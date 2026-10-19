/**
 * ============================================================================
 * HMWK 3 — Elliptic Curve vs. Caesar Cipher: Encryption & Cryptanalysis
 * secp256k1 Toy Scheme, Classical Shift Cipher, Statistical & Algebraic Attacks
 * Author: Emanuele Orlandi (ID: 2021953) - Statistics Portfolio 2026/2027
 * ============================================================================
 */

// secp256k1 Curve Constants (Koblitz Curve: y² = x³ + 7 over F_p)
const SECP256K1_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const SECP256K1_A = 0n;
const SECP256K1_B = 7n;
const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const SECP256K1_GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const SECP256K1_GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

const SECP256K1_G = { x: SECP256K1_GX, y: SECP256K1_GY };

// Toy Curve Parameters (Small Field from Homework 1 for instantaneous visualizations)
const TOY_CURVE_P = 10007n;
const TOY_CURVE_B = 7n;

// Standard English Letter Frequencies (Normalized Probabilities from Brown/Norvig corpus)
const ENGLISH_FREQS = {
  A: 0.08167, B: 0.01492, C: 0.02782, D: 0.04253, E: 0.12702,
  F: 0.02228, G: 0.02015, H: 0.06094, I: 0.06966, J: 0.00153,
  K: 0.00772, L: 0.04025, M: 0.02406, N: 0.06749, O: 0.07507,
  P: 0.01929, Q: 0.00095, R: 0.05987, S: 0.06327, T: 0.09056,
  U: 0.02758, V: 0.00978, W: 0.02360, X: 0.00150, Y: 0.01974,
  Z: 0.00074
};

// Common English Bigram Probabilities for Short-Ciphertext Cryptanalysis
const TOP_BIGRAM_PROBS = {
  TH: 0.0388, HE: 0.0368, IN: 0.0228, ER: 0.0218, AN: 0.0214, RE: 0.0175,
  ON: 0.0165, AT: 0.0150, EN: 0.0145, ND: 0.0135, TI: 0.0135, ES: 0.0135,
  OR: 0.0129, TE: 0.0121, OF: 0.0118, ED: 0.0117, IS: 0.0113, IT: 0.0112,
  AL: 0.0109, AR: 0.0107, ST: 0.0105, TO: 0.0105, NT: 0.0105, NG: 0.0105,
  SE: 0.0093, HA: 0.0093, AS: 0.0087, OU: 0.0087, IO: 0.0083, LE: 0.0083,
  VE: 0.0083, CO: 0.0080, ME: 0.0079, DE: 0.0077, HI: 0.0076, RI: 0.0073,
  RO: 0.0073, IC: 0.0070, NE: 0.0069, EA: 0.0069, RA: 0.0069, CE: 0.0065
};

// Natural English Benchmark Corpus for Monte Carlo Length Experiments
const BENCHMARK_CORPUS = `
Cryptology is the dual discipline comprising cryptography and cryptanalysis. While cryptography seeks to guarantee confidentiality, authenticity, and integrity in the presence of malicious adversaries, cryptanalysis explores structural symmetries and entropy deficiencies to dismantle security assurances. The Caesar cipher represents the earliest known military substitution system, relying strictly upon the secrecy of a monoalphabetic cyclic translation. In contrast, modern public-key schemes rooted in algebraic group geometry over elliptic curves such as secp256k1 operate across vast multi-dimensional topological manifolds. The security of the elliptic curve discrete logarithm problem rests upon the intractability of determining the scalar multiplier from public point coordinates. If the private scalar is constrained within an unnaturally restricted interval, the computational trapdoor collapses, rendering the scheme vulnerable to combinatorial search, baby-step giant-step reductions, and Pollard lambda techniques.
`.trim();

/* ============================================================================
   1. MODULAR ARITHMETIC & ELLIPTIC CURVE ARITHMETIC
   ============================================================================ */

/**
 * BigInt Canonical Modulo: handles negative inputs cleanly
 */
function bigMod(a, m) {
  const r = a % m;
  return r >= 0n ? r : r + m;
}

/**
 * Extended Euclidean Algorithm for BigInt modular inverse
 */
function bigModInverse(a, m) {
  a = bigMod(a, m);
  if (a === 0n) throw new Error("Division by zero in modular inversion");
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }

  if (old_r !== 1n) {
    throw new Error("Modular inverse does not exist (values are not coprime)");
  }
  return bigMod(old_s, m);
}

/**
 * Elliptic Curve Point Addition over F_p: P + Q on y² = x³ + b (mod p)
 * null represents the Point at Infinity (neutral group identity element)
 */
function ecAdd(P, Q, p = SECP256K1_P, b = SECP256K1_B) {
  if (!P) return Q;
  if (!Q) return P;

  // Check if P + (-P) = Point at Infinity
  if (P.x === Q.x && bigMod(P.y + Q.y, p) === 0n) {
    return null;
  }

  let lambda;
  if (P.x === Q.x && P.y === Q.y) {
    // Point Doubling: lambda = (3x² + a) / (2y) mod p (a = 0 for secp256k1)
    if (P.y === 0n) return null;
    const num = bigMod(3n * P.x * P.x, p);
    const den = bigMod(2n * P.y, p);
    lambda = bigMod(num * bigModInverse(den, p), p);
  } else {
    // Point Addition: lambda = (y2 - y1) / (x2 - x1) mod p
    const num = bigMod(Q.y - P.y, p);
    const den = bigMod(Q.x - P.x, p);
    lambda = bigMod(num * bigModInverse(den, p), p);
  }

  const x3 = bigMod(lambda * lambda - P.x - Q.x, p);
  const y3 = bigMod(lambda * (P.x - x3) - P.y, p);

  return { x: x3, y: y3 };
}

/**
 * Elliptic Curve Scalar Multiplication: Q = k * P via Double-and-Add
 */
function ecMultiply(k, P, p = SECP256K1_P, b = SECP256K1_B) {
  let scalar = typeof k === 'bigint' ? k : BigInt(k);
  if (scalar === 0n || !P) return null;

  let result = null;
  let addend = P;

  while (scalar > 0n) {
    if (scalar & 1n) {
      result = ecAdd(result, addend, p, b);
    }
    addend = ecAdd(addend, addend, p, b);
    scalar >>= 1n;
  }

  return result;
}

/**
 * Validates whether a point lies exactly on the curve y² = x³ + b (mod p)
 */
function isOnCurve(P, p = SECP256K1_P, b = SECP256K1_B) {
  if (!P) return true; // Point at infinity is formally on the curve
  const lhs = bigMod(P.y * P.y, p);
  const rhs = bigMod(P.x * P.x * P.x + b, p);
  return lhs === rhs;
}

/* ============================================================================
   2. TOY ECC ENCRYPTION & DECRYPTION SCHEME (EC-ElGamal / ECDH Stream Mask)
   ============================================================================ */

/**
 * Deterministic PRNG / Keystream Derivation from Shared Point S = (x_S, y_S)
 * Produces pseudorandom bytes to mask and unmask variable-length message bytes.
 */
function deriveKeystream(S, length) {
  if (!S) throw new Error("Invalid shared secret point");
  let h1 = Number(S.x & 0xFFFFFFFFn);
  let h2 = Number((S.x >> 32n) & 0xFFFFFFFFn);
  let h3 = Number(S.y & 0xFFFFFFFFn);
  let h4 = Number((S.y >> 32n) & 0xFFFFFFFFn);

  const stream = new Uint8Array(length);
  let state = (h1 ^ h2 ^ h3 ^ h4) >>> 0;
  if (state === 0) state = 0x6D2B79F5;

  for (let i = 0; i < length; i++) {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    stream[i] = ((t ^ (t >>> 14)) >>> 0) & 0xFF;
  }
  return stream;
}

/**
 * Toy ECC Encryption Pipeline:
 * - Recipient has public key Q = d * G (where d is restricted private key)
 * - Sender picks random ephemeral scalar r
 * - Sender computes ephemeral public point R = r * G
 * - Sender computes shared secret S = r * Q = r * (d * G)
 * - Sender derives keystream from S and masks plaintext bytes: C_i = M_i ^ K_i
 * - Ciphertext payload: { R: {x, y}, ciphertextBytes: [...] }
 */
function toyEccEncrypt(plaintext, recipientPubKey, ephemeralScalar = null, curveParams = { p: SECP256K1_P, G: SECP256K1_G }) {
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(plaintext);

  // Generate or use provided ephemeral scalar r
  let r = ephemeralScalar;
  if (!r) {
    const randBuf = new Uint32Array(1);
    window.crypto.getRandomValues(randBuf);
    r = BigInt((randBuf[0] % 65530) + 2);
  } else if (typeof r !== 'bigint') {
    r = BigInt(r);
  }

  // Compute Ephemeral Point R = r * G
  const R = ecMultiply(r, curveParams.G, curveParams.p);

  // Compute Shared Secret S = r * Q
  const S = ecMultiply(r, recipientPubKey, curveParams.p);
  if (!S) throw new Error("Degenerate shared secret point at infinity");

  // Derive keystream and mask bytes
  const keystream = deriveKeystream(S, msgBytes.length);
  const cipherBytes = new Uint8Array(msgBytes.length);
  for (let i = 0; i < msgBytes.length; i++) {
    cipherBytes[i] = msgBytes[i] ^ keystream[i];
  }

  return {
    R,
    S,
    r,
    cipherBytes,
    cipherHex: Array.from(cipherBytes).map(b => b.toString(16).padStart(2, '0')).join(''),
    msgLength: msgBytes.length
  };
}

/**
 * Toy ECC Decryption Pipeline:
 * - Recipient uses their private key d and received ephemeral point R
 * - Computes identical shared secret: S = d * R = d * (r * G) = r * (d * G)
 * - Derives keystream and unmasks bytes: M_i = C_i ^ K_i
 */
function toyEccDecrypt(cipherBundle, recipientPrivKey, curveParams = { p: SECP256K1_P }) {
  const d = typeof recipientPrivKey === 'bigint' ? recipientPrivKey : BigInt(recipientPrivKey);
  const R = cipherBundle.R;

  // Verify R is on the curve
  if (!isOnCurve(R, curveParams.p)) {
    throw new Error("Invalid ephemeral public point: point not on curve");
  }

  // Compute Shared Secret S = d * R
  const S = ecMultiply(d, R, curveParams.p);
  if (!S) throw new Error("Degenerate shared secret point at infinity");

  const keystream = deriveKeystream(S, cipherBundle.cipherBytes.length);
  const decryptedBytes = new Uint8Array(cipherBundle.cipherBytes.length);
  for (let i = 0; i < cipherBundle.cipherBytes.length; i++) {
    decryptedBytes[i] = cipherBundle.cipherBytes[i] ^ keystream[i];
  }

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const plaintext = decoder.decode(decryptedBytes);

  return {
    S,
    decryptedBytes,
    plaintext
  };
}

/* ============================================================================
   3. CAESAR CIPHER ENCRYPTION & DECRYPTION
   ============================================================================ */

/**
 * Encrypts a text string with Caesar shift k in Z_26
 * Preserves letter casing and leaves whitespace/punctuation unaltered.
 */
function caesarEncrypt(plaintext, shift) {
  const k = ((shift % 26) + 26) % 26;
  return plaintext.replace(/[a-zA-Z]/g, char => {
    const code = char.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + k) % 26) + base);
  });
}

/**
 * Decrypts a Caesar ciphertext with shift k
 */
function caesarDecrypt(ciphertext, shift) {
  const k = ((shift % 26) + 26) % 26;
  return caesarEncrypt(ciphertext, 26 - k);
}

/* ============================================================================
   4. STATISTICAL DIAGNOSTICS & METRICS
   ============================================================================ */

/**
 * Computes unigram letter frequency counts and probabilities over A-Z
 */
function getLetterDistribution(text) {
  const counts = {};
  for (let i = 65; i <= 90; i++) counts[String.fromCharCode(i)] = 0;

  let totalLetters = 0;
  for (const ch of text.toUpperCase()) {
    if (ch >= 'A' && ch <= 'Z') {
      counts[ch]++;
      totalLetters++;
    }
  }

  const freqs = {};
  for (const letter in counts) {
    freqs[letter] = totalLetters > 0 ? counts[letter] / totalLetters : 0;
  }

  return { counts, freqs, totalLetters };
}

/**
 * Computes Index of Coincidence (IoC):
 * Ic = sum(f_i * (f_i - 1)) / (N * (N - 1))
 * Standard English ~ 0.0667, Random Uniform ~ 0.0385
 */
function computeIndexOfCoincidence(text) {
  const { counts, totalLetters } = getLetterDistribution(text);
  if (totalLetters <= 1) return 0;

  let sum = 0;
  for (const letter in counts) {
    const f = counts[letter];
    sum += f * (f - 1);
  }
  return sum / (totalLetters * (totalLetters - 1));
}

/**
 * Computes Shannon Entropy (in bits per character):
 * H(X) = - sum(p_i * log2(p_i))
 */
function computeShannonEntropy(text) {
  if (!text || text.length === 0) return 0;
  const map = new Map();
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    map.set(ch, (map.get(ch) || 0) + 1);
  }

  let entropy = 0;
  const len = text.length;
  for (const count of map.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/* ============================================================================
   5. STATISTICAL CRYPTANALYSIS OF THE CAESAR CIPHER
   ============================================================================ */

/**
 * Chi-Squared (χ²) Goodness-of-Fit attack against Caesar cipher.
 * For each candidate shift s in [0, 25]:
 *   χ²(s) = sum_{c='A'}^{'Z'} (O_c(s) - E_c)² / E_c
 * where E_c = N * f_{English}(c)
 */
function cryptanalyzeCaesarChiSquared(ciphertext) {
  const results = [];
  const cleanCipher = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const N = cleanCipher.length;

  if (N === 0) {
    return { bestKey: 0, bestText: ciphertext, results: [] };
  }

  for (let s = 0; s < 26; s++) {
    const candidate = caesarDecrypt(ciphertext, s);
    const { counts } = getLetterDistribution(candidate);

    let chi2 = 0;
    let dotProduct = 0;

    for (let i = 65; i <= 90; i++) {
      const char = String.fromCharCode(i);
      const observed = counts[char];
      const expected = N * ENGLISH_FREQS[char];
      const diff = observed - expected;
      chi2 += (diff * diff) / expected;

      dotProduct += (observed / N) * ENGLISH_FREQS[char];
    }

    results.push({
      shift: s,
      chi2,
      dotProduct,
      candidateText: candidate
    });
  }

  results.sort((a, b) => a.chi2 - b.chi2);

  return {
    bestKey: results[0].shift,
    bestChi2: results[0].chi2,
    bestText: results[0].candidateText,
    rankings: results
  };
}

/**
 * Bigram Log-Likelihood Scoring Attack:
 * Evaluates consecutive letter pairs against English bigram probabilities.
 */
function cryptanalyzeCaesarBigram(ciphertext) {
  const results = [];
  const epsilon = 1e-6;

  for (let s = 0; s < 26; s++) {
    const candidate = caesarDecrypt(ciphertext, s);
    const clean = candidate.toUpperCase().replace(/[^A-Z]/g, '');
    let logScore = 0;

    for (let i = 0; i < clean.length - 1; i++) {
      const bigram = clean.substring(i, i + 2);
      const prob = TOP_BIGRAM_PROBS[bigram] || epsilon;
      logScore += Math.log(prob);
    }

    results.push({
      shift: s,
      logScore,
      candidateText: candidate
    });
  }

  results.sort((a, b) => b.logScore - a.logScore);

  return {
    bestKey: results[0].shift,
    bestScore: results[0].logScore,
    bestText: results[0].candidateText,
    rankings: results
  };
}

/**
 * Unigram Peak Matching (assumes the single most frequent letter is 'E')
 */
function cryptanalyzeCaesarPeakMatch(ciphertext) {
  const clean = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length === 0) return { bestKey: 0, bestText: ciphertext };

  const { counts } = getLetterDistribution(clean);
  let maxCount = -1;
  let maxLetter = 'E';

  for (const ch in counts) {
    if (counts[ch] > maxCount) {
      maxCount = counts[ch];
      maxLetter = ch;
    }
  }

  const shift = ((maxLetter.charCodeAt(0) - 69) % 26 + 26) % 26;
  return {
    bestKey: shift,
    peakLetter: maxLetter,
    bestText: caesarDecrypt(ciphertext, shift)
  };
}

/**
 * Monte Carlo Simulation: Evaluates empirical key recovery accuracy across variable ciphertext lengths
 */
function runMonteCarloLengthExperiment(corpus = BENCHMARK_CORPUS, lengths = [5, 10, 15, 25, 50, 100, 200, 500], trialsPerLength = 40) {
  const cleanCorpus = corpus.toUpperCase().replace(/[^A-Z]/g, '');
  const experimentResults = [];

  for (const len of lengths) {
    if (cleanCorpus.length < len) continue;

    let chi2Success = 0;
    let bigramSuccess = 0;
    let peakSuccess = 0;

    for (let t = 0; t < trialsPerLength; t++) {
      const maxStart = cleanCorpus.length - len;
      const startIdx = Math.floor(Math.random() * (maxStart + 1));
      const slice = cleanCorpus.substring(startIdx, startIdx + len);

      const trueKey = Math.floor(Math.random() * 25) + 1;
      const cipher = caesarEncrypt(slice, trueKey);

      const chi2Res = cryptanalyzeCaesarChiSquared(cipher);
      const bigramRes = cryptanalyzeCaesarBigram(cipher);
      const peakRes = cryptanalyzeCaesarPeakMatch(cipher);

      if (chi2Res.bestKey === trueKey) chi2Success++;
      if (bigramRes.bestKey === trueKey) bigramSuccess++;
      if (peakRes.bestKey === trueKey) peakSuccess++;
    }

    experimentResults.push({
      length: len,
      trials: trialsPerLength,
      chi2Accuracy: (chi2Success / trialsPerLength) * 100,
      bigramAccuracy: (bigramSuccess / trialsPerLength) * 100,
      peakAccuracy: (peakSuccess / trialsPerLength) * 100
    });
  }

  return experimentResults;
}

/* ============================================================================
   6. RESTRICTED-SPACE TOY ECC PRIVATE KEY RECOVERY ATTACK (ECDLP)
   ============================================================================ */

/**
 * Direct Point-Accumulation Brute Force Attack:
 * Exploits small private-key range d in [1, K_max] to solve Q = d * G.
 * Operates in non-blocking asynchronous chunks to preserve UI responsiveness.
 */
async function attackToyEccBruteForce(targetPubKey, maxRange = 65536, curveParams = { p: SECP256K1_P, G: SECP256K1_G }, onProgress = null) {
  const startTime = performance.now();
  let currentPoint = null;
  const G = curveParams.G;
  const p = curveParams.p;
  const chunkSize = 2000;

  let candidate = 1;

  while (candidate <= maxRange) {
    const chunkEnd = Math.min(candidate + chunkSize, maxRange + 1);

    for (let d = candidate; d < chunkEnd; d++) {
      currentPoint = ecAdd(currentPoint, G, p);

      if (currentPoint && currentPoint.x === targetPubKey.x && currentPoint.y === targetPubKey.y) {
        const elapsed = performance.now() - startTime;
        return {
          recoveredKey: BigInt(d),
          iterations: d,
          elapsedMs: elapsed,
          opsPerSec: Math.round((d / (elapsed || 1)) * 1000)
        };
      }
    }

    candidate = chunkEnd;
    if (onProgress) {
      onProgress({
        progress: (candidate / maxRange) * 100,
        currentCandidate: candidate,
        elapsedMs: performance.now() - startTime
      });
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  const elapsed = performance.now() - startTime;
  return {
    recoveredKey: null,
    iterations: maxRange,
    elapsedMs: elapsed,
    opsPerSec: Math.round((maxRange / (elapsed || 1)) * 1000)
  };
}

/**
 * Baby-Step Giant-Step (BSGS) Algorithm for Elliptic Curve DLP:
 * Solves Q = d * G for d in [0, K_max] in O(sqrt(K_max)) group operations.
 */
function attackToyEccBSGS(targetPubKey, maxRange = 65536, curveParams = { p: SECP256K1_P, G: SECP256K1_G }) {
  const startTime = performance.now();
  const m = Math.ceil(Math.sqrt(maxRange));
  const G = curveParams.G;
  const p = curveParams.p;

  // Baby Steps: Table of j * G
  const table = new Map();
  let currentBaby = null;
  table.set("infinity", 0);

  for (let j = 1; j < m; j++) {
    currentBaby = ecAdd(currentBaby, G, p);
    if (currentBaby) {
      table.set(`${currentBaby.x}:${currentBaby.y}`, j);
    }
  }

  // Compute M = m * G
  const M = ecMultiply(BigInt(m), G, p);
  const negM = M ? { x: M.x, y: bigMod(-M.y, p) } : null;

  // Giant Steps: gamma_i = Q + i * (-M)
  let gamma = targetPubKey;
  let totalOps = m;

  for (let i = 0; i < m; i++) {
    totalOps++;
    const key = gamma ? `${gamma.x}:${gamma.y}` : "infinity";
    if (table.has(key)) {
      const j = table.get(key);
      const recoveredKey = BigInt(i * m + j);
      const elapsed = performance.now() - startTime;
      return {
        recoveredKey,
        iterations: totalOps,
        elapsedMs: elapsed,
        opsPerSec: Math.round((totalOps / (elapsed || 1)) * 1000)
      };
    }
    gamma = ecAdd(gamma, negM, p);
  }

  const elapsed = performance.now() - startTime;
  return {
    recoveredKey: null,
    iterations: totalOps,
    elapsedMs: elapsed,
    opsPerSec: Math.round((totalOps / (elapsed || 1)) * 1000)
  };
}

// Global Export
window.ToyEccEngine = {
  SECP256K1_P,
  SECP256K1_G,
  SECP256K1_N,
  ecAdd,
  ecMultiply,
  isOnCurve,
  toyEccEncrypt,
  toyEccDecrypt,
  caesarEncrypt,
  caesarDecrypt,
  getLetterDistribution,
  computeIndexOfCoincidence,
  computeShannonEntropy,
  cryptanalyzeCaesarChiSquared,
  cryptanalyzeCaesarBigram,
  cryptanalyzeCaesarPeakMatch,
  runMonteCarloLengthExperiment,
  attackToyEccBruteForce,
  attackToyEccBSGS,
  ENGLISH_FREQS,
  BENCHMARK_CORPUS
};
