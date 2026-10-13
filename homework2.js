/**
 * HMWK 2 — From Wallet Seed to Ethereum Address
 * Cryptographic Pipeline, Key Derivation, Hashing & Statistical Laboratory
 * Author: Emanuele Orlandi (ID: 2021953)
 */

// Full BIP-39 English Wordlist placeholder (will be replaced by builder)
const BIP39_WORDS = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

// secp256k1 Curve Constants
const SECP256K1_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const SECP256K1_GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const SECP256K1_GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n;

// Keccak-f[1600] Round Constants
const KECCAK_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808An, 0x8000000080008000n,
  0x000000000000808Bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008An, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000An,
  0x000000008000808Bn, 0x800000000000008Bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800An, 0x800000008000000An,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
];

// Keccak-f[1600] Rotation Offsets
const KECCAK_ROTC = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14]
];

// 64-bit Left Rotate for BigInt
function rotl64(x, n) {
  const s = BigInt(n % 64);
  if (s === 0n) return x & 0xFFFFFFFFFFFFFFFFn;
  return ((x << s) | (x >> (64n - s))) & 0xFFFFFFFFFFFFFFFFn;
}

// Keccak-f[1600] Permutation
function keccakF(state) {
  const A = Array.from({ length: 5 }, (_, x) =>
    Array.from({ length: 5 }, (_, y) => state[x + 5 * y])
  );

  for (let r = 0; r < 24; r++) {
    // Theta step
    const C = Array.from({ length: 5 }, (_, x) =>
      A[x][0] ^ A[x][1] ^ A[x][2] ^ A[x][3] ^ A[x][4]
    );
    const D = Array.from({ length: 5 }, (_, x) =>
      C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1)
    );
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        A[x][y] ^= D[x];
      }
    }

    // Rho & Pi steps
    const B = Array.from({ length: 5 }, () => Array(5).fill(0n));
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        B[y][(2 * x + 3 * y) % 5] = rotl64(A[x][y], KECCAK_ROTC[x][y]);
      }
    }

    // Chi step
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        A[x][y] = B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y] & 0xFFFFFFFFFFFFFFFFn);
      }
    }

    // Iota step
    A[0][0] ^= KECCAK_RC[r];
  }

  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      state[x + 5 * y] = A[x][y];
    }
  }
}

/**
 * Keccak-256 Hash Function
 * @param {Uint8Array} msgBytes Input bytes
 * @param {number} suffix Padding byte (0x01 for Ethereum Keccak-256, 0x06 for NIST SHA3-256)
 * @returns {Uint8Array} 32-byte digest
 */
function keccak256(msgBytes, suffix = 0x01) {
  const rate = 136; // 1088 bits / 8 = 136 bytes
  const msg = Array.from(msgBytes);

  msg.push(suffix);
  while ((msg.length % rate) !== (rate - 1)) {
    msg.push(0x00);
  }
  msg.push(0x80);

  const state = Array(25).fill(0n);

  for (let b = 0; b < msg.length; b += rate) {
    const block = msg.slice(b, b + rate);
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 0; j < 8; j++) {
        lane |= BigInt(block[8 * i + j]) << BigInt(8 * j);
      }
      state[i] ^= lane;
    }
    keccakF(state);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    const lane = state[i];
    for (let j = 0; j < 8; j++) {
      out[i * 8 + j] = Number((lane >> BigInt(8 * j)) & 0xFFn);
    }
  }
  return out;
}

// Convert byte array to hexadecimal string
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert hexadecimal string to byte array
function hexToBytes(hex) {
  const cleanHex = hex.replace(/^0x/i, '').trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// BigInt Modular Inverse using Extended Euclidean Algorithm
function modInverse(a, m) {
  let [old_r, r] = [BigInt(a) % m, m];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  return ((old_s % m) + m) % m;
}

// secp256k1 Elliptic Curve Point Addition
function pointAdd(p1, p2) {
  if (!p1) return p2;
  if (!p2) return p1;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  if (x1 === x2 && y1 !== y2) return null; // Point at infinity

  let m;
  if (x1 === x2) {
    const num = (3n * x1 * x1) % SECP256K1_P;
    const den = (2n * y1) % SECP256K1_P;
    m = (num * modInverse(den, SECP256K1_P)) % SECP256K1_P;
  } else {
    const num = ((y2 - y1) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
    const den = ((x2 - x1) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
    m = (num * modInverse(den, SECP256K1_P)) % SECP256K1_P;
  }

  const x3 = ((m * m - x1 - x2) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  const y3 = ((m * (x1 - x3) - y1) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  return [x3, y3];
}

// secp256k1 Scalar Multiplication Q = k * G
function pointMul(k, pt = [SECP256K1_GX, SECP256K1_GY]) {
  let curr = pt;
  let res = null;
  let scalar = BigInt(k);
  while (scalar > 0n) {
    if (scalar & 1n) {
      res = pointAdd(res, curr);
    }
    curr = pointAdd(curr, curr);
    scalar >>= 1n;
  }
  return res;
}

// Public Key serialization
function serializePublicKey(point, compressed = false) {
  const [x, y] = point;
  const xHex = x.toString(16).padStart(64, '0');
  const yHex = y.toString(16).padStart(64, '0');
  if (compressed) {
    const prefix = (y % 2n === 0n) ? '02' : '03';
    return prefix + xHex;
  }
  return '04' + xHex + yHex;
}

// SHA-256 via Web Crypto
async function sha256(bytes) {
  const hashBuf = await window.crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(hashBuf);
}

// PBKDF2 with HMAC-SHA512
async function pbkdf2HmacSha512(passwordStr, saltStr, iterations = 2048, keyLen = 64) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passwordStr),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltStr),
      iterations: iterations,
      hash: 'SHA-512'
    },
    keyMaterial,
    keyLen * 8
  );
  return new Uint8Array(derived);
}

// HMAC-SHA512 via Web Crypto
async function hmacSha512(keyBytes, dataBytes) {
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await window.crypto.subtle.sign('HMAC', key, dataBytes);
  return new Uint8Array(sig);
}

// Generate BIP-39 Mnemonic
async function generateMnemonic(wordCount = 12) {
  const entropyBits = (wordCount === 24) ? 256 : 128;
  const entropyBytes = entropyBits / 8;
  const entropy = new Uint8Array(entropyBytes);
  window.crypto.getRandomValues(entropy);

  const hash = await sha256(entropy);
  const checksumBitsCount = entropyBits / 32;

  let binStr = '';
  for (let b of entropy) {
    binStr += b.toString(2).padStart(8, '0');
  }
  let hashBin = '';
  for (let b of hash) {
    hashBin += b.toString(2).padStart(8, '0');
  }
  binStr += hashBin.substring(0, checksumBitsCount);

  const words = [];
  for (let i = 0; i < binStr.length; i += 11) {
    const chunk = binStr.substring(i, i + 11);
    const index = parseInt(chunk, 2);
    words.push(BIP39_WORDS[index]);
  }
  return {
    mnemonic: words.join(' '),
    entropyHex: bytesToHex(entropy),
    words: words
  };
}

// Validate Mnemonic and extract entropy
async function validateMnemonic(mnemonicStr) {
  const words = mnemonicStr.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    return { valid: false, error: 'Mnemonic phrase must contain exactly 12 or 24 words.' };
  }

  let binStr = '';
  for (let w of words) {
    const idx = BIP39_WORDS.indexOf(w);
    if (idx === -1) {
      return { valid: false, error: `Word "${w}" is not found in the standard BIP-39 English wordlist.` };
    }
    binStr += idx.toString(2).padStart(11, '0');
  }

  const checksumBitsCount = words.length === 12 ? 4 : 8;
  const entropyBitsCount = binStr.length - checksumBitsCount;
  const entropyBin = binStr.substring(0, entropyBitsCount);
  const checksumBin = binStr.substring(entropyBitsCount);

  const entropyBytes = new Uint8Array(entropyBitsCount / 8);
  for (let i = 0; i < entropyBytes.length; i++) {
    entropyBytes[i] = parseInt(entropyBin.substr(i * 8, 8), 2);
  }

  const hash = await sha256(entropyBytes);
  let hashBin = '';
  for (let b of hash) {
    hashBin += b.toString(2).padStart(8, '0');
  }
  const expectedChecksumBin = hashBin.substring(0, checksumBitsCount);

  if (checksumBin !== expectedChecksumBin) {
    return { valid: false, error: 'Invalid BIP-39 checksum! Checksum bits do not match SHA-256(entropy).' };
  }

  return {
    valid: true,
    words: words,
    entropyHex: bytesToHex(entropyBytes)
  };
}

// BIP-32 Child Key Derivation (Private)
async function ckdPriv(kParent, cParent, index) {
  const isHardened = (index >= 0x80000000);
  let data;
  if (isHardened) {
    data = new Uint8Array(37);
    data[0] = 0x00;
    data.set(kParent, 1);
    const view = new DataView(data.buffer);
    view.setUint32(33, index, false);
  } else {
    const kParentBigInt = BigInt('0x' + bytesToHex(kParent));
    const pt = pointMul(kParentBigInt);
    const compPub = hexToBytes(serializePublicKey(pt, true));
    data = new Uint8Array(37);
    data.set(compPub, 0);
    const view = new DataView(data.buffer);
    view.setUint32(33, index, false);
  }

  const I = await hmacSha512(cParent, data);
  const IL = I.slice(0, 32);
  const IR = I.slice(32, 64);

  const ILBigInt = BigInt('0x' + bytesToHex(IL));
  const kParentBigInt = BigInt('0x' + bytesToHex(kParent));
  const kiBigInt = (ILBigInt + kParentBigInt) % SECP256K1_N;
  const kiHex = kiBigInt.toString(16).padStart(64, '0');
  const kiBytes = hexToBytes(kiHex);

  return { key: kiBytes, chainCode: IR };
}

// Derive complete BIP-44 Path from Seed
async function deriveEthereumKeyFromSeed(seedBytes, pathStr = "m/44'/60'/0'/0/0") {
  const enc = new TextEncoder();
  const masterI = await hmacSha512(enc.encode('Bitcoin seed'), seedBytes);
  let currentKey = masterI.slice(0, 32);
  let currentChainCode = masterI.slice(32, 64);

  const segments = pathStr.split('/').slice(1);
  for (let seg of segments) {
    seg = seg.trim();
    if (!seg) continue;
    let index;
    if (seg.endsWith("'") || seg.endsWith('h') || seg.endsWith('H')) {
      const num = parseInt(seg.slice(0, -1), 10);
      index = num + 0x80000000;
    } else {
      index = parseInt(seg, 10);
    }
    const derived = await ckdPriv(currentKey, currentChainCode, index);
    currentKey = derived.key;
    currentChainCode = derived.chainCode;
  }

  return {
    privateKey: currentKey,
    chainCode: currentChainCode,
    masterPrivateKey: masterI.slice(0, 32),
    masterChainCode: masterI.slice(32, 64)
  };
}

// Compute EIP-55 Mixed-Case Checksum
function toChecksumAddress(rawAddressHex) {
  const addr = rawAddressHex.toLowerCase().replace(/^0x/, '');
  const enc = new TextEncoder();
  const hashBytes = keccak256(enc.encode(addr));
  const hashHex = bytesToHex(hashBytes);

  let checksummed = '0x';
  const steps = [];

  for (let i = 0; i < addr.length; i++) {
    const char = addr[i];
    const hashNibble = parseInt(hashHex[i], 16);
    const isLetter = /[a-f]/.test(char);
    const shouldCapitalize = isLetter && hashNibble >= 8;
    const finalChar = shouldCapitalize ? char.toUpperCase() : char;
    checksummed += finalChar;

    steps.push({
      char: char,
      hashNibbleHex: hashHex[i],
      hashNibbleVal: hashNibble,
      isLetter: isLetter,
      capitalized: shouldCapitalize,
      finalChar: finalChar
    });
  }

  return {
    address: checksummed,
    hashHex: hashHex,
    steps: steps
  };
}

/* ==========================================================================
   UI CONTROLLER & APPLICATION LOGIC
   ========================================================================== */

// Current Global State
let currentMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
let currentPassphrase = '';
let currentPath = "m/44'/60'/0'/0/0";
let currentDerived = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggleSync();
  initPipelineControls();
  initAvalancheLab();
  initHashDuel();
  initCollisionCalc();
  initCopyButtons();

  // Run initial calculation with standard test vector
  runPipelineCalculation();
});

// Sync Theme Toggle with global portfolio
function initThemeToggleSync() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  const currentTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);

  btn.addEventListener('click', () => {
    const active = document.documentElement.getAttribute('data-theme');
    const next = (active === 'dark') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// Copy to Clipboard with temporary tooltip
function initCopyButtons() {
  document.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (!copyBtn) return;
    const targetId = copyBtn.getAttribute('data-copy-target');
    const textToCopy = targetId ? document.getElementById(targetId)?.textContent : copyBtn.getAttribute('data-copy-val');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy.trim()).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>Copied! ✓</span>';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('copied');
        }, 1800);
      });
    }
  });
}

// Pipeline Controls
function initPipelineControls() {
  const btn12 = document.getElementById('btnGen12');
  const btn24 = document.getElementById('btnGen24');
  const btnVector = document.getElementById('btnMetaMaskVector');
  const mnemonicInput = document.getElementById('mnemonicInput');
  const passphraseInput = document.getElementById('passphraseInput');
  const pathInput = document.getElementById('derivationPathInput');
  const accountIndexInput = document.getElementById('accountIndexInput');
  const btnRecalc = document.getElementById('btnRecalculate');

  if (btn12) {
    btn12.addEventListener('click', async () => {
      const res = await generateMnemonic(12);
      currentMnemonic = res.mnemonic;
      if (mnemonicInput) mnemonicInput.value = currentMnemonic;
      runPipelineCalculation();
    });
  }

  if (btn24) {
    btn24.addEventListener('click', async () => {
      const res = await generateMnemonic(24);
      currentMnemonic = res.mnemonic;
      if (mnemonicInput) mnemonicInput.value = currentMnemonic;
      runPipelineCalculation();
    });
  }

  if (btnVector) {
    btnVector.addEventListener('click', () => {
      currentMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      currentPassphrase = '';
      currentPath = "m/44'/60'/0'/0/0";
      if (mnemonicInput) mnemonicInput.value = currentMnemonic;
      if (passphraseInput) passphraseInput.value = '';
      if (pathInput) pathInput.value = currentPath;
      if (accountIndexInput) accountIndexInput.value = 0;
      runPipelineCalculation();
    });
  }

  if (accountIndexInput) {
    accountIndexInput.addEventListener('input', (e) => {
      const idx = parseInt(e.target.value, 10) || 0;
      currentPath = `m/44'/60'/0'/0/${idx}`;
      if (pathInput) pathInput.value = currentPath;
      runPipelineCalculation();
    });
  }

  if (btnRecalc) {
    btnRecalc.addEventListener('click', () => {
      if (mnemonicInput) currentMnemonic = mnemonicInput.value.trim();
      if (passphraseInput) currentPassphrase = passphraseInput.value;
      if (pathInput) currentPath = pathInput.value.trim();
      runPipelineCalculation();
    });
  }

  if (mnemonicInput) {
    mnemonicInput.addEventListener('change', () => {
      currentMnemonic = mnemonicInput.value.trim();
      runPipelineCalculation();
    });
  }

  if (passphraseInput) {
    passphraseInput.addEventListener('change', () => {
      currentPassphrase = passphraseInput.value;
      runPipelineCalculation();
    });
  }

  if (pathInput) {
    pathInput.addEventListener('change', () => {
      currentPath = pathInput.value.trim();
      runPipelineCalculation();
    });
  }
}

// Master Pipeline Execution
async function runPipelineCalculation() {
  const statusEl = document.getElementById('pipelineStatus');
  if (statusEl) {
    statusEl.textContent = 'Computing pipeline cryptographic transformations...';
    statusEl.className = 'status-msg computing';
  }

  try {
    // Step 0: Validate Mnemonic
    const validRes = await validateMnemonic(currentMnemonic);
    const validationBadge = document.getElementById('mnemonicValidationBadge');
    if (!validRes.valid) {
      if (validationBadge) {
        validationBadge.className = 'badge-pill error';
        validationBadge.textContent = 'Invalid Mnemonic Checksum';
      }
      if (statusEl) {
        statusEl.textContent = validRes.error;
        statusEl.className = 'status-msg error';
      }
      return;
    }

    if (validationBadge) {
      validationBadge.className = 'badge-pill success';
      validationBadge.textContent = `Valid ${validRes.words.length}-Word Mnemonic (Checksum OK)`;
    }

    // Render word chips
    renderMnemonicChips(validRes.words);

    // Step 1: PBKDF2-HMAC-SHA512 to 512-bit Seed
    const seedBytes = await pbkdf2HmacSha512(currentMnemonic.normalize('NFKD'), 'mnemonic' + currentPassphrase.normalize('NFKD'), 2048, 64);
    const seedHex = bytesToHex(seedBytes);

    // Update Step 1 DOM
    document.getElementById('outEntropyHex').textContent = validRes.entropyHex;
    document.getElementById('outSeedHex').textContent = seedHex;

    // Step 2: BIP-32 & BIP-44 Derivation
    const hdRes = await deriveEthereumKeyFromSeed(seedBytes, currentPath);
    const privKeyHex = bytesToHex(hdRes.privateKey);
    const chainCodeHex = bytesToHex(hdRes.chainCode);
    const masterPrivHex = bytesToHex(hdRes.masterPrivateKey);

    // Update Step 2 DOM
    document.getElementById('outMasterPriv').textContent = masterPrivHex;
    document.getElementById('outDerivedPath').textContent = currentPath;
    document.getElementById('outPrivateKeyHex').textContent = privKeyHex;
    document.getElementById('outChainCodeHex').textContent = chainCodeHex;

    // Step 3: secp256k1 Public Key Derivation Q = k * G
    const privKeyBigInt = BigInt('0x' + privKeyHex);
    const pubPoint = pointMul(privKeyBigInt);
    const [pubX, pubY] = pubPoint;
    const pubXHex = pubX.toString(16).padStart(64, '0');
    const pubYHex = pubY.toString(16).padStart(64, '0');
    const uncompressedPubHex = '04' + pubXHex + pubYHex;
    const compressedPubHex = serializePublicKey(pubPoint, true);

    // Update Step 3 DOM
    document.getElementById('outPubX').textContent = pubXHex;
    document.getElementById('outPubY').textContent = pubYHex;
    document.getElementById('outUncompressedPub').textContent = uncompressedPubHex;
    document.getElementById('outCompressedPub').textContent = compressedPubHex;

    // Step 4: Keccak-256 Hashing of Uncompressed Public Key (excluding 0x04)
    const pubKeyCoordinatesBytes = hexToBytes(pubXHex + pubYHex);
    const keccakDigest = keccak256(pubKeyCoordinatesBytes, 0x01);
    const keccakDigestHex = bytesToHex(keccakDigest);

    // Slice last 20 bytes (indices 12 to 31 -> hex chars 24 to 64)
    const rawAddressHex = keccakDigestHex.substring(24);

    // Update Step 4 DOM
    document.getElementById('outKeccakDigest').textContent = keccakDigestHex;
    document.getElementById('outRawAddress').textContent = '0x' + rawAddressHex;

    // Step 5: EIP-55 Mixed-Case Checksum
    const eip55Res = toChecksumAddress(rawAddressHex);

    // Update Step 5 DOM
    document.getElementById('outChecksummedAddress').textContent = eip55Res.address;
    renderEip55Inspector(eip55Res);

    // Save globally
    currentDerived = {
      mnemonic: currentMnemonic,
      seedHex: seedHex,
      privateKeyHex: privKeyHex,
      uncompressedPubHex: uncompressedPubHex,
      keccakDigestHex: keccakDigestHex,
      rawAddress: '0x' + rawAddressHex,
      checksummedAddress: eip55Res.address
    };

    if (statusEl) {
      statusEl.textContent = 'All 5 cryptographic transformations verified successfully!';
      statusEl.className = 'status-msg success';
    }

    // Trigger avalanche refresh if needed
    updateAvalancheWithCurrentKey(privKeyHex);

  } catch (err) {
    console.error('Pipeline error:', err);
    if (statusEl) {
      statusEl.textContent = 'Error computing pipeline: ' + err.message;
      statusEl.className = 'status-msg error';
    }
  }
}

// Render Mnemonic Word Badges
function renderMnemonicChips(words) {
  const container = document.getElementById('mnemonicChipsContainer');
  if (!container) return;
  container.innerHTML = words.map((w, idx) => `
    <div class="word-chip">
      <span class="word-num">${idx + 1}</span>
      <span class="word-text">${w}</span>
    </div>
  `).join('');
}

// Render EIP-55 Nibble-by-Nibble Visualizer
function renderEip55Inspector(eip55Res) {
  const container = document.getElementById('eip55InspectorGrid');
  if (!container) return;

  container.innerHTML = eip55Res.steps.map((st, i) => {
    let tagClass = 'digit';
    let tagLabel = 'Digit (Fixed)';
    if (st.isLetter) {
      if (st.capitalized) {
        tagClass = 'upper';
        tagLabel = `Nibble ${st.hashNibbleHex} ≥ 8 → Uppercase`;
      } else {
        tagClass = 'lower';
        tagLabel = `Nibble ${st.hashNibbleHex} < 8 → Lowercase`;
      }
    }

    return `
      <div class="eip55-cell ${tagClass}" title="Char #${i}: '${st.char}', Hash Nibble: 0x${st.hashNibbleHex} (${st.hashNibbleVal})">
        <div class="eip55-final">${st.finalChar}</div>
        <div class="eip55-sub">h[${i}]=${st.hashNibbleHex}</div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   STATISTICAL LABORATORY: STRICT AVALANCHE CRITERION & COLLISION MATH
   ========================================================================== */

function initAvalancheLab() {
  const bitSlider = document.getElementById('avalancheBitSlider');
  const bitVal = document.getElementById('avalancheBitVal');
  const btnRandomFlip = document.getElementById('btnRandomBitFlip');

  if (bitSlider && bitVal) {
    bitSlider.addEventListener('input', (e) => {
      bitVal.textContent = e.target.value;
      runAvalancheTest(parseInt(e.target.value, 10));
    });
  }

  if (btnRandomFlip) {
    btnRandomFlip.addEventListener('click', () => {
      const randBit = Math.floor(Math.random() * 256);
      if (bitSlider) bitSlider.value = randBit;
      if (bitVal) bitVal.textContent = randBit;
      runAvalancheTest(randBit);
    });
  }
}

function updateAvalancheWithCurrentKey(keyHex) {
  const bitSlider = document.getElementById('avalancheBitSlider');
  const bitIndex = bitSlider ? parseInt(bitSlider.value, 10) : 0;
  runAvalancheTest(bitIndex);
}

function runAvalancheTest(bitIndex) {
  if (!currentDerived) return;
  const originalKeyHex = currentDerived.privateKeyHex;
  let keyBigInt = BigInt('0x' + originalKeyHex);

  // Flip bit at bitIndex
  const mask = 1n << BigInt(bitIndex);
  const flippedKeyBigInt = keyBigInt ^ mask;
  const flippedKeyHex = flippedKeyBigInt.toString(16).padStart(64, '0');

  // Compute Keccak-256 hashes of original vs flipped key
  const origHash = keccak256(hexToBytes(originalKeyHex), 0x01);
  const flipHash = keccak256(hexToBytes(flippedKeyHex), 0x01);

  // Calculate bit differences
  let flippedBits = 0;
  const bitDiffArray = [];

  for (let byteIdx = 0; byteIdx < 32; byteIdx++) {
    const xorByte = origHash[byteIdx] ^ flipHash[byteIdx];
    for (let b = 7; b >= 0; b--) {
      const bitFlipped = (xorByte & (1 << b)) !== 0;
      if (bitFlipped) flippedBits++;
      bitDiffArray.push(bitFlipped);
    }
  }

  const flipRatio = (flippedBits / 256) * 100;
  const diffFrom50 = Math.abs(flipRatio - 50);

  // Chi-Square Goodness-of-Fit test against Binomial(256, 0.5)
  // Expected = 128 flips, 128 non-flips
  const nonFlippedBits = 256 - flippedBits;
  const chiSq = Math.pow(flippedBits - 128, 2) / 128 + Math.pow(nonFlippedBits - 128, 2) / 128;

  // Approximate p-value for 1 degree of freedom: P(ChiSq >= c) = erfc(sqrt(c/2))
  const pValue = Math.min(1, Math.max(0, 1 - chiSqCdf1(chiSq)));

  // Update DOM
  document.getElementById('avalancheFlippedBits').textContent = `${flippedBits} / 256`;
  document.getElementById('avalancheFlipRatio').textContent = `${flipRatio.toFixed(2)}%`;
  document.getElementById('avalancheDiff50').textContent = `±${diffFrom50.toFixed(2)}%`;
  document.getElementById('avalancheChiSq').textContent = chiSq.toFixed(3);
  document.getElementById('avalanchePVal').textContent = pValue.toFixed(4);

  // Render 16x16 Bit Grid
  const gridContainer = document.getElementById('avalancheBitGrid');
  if (gridContainer) {
    gridContainer.innerHTML = bitDiffArray.map((isFlipped, idx) => `
      <div class="bit-cell ${isFlipped ? 'flipped' : 'same'}" title="Bit #${idx}: ${isFlipped ? 'FLIPPED (1)' : 'UNCHANGED (0)'}"></div>
    `).join('');
  }
}

// Chi-Square CDF approximation for df = 1
function chiSqCdf1(x) {
  if (x <= 0) return 0;
  const s = Math.sqrt(x);
  // Approximation of error function erf(s / sqrt(2))
  const t = 1.0 / (1.0 + 0.3275911 * (s / Math.SQRT2));
  const erfVal = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x / 2));
  return Math.max(0, Math.min(1, erfVal));
}

/* ==========================================================================
   KECCAK-256 vs NIST SHA3-256 LIVE HASH DUEL
   ========================================================================== */

function initHashDuel() {
  const inputEl = document.getElementById('hashDuelInput');
  if (!inputEl) return;

  function updateDuel() {
    const text = inputEl.value;
    const enc = new TextEncoder();
    const bytes = enc.encode(text);

    // Ethereum Keccak-256 with 0x01 padding
    const ethKeccak = keccak256(bytes, 0x01);
    const ethKeccakHex = bytesToHex(ethKeccak);

    // NIST SHA3-256 with 0x06 padding
    const nistSha3 = keccak256(bytes, 0x06);
    const nistSha3Hex = bytesToHex(nistSha3);

    document.getElementById('duelEthKeccak').textContent = ethKeccakHex;
    document.getElementById('duelNistSha3').textContent = nistSha3Hex;

    // Byte padding inspection
    document.getElementById('duelEthPaddingByte').textContent = '0x01 (binary 0b01)';
    document.getElementById('duelNistPaddingByte').textContent = '0x06 (binary 0b0110)';
  }

  inputEl.addEventListener('input', updateDuel);
  updateDuel();
}

/* ==========================================================================
   ADDRESS SPACE & BIRTHDAY PARADOX CALCULATOR
   ========================================================================== */

function initCollisionCalc() {
  const slider = document.getElementById('collisionExpSlider');
  const expVal = document.getElementById('collisionExpVal');
  const countDisplay = document.getElementById('collisionAddressCount');
  const probDisplay = document.getElementById('collisionProbDisplay');
  const contextDisplay = document.getElementById('collisionContextDesc');

  if (!slider) return;

  function updateCollision() {
    const exponent = parseFloat(slider.value);
    if (expVal) expVal.textContent = exponent.toFixed(1);

    // Number of addresses n = 10^exponent
    const n = Math.pow(10, exponent);
    if (countDisplay) {
      countDisplay.textContent = n >= 1e9 ? n.toExponential(2) : n.toLocaleString();
    }

    // Address space size N = 2^160 ≈ 1.4615e48
    // Collision prob: p ≈ 1 - exp( - n^2 / (2 * N) )
    // In log scale: exponent_term = 2 * exponent * ln(10) - 160 * ln(2) - ln(2)
    const logN = 160 * Math.LN2;
    const logTerm = 2 * Math.log(n) - logN - Math.LN2;

    let prob;
    if (logTerm < -700) {
      prob = 0;
    } else if (logTerm > 0) {
      prob = 1;
    } else {
      const term = Math.exp(logTerm);
      prob = (term < 1e-15) ? term : (1 - Math.exp(-term));
    }

    if (probDisplay) {
      if (prob === 0 || prob < 1e-30) {
        probDisplay.textContent = `< 10⁻³⁰ (Mathematically zero)`;
      } else if (prob >= 0.99999) {
        probDisplay.textContent = `~100% (Guaranteed collision)`;
      } else {
        probDisplay.textContent = `${(prob * 100).toExponential(4)}%`;
      }
    }

    if (contextDisplay) {
      if (exponent < 15) {
        contextDisplay.textContent = 'All Ethereum addresses ever created across all networks combined are well below 10¹⁰. The collision risk is virtually zero.';
      } else if (exponent < 24) {
        contextDisplay.textContent = 'Comparable to all sand grains on planet Earth (~7.5 × 10¹⁸). Even with millions of supercomputers, a collision has never been observed.';
      } else if (exponent < 25) {
        contextDisplay.textContent = 'At 1.4 × 10²⁴ addresses (the Birthday Bound ≈ 2⁸⁰), there is a ~50% theoretical chance of two random addresses matching.';
      } else {
        contextDisplay.textContent = 'Beyond the birthday bound (2⁸⁰), collisions become mathematically expected, but generating this many addresses exceeds the total energy output of the Sun.';
      }
    }
  }

  slider.addEventListener('input', updateCollision);
  updateCollision();
}
