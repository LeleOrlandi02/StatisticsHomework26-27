/**
 * HMWK 4 — Stochastic Penetration Processes: Random Walks, LLN & CLT
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
   * Standard Normal Quantile Function Phi^(-1)(p) via Beasley-Springer-Moro rational approximation
   */
  function normalQuantile(p) {
    if (p <= 0.0) return -8.0;
    if (p >= 1.0) return 8.0;

    // Coefficients in rational approximations
    const a = [
      -3.969683028665376e+01,
      2.209460984245205e+02,
      -2.759285104469687e+02,
      1.383577518672690e+02,
      -3.066479806614716e+01,
      2.506628277459239e+00
    ];

    const b = [
      -5.447609879822406e+01,
      1.615858368580409e+02,
      -1.556989798598866e+02,
      6.680131188771972e+01,
      -1.328068155288572e+01
    ];

    const c = [
      -7.784894002430293e-03,
      -3.223964580411365e-01,
      -2.400758277161838e+00,
      -2.549732539343734e+00,
      4.374664141464968e+00,
      2.938163982698783e+00
    ];

    const d = [
      7.784695709041462e-03,
      3.224671290700398e-01,
      2.445134137142996e+00,
      3.754408661907416e+00
    ];

    const q = p - 0.5;

    if (Math.abs(q) <= 0.42) {
      const r = q * q;
      return q * (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0);
    }

    const r = q < 0 ? p : 1.0 - p;
    const s = Math.log(-Math.log(r));
    let x = c[0] + s * (c[1] + s * (c[2] + s * (c[3] + s * (c[4] + s * c[5]))));
    const y = 1.0 + s * (d[0] + s * (d[1] + s * (d[2] + s * d[3])));
    x = x / y;

    return q < 0 ? -x : x;
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
   * Kolmogorov-Smirnov Test for standard normality N(0, 1)
   */
  function computeKolmogorovSmirnovTest(sortedSamples) {
    const m = sortedSamples.length;
    let dMax = 0;

    for (let i = 0; i < m; i++) {
      const z = sortedSamples[i];
      const empiricalCdfCurrent = (i + 1) / m;
      const empiricalCdfPrev = i / m;
      const theoreticalCdf = normalCdf(z);

      const dPlus = Math.abs(empiricalCdfCurrent - theoreticalCdf);
      const dMinus = Math.abs(theoreticalCdf - empiricalCdfPrev);

      if (dPlus > dMax) dMax = dPlus;
      if (dMinus > dMax) dMax = dMinus;
    }

    // Asymptotic p-value approximation for Kolmogorov distribution
    const lambda = (Math.sqrt(m) + 0.12 + 0.11 / Math.sqrt(m)) * dMax;
    let pValue = 0;
    for (let j = 1; j <= 20; j++) {
      const term = 2 * Math.pow(-1, j - 1) * Math.exp(-2 * j * j * lambda * lambda);
      pValue += term;
      if (Math.abs(term) < 1e-6) break;
    }
    pValue = Math.max(0, Math.min(1, pValue));

    return {
      statistic: dMax,
      pValue: pValue,
      isNormal: pValue >= 0.05
    };
  }

  // --- Stochastic Penetration Engine ---

  class PenetrationSimulator {
    constructor() {
      this.n = 100;           // Number of systems / steps
      this.m = 100;           // Number of attackers / trajectories
      this.model = 'rademacher'; // 'rademacher' or 'bernoulli'
      this.p = 0.5;           // Parameter for Bernoulli model

      // Flat trajectory store: index = j * (n + 1) + k
      this.trajectories = null;

      // Precomputed statistical summary across steps k = 0 ... n
      this.stepStats = [];

      // Terminal statistics at step n
      this.terminalSummary = null;
    }

    /**
     * Run simulation and precompute statistical trajectories
     */
    runSimulation(config = {}) {
      if (config.n !== undefined) this.n = Math.max(5, Math.min(2500, parseInt(config.n, 10)));
      if (config.m !== undefined) this.m = Math.max(5, Math.min(2500, parseInt(config.m, 10)));
      if (config.model !== undefined) this.model = config.model;
      if (config.p !== undefined) this.p = Math.max(0.01, Math.min(0.99, parseFloat(config.p)));

      const n = this.n;
      const m = this.m;
      const totalElements = m * (n + 1);

      // Float32Array handles values accurately and consumes minimal memory
      this.trajectories = new Float32Array(totalElements);

      const isRademacher = this.model === 'rademacher';
      const p = this.p;

      // Simulate m independent sample paths
      for (let j = 0; j < m; j++) {
        const offset = j * (n + 1);
        this.trajectories[offset] = 0; // S_0 = 0

        let currentSum = 0;
        for (let k = 1; k <= n; k++) {
          let increment = 0;
          if (isRademacher) {
            // X_i in {-1, +1} with prob 1/2
            increment = Math.random() < 0.5 ? 1 : -1;
          } else {
            // X_i in {0, 1} with prob p
            increment = Math.random() < p ? 1 : 0;
          }
          currentSum += increment;
          this.trajectories[offset + k] = currentSum;
        }
      }

      this.computeStepStats();
      this.computeTerminalSummary();

      return this;
    }

    /**
     * Precompute mean, variance, min, max, and quantiles across all attackers for each step k
     */
    computeStepStats() {
      const n = this.n;
      const m = this.m;
      this.stepStats = new Array(n + 1);

      // Model theoretical properties
      const isRademacher = this.model === 'rademacher';
      const mu_X = isRademacher ? 0 : this.p;
      const var_X = isRademacher ? 1.0 : this.p * (1.0 - this.p);
      const sigma_X = Math.sqrt(var_X);

      for (let k = 0; k <= n; k++) {
        let sumTotal = 0;
        let minTotal = Infinity;
        let maxTotal = -Infinity;

        // First pass: sum, min, max
        for (let j = 0; j < m; j++) {
          const s = this.trajectories[j * (n + 1) + k];
          sumTotal += s;
          if (s < minTotal) minTotal = s;
          if (s > maxTotal) maxTotal = s;
        }

        const meanTotal = sumTotal / m;

        // Second pass: sample variance
        let sumSqDiff = 0;
        for (let j = 0; j < m; j++) {
          const s = this.trajectories[j * (n + 1) + k];
          const diff = s - meanTotal;
          sumSqDiff += diff * diff;
        }
        const sampleVarTotal = m > 1 ? sumSqDiff / (m - 1) : 0;

        // Normalizations at step k
        const sqrtK = k > 0 ? Math.sqrt(k) : 1;
        const divK = k > 0 ? k : 1;

        // Theoretical quantities
        const theoMeanTotal = k * mu_X;
        const theoVarTotal = k * var_X;

        const theoMeanAvg = mu_X;
        const theoVarAvg = k > 0 ? var_X / k : 0;

        const theoMeanNorm = k > 0 ? (k * mu_X) / sqrtK : 0;
        const theoVarNorm = var_X;

        // Empirical normalized variances
        const sampleVarAvg = k > 0 ? sampleVarTotal / (k * k) : 0;
        const sampleVarNorm = k > 0 ? sampleVarTotal / k : 0;

        this.stepStats[k] = {
          k: k,
          // Total Score S_k
          total: {
            mean: meanTotal,
            variance: sampleVarTotal,
            sd: Math.sqrt(sampleVarTotal),
            min: minTotal,
            max: maxTotal,
            theoMean: theoMeanTotal,
            theoVar: theoVarTotal,
            theoSD: Math.sqrt(theoVarTotal)
          },
          // Average Score S_k / k
          average: {
            mean: k > 0 ? meanTotal / k : 0,
            variance: sampleVarAvg,
            sd: Math.sqrt(sampleVarAvg),
            min: k > 0 ? minTotal / k : 0,
            max: k > 0 ? maxTotal / k : 0,
            theoMean: theoMeanAvg,
            theoVar: theoVarAvg,
            theoSD: Math.sqrt(theoVarAvg)
          },
          // Normalized Score S_k / sqrt(k)
          normalized: {
            mean: k > 0 ? meanTotal / sqrtK : 0,
            variance: sampleVarNorm,
            sd: Math.sqrt(sampleVarNorm),
            min: k > 0 ? minTotal / sqrtK : 0,
            max: k > 0 ? maxTotal / sqrtK : 0,
            theoMean: theoMeanNorm,
            theoVar: theoVarNorm,
            theoSD: Math.sqrt(theoVarNorm)
          }
        };
      }
    }

    /**
     * Compute comprehensive diagnostic metrics at final step n
     */
    computeTerminalSummary(toleranceEpsilon = 0.05) {
      const n = this.n;
      const m = this.m;
      const isRademacher = this.model === 'rademacher';
      const mu_X = isRademacher ? 0 : this.p;
      const var_X = isRademacher ? 1.0 : this.p * (1.0 - this.p);
      const sigma_X = Math.sqrt(var_X);
      const sqrtN = Math.sqrt(n);

      const terminalScores = new Float32Array(m);
      const terminalAverages = new Float32Array(m);
      const terminalNormalized = new Float32Array(m);
      const terminalStandardized = new Float32Array(m); // Z_n = (S_n - n*mu) / (sigma * sqrt(n))

      let sumS = 0;
      let sumAvg = 0;
      let sumNorm = 0;
      let sumStd = 0;

      for (let j = 0; j < m; j++) {
        const s = this.trajectories[j * (n + 1) + n];
        const avg = s / n;
        const norm = s / sqrtN;
        const std = (s - n * mu_X) / (sigma_X * sqrtN);

        terminalScores[j] = s;
        terminalAverages[j] = avg;
        terminalNormalized[j] = norm;
        terminalStandardized[j] = std;

        sumS += s;
        sumAvg += avg;
        sumNorm += norm;
        sumStd += std;
      }

      const meanS = sumS / m;
      const meanAvg = sumAvg / m;
      const meanNorm = sumNorm / m;
      const meanStd = sumStd / m;

      // Higher moments for normalized / standardized values
      let m2 = 0, m3 = 0, m4 = 0;
      let countOutsideEps = 0;

      for (let j = 0; j < m; j++) {
        const std = terminalStandardized[j];
        const diff = std - meanStd;
        const diff2 = diff * diff;
        m2 += diff2;
        m3 += diff2 * diff;
        m4 += diff2 * diff2;

        if (Math.abs(terminalAverages[j] - mu_X) >= toleranceEpsilon) {
          countOutsideEps++;
        }
      }

      const varStd = m > 1 ? m2 / (m - 1) : 0;
      const sdStd = Math.sqrt(varStd);
      const skewness = sdStd > 0 ? (m3 / m) / Math.pow(varStd, 1.5) : 0;
      const kurtosis = sdStd > 0 ? (m4 / m) / Math.pow(varStd, 2.0) : 0;
      const excessKurtosis = kurtosis - 3.0;

      // Sorted copy for Q-Q plot and Kolmogorov-Smirnov
      const sortedStd = Array.from(terminalStandardized).sort((a, b) => a - b);
      const ksResult = computeKolmogorovSmirnovTest(sortedStd);

      // Chebyshev upper bound: P(|S_n/n - mu| >= eps) <= Var(X) / (n * eps^2)
      const chebyshevBound = Math.min(1.0, var_X / (n * toleranceEpsilon * toleranceEpsilon));
      const empiricalLlnDeviation = countOutsideEps / m;

      // Theoretical skewness & kurtosis for Bernoulli/Rademacher sum
      const theoSkewness = isRademacher ? 0 : (1.0 - 2.0 * this.p) / (sigma_X * sqrtN);
      const theoExcessKurtosis = isRademacher ? -2.0 / n : (1.0 - 6.0 * this.p * (1.0 - this.p)) / (n * var_X);

      this.terminalSummary = {
        n: n,
        m: m,
        model: this.model,
        p: this.p,
        mu_X: mu_X,
        var_X: var_X,
        sigma_X: sigma_X,
        sqrtN: sqrtN,

        // Total Score
        total: {
          mean: meanS,
          variance: this.stepStats[n].total.variance,
          sd: this.stepStats[n].total.sd,
          min: this.stepStats[n].total.min,
          max: this.stepStats[n].total.max,
          theoMean: n * mu_X,
          theoVar: n * var_X,
          theoSD: Math.sqrt(n * var_X)
        },

        // Average Score
        average: {
          mean: meanAvg,
          variance: this.stepStats[n].average.variance,
          sd: this.stepStats[n].average.sd,
          min: this.stepStats[n].average.min,
          max: this.stepStats[n].average.max,
          theoMean: mu_X,
          theoVar: var_X / n,
          theoSD: Math.sqrt(var_X / n),
          empiricalLlnRate: empiricalLlnDeviation,
          chebyshevBound: chebyshevBound,
          epsilon: toleranceEpsilon
        },

        // Normalized Score S_n / sqrt(n)
        normalized: {
          mean: meanNorm,
          variance: this.stepStats[n].normalized.variance,
          sd: this.stepStats[n].normalized.sd,
          min: this.stepStats[n].normalized.min,
          max: this.stepStats[n].normalized.max,
          theoMean: isRademacher ? 0 : n * mu_X / sqrtN,
          theoVar: var_X,
          theoSD: sigma_X
        },

        // Standardized Score Z_n
        standardized: {
          mean: meanStd,
          variance: varStd,
          sd: sdStd,
          skewness: skewness,
          kurtosis: kurtosis,
          excessKurtosis: excessKurtosis,
          theoSkewness: theoSkewness,
          theoExcessKurtosis: theoExcessKurtosis,
          ks: ksResult
        },

        // Arrays for Histograms & Charts
        arrays: {
          total: terminalScores,
          average: terminalAverages,
          normalized: terminalNormalized,
          standardized: terminalStandardized,
          sortedStd: sortedStd
        }
      };

      return this.terminalSummary;
    }

    /**
     * Compute Enterprise Fleet Breach Metrics given critical threshold T
     */
    computeFleetBreachRisk(thresholdT, mode = 'total') {
      const summary = this.terminalSummary;
      if (!summary) return null;

      const m = summary.m;
      const n = summary.n;
      const scores = summary.arrays.total;
      let countBreaches = 0;

      for (let j = 0; j < m; j++) {
        if (scores[j] >= thresholdT) {
          countBreaches++;
        }
      }

      const empiricalSingleAttackerProb = countBreaches / m;
      const empiricalFleetBreachOccurred = countBreaches > 0 ? 1 : 0;

      // Theoretical single attacker probability via CLT / Binomial
      let theoSingleProb = 0;
      if (this.model === 'rademacher') {
        // Z = (T) / sqrt(n)
        const z = thresholdT / Math.sqrt(n);
        theoSingleProb = 1.0 - normalCdf(z);
      } else {
        // Binomial tail sum or Gaussian approx
        if (n <= 200) {
          let sumTail = 0;
          for (let k = Math.ceil(thresholdT); k <= n; k++) {
            sumTail += binomialPmf(n, k, this.p);
          }
          theoSingleProb = sumTail;
        } else {
          const z = (thresholdT - 0.5 - n * this.p) / Math.sqrt(n * this.p * (1 - this.p));
          theoSingleProb = 1.0 - normalCdf(z);
        }
      }

      theoSingleProb = Math.max(0, Math.min(1, theoSingleProb));
      // Enterprise fleet breach: 1 - (1 - P(S_n >= T))^m
      const theoFleetBreachProb = 1.0 - Math.pow(1.0 - theoSingleProb, m);

      return {
        thresholdT: thresholdT,
        empiricalBreachingAttackers: countBreaches,
        empiricalFraction: empiricalSingleAttackerProb,
        theoSingleProb: theoSingleProb,
        theoFleetBreachProb: Math.min(1.0, theoFleetBreachProb),
        maxAttackerScore: summary.total.max,
        fleetTotalScore: summary.arrays.total.reduce((a, b) => a + b, 0)
      };
    }
  }

  // --- High-Performance Canvas Rendering Suite ---

  /**
   * Helper: Sets up Retina / High-DPI canvas resolution
   */
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

  /**
   * Reads theme CSS variables for colors
   */
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
   * Renders trajectory sample paths on canvas
   * Mode: 'total' (S_k), 'average' (S_k / k), 'normalized' (S_k / sqrt(k))
   */
  function renderTrajectoryCanvas(canvas, simulator, options = {}) {
    if (!canvas || !simulator || !simulator.trajectories) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    const mode = options.mode || 'total'; // 'total', 'average', 'normalized'
    const currentStep = options.currentStep !== undefined ? Math.min(simulator.n, options.currentStep) : simulator.n;
    const showEnvelope = options.showEnvelope !== false;
    const showMean = options.showMean !== false;
    const maxRenderPaths = Math.min(simulator.m, options.maxPaths || 250);

    ctx.clearRect(0, 0, width, height);

    // Margins
    const padL = 52;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const n = simulator.n;
    const m = simulator.m;

    // Determine Y-domain based on mode and stats up to currentStep
    let minY = Infinity;
    let maxY = -Infinity;

    for (let k = 1; k <= currentStep; k++) {
      const stat = simulator.stepStats[k][mode];
      if (stat.min < minY) minY = stat.min;
      if (stat.max > maxY) maxY = stat.max;
    }

    if (!isFinite(minY) || !isFinite(maxY)) {
      minY = -1;
      maxY = 1;
    }

    // Include theoretical lines in Y-domain
    if (mode === 'total') {
      const finalStat = simulator.stepStats[n].total;
      minY = Math.min(minY, finalStat.theoMean - 3 * finalStat.theoSD);
      maxY = Math.max(maxY, finalStat.theoMean + 3 * finalStat.theoSD);
    } else if (mode === 'average') {
      const mu = simulator.model === 'rademacher' ? 0 : simulator.p;
      minY = Math.min(minY, mu - 0.25);
      maxY = Math.max(maxY, mu + 0.25);
    } else if (mode === 'normalized') {
      minY = Math.min(minY, -3.5);
      maxY = Math.max(maxY, 3.5);
    }

    // Ensure comfortable padding around Y-axis
    const ySpan = maxY - minY || 1;
    minY -= ySpan * 0.08;
    maxY += ySpan * 0.08;

    // Coordinate mapping functions
    const xMap = (k) => padL + (k / n) * plotW;
    const yMap = (val) => padT + plotH - ((val - minY) / (maxY - minY)) * plotH;

    // Draw Grid & Axes
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Horizontal grid lines
    const yTicks = 6;
    for (let i = 0; i <= yTicks; i++) {
      const v = minY + (i / yTicks) * (maxY - minY);
      const y = yMap(v);

      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const label = mode === 'average' ? v.toFixed(2) : (mode === 'normalized' ? v.toFixed(1) : Math.round(v));
      ctx.fillText(label, padL - 8, y);
    }

    // Zero line if within domain
    if (minY <= 0 && maxY >= 0) {
      const y0 = yMap(0);
      ctx.save();
      ctx.strokeStyle = colors.borderStrong;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();
      ctx.restore();
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
    ctx.fillText('Systems / Attack Steps (k)', padL + plotW / 2, padT + plotH + 22);

    // Theoretical Envelope Bands (±1σ, ±2σ)
    if (showEnvelope) {
      ctx.save();
      // 2-Sigma envelope fill
      ctx.fillStyle = 'rgba(99, 102, 241, 0.07)';
      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const stat = simulator.stepStats[k][mode];
        const valUpper = stat.theoMean + 2 * stat.theoSD;
        const x = xMap(k);
        const y = yMap(valUpper);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let k = currentStep; k >= 1; k--) {
        const stat = simulator.stepStats[k][mode];
        const valLower = stat.theoMean - 2 * stat.theoSD;
        const x = xMap(k);
        const y = yMap(valLower);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Dashed boundary lines for ±2σ
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const stat = simulator.stepStats[k][mode];
        const x = xMap(k);
        const y = yMap(stat.theoMean + 2 * stat.theoSD);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const stat = simulator.stepStats[k][mode];
        const x = xMap(k);
        const y = yMap(stat.theoMean - 2 * stat.theoSD);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // In Average Mode: Render the LLN Epsilon convergence band
    if (mode === 'average') {
      const mu = simulator.model === 'rademacher' ? 0 : simulator.p;
      const eps = 0.05;
      const yUpperEps = yMap(mu + eps);
      const yLowerEps = yMap(mu - eps);

      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.09)';
      ctx.fillRect(padL, yUpperEps, plotW, yLowerEps - yUpperEps);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(padL, yUpperEps);
      ctx.lineTo(padL + plotW, yUpperEps);
      ctx.moveTo(padL, yLowerEps);
      ctx.lineTo(padL + plotW, yLowerEps);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`±ε = ±0.05 Band`, padL + 8, yUpperEps + 12);
      ctx.restore();
    }

    // Trajectory Paths for Attackers
    // Opacity scales down as m increases to preserve visual clarity
    const pathAlpha = Math.max(0.08, Math.min(0.65, 20 / maxRenderPaths));
    ctx.lineWidth = maxRenderPaths > 300 ? 0.9 : 1.3;

    // Subsample paths if m is very large for rendering speed
    const stepSample = Math.max(1, Math.floor(m / maxRenderPaths));

    for (let j = 0; j < m; j += stepSample) {
      const offset = j * (n + 1);

      // Distinguish attacker trajectories with subtle hue variation
      const hue = 220 + (j % 40) * 2;
      ctx.strokeStyle = `hsla(${hue}, 85%, 60%, ${pathAlpha})`;

      ctx.beginPath();
      const startVal = 0;
      ctx.moveTo(xMap(0), yMap(startVal));

      for (let k = 1; k <= currentStep; k++) {
        const s = simulator.trajectories[offset + k];
        let val = s;
        if (mode === 'average') {
          val = s / k;
        } else if (mode === 'normalized') {
          val = s / Math.sqrt(k);
        }

        ctx.lineTo(xMap(k), yMap(val));
      }
      ctx.stroke();
    }

    // Theoretical Mean Curve E[Y_k]
    ctx.save();
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let k = (mode === 'total' ? 0 : 1); k <= currentStep; k++) {
      const stat = simulator.stepStats[k][mode];
      const x = xMap(k);
      const y = yMap(stat.theoMean);
      if (k === (mode === 'total' ? 0 : 1)) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // Empirical Ensemble Mean Curve
    if (showMean) {
      ctx.save();
      ctx.strokeStyle = colors.statusOk; // Emerald
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 1; k <= currentStep; k++) {
        const stat = simulator.stepStats[k][mode];
        const x = xMap(k);
        const y = yMap(stat.mean);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Legend in top-left corner
    ctx.save();
    const legX = padL + 12;
    const legY = padT + 12;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 210, 68, 6) || ctx.rect(legX, legY, 210, 68);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Item 1: Sample Trajectories
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 14);
    ctx.lineTo(legX + 28, legY + 14);
    ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Attack Paths (m = ${m})`, legX + 36, legY + 14);

    // Item 2: Empirical Mean
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 34);
    ctx.lineTo(legX + 28, legY + 34);
    ctx.stroke();
    ctx.fillText(`Empirical Mean (${mode === 'average' ? 'S_k/k' : (mode === 'normalized' ? 'S_k/√k' : 'S_k')})`, legX + 36, legY + 34);

    // Item 3: Theoretical Expectation E[Y]
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 10, legY + 54);
    ctx.lineTo(legX + 28, legY + 54);
    ctx.stroke();
    ctx.fillText(`Theoretical E[Y] & ±2σ Band`, legX + 36, legY + 54);

    ctx.restore();
  }

  /**
   * Renders Terminal Distribution Histogram vs Theoretical Density
   */
  function renderDistributionCanvas(canvas, simulator, options = {}) {
    if (!canvas || !simulator || !simulator.terminalSummary) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    const mode = options.mode || 'normalized'; // 'total', 'average', 'normalized', 'standardized'
    const summary = simulator.terminalSummary;
    const n = simulator.n;
    const m = simulator.m;
    const isRademacher = simulator.model === 'rademacher';

    ctx.clearRect(0, 0, width, height);

    const padL = 48;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const data = summary.arrays[mode];
    if (!data || data.length === 0) return;

    // Find sample min and max
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < minVal) minVal = data[i];
      if (data[i] > maxVal) maxVal = data[i];
    }

    // Standardize min/max bounds depending on mode
    if (mode === 'standardized' || (mode === 'normalized' && isRademacher)) {
      minVal = Math.min(minVal, -3.8);
      maxVal = Math.max(maxVal, 3.8);
    } else if (mode === 'average') {
      const mu = isRademacher ? 0 : simulator.p;
      minVal = Math.min(minVal, mu - 0.25);
      maxVal = Math.max(maxVal, mu + 0.25);
    }

    const span = maxVal - minVal || 1;
    minVal -= span * 0.05;
    maxVal += span * 0.05;

    // Number of histogram bins (Freedman-Diaconis or Sturges rule)
    const numBins = Math.max(12, Math.min(48, Math.round(Math.sqrt(m))));
    const binWidth = (maxVal - minVal) / numBins;
    const binCounts = new Int32Array(numBins);

    for (let i = 0; i < data.length; i++) {
      let b = Math.floor((data[i] - minVal) / binWidth);
      if (b >= numBins) b = numBins - 1;
      if (b < 0) b = 0;
      binCounts[b]++;
    }

    // Max density
    let maxDensity = 0;
    const binDensities = new Float32Array(numBins);
    for (let b = 0; b < numBins; b++) {
      const density = binCounts[b] / (m * binWidth);
      binDensities[b] = density;
      if (density > maxDensity) maxDensity = density;
    }

    // In normalized/standardized mode, make sure theoretical Gaussian peak (0.3989) is visible
    if (mode === 'standardized' || (mode === 'normalized' && isRademacher)) {
      maxDensity = Math.max(maxDensity, 0.45);
    }

    maxDensity *= 1.15; // Padding at top

    // Mapping coordinates
    const xMap = (v) => padL + ((v - minVal) / (maxVal - minVal)) * plotW;
    const yMap = (dens) => padT + plotH - (dens / maxDensity) * plotH;

    // Draw Grid
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= 4; i++) {
      const densVal = (i / 4) * maxDensity;
      const y = yMap(densVal);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(densVal.toFixed(2), padL - 6, y);
    }

    // Draw Histogram Bars
    for (let b = 0; b < numBins; b++) {
      const v0 = minVal + b * binWidth;
      const x0 = xMap(v0);
      const x1 = xMap(v0 + binWidth);
      const w = Math.max(1, x1 - x0 - 1);
      const y = yMap(binDensities[b]);
      const h = padT + plotH - y;

      const grad = ctx.createLinearGradient(0, y, 0, padT + plotH);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.65)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.2)');

      ctx.fillStyle = grad;
      ctx.fillRect(x0 + 0.5, y, w, h);

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, y, w, h);
    }

    // Overlaid Theoretical Distribution Curve
    ctx.save();
    ctx.lineWidth = 2.4;

    if (mode === 'standardized' || (mode === 'normalized' && isRademacher)) {
      // Standard Normal Curve N(0, 1)
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.beginPath();
      const numPts = 120;
      for (let i = 0; i <= numPts; i++) {
        const v = minVal + (i / numPts) * (maxVal - minVal);
        const dens = normalPdf(v);
        const x = xMap(v);
        const y = yMap(dens);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Theoretical label
      ctx.fillStyle = '#10b981';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Theoretical Standard Normal N(0, 1)`, padL + 12, padT + 20);
    } else if (mode === 'total' && !isRademacher && n <= 300) {
      // Bernoulli Binomial PMF
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      for (let k = Math.max(0, Math.floor(minVal)); k <= Math.min(n, Math.ceil(maxVal)); k++) {
        const prob = binomialPmf(n, k, simulator.p);
        const x = xMap(k);
        const y = yMap(prob);
        if (k === Math.max(0, Math.floor(minVal))) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        ctx.arc(x, y, 2, 0, Math.PI * 2);
      }
      ctx.stroke();
    } else {
      // Gaussian approximation with empirical mean and SD
      const mean = summary[mode].theoMean;
      const sd = summary[mode].theoSD;
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      const numPts = 120;
      for (let i = 0; i <= numPts; i++) {
        const v = minVal + (i / numPts) * (maxVal - minVal);
        const z = sd > 0 ? (v - mean) / sd : 0;
        const dens = sd > 0 ? normalPdf(z) / sd : 0;
        const x = xMap(v);
        const y = yMap(dens);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // X-Axis labels
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';
    const numXTicks = 6;
    for (let i = 0; i <= numXTicks; i++) {
      const v = minVal + (i / numXTicks) * (maxVal - minVal);
      const x = xMap(v);
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 4);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = Math.abs(v) < 10 ? v.toFixed(2) : Math.round(v);
      ctx.fillText(label, x, padT + plotH + 6);
    }

    // Legend
    ctx.save();
    ctx.fillStyle = colors.textMain;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Empirical Histogram (m = ${m})`, padL + plotW - 8, padT + 16);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`— CLT Asymptotic Limit`, padL + plotW - 8, padT + 32);
    ctx.restore();
  }

  /**
   * Renders Variance Scaling across steps k = 1 ... n
   * Demonstrates:
   * 1. Var(S_k) ~ O(k) (Exploding)
   * 2. Var(S_k / sqrt(k)) ~ O(1) (Stable Constant)
   * 3. Var(S_k / k) ~ O(1/k) (Collapsing to 0)
   */
  function renderVarianceCanvas(canvas, simulator, options = {}) {
    if (!canvas || !simulator || !simulator.stepStats) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 52;
    const padR = 24;
    const padT = 24;
    const padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    if (plotW <= 0 || plotH <= 0) return;

    const n = simulator.n;
    const viewMetric = options.metric || 'comparison'; // 'comparison', 'total', 'average', 'normalized'

    // We plot normalized variance curves so they can be viewed on one comparable scale,
    // or log scale / individual scales.
    const xMap = (k) => padL + (k / n) * plotW;

    // Grid
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    if (viewMetric === 'comparison') {
      // Plot Normalized Variance: Var(S_k) / Var(X_1) to show the 3 scaling regimes
      // Total: k
      // Normalized: 1
      // Average: 1/k
      const maxVal = Math.min(n, 120); // Cap comparison view height for readability
      const yMap = (v) => padT + plotH - (Math.min(maxVal, Math.max(0, v)) / maxVal) * plotH;

      for (let i = 0; i <= 4; i++) {
        const v = (i / 4) * maxVal;
        const y = yMap(v);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(0), padL - 8, y);
      }

      // 1. Total Score Variance Var(S_k) (Blue, explodes linearly)
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 1; k <= n; k++) {
        const sampleVar = simulator.stepStats[k].total.variance;
        const v = sampleVar / simulator.stepStats[n].total.theoVar * n; // Normalized to step scale
        const x = xMap(k);
        const y = yMap(v);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Normalized Score Variance Var(S_k / sqrt(k)) (Amber, flat at 1.0)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 1; k <= n; k++) {
        const sampleVar = simulator.stepStats[k].normalized.variance;
        const v = sampleVar / (simulator.model === 'rademacher' ? 1.0 : simulator.p * (1 - simulator.p));
        const x = xMap(k);
        const y = yMap(v);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 3. Average Score Variance Var(S_k / k) (Emerald, collapses to 0)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let k = 1; k <= n; k++) {
        const sampleVar = simulator.stepStats[k].average.variance;
        const v = sampleVar / (simulator.model === 'rademacher' ? 1.0 : simulator.p * (1 - simulator.p));
        const x = xMap(k);
        const y = yMap(v);
        if (k === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Legend in top-left
      ctx.save();
      const legX = padL + 12;
      const legY = padT + 12;
      ctx.fillStyle = colors.bgCard;
      ctx.strokeStyle = colors.borderSubtle;
      ctx.beginPath();
      ctx.roundRect?.(legX, legY, 230, 68, 6) || ctx.rect(legX, legY, 230, 68);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(legX + 8, legY + 8, 14, 10);
      ctx.fillStyle = colors.textMain;
      ctx.fillText('Var(S_k) ~ O(k) [Exploding]', legX + 28, legY + 14);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(legX + 8, legY + 28, 14, 10);
      ctx.fillStyle = colors.textMain;
      ctx.fillText('Var(S_k / √k) ~ O(1) [CLT Invariant]', legX + 28, legY + 34);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(legX + 8, legY + 48, 14, 10);
      ctx.fillStyle = colors.textMain;
      ctx.fillText('Var(S_k / k) ~ O(1/k) [LLN Collapse]', legX + 28, legY + 54);
      ctx.restore();
    }

    // X-Axis
    for (let i = 0; i <= 5; i++) {
      const stepVal = Math.round((i / 5) * n);
      const x = xMap(stepVal);
      ctx.beginPath();
      ctx.moveTo(x, padT + plotH);
      ctx.lineTo(x, padT + plotH + 4);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(stepVal, x, padT + plotH + 6);
    }
  }

  /**
   * Renders Normal Quantile-Quantile (Q-Q) Plot for CLT Verification
   */
  function renderQQCanvas(canvas, simulator, options = {}) {
    if (!canvas || !simulator || !simulator.terminalSummary) return;

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

    const sortedStd = simulator.terminalSummary.arrays.sortedStd;
    const m = sortedStd.length;

    // Symmetric domain [-3.5, +3.5]
    const minZ = -3.5;
    const maxZ = 3.5;

    const xMap = (theoZ) => padL + ((theoZ - minZ) / (maxZ - minZ)) * plotW;
    const yMap = (empZ) => padT + plotH - ((empZ - minZ) / (maxZ - minZ)) * plotH;

    // Grid & 45-degree Reference Line
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let z = -3; z <= 3; z += 1) {
      const x = xMap(z);
      const y = yMap(z);

      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(z, padL - 6, y);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(z, x, padT + plotH + 6);
    }

    // Reference Line y = x
    ctx.save();
    ctx.strokeStyle = '#ef4444'; // Red reference
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xMap(minZ), yMap(minZ));
    ctx.lineTo(xMap(maxZ), yMap(maxZ));
    ctx.stroke();
    ctx.restore();

    // Plot Empirical Quantiles against Theoretical Quantiles
    ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
    ctx.strokeStyle = colors.accentPrimary;

    for (let i = 0; i < m; i++) {
      // Blom / Filliben plotting position: (i + 0.5) / m
      const p = (i + 0.5) / m;
      const theoZ = normalQuantile(p);
      const empZ = sortedStd[i];

      const x = xMap(theoZ);
      const y = yMap(empZ);

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chart Title & Metrics
    ctx.save();
    ctx.fillStyle = colors.textMain;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Normal Q-Q Plot (CLT Diagnostic)`, padL + 8, padT + 14);

    const ks = simulator.terminalSummary.standardized.ks;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = ks.isNormal ? '#10b981' : '#f59e0b';
    ctx.fillText(`K-S Stat D: ${ks.statistic.toFixed(4)} | p-val: ${ks.pValue.toFixed(3)} (${ks.isNormal ? 'Normal Pass' : 'Tail Discrepancy'})`, padL + 8, padT + 28);
    ctx.restore();
  }

  // --- Export Module ---
  window.Hw4Engine = {
    PenetrationSimulator: PenetrationSimulator,
    normalCdf: normalCdf,
    normalPdf: normalPdf,
    normalQuantile: normalQuantile,
    binomialPmf: binomialPmf,
    renderTrajectoryCanvas: renderTrajectoryCanvas,
    renderDistributionCanvas: renderDistributionCanvas,
    renderVarianceCanvas: renderVarianceCanvas,
    renderQQCanvas: renderQQCanvas
  };

})(window);
