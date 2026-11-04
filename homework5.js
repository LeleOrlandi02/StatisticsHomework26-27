/**
 * HMWK 5 — Welford's Recurrence Formulas & Sampling Distributions
 * Numerical Simulation Engine, Statistical Diagnostics & High-DPI Visualizations
 * Author: Emanuele Orlandi (ID: 2021953)
 */

(function (window) {
  'use strict';

  // --- Mathematical & Statistical Utilities ---

  /**
   * High-precision Error Function erf(x) via Abramowitz & Stegun approximation (formula 7.1.26)
   * Maximum error: 1.5e-7
   */
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Standard Normal Cumulative Distribution Function (CDF) Phi(z)
   */
  function normalCdf(z) {
    return 0.5 * (1.0 + erf(z / Math.SQRT2));
  }

  /**
   * Standard Normal Probability Density Function (PDF) phi(z)
   */
  function normalPdf(z) {
    return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
  }

  /**
   * Gaussian density N(mu, sigma^2) at value x
   */
  function gaussianPdf(x, mu, sigma) {
    if (sigma <= 0) return 0;
    return (1.0 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
  }

  /**
   * Log-gamma function (Lanczos approximation) for exact binomial probabilities without overflow
   */
  function logGamma(x) {
    const p = [
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }
    x -= 1;
    let a = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
      a += p[i] / (x + i + 1);
    }
    const t = x + p.length - 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  /**
   * Log-combination ln(n! / (k! (n-k)!))
   */
  function logCombination(n, k) {
    if (k < 0 || k > n) return -Infinity;
    if (k === 0 || k === n) return 0;
    return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
  }

  /**
   * Binomial Probability Mass Function: P(K = k) = C(n, k) p^k (1-p)^(n-k)
   */
  function binomialPmf(n, k, p) {
    if (k < 0 || k > n) return 0;
    if (p === 0) return k === 0 ? 1 : 0;
    if (p === 1) return k === n ? 1 : 0;
    const logP = logCombination(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
    return Math.exp(logP);
  }

  /**
   * Box-Muller transform for standard normal random variates
   */
  function randomStandardNormal() {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  /**
   * Beta distribution random sample using Gamma variates (Marsaglia & Tsang method)
   */
  function randomGamma(alpha) {
    if (alpha < 1.0) {
      return randomGamma(alpha + 1.0) * Math.pow(Math.random(), 1.0 / alpha);
    }
    const d = alpha - 1.0 / 3.0;
    const c = 1.0 / Math.sqrt(9.0 * d);
    while (true) {
      let z = randomStandardNormal();
      let v = 1.0 + c * z;
      if (v <= 0) continue;
      v = v * v * v;
      const u = Math.random();
      if (u < 1.0 - 0.0331 * z * z * z * z) return d * v;
      if (Math.log(u) < 0.5 * z * z + d * (1.0 - v + Math.log(v))) return d * v;
    }
  }

  function randomBeta(alpha, beta) {
    const x = randomGamma(alpha);
    const y = randomGamma(beta);
    return x / (x + y);
  }

  // --- Welford Accumulator Class (Ex. 1 Core Algorithm) ---

  /**
   * Streaming single-pass accumulator implementing Knuth's mean & Welford's M2 / variance recurrence
   */
  class WelfordAccumulator {
    constructor() {
      this.count = 0;
      this.mean = 0.0;
      this.M2 = 0.0; // Sum of squared differences from the mean (SS)
      this.history = []; // Optional history for visualization
    }

    reset() {
      this.count = 0;
      this.mean = 0.0;
      this.M2 = 0.0;
      this.history = [];
      return this;
    }

    /**
     * Core 3-line update step
     * @param {number} x - new streaming observation
     */
    update(x) {
      this.count += 1;
      const delta = x - this.mean;
      this.mean += delta / this.count;
      const delta2 = x - this.mean;
      this.M2 += delta * delta2;

      this.history.push({
        k: this.count,
        x: x,
        delta: delta,
        mean: this.mean,
        M2: this.M2,
        sampleVar: this.sampleVariance,
        popVar: this.populationVariance
      });

      return this;
    }

    get sampleVariance() {
      return this.count > 1 ? this.M2 / (this.count - 1) : 0.0;
    }

    get sampleSD() {
      return Math.sqrt(this.sampleVariance);
    }

    get populationVariance() {
      return this.count > 0 ? this.M2 / this.count : 0.0;
    }

    get populationSD() {
      return Math.sqrt(this.populationVariance);
    }
  }

  // --- Penetration Score Distributions on [0, 10] ---

  const DISTRIBUTIONS = {
    // 1. Binomial(10, p)
    binomial: {
      name: 'Binomial B(10, p)',
      description: 'Discrete sub-component compromise count out of 10 security tiers.',
      isDiscrete: true,
      hasParam: true,
      paramName: 'p (Success Prob)',
      paramMin: 0.05,
      paramMax: 0.95,
      paramStep: 0.05,
      defaultParam: 0.5,
      getTheoretical(param = 0.5) {
        const p = param;
        const n = 10;
        const mu = n * p;
        const variance = n * p * (1 - p);
        const mu4 = n * p * (1 - p) * (1 + (3 * n - 6) * p * (1 - p));
        return {
          name: `Binomial(10, ${p.toFixed(2)})`,
          mu: mu,
          variance: variance,
          sd: Math.sqrt(variance),
          skewness: (1 - 2 * p) / Math.sqrt(variance),
          kurtosis: 3 + (1 - 6 * p * (1 - p)) / variance,
          mu4: mu4,
          pdf: (x) => {
            const k = Math.round(x);
            if (k < 0 || k > 10 || Math.abs(x - k) > 1e-4) return 0;
            return binomialPmf(10, k, p);
          }
        };
      },
      sample(param = 0.5) {
        let count = 0;
        for (let i = 0; i < 10; i++) {
          if (Math.random() < param) count++;
        }
        return count;
      }
    },

    // 2. Discrete Uniform on {0, 1, ..., 10}
    discreteUniform: {
      name: 'Discrete Uniform {0..10}',
      description: 'Equal probability across integer breach levels 0 through 10.',
      isDiscrete: true,
      hasParam: false,
      getTheoretical() {
        const a = 0, b = 10;
        const N = b - a + 1; // 11
        const mu = (a + b) / 2.0; // 5.0
        const variance = (N * N - 1) / 12.0; // 120 / 12 = 10.0
        // Fourth central moment for discrete uniform
        const mu4 = (N * N - 1) * (3 * N * N - 7) / 240.0;
        return {
          name: 'Discrete Uniform {0..10}',
          mu: mu,
          variance: variance,
          sd: Math.sqrt(variance),
          skewness: 0.0,
          kurtosis: mu4 / (variance * variance),
          mu4: mu4,
          pdf: (x) => {
            const k = Math.round(x);
            return (k >= 0 && k <= 10 && Math.abs(x - k) < 1e-4) ? 1.0 / 11.0 : 0;
          }
        };
      },
      sample() {
        return Math.floor(Math.random() * 11);
      }
    },

    // 3. Continuous Uniform on [0, 10]
    continuousUniform: {
      name: 'Continuous Uniform U(0, 10)',
      description: 'Continuous intrusion penetration severity distributed evenly between 0 and 10.',
      isDiscrete: false,
      hasParam: false,
      getTheoretical() {
        const a = 0, b = 10;
        const mu = (a + b) / 2.0; // 5.0
        const variance = Math.pow(b - a, 2) / 12.0; // 100 / 12 = 8.3333...
        const mu4 = Math.pow(b - a, 4) / 80.0; // 10000 / 80 = 125.0
        return {
          name: 'Uniform(0, 10)',
          mu: mu,
          variance: variance,
          sd: Math.sqrt(variance),
          skewness: 0.0,
          kurtosis: 1.8, // Uniform kurtosis = 9/5 = 1.8 (excess = -1.2)
          mu4: mu4,
          pdf: (x) => (x >= 0 && x <= 10) ? 0.1 : 0
        };
      },
      sample() {
        return Math.random() * 10.0;
      }
    },

    // 4. Truncated Normal on [0, 10] with mu0 = 5, sigma0 = 2
    truncatedNormal: {
      name: 'Truncated Normal (μ=5, σ=2)',
      description: 'Symmetric Gaussian bell curve centered at 5, clipped to [0, 10].',
      isDiscrete: false,
      hasParam: false,
      getTheoretical() {
        // High accuracy numerical integration over [0, 10]
        const mu0 = 5.0, s0 = 2.0;
        const alpha = (0 - mu0) / s0; // -2.5
        const beta = (10 - mu0) / s0; // +2.5
        const Z = normalCdf(beta) - normalCdf(alpha);

        // By symmetry around 5, mu = 5.0 exactly
        const mu = 5.0;
        // Variance formula for symmetric truncated normal: s0^2 * [1 - 2 * beta * phi(beta) / Z]
        const phiBeta = normalPdf(beta);
        const variance = s0 * s0 * (1.0 - (2.0 * beta * phiBeta) / Z);
        const sd = Math.sqrt(variance);

        return {
          name: 'Truncated Normal(5, 4) on [0, 10]',
          mu: mu,
          variance: variance,
          sd: sd,
          skewness: 0.0,
          kurtosis: 2.95,
          mu4: 3.0 * variance * variance,
          pdf: (x) => {
            if (x < 0 || x > 10) return 0;
            return gaussianPdf(x, mu0, s0) / Z;
          }
        };
      },
      sample() {
        // Rejection sampling for truncated normal
        let val;
        do {
          val = 5.0 + 2.0 * randomStandardNormal();
        } while (val < 0.0 || val > 10.0);
        return val;
      }
    },

    // 5. Novice Hacker Profile: Beta(2, 5) * 10 (Right-skewed, low scores)
    betaNovice: {
      name: 'Novice Hackers (Beta 2, 5 × 10)',
      description: 'Right-skewed distribution modeling resilient systems where low scores are common.',
      isDiscrete: false,
      hasParam: false,
      getTheoretical() {
        const a = 2.0, b = 5.0;
        const muUnit = a / (a + b); // 2/7 approx 0.2857
        const varUnit = (a * b) / (Math.pow(a + b, 2) * (a + b + 1)); // 10 / (49 * 8) = 10 / 392 approx 0.02551
        const mu = muUnit * 10.0; // approx 2.8571
        const variance = varUnit * 100.0; // approx 2.5510
        return {
          name: 'Beta(2, 5) × 10',
          mu: mu,
          variance: variance,
          sd: Math.sqrt(variance),
          skewness: (2 * (b - a) * Math.sqrt(a + b + 1)) / ((a + b + 2) * Math.sqrt(a * b)),
          kurtosis: 3.0,
          mu4: 3.0 * variance * variance,
          pdf: (x) => {
            if (x <= 0 || x >= 10) return 0;
            const u = x / 10.0;
            // Beta(2, 5): B(2, 5) = Gamma(2)Gamma(5)/Gamma(7) = 1*24/720 = 1/30
            // f(u) = 30 * u^1 * (1-u)^4
            const densUnit = 30.0 * u * Math.pow(1.0 - u, 4);
            return densUnit / 10.0;
          }
        };
      },
      sample() {
        return randomBeta(2.0, 5.0) * 10.0;
      }
    },

    // 6. Advanced APT Profile: Beta(5, 2) * 10 (Left-skewed, high scores)
    betaAdvanced: {
      name: 'Advanced APT (Beta 5, 2 × 10)',
      description: 'Left-skewed distribution modeling sophisticated adversaries frequently breaching deep layers.',
      isDiscrete: false,
      hasParam: false,
      getTheoretical() {
        const a = 5.0, b = 2.0;
        const muUnit = a / (a + b); // 5/7 approx 0.7143
        const varUnit = (a * b) / (Math.pow(a + b, 2) * (a + b + 1)); // 10 / 392 approx 0.02551
        const mu = muUnit * 10.0; // approx 7.1429
        const variance = varUnit * 100.0; // approx 2.5510
        return {
          name: 'Beta(5, 2) × 10',
          mu: mu,
          variance: variance,
          sd: Math.sqrt(variance),
          skewness: (2 * (b - a) * Math.sqrt(a + b + 1)) / ((a + b + 2) * Math.sqrt(a * b)),
          kurtosis: 3.0,
          mu4: 3.0 * variance * variance,
          pdf: (x) => {
            if (x <= 0 || x >= 10) return 0;
            const u = x / 10.0;
            // Beta(5, 2): f(u) = 30 * u^4 * (1-u)^1
            const densUnit = 30.0 * Math.pow(u, 4) * (1.0 - u);
            return densUnit / 10.0;
          }
        };
      },
      sample() {
        return randomBeta(5.0, 2.0) * 10.0;
      }
    }
  };

  // --- Multi-Hacker Sampling Simulator Engine (Ex. 2) ---

  class HackerSamplingSimulator {
    constructor() {
      this.n = 100; // Number of systems per hacker
      this.m = 100; // Number of hackers
      this.distKey = 'binomial';
      this.distParam = 0.5;

      // Trajectory matrices stored in flat TypedArrays for memory & cache efficiency
      // Each hacker has n steps.
      // hackerMeans[j * (n + 1) + k] = sampling mean of hacker j after k systems
      this.hackerMeans = null;
      // hackerVars[j * (n + 1) + k] = sampling variance (Bessel-corrected) of hacker j after k systems
      this.hackerVars = null;
      // hackerPopVars[j * (n + 1) + k] = biased population variance M2/k
      this.hackerPopVars = null;

      // Summary across the m hackers at terminal step n
      this.terminalMeans = null;     // Array of length m: final sample mean of each hacker
      this.terminalVars = null;      // Array of length m: final sample variance of each hacker
      this.terminalPopVars = null;   // Array of length m: final pop variance of each hacker

      // Ensemble statistics per step k (k = 1 ... n):
      // avgOfMeans[k], varOfMeans[k], avgOfVars[k], varOfVars[k]
      this.stepEnsembleStats = [];
      this.summary = null;
    }

    runSimulation(config = {}) {
      if (config.n !== undefined) this.n = Math.max(5, Math.min(2500, parseInt(config.n, 10)));
      if (config.m !== undefined) this.m = Math.max(5, Math.min(2500, parseInt(config.m, 10)));
      if (config.distKey !== undefined && DISTRIBUTIONS[config.distKey]) this.distKey = config.distKey;
      if (config.distParam !== undefined) this.distParam = parseFloat(config.distParam);

      const n = this.n;
      const m = this.m;
      const dist = DISTRIBUTIONS[this.distKey];
      const param = this.distParam;
      const totalElements = m * (n + 1);

      this.hackerMeans = new Float32Array(totalElements);
      this.hackerVars = new Float32Array(totalElements);
      this.hackerPopVars = new Float32Array(totalElements);

      this.terminalMeans = new Float64Array(m);
      this.terminalVars = new Float64Array(m);
      this.terminalPopVars = new Float64Array(m);

      // Simulate m hackers using Welford's recurrence formulas along the stream
      for (let j = 0; j < m; j++) {
        const offset = j * (n + 1);
        let mean = 0.0;
        let M2 = 0.0;

        this.hackerMeans[offset] = 0;
        this.hackerVars[offset] = 0;
        this.hackerPopVars[offset] = 0;

        for (let k = 1; k <= n; k++) {
          const score = dist.sample(param);

          // Welford's recurrence step
          const delta = score - mean;
          mean += delta / k;
          const delta2 = score - mean;
          M2 += delta * delta2;

          const sampleVar = k > 1 ? M2 / (k - 1) : 0.0;
          const popVar = M2 / k;

          this.hackerMeans[offset + k] = mean;
          this.hackerVars[offset + k] = sampleVar;
          this.hackerPopVars[offset + k] = popVar;
        }

        this.terminalMeans[j] = mean;
        this.terminalVars[j] = n > 1 ? M2 / (n - 1) : 0.0;
        this.terminalPopVars[j] = M2 / n;
      }

      this.computeEnsembleStats();
      return this;
    }

    /**
     * Precompute step-by-step ensemble statistics across hackers for each system k = 1 ... n
     */
    computeEnsembleStats() {
      const n = this.n;
      const m = this.m;
      this.stepEnsembleStats = new Array(n + 1);

      const dist = DISTRIBUTIONS[this.distKey];
      const theo = dist.getTheoretical(this.distParam);

      for (let k = 1; k <= n; k++) {
        let sumMean = 0.0;
        let sumVar = 0.0;
        let sumPopVar = 0.0;

        for (let j = 0; j < m; j++) {
          const idx = j * (n + 1) + k;
          sumMean += this.hackerMeans[idx];
          sumVar += this.hackerVars[idx];
          sumPopVar += this.hackerPopVars[idx];
        }

        const avgMean = sumMean / m;
        const avgVar = sumVar / m;
        const avgPopVar = sumPopVar / m;

        // Sample variance of sample means & sample variances across m hackers
        let sumSqDiffMean = 0.0;
        let sumSqDiffVar = 0.0;

        for (let j = 0; j < m; j++) {
          const idx = j * (n + 1) + k;
          const diffMean = this.hackerMeans[idx] - avgMean;
          sumSqDiffMean += diffMean * diffMean;

          const diffVar = this.hackerVars[idx] - avgVar;
          sumSqDiffVar += diffVar * diffVar;
        }

        const varOfMeans = m > 1 ? sumSqDiffMean / (m - 1) : 0.0;
        const varOfVars = m > 1 ? sumSqDiffVar / (m - 1) : 0.0;

        // Theoretical quantities at step k:
        // Var(X_bar_k) = sigma^2 / k
        const theoVarOfMeans = theo.variance / k;
        // Var(S_k^2) approx 2*sigma^4 / (k - 1) for normal or general kurtosis formula
        const theoVarOfVars = k > 1 ? (1.0 / k) * (theo.mu4 - ((k - 3) / (k - 1)) * Math.pow(theo.variance, 2)) : 0.0;

        this.stepEnsembleStats[k] = {
          k: k,
          avgMean: avgMean,
          varOfMeans: varOfMeans,
          sdOfMeans: Math.sqrt(varOfMeans),
          avgVar: avgVar,
          avgPopVar: avgPopVar,
          varOfVars: varOfVars,
          sdOfVars: Math.sqrt(varOfVars),
          theoVarOfMeans: theoVarOfMeans,
          theoSDOfMeans: Math.sqrt(theoVarOfMeans),
          theoVarOfVars: Math.max(0, theoVarOfVars),
          theoSDOfVars: Math.sqrt(Math.max(0, theoVarOfVars))
        };
      }

      // Terminal step n summary
      const finalStats = this.stepEnsembleStats[n];
      this.summary = {
        n: n,
        m: m,
        theo: theo,
        avgSamplingMean: finalStats.avgMean,
        avgSamplingVar: finalStats.avgVar,
        avgPopVar: finalStats.avgPopVar,
        varOfSamplingMeans: finalStats.varOfMeans,
        sdOfSamplingMeans: finalStats.sdOfMeans,
        varOfSamplingVars: finalStats.varOfVars,
        sdOfSamplingVars: finalStats.sdOfVars,
        theoVarOfMeans: finalStats.theoVarOfMeans,
        theoSDOfMeans: finalStats.theoSDOfMeans,
        theoVarOfVars: finalStats.theoVarOfVars,
        theoSDOfVars: finalStats.theoSDOfVars,
        meanBias: finalStats.avgMean - theo.mu,
        meanRelErrorPct: (Math.abs(finalStats.avgMean - theo.mu) / (theo.mu || 1)) * 100,
        varBias: finalStats.avgVar - theo.variance,
        varRelErrorPct: (Math.abs(finalStats.avgVar - theo.variance) / (theo.variance || 1)) * 100,
        popVarBias: finalStats.avgPopVar - theo.variance,
        popVarTheoExpected: ((n - 1) / n) * theo.variance
      };
    }
  }

  // --- High-Performance Canvas Rendering Suite ---

  function setupHiDpiCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(10, Math.floor(rect.width));
    const height = Math.max(10, Math.floor(rect.height));

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    return { ctx, width, height, dpr };
  }

  function getThemeColors() {
    const root = document.documentElement;
    const style = getComputedStyle(root);

    return {
      bgCard: style.getPropertyValue('--bg-card').trim() || '#ffffff',
      bgSecondary: style.getPropertyValue('--bg-secondary').trim() || '#f1f5f9',
      borderSubtle: style.getPropertyValue('--border-subtle').trim() || '#e2e8f0',
      borderStrong: style.getPropertyValue('--border-strong').trim() || '#cbd5e1',
      textMain: style.getPropertyValue('--text-main').trim() || '#0f172a',
      textMuted: style.getPropertyValue('--text-muted').trim() || '#64748b',
      textLight: style.getPropertyValue('--text-light').trim() || '#94a3b8',
      accentPrimary: style.getPropertyValue('--accent-primary').trim() || '#4f46e5',
      accentSecondary: style.getPropertyValue('--accent-secondary').trim() || '#6366f1',
      statusOk: style.getPropertyValue('--status-completed-text').trim() || '#059669',
      statusWarn: style.getPropertyValue('--status-pending-text').trim() || '#d97706',
      statusBad: '#ef4444'
    };
  }

  /**
   * 1. Renders Hacker Sampling Mean Trajectories on Canvas
   * Shows sample mean path of each hacker over steps k = 1 ... n converging to mu
   */
  function renderTrajectoryCanvas(canvas, simulator, options = {}) {
    if (!canvas || !simulator || !simulator.hackerMeans) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    const currentStep = options.currentStep !== undefined ? Math.min(simulator.n, options.currentStep) : simulator.n;
    const showEnvelope = options.showEnvelope !== false;
    const maxRenderPaths = Math.min(simulator.m, options.maxPaths || 250);

    ctx.clearRect(0, 0, width, height);

    const padL = 54;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const n = simulator.n;
    const m = simulator.m;
    const theo = simulator.summary ? simulator.summary.theo : DISTRIBUTIONS[simulator.distKey].getTheoretical(simulator.distParam);

    // Y domain spans around mu
    const minY = 0.0;
    const maxY = 10.0;

    const xMap = (k) => padL + (k / n) * plotW;
    const yMap = (val) => padT + plotH - ((val - minY) / (maxY - minY)) * plotH;

    // Draw Grid & Axes
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Horizontal grid lines (0 to 10)
    for (let v = 0; v <= 10; v += 2) {
      const y = yMap(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.toFixed(1), padL - 8, y);
    }

    // Vertical grid lines (steps k)
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const stepVal = Math.round((i / xTicks) * n);
      const x = xMap(stepVal);

      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(stepVal, x, padT + plotH + 8);
    }

    // X-Axis Label
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Systems Attempted per Hacker (n)', padL + plotW / 2, padT + plotH + 22);

    // Theoretical Confidence Envelope Bands: mu +/- 2 * (sigma / sqrt(k))
    if (showEnvelope) {
      ctx.save();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.beginPath();

      for (let k = 1; k <= currentStep; k++) {
        const se = theo.sd / Math.sqrt(k);
        const yUpper = yMap(Math.min(10, theo.mu + 2 * se));
        const x = xMap(k);
        if (k === 1) ctx.moveTo(x, yUpper);
        else ctx.lineTo(x, yUpper);
      }
      for (let k = currentStep; k >= 1; k--) {
        const se = theo.sd / Math.sqrt(k);
        const yLower = yMap(Math.max(0, theo.mu - 2 * se));
        const x = xMap(k);
        ctx.lineTo(x, yLower);
      }
      ctx.closePath();
      ctx.fill();

      // Envelope stroke borders
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const se = theo.sd / Math.sqrt(k);
        const x = xMap(k);
        const y = yMap(Math.min(10, theo.mu + 2 * se));
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const se = theo.sd / Math.sqrt(k);
        const x = xMap(k);
        const y = yMap(Math.max(0, theo.mu - 2 * se));
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Individual Hacker Sample Mean Paths
    const pathAlpha = Math.max(0.08, Math.min(0.65, 20 / maxRenderPaths));
    ctx.lineWidth = maxRenderPaths > 300 ? 0.9 : 1.3;
    const stepSample = Math.max(1, Math.floor(m / maxRenderPaths));

    for (let j = 0; j < m; j += stepSample) {
      const offset = j * (n + 1);
      const hue = 210 + (j % 50) * 2;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${pathAlpha})`;

      ctx.beginPath();
      const startVal = simulator.hackerMeans[offset + 1];
      ctx.moveTo(xMap(1), yMap(startVal));

      for (let k = 2; k <= currentStep; k++) {
        const meanVal = simulator.hackerMeans[offset + k];
        ctx.lineTo(xMap(k), yMap(meanVal));
      }
      ctx.stroke();
    }

    // Theoretical Mean Line mu
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yMap(theo.mu));
    ctx.lineTo(padL + plotW, yMap(theo.mu));
    ctx.stroke();
    ctx.restore();

    // Ensemble Average of Sampling Means Curve across step k
    ctx.save();
    ctx.strokeStyle = colors.statusOk; // Emerald
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 1; k <= currentStep; k++) {
      const avgK = simulator.stepEnsembleStats[k].avgMean;
      const x = xMap(k);
      const y = yMap(avgK);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Legend
    ctx.save();
    const legX = padL + 12;
    const legY = padT + 12;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 230, 68, 6) || ctx.rect(legX, legY, 230, 68);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 1. Attackers sample paths
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 14);
    ctx.lineTo(legX + 28, legY + 14);
    ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Hacker Sample Means (m = ${m})`, legX + 36, legY + 14);

    // 2. Ensemble average of means
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 34);
    ctx.lineTo(legX + 28, legY + 34);
    ctx.stroke();
    ctx.fillText(`Ensemble Mean of Means (${simulator.summary?.avgSamplingMean.toFixed(3) || '...'})`, legX + 36, legY + 34);

    // 3. Theoretical mu & 2*SE band
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 54);
    ctx.lineTo(legX + 28, legY + 54);
    ctx.stroke();
    ctx.fillText(`Theoretical μ = ${theo.mu.toFixed(2)} & ±2·SE Funnel`, legX + 36, legY + 54);

    ctx.restore();
  }

  /**
   * 2. Renders Distribution of Sampling Means Histogram vs Theoretical Normal Density
   */
  function renderMeansDistributionCanvas(canvas, simulator) {
    if (!canvas || !simulator || !simulator.terminalMeans) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const m = simulator.m;
    const n = simulator.n;
    const theo = simulator.summary.theo;
    const values = simulator.terminalMeans;

    // Bounds for histogram around mu +/- 4 * SE
    const se = theo.sd / Math.sqrt(n);
    const minVal = Math.max(0, theo.mu - 4.0 * se);
    const maxVal = Math.min(10, theo.mu + 4.0 * se);
    const span = maxVal - minVal || 1;

    // Binning
    const numBins = Math.max(12, Math.min(40, Math.round(Math.sqrt(m))));
    const binWidth = span / numBins;
    const binCounts = new Array(numBins).fill(0);

    for (let j = 0; j < m; j++) {
      const v = values[j];
      const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((v - minVal) / binWidth)));
      binCounts[binIdx]++;
    }

    // Convert counts to density: density = count / (m * binWidth)
    let maxDensity = 0;
    const binDensities = binCounts.map(count => {
      const d = count / (m * binWidth);
      if (d > maxDensity) maxDensity = d;
      return d;
    });

    // Also compare with peak theoretical density
    const theoPeakDensity = gaussianPdf(theo.mu, theo.mu, se);
    maxDensity = Math.max(maxDensity, theoPeakDensity) * 1.15;

    const xMap = (v) => padL + ((v - minVal) / span) * plotW;
    const yMap = (dens) => padT + plotH - (dens / maxDensity) * plotH;

    // Grid & Axes
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // X Axis ticks
    for (let i = 0; i <= 5; i++) {
      const v = minVal + (i / 5) * span;
      const x = xMap(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(v.toFixed(2), x, padT + plotH + 8);
    }

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Sampling Mean x̄ across Hackers', padL + plotW / 2, padT + plotH + 22);

    // Draw Histogram Bars
    for (let i = 0; i < numBins; i++) {
      const bLeft = minVal + i * binWidth;
      const bRight = bLeft + binWidth;
      const x1 = xMap(bLeft);
      const x2 = xMap(bRight);
      const d = binDensities[i];
      const y = yMap(d);
      const bH = (padT + plotH) - y;

      ctx.fillStyle = 'rgba(79, 70, 229, 0.45)';
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.85)';
      ctx.lineWidth = 1;

      ctx.fillRect(x1 + 1, y, Math.max(1, x2 - x1 - 2), bH);
      ctx.strokeRect(x1 + 1, y, Math.max(1, x2 - x1 - 2), bH);
    }

    // Theoretical Density Curve N(mu, sigma^2 / n)
    ctx.save();
    ctx.strokeStyle = '#ef4444'; // Red
    ctx.lineWidth = 2.4;
    ctx.beginPath();

    const curveSteps = 150;
    for (let i = 0; i <= curveSteps; i++) {
      const v = minVal + (i / curveSteps) * span;
      const dens = gaussianPdf(v, theo.mu, se);
      const x = xMap(v);
      const y = yMap(dens);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Vertical line for empirical ensemble average
    const empMean = simulator.summary.avgSamplingMean;
    ctx.save();
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2.0;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xMap(empMean), padT);
    ctx.lineTo(xMap(empMean), padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Legend
    ctx.save();
    const legX = padL + 12;
    const legY = padT + 10;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 210, 48, 6) || ctx.rect(legX, legY, 210, 48);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Emp Mean
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 14);
    ctx.lineTo(legX + 22, legY + 14);
    ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Empirical Avg x̄̄ = ${empMean.toFixed(3)}`, legX + 28, legY + 14);

    // Theoretical CLT curve
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 22, legY + 34);
    ctx.stroke();
    ctx.fillText(`Theoretical N(μ, σ²/n)`, legX + 28, legY + 34);
    ctx.restore();
  }

  /**
   * 3. Renders Distribution of Sampling Variances Histogram vs Theoretical Variance
   */
  function renderVarsDistributionCanvas(canvas, simulator) {
    if (!canvas || !simulator || !simulator.terminalVars) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const m = simulator.m;
    const theo = simulator.summary.theo;
    const sampleVars = simulator.terminalVars;
    const popVars = simulator.terminalPopVars;

    // Determine domain around theo.variance
    let minV = Infinity, maxV = -Infinity;
    for (let j = 0; j < m; j++) {
      if (sampleVars[j] < minV) minV = sampleVars[j];
      if (sampleVars[j] > maxV) maxV = sampleVars[j];
    }
    minV = Math.max(0, Math.min(minV, theo.variance * 0.5));
    maxV = Math.max(maxV, theo.variance * 1.5);
    const span = maxV - minV || 1;

    const numBins = Math.max(12, Math.min(40, Math.round(Math.sqrt(m))));
    const binWidth = span / numBins;
    const binCounts = new Array(numBins).fill(0);

    for (let j = 0; j < m; j++) {
      const v = sampleVars[j];
      const binIdx = Math.min(numBins - 1, Math.max(0, Math.floor((v - minV) / binWidth)));
      binCounts[binIdx]++;
    }

    let maxDensity = 0;
    const binDensities = binCounts.map(count => {
      const d = count / (m * binWidth);
      if (d > maxDensity) maxDensity = d;
      return d;
    });

    maxDensity *= 1.25;

    const xMap = (v) => padL + ((v - minV) / span) * plotW;
    const yMap = (dens) => padT + plotH - (dens / maxDensity) * plotH;

    // Grid & Axes
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= 5; i++) {
      const v = minV + (i / 5) * span;
      const x = xMap(v);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(v.toFixed(2), x, padT + plotH + 8);
    }

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Sampling Variance s² across Hackers', padL + plotW / 2, padT + plotH + 22);

    // Bars
    for (let i = 0; i < numBins; i++) {
      const bLeft = minV + i * binWidth;
      const bRight = bLeft + binWidth;
      const x1 = xMap(bLeft);
      const x2 = xMap(bRight);
      const d = binDensities[i];
      const y = yMap(d);
      const bH = (padT + plotH) - y;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.40)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.lineWidth = 1;

      ctx.fillRect(x1 + 1, y, Math.max(1, x2 - x1 - 2), bH);
      ctx.strokeRect(x1 + 1, y, Math.max(1, x2 - x1 - 2), bH);
    }

    // Vertical line for Theoretical Variance sigma^2
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xMap(theo.variance), padT);
    ctx.lineTo(xMap(theo.variance), padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Vertical line for Average of Unbiased Sample Variances s^2
    const avgSampleVar = simulator.summary.avgSamplingVar;
    ctx.save();
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xMap(avgSampleVar), padT);
    ctx.lineTo(xMap(avgSampleVar), padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Vertical line for Average of Biased Population Variances popVar
    const avgPopVar = simulator.summary.avgPopVar;
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.0;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(xMap(avgPopVar), padT);
    ctx.lineTo(xMap(avgPopVar), padT + plotH);
    ctx.stroke();
    ctx.restore();

    // Legend
    ctx.save();
    const legX = padL + 12;
    const legY = padT + 10;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 240, 68, 6) || ctx.rect(legX, legY, 240, 68);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Item 1: Unbiased s^2
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 14);
    ctx.lineTo(legX + 22, legY + 14);
    ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Avg Sample Var s̄² = ${avgSampleVar.toFixed(3)} (Unbiased)`, legX + 28, legY + 14);

    // Item 2: Theoretical sigma^2
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 22, legY + 34);
    ctx.stroke();
    ctx.fillText(`Theoretical σ² = ${theo.variance.toFixed(3)}`, legX + 28, legY + 34);

    // Item 3: Biased popVar
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 54);
    ctx.lineTo(legX + 22, legY + 54);
    ctx.stroke();
    ctx.fillText(`Biased Pop Var = ${avgPopVar.toFixed(3)} [×(n-1)/n]`, legX + 28, legY + 54);

    ctx.restore();
  }

  /**
   * 4. Renders Variability Scaling vs n (Decay Rate O(1/n)) Canvas
   * Compares Var(X_bar_k) and Var(S_k^2) as k goes from 1 to n
   */
  function renderScalingCanvas(canvas, simulator) {
    if (!canvas || !simulator || !simulator.stepEnsembleStats) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 54;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const n = simulator.n;
    const stats = simulator.stepEnsembleStats;

    // Determine max variance for scaling
    let maxVar = 0;
    for (let k = 2; k <= n; k++) {
      if (stats[k].varOfMeans > maxVar) maxVar = stats[k].varOfMeans;
      if (stats[k].theoVarOfMeans > maxVar) maxVar = stats[k].theoVarOfMeans;
    }
    maxVar = Math.max(0.1, maxVar * 1.15);

    const xMap = (k) => padL + ((k - 1) / (n - 1 || 1)) * plotW;
    const yMap = (val) => padT + plotH - (val / maxVar) * plotH;

    // Grid & Axes
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Y ticks
    for (let i = 0; i <= 5; i++) {
      const v = (i / 5) * maxVar;
      const y = yMap(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.toFixed(3), padL - 8, y);
    }

    // X ticks
    for (let i = 0; i <= 5; i++) {
      const stepVal = Math.max(1, Math.round(1 + (i / 5) * (n - 1)));
      const x = xMap(stepVal);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(stepVal, x, padT + plotH + 8);
    }

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Systems Count (n) → Hyperbolic Decay O(1/n)', padL + plotW / 2, padT + plotH + 22);

    // 1. Theoretical Var(X_bar_k) = sigma^2 / k
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (let k = 1; k <= n; k++) {
      const v = stats[k].theoVarOfMeans;
      const x = xMap(k);
      const y = yMap(v);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // 2. Empirical Var(X_bar_k) across hackers
    ctx.save();
    ctx.strokeStyle = colors.accentPrimary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 1; k <= n; k++) {
      const v = stats[k].varOfMeans;
      const x = xMap(k);
      const y = yMap(v);
      if (k === 1) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Legend
    ctx.save();
    const legX = padL + 12;
    const legY = padT + 10;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 230, 48, 6) || ctx.rect(legX, legY, 230, 48);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Empirical
    ctx.strokeStyle = colors.accentPrimary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 14);
    ctx.lineTo(legX + 22, legY + 14);
    ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Empirical Var(x̄) ~ O(1/n)`, legX + 28, legY + 14);

    // Theoretical
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 22, legY + 34);
    ctx.stroke();
    ctx.fillText(`Theoretical σ²/n Decay Curve`, legX + 28, legY + 34);

    ctx.restore();
  }

  // --- Export Public Engine API ---

  window.Hw5Engine = {
    WelfordAccumulator: WelfordAccumulator,
    HackerSamplingSimulator: HackerSamplingSimulator,
    DISTRIBUTIONS: DISTRIBUTIONS,
    renderTrajectoryCanvas: renderTrajectoryCanvas,
    renderMeansDistributionCanvas: renderMeansDistributionCanvas,
    renderVarsDistributionCanvas: renderVarsDistributionCanvas,
    renderScalingCanvas: renderScalingCanvas,
    setupHiDpiCanvas: setupHiDpiCanvas,
    getThemeColors: getThemeColors
  };

})(window);

