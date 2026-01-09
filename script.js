// Your Firebase config here
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

// Elements
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

const balanceDisplay = document.getElementById("balanceDisplay");
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const bgColorPicker = document.getElementById("bgColorPicker");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const leaderboardList = document.getElementById("leaderboardList");

// Game Elements
// Slots
const slotsWagerInput = document.getElementById("slotsWager");
const spinSlotsBtn = document.getElementById("spinSlotsBtn");
const slotsVisual = document.getElementById("slotsVisual");
const slotsResult = document.getElementById("slotsResult");

// Blackjack
const blackjackWagerInput = document.getElementById("blackjackWager");
const blackjackStartBtn = document.getElementById("blackjackStartBtn");
const blackjackGameDiv = document.getElementById("blackjackGame");
const playerHandSpan = document.getElementById("playerHand");
const dealerHandSpan = document.getElementById("dealerHand");
const playerScoreSpan = document.getElementById("playerScore");
const dealerScoreSpan = document.getElementById("dealerScore");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const blackjackMsg = document.getElementById("blackjackMsg");

// High-Low
const highlowWagerInput = document.getElementById("highlowWager");
const startHighLowBtn = document.getElementById("startHighLowBtn");
const cashoutHighLowBtn = document.getElementById("cashoutHighLowBtn");
const guessHigherBtn = document.getElementById("guessHigherBtn");
const guessLowerBtn = document.getElementById("guessLowerBtn");
const currentCardDiv = document.getElementById("currentCard");
const highlowMsg = document.getElementById("highlowMsg");
const highlowStreakSpan = document.getElementById("highlowStreak");
const highlowWinningsSpan = document.getElementById("highlowWinnings");

// Plinko
const plinkoWagerInput = document.getElementById("plinkoWager");
const plinkoDifficultySelect = document.getElementById("plinkoDifficulty");
const plinkoStartBtn = document.getElementById("plinkoStartBtn");
const plinkoBoard = document.getElementById("plinkoBoard");
const plinkoResult = document.getElementById("plinkoResult");

// Mines
const minesWagerInput = document.getElementById("minesWager");
const startMinesBtn = document.getElementById("startMinesBtn");
const minesGrid = document.getElementById("minesGrid");

// Crash
const crashWagerInput = document.getElementById("crashWager");
const crashStartBtn = document.getElementById("crashStartBtn");
const cashoutCrashBtn = document.getElementById("cashoutCrashBtn");
const crashMultiplierDiv = document.getElementById("crashMultiplier");

// Variables
let currentUser = null;
let currentUserData = null;

// --- Authentication & User Data ---

auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    await loadUserData(user.uid);
    showApp();
  } else {
    currentUser = null;
    currentUserData = null;
    showLogin();
  }
});

loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }
  auth.signInWithEmailAndPassword(email, password)
    .catch(e => alert(e.message));
});

signupBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }
  auth.createUserWithEmailAndPassword(email, password)
    .then(cred => {
      // Create initial user data
      db.collection("users").doc(cred.user.uid).set({
        balance: 1000,
        username: `User${Math.floor(Math.random() * 10000)}`,
        bgColor: "#2c003e"
      });
    })
    .catch(e => alert(e.message));
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Load user data from Firestore
async function loadUserData(uid) {
  const doc = await db.collection("users").doc(uid).get();
  if (doc.exists) {
    currentUserData = doc.data();
  } else {
    currentUserData = { balance: 1000, username: `User${Math.floor(Math.random() * 10000)}`, bgColor: "#2c003e" };
    await saveUserData(currentUserData);
  }
  updateUI();
}

// Save user data to Firestore
async function saveUserData(data) {
  if (!currentUser) return;
  await db.collection("users").doc(currentUser.uid).set(data);
  currentUserData = data;
  updateUI();
  updateLeaderboard();
}

function updateUI() {
  if (!currentUserData) return;
  balanceDisplay.textContent = `Balance: ${currentUserData.balance.toFixed(2)} LUTT`;
  usernameInput.value = currentUserData.username || "";
  document.body.style.backgroundColor = currentUserData.bgColor || "#2c003e";
  bgColorPicker.value = currentUserData.bgColor || "#2c003e";
}

function showApp() {
  loginSection.classList.add("hidden");
  appSection.classList.remove("hidden");
}

function showLogin() {
  loginSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

// Save username button
saveUsernameBtn.addEventListener("click", () => {
  const newUsername = usernameInput.value.trim();
  if (newUsername.length < 3) {
    alert("Username must be at least 3 characters.");
    return;
  }
  currentUserData.username = newUsername;
  saveUserData(currentUserData);
});

// Background color picker
bgColorPicker.addEventListener("input", () => {
  currentUserData.bgColor = bgColorPicker.value;
  saveUserData(currentUserData);
});

// --- Tabs navigation ---
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab;
    tabContents.forEach(tc => {
      tc.id === target ? tc.classList.remove("hidden") : tc.classList.add("hidden");
    });
  });
});

// --- Leaderboard ---
async function updateLeaderboard() {
  const snapshot = await db.collection("users").orderBy("balance", "desc").limit(10).get();
  leaderboardList.innerHTML = "";
  snapshot.forEach(doc => {
    const user = doc.data();
    const li = document.createElement("li");
    li.textContent = `${user.username || "Anon"} - ${user.balance.toFixed(2)} LUTT`;
    leaderboardList.appendChild(li);
  });
}

// --- Slots Game ---
const slotsSymbols = ["🍒", "🍋", "🍉", "⭐", "💎"];
spinSlotsBtn.addEventListener("click", () => {
  const wager = parseFloat(slotsWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }

  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  slotsResult.textContent = "Spinning...";
  let spins = 0;

  const interval = setInterval(() => {
    const spinResult = [
      slotsSymbols[Math.floor(Math.random() * slotsSymbols.length)],
      slotsSymbols[Math.floor(Math.random() * slotsSymbols.length)],
      slotsSymbols[Math.floor(Math.random() * slotsSymbols.length)]
    ];
    slotsVisual.textContent = spinResult.join(" ");
    spins++;
    if (spins > 15) {
      clearInterval(interval);
      // Simple payout logic:
      let payout = 0;
      if (spinResult[0] === spinResult[1] && spinResult[1] === spinResult[2]) {
        payout = wager * 10;
      } else if (spinResult[0] === spinResult[1] || spinResult[1] === spinResult[2]) {
        payout = wager * 2;
      }
      if (payout > 0) {
        currentUserData.balance += payout;
        saveUserData(currentUserData);
        slotsResult.textContent = `You won ${payout.toFixed(2)} LUTT! 🎉`;
      } else {
        slotsResult.textContent = "No win, try again!";
      }
    }
  }, 150);
});

// --- Blackjack Game ---
let blackjackDeck = [];
let blackjackPlayerHand = [];
let blackjackDealerHand = [];
let blackjackBet = 0;
let blackjackGameActive = false;
let blackjackDoubled = false;

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ value, suit });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (["J", "Q", "K"].includes(card.value)) return 10;
  if (card.value === "A") return 11;
  return parseInt(card.value);
}

function handValue(hand) {
  let value = 0;
  let aces = 0;
  for (const card of hand) {
    value += cardValue(card);
    if (card.value === "A") aces++;
  }
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  return value;
}

function handToString(hand) {
  return hand.map(c => `${c.value}${c.suit}`).join(" ");
}

blackjackStartBtn.addEventListener("click", () => {
  const wager = parseFloat(blackjackWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }

  blackjackBet = wager;
  blackjackDoubled = false;
  currentUserData.balance -= wager;
  saveUserData(currentUserData);

  blackjackDeck = shuffleDeck(createDeck());
  blackjackPlayerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
  blackjackDealerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
  blackjackGameActive = true;

  blackjackMsg.textContent = "";
  blackjackGameDiv.classList.remove("hidden");
  updateBlackjackUI();
  hitBtn.disabled = false;
  standBtn.disabled = false;
  doubleBtn.disabled = false;
});

function updateBlackjackUI() {
  playerHandSpan.textContent = handToString(blackjackPlayerHand);
  dealerHandSpan.textContent = blackjackDealerHand[0].value + blackjackDealerHand[0].suit + " ??";
  playerScoreSpan.textContent = handValue(blackjackPlayerHand);
  dealerScoreSpan.textContent = "?";
  blackjackMsg.textContent = "";
}

hitBtn.addEventListener("click", () => {
  if (!blackjackGameActive) return;
  blackjackPlayerHand.push(blackjackDeck.pop());
  const val = handValue(blackjackPlayerHand);
  playerScoreSpan.textContent = val;
  playerHandSpan.textContent = handToString(blackjackPlayerHand);

  if (val > 21) {
    blackjackGameOver(false);
  }
});

standBtn.addEventListener("click", () => {
  if (!blackjackGameActive) return;
  dealerTurn();
});

doubleBtn.addEventListener("click", () => {
  if (!blackjackGameActive) return;
  if (blackjackDoubled) return;
  if (blackjackBet * 2 > currentUserData.balance + blackjackBet) {
    alert("Insufficient balance to double.");
    return;
  }
  currentUserData.balance -= blackjackBet;
  blackjackBet *= 2;
  blackjackDoubled = true;
  blackjackPlayerHand.push(blackjackDeck.pop());
  updateBlackjackUI();
  if (handValue(blackjackPlayerHand) > 21) {
    blackjackGameOver(false);
  } else {
    dealerTurn();
  }
});

function dealerTurn() {
  let dealerVal = handValue(blackjackDealerHand);
  while (dealerVal < 17) {
    blackjackDealerHand.push(blackjackDeck.pop());
    dealerVal = handValue(blackjackDealerHand);
  }
  dealerScoreSpan.textContent = dealerVal;
  dealerHandSpan.textContent = handToString(blackjackDealerHand);
  const playerVal = handValue(blackjackPlayerHand);
  if (dealerVal > 21 || playerVal > dealerVal) {
    blackjackGameOver(true);
  } else {
    blackjackGameOver(false);
  }
}

function blackjackGameOver(playerWon) {
  blackjackGameActive = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;

  dealerScoreSpan.textContent = handValue(blackjackDealerHand);
  dealerHandSpan.textContent = handToString(blackjackDealerHand);

  if (playerWon) {
    const winnings = blackjackBet * 2;
    currentUserData.balance += winnings;
    saveUserData(currentUserData);
    blackjackMsg.textContent = `You won ${winnings.toFixed(2)} LUTT! 🎉`;
  } else {
    blackjackMsg.textContent = "You lost!";
  }
}

// --- High-Low Game ---
const cards = [
  "🂡","🂢","🂣","🂤","🂥","🂦","🂧","🂨","🂩","🂪","🂫","🂭","🂮", // A-K spades
  "🂱","🂲","🂳","🂴","🂵","🂶","🂷","🂸","🂹","🂺","🂻","🂽","🂾", // hearts
  "🃁","🃂","🃃","🃄","🃅","🃆","🃇","🃈","🃉","🃊","🃋","🃍","🃎", // diamonds
  "🃑","🃒","🃓","🃔","🃕","🃖","🃗","🃘","🃙","🃚","🃛","🃝","🃞"  // clubs
];

let highlowGameActive = false;
let highlowCurrentCardIndex = null;
let highlowStreak = 0;
let highlowWager = 0;
let highlowWinnings = 0;

startHighLowBtn.addEventListener("click", () => {
  const wager = parseFloat(highlowWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  highlowWager = wager;
  highlowWinnings = 0;
  highlowStreak = 0;
  highlowGameActive = true;
  highlowCurrentCardIndex = Math.floor(Math.random() * cards.length);
  currentCardDiv.textContent = cards[highlowCurrentCardIndex];
  highlowMsg.textContent = "Make your guess!";
  highlowStreakSpan.textContent = highlowStreak;
  highlowWinningsSpan.textContent = highlowWinnings.toFixed(2);

  guessHigherBtn.disabled = false;
  guessLowerBtn.disabled = false;
  startHighLowBtn.disabled = true;
  cashoutHighLowBtn.classList.remove("hidden");
});

function guessHighLow(isHigher) {
  if (!highlowGameActive) return;
  const nextCardIndex = Math.floor(Math.random() * cards.length);
  const oldCardIndex = highlowCurrentCardIndex;
  highlowCurrentCardIndex = nextCardIndex;
  currentCardDiv.textContent = cards[nextCardIndex];
  const won = isHigher ? nextCardIndex > oldCardIndex : nextCardIndex < oldCardIndex;

  if (won) {
    highlowStreak++;
    const multiplier = 1 + highlowStreak * 0.5;
    const roundWin = highlowWager * multiplier;
    highlowWinnings += roundWin;
    highlowMsg.textContent = `Correct! You won ${roundWin.toFixed(2)} LUTT`;
    highlowStreakSpan.textContent = highlowStreak;
    highlowWinningsSpan.textContent = highlowWinnings.toFixed(2);
  } else {
    highlowMsg.textContent = "Wrong guess! You lost your wager.";
    highlowGameActive = false;
    guessHigherBtn.disabled = true;
    guessLowerBtn.disabled = true;
    startHighLowBtn.disabled = false;
    cashoutHighLowBtn.classList.add("hidden");
  }
}

guessHigherBtn.addEventListener("click", () => guessHighLow(true));
guessLowerBtn.addEventListener("click", () => guessHighLow(false));

cashoutHighLowBtn.addEventListener("click", () => {
  if (!highlowGameActive) return;
  currentUserData.balance += highlowWinnings;
  saveUserData(currentUserData);
  highlowMsg.textContent = `You cashed out with ${highlowWinnings.toFixed(2)} LUTT!`;
  highlowGameActive = false;
  guessHigherBtn.disabled = true;
  guessLowerBtn.disabled = true;
  startHighLowBtn.disabled = false;
  cashoutHighLowBtn.classList.add("hidden");
});

// --- Plinko Game ---
const plinkoRows = 10;
const plinkoCols = 11;

function generatePlinkoBoard() {
  plinkoBoard.innerHTML = "";
  for (let row = 0; row < plinkoRows; row++) {
    for (let col = 0; col < plinkoCols; col++) {
      if ((row + col) % 2 === 1) {
        const peg = document.createElement("div");
        peg.classList.add("plinko-peg");
        peg.style.top = `${(row * 100) / plinkoRows}%`;
        peg.style.left = `${(col * 100) / plinkoCols}%`;
        plinkoBoard.appendChild(peg);
      }
    }
  }
  // Slots at bottom for payouts
  for (let i = 0; i < plinkoCols; i++) {
    const slot = document.createElement("div");
    slot.classList.add("plinko-slot");
    slot.style.left = `${(i * 100) / plinkoCols}%`;
    slot.style.width = `${100 / plinkoCols}%`;
    plinkoBoard.appendChild(slot);
  }
}

function normalDistributionPayouts(cols, difficulty) {
  // center slots lower payouts, edges higher
  const payouts = [];
  const center = cols / 2;
  let basePayout;
  switch (difficulty) {
    case "easy": basePayout = 1.2; break;
    case "medium": basePayout = 1.5; break;
    case "hard": basePayout = 2.0; break;
    default: basePayout = 1.2;
  }
  for (let i = 0; i < cols; i++) {
    const dist = Math.abs(i - center);
    const multiplier = basePayout + dist * 0.5;
    payouts.push(Math.round(multiplier * 100) / 100);
  }
  return payouts;
}

async function startPlinko() {
  const wager = parseFloat(plinkoWagerInput.value);
  const difficulty = plinkoDifficultySelect.value;
  if (!wager || wager < 1) {
    alert("Enter valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  updateUI();
  generatePlinkoBoard();

  const payouts = normalDistributionPayouts(plinkoCols, difficulty);
  const slots = plinkoBoard.querySelectorAll(".plinko-slot");
  slots.forEach((slot, idx) => {
    slot.textContent = `${payouts[idx].toFixed(2)}x`;
  });
  plinkoResult.textContent = "";

  // Animate ball drop
  const ball = document.createElement("div");
  ball.classList.add("plinko-ball");
  plinkoBoard.appendChild(ball);
  let row = 0;
  let col = Math.floor(plinkoCols / 2);
  ball.style.left = `${(col * 100) / plinkoCols + 100 / (plinkoCols * 2)}%`;
  ball.style.top = "0%";

  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (row < plinkoRows - 1) {
        const move = Math.random() < 0.5 ? -1 : 1;
        col = Math.min(Math.max(col + move, 0), plinkoCols - 1);
        row++;
        ball.style.left = `${(col * 100) / plinkoCols + 100 / (plinkoCols * 2)}%`;
        ball.style.top = `${(row * 100) / plinkoRows}%`;
      } else {
        clearInterval(interval);
        const payoutMultiplier = payouts[col];
        const winnings = wager * payoutMultiplier;
        currentUserData.balance += winnings;
        saveUserData(currentUserData);
        plinkoResult.textContent = `You won ${winnings.toFixed(2)} LUTT! Multiplier: ${payoutMultiplier.toFixed(2)}x`;
        ball.remove();
        resolve();
      }
    }, 300);
  });
}

plinkoStartBtn.addEventListener("click", () => {
  startPlinko();
});

// --- Mines Game (simple implementation) ---
let minesGameActive = false;
let minesGridData = [];
let minesWager = 0;

startMinesBtn.addEventListener("click", () => {
  minesWager = parseFloat(minesWagerInput.value);
  if (!minesWager || minesWager < 1) {
    alert("Enter valid wager.");
    return;
  }
  if (minesWager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  currentUserData.balance -= minesWager;
  saveUserData(currentUserData);
  minesGameActive = true;
  generateMinesGrid();
});

function generateMinesGrid() {
  minesGrid.innerHTML = "";
  minesGridData = [];
  const totalCells = 25;
  const minesCount = 5;
  // Generate mines indices
  const minesIndices = new Set();
  while (minesIndices.size < minesCount) {
    minesIndices.add(Math.floor(Math.random() * totalCells));
  }

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.classList.add("mine-cell");
    cell.textContent = "?";
    const isMine = minesIndices.has(i);
    minesGridData.push({ isMine, revealed: false, element: cell });
    cell.addEventListener("click", () => onMineCellClick(i));
    minesGrid.appendChild(cell);
  }
}

function onMineCellClick(idx) {
  if (!minesGameActive) return;
  const cellData = minesGridData[idx];
  if (cellData.revealed) return;

  if (cellData.isMine) {
    cellData.element.textContent = "💣";
    cellData.element.style.backgroundColor = "#a00";
    alert("You hit a mine! Game over.");
    minesGameActive = false;
    // Lose wager, no refund
  } else {
    cellData.element.textContent = "✔️";
    cellData.element.style.backgroundColor = "#0a0";
    cellData.revealed = true;
    // Reward per safe cell could be wager * some multiplier
    const safeCells = minesGridData.filter(c => !c.isMine && c.revealed).length;
    const payout = minesWager * (safeCells * 0.3);
    balanceDisplay.textContent = `Balance: ${currentUserData.balance.toFixed(2)} LUTT (Safe cells: ${safeCells})`;
    if (safeCells === minesGridData.length - 5) {
      alert(`You cleared all safe cells! You won ${payout.toFixed(2)} LUTT!`);
      currentUserData.balance += payout;
      saveUserData(currentUserData);
      minesGameActive = false;
    }
  }
}

// --- Crash Game ---
let crashGameActive = false;
let crashMultiplier = 1.0;
let crashInterval = null;

crashStartBtn.addEventListener("click", () => {
  const wager = parseFloat(crashWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  crashGameActive = true;
  crashMultiplier = 1.0;
  crashMultiplierDiv.textContent = "1.00x";
  cashoutCrashBtn.disabled = false;
  crashStartBtn.disabled = true;
  
  crashInterval = setInterval(() => {
    crashMultiplier += (Math.random() * 0.1);
    crashMultiplierDiv.textContent = crashMultiplier.toFixed(2) + "x";

    if (Math.random() < 0.01) {
      // Crash happens
      clearInterval(crashInterval);
      crashGameActive = false;
      cashoutCrashBtn.disabled = true;
      crashStartBtn.disabled = false;
      crashMultiplierDiv.textContent = "Crashed!";
      alert("Crash! You lost your wager.");
    }
  }, 200);
});

cashoutCrashBtn.addEventListener("click", () => {
  if (!crashGameActive) return;
  crashGameActive = false;
  clearInterval(crashInterval);
  cashoutCrashBtn.disabled = true;
  crashStartBtn.disabled = false;

  const wager = parseFloat(crashWagerInput.value);
  const winnings = wager * crashMultiplier;
  currentUserData.balance += winnings;
  saveUserData(currentUserData);
  alert(`You cashed out at ${crashMultiplier.toFixed(2)}x! You won ${winnings.toFixed(2)} LUTT!`);
});

// ------------- GLOBAL CHAT -------------
const chatMessagesDiv = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");

chatSendBtn.addEventListener("click", async () => {
  const message = chatInput.value.trim();
  if (!message || !currentUser) return;

  await db.collection("globalChat").add({
    uid: currentUser.uid,
    username: currentUserData.username || "Anon",
    message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  chatInput.value = "";
});

db.collection("globalChat").orderBy("timestamp", "asc").limit(100).onSnapshot(snapshot => {
  chatMessagesDiv.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat-message");
    msgDiv.textContent = `${data.username}: ${data.message}`;
    chatMessagesDiv.appendChild(msgDiv);
  });
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
});

// ------------- DAILY LEADERBOARD -------------
async function updateDailyLeaderboard() {
  const todayKey = new Date().toISOString().slice(0,10);
  const snapshot = await db.collection("dailyStats").doc(todayKey).collection("users").orderBy("balance", "desc").limit(10).get();
  const dailyList = document.getElementById("daily-leaderboard-list");
  dailyList.innerHTML = "";
  snapshot.forEach(doc => {
    const user = doc.data();
    const li = document.createElement("li");
    li.textContent = `${user.username || "Anon"} - ${user.balance.toFixed(2)} LUTT`;
    dailyList.appendChild(li);
  });
}

async function updateDailyStats() {
  if (!currentUser) return;
  const todayKey = new Date().toISOString().slice(0,10);
  const userDoc = db.collection("dailyStats").doc(todayKey).collection("users").doc(currentUser.uid);
  await userDoc.set({
    username: currentUserData.username || "Anon",
    balance: currentUserData.balance,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  updateDailyLeaderboard();
}

// Modify your saveUserData function to call updateDailyStats:
async function saveUserData(data) {
  if (!currentUser) return;
  await db.collection("users").doc(currentUser.uid).set(data);
  currentUserData = data;
  updateUI();
  updateLeaderboard();
  await updateDailyStats();
}

// ------------- FREE BOX TIMER & CLAIM -------------
const freeBoxBtn = document.getElementById("free-box-btn");
const freeBoxTimerDiv = document.getElementById("free-box-timer");
let freeBoxLastClaim = 0;

async function loadFreeBoxClaim() {
  if (!currentUser) return;
  const doc = await db.collection("freeBoxClaims").doc(currentUser.uid).get();
  freeBoxLastClaim = doc.exists ? doc.data().lastClaim || 0 : 0;
  updateFreeBoxTimer();
}

function updateFreeBoxTimer() {
  const now = Date.now();
  const elapsed = now - freeBoxLastClaim;
  const cooldown = 30 * 60 * 1000;
  const remaining = cooldown - elapsed;
  if (remaining <= 0) {
    freeBoxBtn.disabled = false;
    freeBoxTimerDiv.textContent = "Free box ready!";
  } else {
    freeBoxBtn.disabled = true;
    const min = Math.floor(remaining / 60000);
    const sec = Math.floor((remaining % 60000) / 1000);
    freeBoxTimerDiv.textContent = `Next free box in: ${min.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
    setTimeout(updateFreeBoxTimer, 1000);
  }
}

freeBoxBtn.addEventListener("click", async () => {
  if (freeBoxBtn.disabled || !currentUser) return;
  const reward = Math.floor(Math.random() * 91) + 10;
  currentUserData.balance += reward;
  await saveUserData(currentUserData);
  freeBoxLastClaim = Date.now();
  await db.collection("freeBoxClaims").doc(currentUser.uid).set({ lastClaim: freeBoxLastClaim });
  alert(`You claimed a free box with ${reward} LUTT!`);
  updateFreeBoxTimer();
});

// Load free box claim info on login:
auth.onAuthStateChanged(user => {
  if (user) {
    loadUserData(user.uid);
    loadFreeBoxClaim();
  } else {
    showLogin();
  }
});

// ------------- MINES CASHOUT BUTTON -------------
const minesCashoutBtn = document.getElementById("mines-cashout-btn");

minesCashoutBtn.addEventListener("click", () => {
  if (!minesGameActive) return;
  const safeCells = minesGridData.filter(c => !c.isMine && c.revealed).length;
  const payout = minesWager * (safeCells * 0.3);
  if (payout > 0) {
    alert(`You cashed out and won ${payout.toFixed(2)} LUTT!`);
    currentUserData.balance += payout;
    saveUserData(currentUserData);
  } else {
    alert("No safe cells revealed, no payout.");
  }
  minesGameActive = false;
  minesCashoutBtn.disabled = true;
  minesGridData.forEach(c => c.revealed = true);
});

// Modify existing mine click handler in your code to enable cashout button on safe reveal:
function onMineCellClick(idx) {
  if (!minesGameActive) return;
  const cellData = minesGridData[idx];
  if (cellData.revealed) return;

  if (cellData.isMine) {
    cellData.element.textContent = "💣";
    cellData.element.style.backgroundColor = "#a00";
    alert("You hit a mine! Game over.");
    minesGameActive = false;
    minesCashoutBtn.disabled = true;
  } else {
    cellData.element.textContent = "✔️";
    cellData.element.style.backgroundColor = "#0a0";
    cellData.revealed = true;
    minesCashoutBtn.disabled = false; // enable cashout
  }
}

// ------------- PLINKO MULTIPLIERS LOWER -------------
// Replace your plinko payout function with this:
function normalDistributionPayouts(cols, difficulty) {
  const payouts = [];
  const center = cols / 2;
  let basePayout;
  switch (difficulty) {
    case "easy": basePayout = 0.5; break;
    case "medium": basePayout = 0.75; break;
    case "hard": basePayout = 1.0; break;
    default: basePayout = 0.5;
  }
  for (let i = 0; i < cols; i++) {
    const dist = Math.abs(i - center);
    const multiplier = basePayout + dist * 0.25;
    payouts.push(Math.round(multiplier * 100) / 100);
  }
  return payouts;
}


// --- Initial Setup ---
updateLeaderboard();
generatePlinkoBoard();
