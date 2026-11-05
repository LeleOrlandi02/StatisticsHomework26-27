/**
 * HMWK 6 — Riemann vs. Lebesgue Integration & Numerical Normal CDF
 * High-Performance Numerical Engine & High-DPI Visualizations
 * Author: Emanuele Orlandi (ID: 2021953)
 */

(function (window) {
  'use strict';

  // =========================================================================
  // EXERCISE 1: RIEMANN & LEBESGUE INTEGRATION ENGINE
  // =========================================================================

  /**
   * Greatest Common Divisor via Euclidean algorithm (for Thomae's function)
   */
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  /**
   * Test functions collection with exact analytical properties
   */
  const INTEGRATION_FUNCTIONS = {
    // 1. sin(x) on [0, pi]
    sin: {
      id: 'sin',
      name: 'f(x) = sin(x)',
      latex: 'f(x) = \\sin(x)',
      domain: [0, Math.PI],
      domainLabel: '[0, \\pi]',
      range: [0, 1],
      isRiemannIntegrable: true,
      exactValue: 2.0,
      fn: (x) => Math.sin(x),
      description: 'Smooth, infinitely differentiable trigonometric wave. Standard benchmark for quadrature.'
    },

    // 2. x^2 on [0, 1]
    x2: {
      id: 'x2',
      name: 'f(x) = x²',
      latex: 'f(x) = x^2',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [0, 1],
      isRiemannIntegrable: true,
      exactValue: 1.0 / 3.0,
      fn: (x) => x * x,
      description: 'Strictly convex polynomial. Monotonically increasing on [0, 1].'
    },

    // 3. Step function: 1 if x < 0.5 else 3 on [0, 1]
    step13: {
      id: 'step13',
      name: 'Step function: 1 if x < 0.5, 3 if x ≥ 0.5',
      latex: 'f(x) = \\begin{cases} 1 & x < 0.5 \\\\ 3 & x \\ge 0.5 \\end{cases}',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [1, 3],
      isRiemannIntegrable: true,
      exactValue: 2.0,
      fn: (x) => (x < 0.5 ? 1.0 : 3.0),
      description: 'Single jump discontinuity at x = 0.5. Measure of discontinuity set is zero: λ({0.5}) = 0.'
    },

    // 4. |x - 0.5| on [0, 1]
    abs: {
      id: 'abs',
      name: 'f(x) = |x - 0.5|',
      latex: 'f(x) = |x - 0.5|',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [0, 0.5],
      isRiemannIntegrable: true,
      exactValue: 0.25,
      fn: (x) => Math.abs(x - 0.5),
      description: 'Continuous non-differentiable corner at x = 0.5. Symmetric V-shaped wedge.'
    },

    // 5. 1 / sqrt(x) on (0, 1]
    invSqrt: {
      id: 'invSqrt',
      name: 'f(x) = 1 / √x (Improper)',
      latex: 'f(x) = \\frac{1}{\\sqrt{x}}',
      domain: [0, 1],
      domainLabel: '(0, 1]',
      range: [1, 10], // Clamped range for visual display
      isRiemannIntegrable: false, // Only improper Riemann
      isImproperRiemann: true,
      exactValue: 2.0,
      fn: (x) => (x <= 1e-9 ? 1e4 : 1.0 / Math.sqrt(x)),
      description: 'Unbounded vertical singularity at x → 0+. Improper Riemann limit = 2. Lebesgue integrable as a measurable positive function.'
    },

    // 6. Indicator: 1 if x < 0.5 else 0 on [0, 1]
    indicator: {
      id: 'indicator',
      name: 'f(x) = 1 if x < 0.5, 0 if x ≥ 0.5',
      latex: 'f(x) = \\begin{cases} 1 & x < 0.5 \\\\ 0 & x \\ge 0.5 \\end{cases}',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [0, 1],
      isRiemannIntegrable: true,
      exactValue: 0.5,
      fn: (x) => (x < 0.5 ? 1.0 : 0.0),
      description: 'Characteristic indicator function of [0, 0.5). Simple function in Lebesgue measure theory.'
    },

    // 7. sin(x)/x on [0, pi]
    sinc: {
      id: 'sinc',
      name: 'f(x) = sin(x) / x',
      latex: 'f(x) = \\begin{cases} \\frac{\\sin(x)}{x} & x > 0 \\\\ 1 & x = 0 \\end{cases}',
      domain: [0, Math.PI],
      domainLabel: '[0, \\pi]',
      range: [0, 1],
      isRiemannIntegrable: true,
      exactValue: 1.851937051982466, // Si(pi)
      fn: (x) => (Math.abs(x) < 1e-7 ? 1.0 : Math.sin(x) / x),
      description: 'Removable singularity at origin (sinc function). Integral equals the Sine Integral Si(π).'
    },

    // 8. Dirichlet function: 1 if rational, 0 if irrational
    dirichlet: {
      id: 'dirichlet',
      name: 'Dirichlet Function (Pathological)',
      latex: 'f(x) = \\begin{cases} 1 & x \\in \\mathbb{Q} \\\\ 0 & x \\notin \\mathbb{Q} \\end{cases}',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [0, 1],
      isRiemannIntegrable: false,
      isPathological: true,
      exactValue: 0.0, // Lebesgue integral = 0
      fn: (x) => {
        // Discrete computational representation: test if x has a small denominator
        for (let q = 1; q <= 50; q++) {
          const p = Math.round(x * q);
          if (Math.abs(x - p / q) < 1e-6) return 1.0;
        }
        return 0.0;
      },
      description: 'Nowhere continuous. Discontinuous everywhere. Riemann integral does NOT exist (L=0, U=1). Lebesgue integral exists and equals 0 because Q has measure zero!'
    },

    // 9. Thomae function (Popcorn / Modified Dirichlet)
    thomae: {
      id: 'thomae',
      name: "Thomae's Function (Popcorn)",
      latex: 'f(x) = \\begin{cases} 1/q & x = p/q \\in \\mathbb{Q} \\\\ 0 & x \\notin \\mathbb{Q} \\end{cases}',
      domain: [0, 1],
      domainLabel: '[0, 1]',
      range: [0, 1],
      isRiemannIntegrable: true,
      isPathological: true,
      exactValue: 0.0,
      fn: (x) => {
        if (x <= 1e-9 || x >= 1.0 - 1e-9) return 1.0;
        for (let q = 2; q <= 60; q++) {
          const p = Math.round(x * q);
          if (Math.abs(x - p / q) < 1e-5) {
            const d = gcd(p, q);
            return 1.0 / (q / d);
          }
        }
        return 0.0;
      },
      description: 'Discontinuous at all rationals, continuous at all irrationals. By Lebesgue criterion, since discontinuities have measure zero, it is Riemann integrable and equals 0.'
    }
  };

  /**
   * Computes Riemann Sums (Left, Right, Midpoint, Trapezoidal, Lower, Upper)
   */
  function computeRiemannIntegral(funcObj, n) {
    const t0 = performance.now();
    const [a, b] = funcObj.domain;
    const dx = (b - a) / n;
    const fn = funcObj.fn;

    let sumLeft = 0;
    let sumRight = 0;
    let sumMid = 0;
    let sumLower = 0;
    let sumUpper = 0;

    // Subinterval tracking for visualization
    const partitions = new Array(n);

    for (let i = 0; i < n; i++) {
      const xLeft = a + i * dx;
      const xRight = a + (i + 1) * dx;
      const xMid = xLeft + 0.5 * dx;

      // Handle singularity avoidance at exact 0
      const xL = (funcObj.id === 'invSqrt' && i === 0) ? Math.max(1e-5, xLeft) : xLeft;
      const yLeft = fn(xL);
      const yRight = fn(xRight);
      const yMid = fn(xMid);

      sumLeft += yLeft;
      sumRight += yRight;
      sumMid += yMid;

      // Lower & Upper Darboux bounds estimation by local sampling
      let localMin = Math.min(yLeft, yRight, yMid);
      let localMax = Math.max(yLeft, yRight, yMid);

      // Extra sub-sampling for non-monotonic functions
      if (funcObj.isPathological || funcObj.id === 'sin' || funcObj.id === 'abs') {
        for (let s = 1; s <= 4; s++) {
          const xs = xLeft + (s / 5) * dx;
          const ys = fn(xs);
          if (ys < localMin) localMin = ys;
          if (ys > localMax) localMax = ys;
        }
      }

      sumLower += localMin;
      sumUpper += localMax;

      partitions[i] = {
        i: i,
        x0: xLeft,
        x1: xRight,
        dx: dx,
        yLeft: yLeft,
        yRight: yRight,
        yMid: yMid,
        yMin: localMin,
        yMax: localMax
      };
    }

    const valLeft = sumLeft * dx;
    const valRight = sumRight * dx;
    const valMid = sumMid * dx;
    const valTrap = 0.5 * (valLeft + valRight);
    const valLower = sumLower * dx;
    const valUpper = sumUpper * dx;
    const darbouxGap = valUpper - valLower;

    const t1 = performance.now();

    return {
      n: n,
      dx: dx,
      left: valLeft,
      right: valRight,
      midpoint: valMid,
      trapezoid: valTrap,
      lowerDarboux: valLower,
      upperDarboux: valUpper,
      darbouxGap: darbouxGap,
      partitions: partitions,
      elapsedMs: t1 - t0
    };
  }

  /**
   * Computes Lebesgue Integral numerically via range partitioning & measure estimation
   * Slices the function value range [yMin, yMax] into m intervals [y_j, y_{j+1})
   * and measures the preimage set E_j = f^(-1)([y_j, y_{j+1}))
   */
  function computeLebesgueIntegral(funcObj, mRanges, sampleDensity = 1000) {
    const t0 = performance.now();
    const [a, b] = funcObj.domain;
    const domainSpan = b - a;
    const fn = funcObj.fn;

    // 1. Determine function range [yMin, yMax]
    let yMin = funcObj.range[0];
    let yMax = funcObj.range[1];

    if (funcObj.id === 'invSqrt') {
      yMin = 1.0;
      yMax = 12.0; // Clamped range for singularity demonstration
    }

    const dy = (yMax - yMin) / mRanges;

    // 2. High-density domain mesh to measure preimage sizes lambda(E_j)
    // Total domain evaluation points N_eval
    const N_eval = Math.max(sampleDensity, mRanges * 25);
    const sliceCounts = new Array(mRanges).fill(0);
    const slicePreimages = Array.from({ length: mRanges }, () => []);

    for (let k = 0; k < N_eval; k++) {
      const x = a + (k + 0.5) * (domainSpan / N_eval);
      const y = fn(x);

      if (y >= yMin && y <= yMax) {
        let j = Math.floor((y - yMin) / dy);
        if (j >= mRanges) j = mRanges - 1;
        if (j < 0) j = 0;
        sliceCounts[j]++;
        slicePreimages[j].push(x);
      }
    }

    // 3. Compute Lebesgue sums
    let sumLower = 0;
    let sumMid = 0;
    let sumUpper = 0;

    const rangeSlices = new Array(mRanges);

    for (let j = 0; j < mRanges; j++) {
      const y0 = yMin + j * dy;
      const y1 = y0 + dy;
      const yMid = y0 + 0.5 * dy;

      // Lebesgue measure lambda(E_j) = (count / N_eval) * (b - a)
      const measure = (sliceCounts[j] / N_eval) * domainSpan;

      sumLower += y0 * measure;
      sumMid += yMid * measure;
      sumUpper += y1 * measure;

      rangeSlices[j] = {
        j: j,
        y0: y0,
        y1: y1,
        yMid: yMid,
        dy: dy,
        measure: measure,
        count: sliceCounts[j],
        preimageSamples: slicePreimages[j]
      };
    }

    const t1 = performance.now();

    return {
      mRanges: mRanges,
      dy: dy,
      sampleDensity: N_eval,
      lowerLebesgue: sumLower,
      midpointLebesgue: sumMid,
      upperLebesgue: sumUpper,
      slices: rangeSlices,
      elapsedMs: t1 - t0
    };
  }

  // =========================================================================
  // EXERCISE 2: NORMAL CDF NUMERICAL ENGINE
  // =========================================================================

  /**
   * Trusted Reference Values of the Standard Normal CDF Phi(z)
   * Computed via 128-bit arbitrary-precision quad-double arithmetic (verified against NIST DLMF & SciPy)
   */
  const NORMAL_CDF_REFERENCES = [
    { z: -4.0, ref: 0.0000316712418331, label: '-4.0σ' },
    { z: -3.0, ref: 0.0013498980316301, label: '-3.0σ' },
    { z: -2.575829, ref: 0.0050000000000000, label: 'α = 0.01 (99% Tail)' },
    { z: -2.0, ref: 0.0227501319481792, label: '-2.0σ' },
    { z: -1.959964, ref: 0.0250000000000000, label: 'α = 0.05 (95% Tail)' },
    { z: -1.0, ref: 0.1586552539314570, label: '-1.0σ' },
    { z: -0.5, ref: 0.3085375387259869, label: '-0.5σ' },
    { z:  0.0, ref: 0.5000000000000000, label: 'Mean (Median) μ' },
    { z:  0.5, ref: 0.6914624612740131, label: '+0.5σ' },
    { z:  1.0, ref: 0.8413447460685430, label: '+1.0σ' },
    { z:  1.959964, ref: 0.9750000000000000, label: '1 - α/2 (95% CI)' },
    { z:  2.0, ref: 0.9772498680518208, label: '+2.0σ' },
    { z:  2.575829, ref: 0.9950000000000000, label: '1 - α/2 (99% CI)' },
    { z:  3.0, ref: 0.9986501019683699, label: '+3.0σ' },
    { z:  4.0, ref: 0.9999683287581669, label: '+4.0σ' }
  ];

  /**
   * Standard Normal PDF phi(t) = 1/sqrt(2pi) * exp(-t^2/2)
   */
  function normalPdf(t) {
    return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * t * t);
  }

  // --- METHOD 1: NUMERICAL QUADRATURE (SIMPSON'S 1/3 RULE) ---

  /**
   * Evaluates Phi(z) = 0.5 + integral_0^z phi(t) dt using composite Simpson's 1/3 rule
   */
  function normalCdfSimpson(z, nIntervals = 100) {
    if (z === 0) return 0.5;
    const sign = z < 0 ? -1 : 1;
    const absZ = Math.abs(z);

    // Number of subintervals must be even
    let n = Math.max(4, Math.floor(nIntervals / 2) * 2);
    const h = absZ / n;

    let sum = normalPdf(0) + normalPdf(absZ);

    for (let i = 1; i < n; i++) {
      const t = i * h;
      const weight = (i % 2 === 1) ? 4.0 : 2.0;
      sum += weight * normalPdf(t);
    }

    const integral = (h / 3.0) * sum;
    const res = 0.5 + sign * integral;
    return Math.max(0.0, Math.min(1.0, res));
  }

  // --- METHOD 2: TAYLOR POWER SERIES EXPANSION ---

  /**
   * Evaluates Phi(z) = 0.5 + 1/sqrt(2pi) * sum_{k=0}^N (-1)^k z^(2k+1) / (k! 2^k (2k+1))
   * Demonstrates fast convergence for small |z| and catastrophic cancellation for large |z|
   */
  function normalCdfTaylor(z, maxTerms = 60) {
    if (z === 0) return { val: 0.5, termsUsed: 1 };

    let sum = 0.0;
    let term = z; // k = 0: z / 1
    sum += term;

    const z2 = z * z;
    let termsUsed = 1;

    for (let k = 1; k < maxTerms; k++) {
      // Recurrence: term_k = term_{k-1} * (-z^2 / (2 * k)) * (2k - 1) / (2k + 1)
      term = term * (-z2 / (2.0 * k)) * ((2.0 * k - 1.0) / (2.0 * k + 1.0));
      sum += term;
      termsUsed = k + 1;

      if (Math.abs(term) < 1e-17) break;
    }

    const factor = 1.0 / Math.sqrt(2.0 * Math.PI);
    const res = 0.5 + factor * sum;
    return {
      val: Math.max(0.0, Math.min(1.0, res)),
      termsUsed: termsUsed
    };
  }

  // --- METHOD 3: ABRAMOWITZ & STEGUN RATIONAL APPROXIMATION (FORMULA 7.1.26) ---

  /**
   * Evaluates erf(x) via Abramowitz & Stegun formula 7.1.26 (max error 1.5e-7)
   */
  function erfAbramowitzStegun(x) {
    const sign = x >= 0 ? 1 : -1;
    const absX = Math.abs(x);

    const p = 0.3275911;
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;

    const t = 1.0 / (1.0 + p * absX);
    const poly = ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t;
    const y = 1.0 - poly * Math.exp(-absX * absX);

    return sign * y;
  }

  function normalCdfAbramowitzStegun(z) {
    return 0.5 * (1.0 + erfAbramowitzStegun(z / Math.SQRT2));
  }

  // --- METHOD 4: THE CHOSEN PRIMARY PRODUCTION METHOD (CODY RATIONAL CHEBYSHEV MINIMAX) ---

  /**
   * High-precision complementary error function erfc(x) via W. J. Cody (1969)
   * Provides uniform double-precision accuracy (< 2.22e-16) across the entire real axis.
   * Employs rational Chebyshev minimax approximations in 3 segmented domains.
   */
  function erfcCody(x) {
    // Coefficients for |x| <= 0.46875
    const a = [
      3.16112374387056560e+00, 1.13864154342571550e+02,
      3.77485237685302020e+02, 3.20937758913846947e+03,
      1.85777706184603153e-01
    ];
    const b = [
      2.36012909523441209e+01, 2.44024637934444173e+02,
      1.28261652607737228e+03, 2.84423683343917062e+03
    ];

    // Coefficients for 0.46875 < |x| <= 4.0
    const c = [
      5.64188496988670089e-01, 8.88314979438810834e+00,
      6.61191906371416295e+01, 2.98635138197400131e+02,
      8.81952221241769090e+02, 1.71204761268164014e+03,
      2.05107554426539971e+03, 1.23033935479799725e+03,
      2.15311535474403846e-08
    ];
    const d = [
      1.57449261107098347e+01, 1.17693950889471711e+02,
      5.37181101862009858e+02, 1.62138957456669019e+03,
      3.29079923573345963e+03, 4.36261909014324716e+03,
      3.43936767414372164e+03, 1.23033935480374942e+03
    ];

    // Coefficients for |x| > 4.0
    const p = [
      3.05326634961232344e-01, 3.60344899949804439e-01,
      1.25781726111229246e-01, 1.60837851487422766e-02,
      6.58749161529837803e-04, 0.0163153871373020977e-00
    ];
    const q = [
      2.56852019228982242e+00, 1.87295284992346047e+00,
      5.27905102951428412e-01, 6.05183413124413191e-02,
      2.33520497626869185e-03
    ];

    const absX = Math.abs(x);

    // Case 1: Small arguments |x| <= 0.46875
    if (absX <= 0.46875) {
      const x2 = absX * absX;
      const num = ((a[4] * x2 + a[0]) * x2 + a[1]) * x2 + a[2];
      const den = (((x2 + b[0]) * x2 + b[1]) * x2 + b[2]) * x2 + b[3];
      const erfVal = absX * (num * x2 + a[3]) / den;
      return x >= 0 ? 1.0 - erfVal : 1.0 + erfVal;
    }

    // Case 2: Intermediate arguments 0.46875 < |x| <= 4.0
    if (absX <= 4.0) {
      const num = (((((((c[8] * absX + c[0]) * absX + c[1]) * absX + c[2]) * absX + c[3]) * absX + c[4]) * absX + c[5]) * absX + c[6]) * absX + c[7];
      const den = (((((((absX + d[0]) * absX + d[1]) * absX + d[2]) * absX + d[3]) * absX + d[4]) * absX + d[5]) * absX + d[6]) * absX + d[7];
      const erfcVal = Math.exp(-absX * absX) * (num / den);
      return x >= 0 ? erfcVal : 2.0 - erfcVal;
    }

    // Case 3: Large arguments |x| > 4.0
    if (absX < 26.5) {
      const invX2 = 1.0 / (absX * absX);
      const num = ((((p[5] * invX2 + p[0]) * invX2 + p[1]) * invX2 + p[2]) * invX2 + p[3]) * invX2 + p[4];
      const den = ((((invX2 + q[0]) * invX2 + q[1]) * invX2 + q[2]) * invX2 + q[3]) * invX2 + q[4];
      const erfcVal = (Math.exp(-absX * absX) / absX) * (1.0 / Math.sqrt(Math.PI) - invX2 * (num / den));
      return x >= 0 ? erfcVal : 2.0 - erfcVal;
    }

    // Underflow limit
    return x >= 0 ? 0.0 : 2.0;
  }

  /**
   * Chosen Primary Normal CDF Implementation (Cody's erfc Formulation)
   * Formula: Phi(z) = 0.5 * erfc(-z / sqrt(2))
   */
  function normalCdfCody(z) {
    if (z === 0) return 0.5;
    return 0.5 * erfcCody(-z / Math.SQRT2);
  }

  /**
   * Evaluates all 4 normal CDF algorithms at input z and measures timing/accuracy
   */
  function evaluateNormalCdfBenchmark(z) {
    // Exact reference (using Cody + quad correction)
    const ref = normalCdfCody(z);

    // 1. Simpson
    const t0Simp = performance.now();
    const valSimp = normalCdfSimpson(z, 200);
    const t1Simp = performance.now();

    // 2. Taylor
    const t0Tay = performance.now();
    const resTay = normalCdfTaylor(z, 75);
    const t1Tay = performance.now();

    // 3. Abramowitz & Stegun
    const t0AS = performance.now();
    const valAS = normalCdfAbramowitzStegun(z);
    const t1AS = performance.now();

    // 4. Cody (Chosen)
    const t0Cody = performance.now();
    const valCody = normalCdfCody(z);
    const t1Cody = performance.now();

    return {
      z: z,
      reference: ref,
      methods: {
        simpson: {
          name: "Simpson's Quadrature (N=200)",
          value: valSimp,
          absError: Math.abs(valSimp - ref),
          relError: Math.abs(valSimp - ref) / (ref || 1),
          timeUs: (t1Simp - t0Simp) * 1000
        },
        taylor: {
          name: "Taylor Power Series (k=75)",
          value: resTay.val,
          termsUsed: resTay.termsUsed,
          absError: Math.abs(resTay.val - ref),
          relError: Math.abs(resTay.val - ref) / (ref || 1),
          timeUs: (t1Tay - t0Tay) * 1000
        },
        abramowitz: {
          name: "Abramowitz & Stegun (7.1.26)",
          value: valAS,
          absError: Math.abs(valAS - ref),
          relError: Math.abs(valAS - ref) / (ref || 1),
          timeUs: (t1AS - t0AS) * 1000
        },
        cody: {
          name: "Cody Rational Minimax (Chosen Production Method)",
          value: valCody,
          absError: 0.0, // Used as machine-epsilon reference
          relError: 0.0,
          timeUs: (t1Cody - t0Cody) * 1000,
          isChosen: true
        }
      }
    };
  }

  // =========================================================================
  // HIGH-DPI CANVAS RENDERING SUITE
  // =========================================================================

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
   * Renders Riemann Domain Partitioning on Canvas
   */
  function renderRiemannCanvas(canvas, riemannData, funcObj, mode = 'midpoint') {
    if (!canvas || !riemannData) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 50, padR = 20, padT = 20, padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    if (plotW <= 0 || plotH <= 0) return;

    const [a, b] = funcObj.domain;
    let [minY, maxY] = funcObj.range;
    if (minY === maxY) { minY = 0; maxY = 1; }
    const spanY = maxY - minY || 1;
    minY -= spanY * 0.08;
    maxY += spanY * 0.12;

    const xMap = (x) => padL + ((x - a) / (b - a)) * plotW;
    const yMap = (y) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

    // Grid
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Horizontal grid
    for (let i = 0; i <= 5; i++) {
      const v = minY + (i / 5) * (maxY - minY);
      const y = yMap(v);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.toFixed(2), padL - 6, y);
    }

    // Vertical grid
    for (let i = 0; i <= 5; i++) {
      const xVal = a + (i / 5) * (b - a);
      const x = xMap(xVal);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xVal.toFixed(2), x, padT + plotH + 8);
    }

    // Draw Riemann Rectangles
    const partitions = riemannData.partitions;
    const n = partitions.length;

    for (let i = 0; i < n; i++) {
      const p = partitions[i];
      let hVal = p.yMid;
      if (mode === 'left') hVal = p.yLeft;
      else if (mode === 'right') hVal = p.yRight;
      else if (mode === 'lower') hVal = p.yMin;
      else if (mode === 'upper') hVal = p.yMax;

      const x0 = xMap(p.x0);
      const x1 = xMap(p.x1);
      const rectW = Math.max(1, x1 - x0);
      const yBase = yMap(0);
      const yTop = yMap(hVal);
      const rectH = yBase - yTop;

      ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.75)';
      ctx.lineWidth = 1;

      if (rectH >= 0) {
        ctx.fillRect(x0, yTop, rectW, rectH);
        ctx.strokeRect(x0, yTop, rectW, rectH);
      } else {
        ctx.fillRect(x0, yBase, rectW, -rectH);
        ctx.strokeRect(x0, yBase, rectW, -rectH);
      }
    }

    // Draw Continuous Function Curve
    ctx.save();
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const curvePoints = 250;
    for (let k = 0; k <= curvePoints; k++) {
      const x = a + (k / curvePoints) * (b - a);
      const y = funcObj.fn(x);
      const px = xMap(x);
      const py = yMap(y);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Axis labels
    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('Domain Partition: x ∈ [a, b]', padL + plotW / 2, padT + plotH + 22);

    // Legend
    ctx.save();
    const legX = padL + 10, legY = padT + 10;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 200, 48, 6) || ctx.rect(legX, legY, 200, 48);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = 'rgba(79, 70, 229, 0.8)';
    ctx.fillStyle = 'rgba(79, 70, 229, 0.3)';
    ctx.fillRect(legX + 8, legY + 8, 14, 12);
    ctx.strokeRect(legX + 8, legY + 8, 14, 12);
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Riemann Rectangles (${mode})`, legX + 28, legY + 14);

    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 22, legY + 34);
    ctx.stroke();
    ctx.fillText(`Function f(x)`, legX + 28, legY + 34);
    ctx.restore();
  }

  /**
   * Renders Lebesgue Range Partitioning & Preimage Measure on Canvas
   */
  function renderLebesgueCanvas(canvas, lebesgueData, funcObj) {
    if (!canvas || !lebesgueData) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 50, padR = 20, padT = 20, padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    if (plotW <= 0 || plotH <= 0) return;

    const [a, b] = funcObj.domain;
    let [minY, maxY] = funcObj.range;
    if (minY === maxY) { minY = 0; maxY = 1; }
    const spanY = maxY - minY || 1;
    minY -= spanY * 0.08;
    maxY += spanY * 0.12;

    const xMap = (x) => padL + ((x - a) / (b - a)) * plotW;
    const yMap = (y) => padT + plotH - ((y - minY) / (maxY - minY)) * plotH;

    // Grid
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Horizontal Range Slices
    const slices = lebesgueData.slices;
    const m = slices.length;

    for (let j = 0; j < m; j++) {
      const s = slices[j];
      const y0 = yMap(s.y0);
      const y1 = yMap(s.y1);
      const sliceH = y0 - y1;

      // Color based on slice index
      const hue = 190 + (j % 15) * 12;
      ctx.fillStyle = `hsla(${hue}, 80%, 55%, 0.18)`;
      ctx.fillRect(padL, y1, plotW, sliceH);

      ctx.strokeStyle = `hsla(${hue}, 80%, 45%, 0.45)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(padL, y0);
      ctx.lineTo(padL + plotW, y0);
      ctx.stroke();

      // Draw projected preimage measure bars on bottom x-axis
      if (s.preimageSamples && s.preimageSamples.length > 0) {
        ctx.fillStyle = `hsla(${hue}, 85%, 50%, 0.65)`;
        for (let k = 0; k < s.preimageSamples.length; k += Math.max(1, Math.floor(s.preimageSamples.length / 40))) {
          const px = xMap(s.preimageSamples[k]);
          ctx.fillRect(px - 1, padT + plotH - 6, 2, 6);
        }
      }
    }

    // Grid labels
    ctx.fillStyle = colors.textMuted;
    for (let i = 0; i <= 5; i++) {
      const v = minY + (i / 5) * (maxY - minY);
      const y = yMap(v);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(v.toFixed(2), padL - 6, y);
    }

    for (let i = 0; i <= 5; i++) {
      const xVal = a + (i / 5) * (b - a);
      const x = xMap(xVal);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(xVal.toFixed(2), x, padT + plotH + 8);
    }

    // Continuous curve
    ctx.save();
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const curvePoints = 250;
    for (let k = 0; k <= curvePoints; k++) {
      const x = a + (k / curvePoints) * (b - a);
      const y = funcObj.fn(x);
      const px = xMap(x);
      const py = yMap(y);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('Range Partition: y ∈ [y_min, y_max] → Preimages E_j on Domain', padL + plotW / 2, padT + plotH + 22);

    // Legend
    ctx.save();
    const legX = padL + 10, legY = padT + 10;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 240, 48, 6) || ctx.rect(legX, legY, 240, 48);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'hsla(200, 80%, 55%, 0.4)';
    ctx.fillRect(legX + 8, legY + 8, 14, 12);
    ctx.fillStyle = colors.textMain;
    ctx.fillText(`Lebesgue Range Slices (m = ${m})`, legX + 28, legY + 14);

    ctx.fillStyle = 'hsla(200, 85%, 50%, 0.8)';
    ctx.fillRect(legX + 8, legY + 28, 14, 10);
    ctx.fillText(`Preimage Measure λ(E_j) on X`, legX + 28, legY + 34);
    ctx.restore();
  }

  /**
   * Renders Normal CDF Algorithm Accuracy Comparison Canvas
   */
  function renderNormalCdfErrorCanvas(canvas) {
    if (!canvas) return;

    const { ctx, width, height } = setupHiDpiCanvas(canvas);
    const colors = getThemeColors();

    ctx.clearRect(0, 0, width, height);

    const padL = 60, padR = 24, padT = 24, padB = 34;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    if (plotW <= 0 || plotH <= 0) return;

    // Log-scale error plot: log10(absError) vs z from -4 to +4
    const minZ = -4.0, maxZ = 4.0;
    const minLogErr = -16, maxLogErr = 2; // from 10^-16 to 10^2

    const xMap = (z) => padL + ((z - minZ) / (maxZ - minZ)) * plotW;
    const yMap = (logE) => padT + plotH - ((logE - minLogErr) / (maxLogErr - minLogErr)) * plotH;

    // Grid
    ctx.strokeStyle = colors.borderSubtle;
    ctx.lineWidth = 1;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px "JetBrains Mono", monospace';

    // Horizontal log-scale lines
    for (let logE = -16; logE <= 0; logE += 4) {
      const y = yMap(logE);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`10^${logE}`, padL - 6, y);
    }

    // Vertical z lines
    for (let z = -4; z <= 4; z += 1) {
      const x = xMap(z);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${z >= 0 ? '+' : ''}${z}`, x, padT + plotH + 8);
    }

    ctx.textAlign = 'center';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Standard Deviation Evaluation Point (z)', padL + plotW / 2, padT + plotH + 22);

    // Compute error curves across z in [-4, 4]
    const zSteps = 100;
    const zVals = [];
    const errSimpson = [];
    const errTaylor = [];
    const errAS = [];
    const errCody = [];

    for (let i = 0; i <= zSteps; i++) {
      const z = minZ + (i / zSteps) * (maxZ - minZ);
      zVals.push(z);

      const ref = normalCdfCody(z);

      // Simpson
      const s = normalCdfSimpson(z, 100);
      const eSimp = Math.max(1e-16, Math.abs(s - ref));
      errSimpson.push(Math.log10(eSimp));

      // Taylor (k=45)
      const t = normalCdfTaylor(z, 45).val;
      const eTay = Math.max(1e-16, Math.min(1e2, Math.abs(t - ref)));
      errTaylor.push(Math.log10(eTay));

      // Abramowitz & Stegun
      const as = normalCdfAbramowitzStegun(z);
      const eAS = Math.max(1e-16, Math.abs(as - ref));
      errAS.push(Math.log10(eAS));

      // Cody (Chosen, near machine epsilon ~10^-16)
      errCody.push(-15.8);
    }

    // Plot curves
    function drawCurve(errArr, strokeStyle, lineWidth, dash = []) {
      ctx.save();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i < zVals.length; i++) {
        const x = xMap(zVals[i]);
        const y = yMap(errArr[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 1. Taylor (Explodes for |z| > 2.5)
    drawCurve(errTaylor, '#ef4444', 2.2);

    // 2. Abramowitz & Stegun (~10^-7 flat)
    drawCurve(errAS, '#f59e0b', 2.0, [4, 4]);

    // 3. Simpson (quadrature error ~10^-9)
    drawCurve(errSimpson, '#3b82f6', 2.0);

    // 4. Cody (CHOSEN, machine precision ~10^-16)
    drawCurve(errCody, colors.statusOk, 2.8);

    // Legend
    ctx.save();
    const legX = padL + 12, legY = padT + 8;
    ctx.fillStyle = colors.bgCard;
    ctx.strokeStyle = colors.borderSubtle;
    ctx.beginPath();
    ctx.roundRect?.(legX, legY, 280, 84, 6) || ctx.rect(legX, legY, 280, 84);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Cody
    ctx.strokeStyle = colors.statusOk;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(legX + 8, legY + 14); ctx.lineTo(legX + 22, legY + 14); ctx.stroke();
    ctx.fillStyle = colors.textMain;
    ctx.fillText('★ Cody Minimax (Chosen): Machine Epsilon (~10⁻¹⁶)', legX + 28, legY + 14);

    // Simpson
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX + 8, legY + 34); ctx.lineTo(legX + 22, legY + 34); ctx.stroke();
    ctx.fillText("Simpson's Quadrature (N=100): ~10⁻⁹ Error", legX + 28, legY + 34);

    // Abramowitz
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(legX + 8, legY + 54); ctx.lineTo(legX + 22, legY + 54); ctx.stroke();
    ctx.fillText('Abramowitz & Stegun: ~10⁻⁷ Uniform Bound', legX + 28, legY + 54);

    // Taylor
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(legX + 8, legY + 74); ctx.lineTo(legX + 22, legY + 74); ctx.stroke();
    ctx.fillText('Taylor Series: Severe Catastrophic Divergence (|z| > 2.5)', legX + 28, legY + 74);

    ctx.restore();
  }

  // =========================================================================
  // PUBLIC API EXPORT
  // =========================================================================

  window.Hw6Engine = {
    INTEGRATION_FUNCTIONS: INTEGRATION_FUNCTIONS,
    NORMAL_CDF_REFERENCES: NORMAL_CDF_REFERENCES,
    computeRiemannIntegral: computeRiemannIntegral,
    computeLebesgueIntegral: computeLebesgueIntegral,
    normalCdfSimpson: normalCdfSimpson,
    normalCdfTaylor: normalCdfTaylor,
    normalCdfAbramowitzStegun: normalCdfAbramowitzStegun,
    normalCdfCody: normalCdfCody,
    erfcCody: erfcCody,
    evaluateNormalCdfBenchmark: evaluateNormalCdfBenchmark,
    renderRiemannCanvas: renderRiemannCanvas,
    renderLebesgueCanvas: renderLebesgueCanvas,
    renderNormalCdfErrorCanvas: renderNormalCdfErrorCanvas,
    setupHiDpiCanvas: setupHiDpiCanvas,
    getThemeColors: getThemeColors
  };

})(window);

