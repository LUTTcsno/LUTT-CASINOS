// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6CNjm2upOaD4BP3f7MBUPh0u1IDkHjh4",
  authDomain: "lutt-casinos.firebaseapp.com",
  projectId: "lutt-casinos",
  storageBucket: "lutt-casinos.firebasestorage.app",
  messagingSenderId: "1061450870530",
  appId: "1:1061450870530:web:27cd82b5e433cc6320dc1b",
  measurementId: "G-TXJY4VLCHV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("app");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const usernameInput = document.getElementById("usernameInput");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMsg = document.getElementById("authMsg");

const balanceAmount = document.getElementById("balanceAmount");

const navBtns = document.querySelectorAll(".nav-btn");
const gameTabs = document.querySelectorAll(".gameTab");

let currentUserData = null;
let currentUserId = null;

// Show / Hide Tabs
function showGameTab(tabName) {
  gameTabs.forEach(tab => {
    tab.classList.toggle("hidden", tab.id !== tabName);
  });
  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });
}

// Initialize tab nav listeners
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    showGameTab(btn.getAttribute("data-tab"));
  });
});

// Auth functions
async function saveUserData(userData) {
  if (!currentUserId) return;
  await db.collection("users").doc(currentUserId).set(userData);
}

async function loadUserData(userId) {
  const doc = await db.collection("users").doc(userId).get();
  if (doc.exists) return doc.data();
  return null;
}

function updateBalances(data) {
  balanceAmount.textContent = data.balance ?? 0;
}

// Sign Up
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim() || "Anonymous";

  if (!email || !password) {
    authMsg.textContent = "Email and password required.";
    return;
  }
  if (username.length < 3) {
    authMsg.textContent = "Username must be at least 3 characters.";
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUserId = userCredential.user.uid;
    currentUserData = {
      username,
      balance: 1000,
      luttsEarned: 0,
      createdAt: new Date(),
    };
    await saveUserData(currentUserData);
    authMsg.textContent = "Account created! Logged in.";
  } catch (error) {
    authMsg.textContent = error.message;
  }
});

// Log In
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMsg.textContent = "Email and password required.";
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUserId = userCredential.user.uid;
    currentUserData = await loadUserData(currentUserId);
    if (!currentUserData) {
      // New user record in DB
      currentUserData = { username: "Anonymous", balance: 1000, luttsEarned: 0, createdAt: new Date() };
      await saveUserData(currentUserData);
    }
    authMsg.textContent = "Logged in successfully!";
  } catch (error) {
    authMsg.textContent = error.message;
  }
});

// Log Out
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  currentUserId = null;
  currentUserData = null;
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  authMsg.textContent = "";
  emailInput.value = "";
  passwordInput.value = "";
  usernameInput.value = "";
});

// Auth state observer
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUserId = user.uid;
    currentUserData = await loadUserData(currentUserId);
    if (!currentUserData) {
      currentUserData = { username: "Anonymous", balance: 1000, luttsEarned: 0, createdAt: new Date() };
      await saveUserData(currentUserData);
    }
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    updateBalances(currentUserData);
    showGameTab("dashboard");
    authMsg.textContent = "";
  } else {
    currentUserId = null;
    currentUserData = null;
    loginSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
});

/* ------------------------------
     HIGH-LOW GAME IMPLEMENTATION
-------------------------------- */

const highlowWagerInput = document.getElementById("highlowWager");
const startHighLowBtn = document.getElementById("startHighLowBtn");
const currentCardDiv = document.getElementById("currentCard");
const guessHigherBtn = document.getElementById("guessHigherBtn");
const guessLowerBtn = document.getElementById("guessLowerBtn");
const highlowMsg = document.getElementById("highlowMsg");
const highlowStreakSpan = document.getElementById("highlowStreak");
const highlowGameDiv = document.getElementById("highlowGame");

let highlowDeck = [];
let currentHighLowCard = null;
let highlowStreak = 0;

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
    { name: "A", value: 14 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "7", value: 7 },
    { name: "8", value: 8 },
    { name: "9", value: 9 },
    { name: "10", value: 10 },
    { name: "J", value: 11 },
    { name: "Q", value: 12 },
    { name: "K", value: 13 }
  ];

  const deck = [];
  for (const suit of suits) {
    for (const val of values) {
      deck.push({ suit, name: val.name, value: val.value });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function showCard(card) {
  if (!card) {
    currentCardDiv.textContent = "🂠";
    return;
  }
  const suitColor = (card.suit === "♥" || card.suit === "♦") ? "red" : "white";
  currentCardDiv.innerHTML = `<span style="color:${suitColor}; font-size:5rem">${card.name}${card.suit}</span>`;
}

function resetHighLow() {
  highlowDeck = createDeck();
  shuffleDeck(highlowDeck);
  currentHighLowCard = highlowDeck.pop();
  showCard(currentHighLowCard);
  highlowStreak = 0;
  highlowStreakSpan.textContent = highlowStreak;
  highlowMsg.textContent = "";
  guessHigherBtn.disabled = false;
  guessLowerBtn.disabled = false;
  highlowGameDiv.classList.remove("hidden");
}

async function startHighLow() {
  if (!currentUserData) {
    alert("Please log in first!");
    return;
  }
  const wager = parseInt(highlowWagerInput.value);
  if (isNaN(wager) || wager < 1) {
    alert("Please enter a valid wager (minimum 1).");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance for this wager.");
    return;
  }
  currentUserData.balance -= wager;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);
  resetHighLow();
}

async function guessHighLow(guessHigher) {
  if (highlowDeck.length === 0) {
    highlowMsg.textContent = "No more cards. Game over.";
    guessHigherBtn.disabled = true;
    guessLowerBtn.disabled = true;
    return;
  }
  const nextCard = highlowDeck.pop();
  showCard(nextCard);
  if ((guessHigher && nextCard.value > currentHighLowCard.value) ||
      (!guessHigher && nextCard.value < currentHighLowCard.value)) {
    // Correct guess
    highlowStreak++;
    highlowStreakSpan.textContent = highlowStreak;
    // Reward: wager * streak (for example)
    const reward = parseInt(highlowWagerInput.value) * highlowStreak;
    currentUserData.balance += reward;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
    highlowMsg.textContent = `Correct! You earned ${reward} LUTT.`;
  } else {
    // Wrong guess - end game
    highlowMsg.textContent = "Wrong! Game over.";
    guessHigherBtn.disabled = true;
    guessLowerBtn.disabled = true;
  }
  currentHighLowCard = nextCard;
}

startHighLowBtn.addEventListener("click", startHighLow);
guessHigherBtn.addEventListener("click", () => guessHighLow(true));
guessLowerBtn.addEventListener("click", () => guessHighLow(false));

/* ------------------------------
      PLINKO GAME IMPLEMENTATION
-------------------------------- */

const plinkoWagerInput = document.getElementById("plinkoWager");
const plinkoDifficultySelect = document.getElementById("plinkoDifficulty");
const plinkoStartBtn = document.getElementById("plinkoStartBtn");
const plinkoBoard = document.getElementById("plinkoBoard");
const plinkoResult = document.getElementById("plinkoResult");

let plinkoBall = null;

const plinkoConfig = {
  easy: {
    rows: 7,
    cols: 8,
    multipliers: [0, 0.5, 1, 2, 2, 1, 0.5, 0],
  },
  medium: {
    rows: 9,
    cols: 9,
    multipliers: [0, 0.3, 1, 3, 5, 3, 1, 0.3, 0],
  },
  hard: {
    rows: 11,
    cols: 10,
    multipliers: [0, 0.1, 0.5, 2, 5, 10, 5, 2, 0.5, 0.1],
  },
};

function createPlinkoBoard(difficulty) {
  plinkoBoard.innerHTML = "";
  const config = plinkoConfig[difficulty];
  const pegSpacingX = plinkoBoard.clientWidth / config.cols;
  const pegSpacingY = plinkoBoard.clientHeight / config.rows;

  // Create pegs
  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      // Skip pegs on odd rows at end for staggered layout
      if (row % 2 === 1 && col === config.cols - 1) continue;
      const peg = document.createElement("div");
      peg.className = "plinko-peg";
      let x = col * pegSpacingX + (row % 2 === 1 ? pegSpacingX / 2 : 0);
      let y = row * pegSpacingY;
      peg.style.left = `${x}px`;
      peg.style.top = `${y}px`;
      plinkoBoard.appendChild(peg);
    }
  }

  // Create slots
  const slotCount = config.multipliers.length;
  const slotWidth = plinkoBoard.clientWidth / slotCount;
  for (let i = 0; i < slotCount; i++) {
    const slot = document.createElement("div");
    slot.className = "plinko-slot";
    slot.style.left = `${i * slotWidth}px`;
    slot.style.width = `${slotWidth}px`;
    slot.textContent = `${config.multipliers[i]}x`;
    plinkoBoard.appendChild(slot);
  }
}

function createPlinkoBall() {
  if (plinkoBall) plinkoBall.remove();
  plinkoBall = document.createElement("div");
  plinkoBall.className = "plinko-ball";
  plinkoBoard.appendChild(plinkoBall);
  plinkoBall.style.top = "10px";
  plinkoBall.style.left = (plinkoBoard.clientWidth / 2 - 12) + "px";
}

function playPlinkoSound(type) {
  if (!window.AudioContext) return;
  const ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  if (type === "drop") {
    o.frequency.value = 800;
    g.gain.value = 0.1;
  } else if (type === "bounce") {
    o.frequency.value = 1200;
    g.gain.value = 0.05;
  }
  o.start();
  setTimeout(() => {
    o.stop();
    ctx.close();
  }, 100);
}

async function dropBall() {
  const difficulty = plinkoDifficultySelect.value;
  const config = plinkoConfig[difficulty];
  const rows = config.rows;
  const cols = config.cols;
  const pegSpacingX = plinkoBoard.clientWidth / cols;
  const pegSpacingY = plinkoBoard.clientHeight / rows;

  let x = plinkoBoard.clientWidth / 2 - 12;
  let y = 10;
  createPlinkoBall();
  playPlinkoSound("drop");

  let path = [];
  for (let row = 0; row < rows; row++) {
    const moveLeft = Math.random() < 0.5;
    if (row % 2 === 1) {
      x += moveLeft ? -pegSpacingX / 2 : pegSpacingX / 2;
    }
    y += pegSpacingY;
    path.push({ x, y });
  }

  for (const pos of path) {
    await new Promise(r => setTimeout(r, 200));
    plinkoBall.style.left = pos.x + "px";
    plinkoBall.style.top = pos.y + "px";
    playPlinkoSound("bounce");
  }

  const slotWidth = plinkoBoard.clientWidth / config.multipliers.length;
  const slotIndex = Math.min(
    config.multipliers.length - 1,
    Math.max(0, Math.floor((x + 12) / slotWidth))
  );
  const multiplier = config.multipliers[slotIndex];
  return multiplier;
}

async function playPlinko() {
  if (!currentUserData) {
    alert("Please log in to play!");
    return;
  }
  const wager = parseInt(plinkoWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }

  plinkoStartBtn.disabled = true;
  plinkoResult.textContent = "";
  currentUserData.balance -= wager;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  createPlinkoBoard(plinkoDifficultySelect.value);

  const multiplier = await dropBall();

  const winnings = Math.floor(wager * multiplier);
  if (winnings > 0) {
    currentUserData.balance += winnings;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
    plinkoResult.textContent = `You won ${winnings} LUTT! (x${multiplier}) 🎉`;
  } else {
    plinkoResult.textContent = `No winnings. Better luck next time!`;
  }
  plinkoStartBtn.disabled = false;
}

plinkoStartBtn.addEventListener("click", playPlinko);
createPlinkoBoard(plinkoDifficultySelect.value);
plinkoDifficultySelect.addEventListener("change", () => createPlinkoBoard(plinkoDifficultySelect.value));

/* ------------------------------
          LEADERBOARD
--------------------------------*/

const leaderboardList = document.getElementById("leaderboardList");

async function updateLeaderboard() {
  const snapshot = await db.collection("users").orderBy("balance", "desc").limit(10).get();
  leaderboardList.innerHTML = "";
  snapshot.forEach(doc => {
    const user = doc.data();
    const li = document.createElement("li");
    li.textContent = `${user.username || "Anonymous"}: ${user.balance} LUTT`;
    leaderboardList.appendChild(li);
  });
}

// Update leaderboard every 20 seconds only if app is visible
setInterval(() => {
  if (!appSection.classList.contains("hidden")) {
    updateLeaderboard();
  }
}, 20000);

updateLeaderboard();

