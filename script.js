// Firebase config (your keys)
const firebaseConfig = {
  apiKey: "AIzaSyD6CNjm2upOaD4BP3f7MBUPh0u1IDkHjh4",
  authDomain: "lutt-casinos.firebaseapp.com",
  projectId: "lutt-casinos",
  storageBucket: "lutt-casinos.firebasestorage.app",
  messagingSenderId: "1061450870530",
  appId: "1:1061450870530:web:27cd82b5e433cc6320dc1b",
  measurementId: "G-TXJY4VLCHV"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const loginScreen = document.getElementById("loginScreen");
const gameScreen = document.getElementById("gameScreen");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const usernameInput = document.getElementById("username");
const signUpBtn = document.getElementById("signUpBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const displayUsername = document.getElementById("displayUsername");
const balanceSpan = document.getElementById("balance");
const streakSpan = document.getElementById("streak");
const dailyBonusBtn = document.getElementById("dailyBonusBtn");
const dailyMsg = document.getElementById("dailyMsg");

const navBtns = document.querySelectorAll(".nav-btn");
const gameTabs = document.querySelectorAll(".gameTab");
const leaderboardList = document.getElementById("leaderboardList");

let currentUser = null;
let currentUserData = null;

// --- User Data Helpers ---
async function initUserData() {
  const docRef = db.collection("users").doc(currentUser.uid);
  const doc = await docRef.get();
  if (!doc.exists) {
    await docRef.set({
      balance: 1000,
      username: usernameInput.value || currentUser.email.split("@")[0],
      streak: 0,
      lastLogin: null,
    });
  }
}

async function loadUserData() {
  const doc = await db.collection("users").doc(currentUser.uid).get();
  return doc.data();
}

async function saveUserData(data) {
  await db.collection("users").doc(currentUser.uid).set(data);
  currentUserData = data;
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
}

function showGame(userData) {
  loginScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

  displayUsername.textContent = userData.username || "Anonymous";
  updateBalances(userData);
  showGameTab("dashboard");
  updateLeaderboard();
  fetchActiveBattles();
}

function updateBalances(data) {
  balanceSpan.innerText = data.balance;
  streakSpan.innerText = data.streak || 0;
}

function showGameTab(tabName) {
  gameTabs.forEach(tab => {
    if (tab.id === tabName) tab.classList.remove("hidden");
    else tab.classList.add("hidden");
  });
  navBtns.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabName) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

// --- Leaderboard ---
async function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const usersSnapshot = await db.collection("users").orderBy("balance", "desc").limit(10).get();

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.username || "Anonymous"} - ${data.balance} LUTT`;
    leaderboardList.appendChild(li);
  });
}

// --- Navigation ---
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    showGameTab(btn.getAttribute("data-tab"));
  });
});

// --- Auth Handlers ---
signUpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();
  if (!email || !password || !username) return alert("Fill all fields.");
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    await db.collection("users").doc(currentUser.uid).set({
      balance: 1000,
      username,
      streak: 0,
      lastLogin: null,
    });
    currentUserData = await loadUserData();
    showGame(currentUserData);
  } catch (e) {
    alert("Sign up failed: " + e.message);
  }
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Fill all fields.");
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;
    currentUserData = await loadUserData();
    showGame(currentUserData);
  } catch (e) {
    alert("Login failed: " + e.message);
  }
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
  currentUser = null;
  currentUserData = null;
  showLogin();
});

// --- Daily Bonus ---
dailyBonusBtn.addEventListener("click", async () => {
  const now = new Date();
  const lastLogin = currentUserData.lastLogin ? currentUserData.lastLogin.toDate() : null;

  if (lastLogin) {
    const diff = now - lastLogin;
    if (diff < 24 * 60 * 60 * 1000) {
      dailyMsg.textContent = "Already claimed bonus today!";
      return;
    }
    if (diff < 48 * 60 * 60 * 1000) {
      currentUserData.streak = (currentUserData.streak || 0) + 1;
    } else {
      currentUserData.streak = 1;
    }
  } else {
    currentUserData.streak = 1;
  }

  const bonus = 100 + (currentUserData.streak - 1) * 10;
  currentUserData.balance += bonus;
  currentUserData.lastLogin = firebase.firestore.Timestamp.fromDate(now);
  await saveUserData(currentUserData);
  updateBalances(currentUserData);
  dailyMsg.textContent = `Bonus claimed! You received ${bonus} LUTT. Streak: ${currentUserData.streak}`;
  updateLeaderboard();
});

// --- Blackjack ---
const blackjackWagerInput = document.getElementById("blackjackWager");
const blackjackPlayBtn = document.getElementById("blackjackPlayBtn");
const dealerHandDiv = document.getElementById("dealerHand");
const playerHandDiv = document.getElementById("playerHand");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const blackjackResult = document.getElementById("blackjackResult");

let blackjackBet = 0;
let playerHand = [];
let dealerHand = [];
let playerTurn = false;

const deck = (() => {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let d = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      d.push({ rank, suit });
    });
  });
  return d;
})();

function shuffleDeck() {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let currentDeck = [];

function cardValue(card) {
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  hand.forEach(card => {
    total += cardValue(card);
    if (card.rank === "A") aces++;
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function renderHands() {
  dealerHandDiv.innerHTML = "";
  playerHandDiv.innerHTML = "";

  dealerHand.forEach((card, i) => {
    const div = document.createElement("div");
    div.className = "cardVisual";
    div.textContent = `${card.rank}${card.suit}`;
    if (i === 0 && playerTurn) {
      div.textContent = "🂠"; // facedown card
    }
    dealerHandDiv.appendChild(div);
  });

  playerHand.forEach(card => {
    const div = document.createElement("div");
    div.className = "cardVisual";
    div.textContent = `${card.rank}${card.suit}`;
    playerHandDiv.appendChild(div);
  });
}

async function dealCard(hand) {
  hand.push(currentDeck.pop());
  renderHands();
  await new Promise(r => setTimeout(r, 500));
}

async function dealerPlay() {
  while (handValue(dealerHand) < 17) {
    await dealCard(dealerHand);
  }
}

function resetBlackjack() {
  blackjackResult.textContent = "";
  playerHand = [];
  dealerHand = [];
  currentDeck = shuffleDeck();
}

// Blackjack play handler
blackjackPlayBtn.addEventListener("click", async () => {
  if (!currentUserData) return;
  const wager = parseInt(blackjackWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }

  resetBlackjack();

  blackjackBet = wager;
  currentUserData.balance -= wager;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  playerTurn = true;
  await dealCard(playerHand);
  await dealCard(dealerHand);
  await dealCard(playerHand);
  renderHands();

  hitBtn.disabled = false;
  standBtn.disabled = false;
  doubleBtn.disabled = false;
});

hitBtn.addEventListener("click", async () => {
  if (!playerTurn) return;
  await dealCard(playerHand);
  const value = handValue(playerHand);
  if (value > 21) {
    endBlackjack("Bust! You lose.");
  }
});

standBtn.addEventListener("click", async () => {
  if (!playerTurn) return;
  playerTurn = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;

  await dealerPlay();
  const playerVal = handValue(playerHand);
  const dealerVal = handValue(dealerHand);

  if (dealerVal > 21 || playerVal > dealerVal) {
    const winnings = blackjackBet * 2;
    currentUserData.balance += winnings;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
    endBlackjack(`You win! You earned ${winnings} LUTT.`);
  } else if (playerVal === dealerVal) {
    currentUserData.balance += blackjackBet;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
    endBlackjack("Push! Your bet has been returned.");
  } else {
    endBlackjack("You lose!");
  }
});

doubleBtn.addEventListener("click", async () => {
  if (!playerTurn) return;
  if (currentUserData.balance < blackjackBet) {
    alert("Not enough balance to double.");
    return;
  }
  currentUserData.balance -= blackjackBet;
  blackjackBet *= 2;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  await dealCard(playerHand);

  if (handValue(playerHand) > 21) {
    endBlackjack("Bust! You lose.");
  } else {
    playerTurn = false;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    await dealerPlay();
    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);

    if (dealerVal > 21 || playerVal > dealerVal) {
      const winnings = blackjackBet * 2;
      currentUserData.balance += winnings;
      await saveUserData(currentUserData);
      updateBalances(currentUserData);
      endBlackjack(`You win! You earned ${winnings} LUTT.`);
    } else if (playerVal === dealerVal) {
      currentUserData.balance += blackjackBet;
      await saveUserData(currentUserData);
      updateBalances(currentUserData);
      endBlackjack("Push! Your bet has been returned.");
    } else {
      endBlackjack("You lose!");
    }
  }
});

function endBlackjack(message) {
  blackjackResult.textContent = message;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;
  playerTurn = false;
}

// --- Slots Game ---

const slotsSpinBtn = document.getElementById("slotsSpinBtn");
const slotsWagerInput = document.getElementById("slotsWager");
const slotsReels = [document.getElementById("reel1"), document.getElementById("reel2"), document.getElementById("reel3")];
const slotsResult = document.getElementById("slotsResult");

const slotSymbols = ["🍒", "7️⃣", "⭐", "🔔", "🍋", "🍉", "💎"];
const slotPayouts = {
  "🍒": 2,
  "7️⃣": 10,
  "⭐": 5,
  "🔔": 3,
  "🍋": 2,
  "🍉": 4,
  "💎": 8
};

function getRandomSymbol() {
  return slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
}

function checkSlotsWin(resultSymbols, wager) {
  // Simple: 3 matching symbols pay out wager * multiplier
  if (resultSymbols[0] === resultSymbols[1] && resultSymbols[1] === resultSymbols[2]) {
    const multiplier = slotPayouts[resultSymbols[0]];
    return wager * multiplier;
  }
  // 2 matching symbols pays half the multiplier
  if (resultSymbols[0] === resultSymbols[1] || resultSymbols[1] === resultSymbols[2] || resultSymbols[0] === resultSymbols[2]) {
    const matchedSymbol = resultSymbols[0] === resultSymbols[1] ? resultSymbols[0] : (resultSymbols[1] === resultSymbols[2] ? resultSymbols[1] : resultSymbols[0]);
    const multiplier = slotPayouts[matchedSymbol] / 2;
    return Math.floor(wager * multiplier);
  }
  return 0;
}

slotsSpinBtn.addEventListener("click", async () => {
  if (!currentUserData) return;
  const wager = parseInt(slotsWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }

  slotsSpinBtn.disabled = true;
  slotsResult.textContent = "";
  currentUserData.balance -= wager;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  // Animate reels
  const spins = 15;
  let finalSymbols = [];
  for (let i = 0; i < slotsReels.length; i++) {
    await spinReel(slotsReels[i], spins);
    const symbol = getRandomSymbol();
    slotsReels[i].textContent = symbol;
    finalSymbols.push(symbol);
  }

  const winnings = checkSlotsWin(finalSymbols, wager);
  if (winnings > 0) {
    slotsResult.textContent = `You won ${winnings} LUTT! 🎉`;
    currentUserData.balance += winnings;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
  } else {
    slotsResult.textContent = "No win. Try again!";
  }
  slotsSpinBtn.disabled = false;
});

function spinReel(reel, spins) {
  return new Promise((resolve) => {
    let count = 0;
    const interval = setInterval(() => {
      reel.textContent = getRandomSymbol();
      count++;
      if (count >= spins) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

// --- Case Battle PvP (same as previous implementation, can reuse code) ---

// ... (Reuse your existing case battle PvP code here, unchanged)

// --- Firebase Auth State ---
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    currentUserData = await loadUserData();
    if (!currentUserData) {
      await initUserData();
      currentUserData = await loadUserData();
    }
    showGame(currentUserData);
  } else {
    showLogin();
  }
});
