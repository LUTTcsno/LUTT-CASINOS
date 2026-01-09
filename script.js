// Your Firebase config (replace with your own keys)
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

// ELEMENTS
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const usernameInput = document.getElementById("usernameInput");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMsg = document.getElementById("authMsg");
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const usernameDisplay = document.getElementById("usernameDisplay");
const balanceDisplay = document.getElementById("balanceDisplay");

// NAVIGATION
const navButtons = document.querySelectorAll(".nav-btn");
const gameTabs = document.querySelectorAll(".gameTab");

function showGameTab(tabName) {
  gameTabs.forEach(tab => {
    if (tab.id === tabName) {
      tab.classList.remove("hidden");
    } else {
      tab.classList.add("hidden");
    }
  });
  navButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// NAV BUTTONS LISTENER
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    showGameTab(btn.dataset.tab);
  });
});

// USER DATA
let currentUserId = null;
let currentUserData = null;

async function saveUserData(data) {
  if (!currentUserId) return;
  await db.collection("users").doc(currentUserId).set(data);
}

async function loadUserData(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? doc.data() : null;
}

function updateBalances(userData) {
  usernameDisplay.textContent = userData.username || "Anonymous";
  balanceDisplay.textContent = userData.balance.toFixed(2);
}

// SIGNUP
signupBtn.addEventListener("click", async () => {
  authMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const username = usernameInput.value.trim();

  if (!email || !password || !username) {
    authMsg.textContent = "Please fill all fields";
    return;
  }
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUserId = userCredential.user.uid;
    currentUserData = { username, balance: 1000, createdAt: new Date() };
    await saveUserData(currentUserData);
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    updateBalances(currentUserData);
  } catch (error) {
    authMsg.textContent = error.message;
  }
});

// LOGIN
loginBtn.addEventListener("click", async () => {
  authMsg.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    authMsg.textContent = "Please enter email and password";
    return;
  }
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUserId = userCredential.user.uid;
    currentUserData = await loadUserData(currentUserId);
    if (!currentUserData) {
      currentUserData = { username: "Anonymous", balance: 1000, createdAt: new Date() };
      await saveUserData(currentUserData);
    }
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    updateBalances(currentUserData);
  } catch (error) {
    authMsg.textContent = error.message;
  }
});

// LOGOUT
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

// AUTH STATE CHANGE
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUserId = user.uid;
    currentUserData = await loadUserData(currentUserId);
    if (!currentUserData) {
      currentUserData = { username: "Anonymous", balance: 1000, createdAt: new Date() };
      await saveUserData(currentUserData);
    }
    loginSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    updateBalances(currentUserData);
  } else {
    currentUserId = null;
    currentUserData = null;
    loginSection.classList.remove("hidden");
    appSection.classList.add("hidden");
  }
});

// --- UPDATE LEADERBOARD ---
const leaderboardList = document.getElementById("leaderboardList");

async function updateLeaderboard() {
  const snapshot = await db.collection("users").orderBy("balance", "desc").limit(10).get();
  leaderboardList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.username || "Anonymous"} — ${data.balance.toFixed(2)} LUTT`;
    leaderboardList.appendChild(li);
  });
}

// Refresh leaderboard every 10 seconds
setInterval(() => {
  if (appSection.classList.contains("hidden")) return;
  updateLeaderboard();
}, 10000);
updateLeaderboard();

// --------------- GAME LOGIC BELOW ---------------

// --- SLOT MACHINE ---
const slotsWagerInput = document.getElementById("slotsWager");
const spinSlotsBtn = document.getElementById("spinSlotsBtn");
const slotsResult = document.getElementById("slotsResult");
const slotsVisual = document.getElementById("slotsVisual");

const slotSymbols = ["🍒", "🍋", "🍉", "⭐", "7️⃣", "💎"];

spinSlotsBtn.addEventListener("click", spinSlots);

function spinSlots() {
  if (!currentUserData) {
    alert("Please log in to play!");
    return;
  }
  const wager = parseInt(slotsWagerInput.value);
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
  updateBalances(currentUserData);

  spinSlotsBtn.disabled = true;
  slotsResult.textContent = "";
  slotsVisual.textContent = "🎰🎰🎰";

  let spins = 20;
  let interval = setInterval(() => {
    const reel1 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    const reel2 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    const reel3 = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
    slotsVisual.textContent = reel1 + reel2 + reel3;
    spins--;
    if (spins <= 0) {
      clearInterval(interval);
      calculateSlotsWinnings(reel1, reel2, reel3, wager);
      spinSlotsBtn.disabled = false;
    }
  }, 100);
}

function calculateSlotsWinnings(r1, r2, r3, wager) {
  let payout = 0;
  if (r1 === r2 && r2 === r3) {
    payout = wager * 10;
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    payout = wager * 2;
  } else if (slotSymbols.includes(r1) && slotSymbols.includes(r2) && slotSymbols.includes(r3)) {
    payout = wager * 0.5;
  }
  if (payout > 0) {
    currentUserData.balance += payout;
    saveUserData(currentUserData);
    updateBalances(currentUserData);
    slotsResult.textContent = `You won ${payout} LUTT! 🎉`;
  } else {
    slotsResult.textContent = `No win. Try again!`;
  }
}

// --- BLACKJACK ---

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

let blackjackDeck = [];
let playerHand = [];
let dealerHand = [];
let blackjackWager = 0;
let canDouble = true;

function createBlackjackDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = [
    { name: "A", value: [1, 11] },
    { name: "2", value: [2] },
    { name: "3", value: [3] },
    { name: "4", value: [4] },
    { name: "5", value: [5] },
    { name: "6", value: [6] },
    { name: "7", value: [7] },
    { name: "8", value: [8] },
    { name: "9", value: [9] },
    { name: "10", value: [10] },
    { name: "J", value: [10] },
    { name: "Q", value: [10] },
    { name: "K", value: [10] }
  ];

  const deck = [];
  for (const suit of suits) {
    for (const val of values) {
      deck.push({ suit, name: val.name, value: val.value });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function handScore(hand) {
  let scores = [0];
  hand.forEach(card => {
    let newScores = [];
    card.value.forEach(val => {
      scores.forEach(s => {
        newScores.push(s + val);
      });
    });
    scores = newScores;
  });
  let validScores = scores.filter(s => s <= 21);
  if (validScores.length === 0) return Math.min(...scores);
  return Math.max(...validScores);
}

function handToString(hand) {
  return hand.map(c => `${c.name}${c.suit}`).join(" ");
}

function updateBlackjackUI() {
  playerHandSpan.textContent = handToString(playerHand);
  dealerHandSpan.textContent = handToString(dealerHand);
  playerScoreSpan.textContent = handScore(playerHand);
  dealerScoreSpan.textContent = handScore(dealerHand);
}

function endBlackjackGame(msg, payoutMultiplier = 0) {
  blackjackMsg.textContent = msg;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;
  blackjackGameDiv.classList.remove("hidden");

  if (payoutMultiplier > 0) {
    let winnings = blackjackWager * payoutMultiplier;
    currentUserData.balance += winnings;
    saveUserData(currentUserData);
    updateBalances(currentUserData);
  }
}

function dealerPlay() {
  while (handScore(dealerHand) < 17) {
    dealerHand.push(blackjackDeck.pop());
  }
}

blackjackStartBtn.addEventListener("click", () => {
  if (!currentUserData) {
    alert("Please log in to play!");
    return;
  }
  let wager = parseInt(blackjackWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  blackjackWager = wager;
  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  updateBalances(currentUserData);

  blackjackDeck = createBlackjackDeck();
  shuffle(blackjackDeck);
  playerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
  dealerHand = [blackjackDeck.pop(), blackjackDeck.pop()];
  canDouble = true;

  updateBlackjackUI();

  blackjackMsg.textContent = "";
  hitBtn.disabled = false;
  standBtn.disabled = false;
  doubleBtn.disabled = false;
  blackjackGameDiv.classList.remove("hidden");
});

hitBtn.addEventListener("click", () => {
  playerHand.push(blackjackDeck.pop());
  canDouble = false;
  updateBlackjackUI();

  const score = handScore(playerHand);
  if (score > 21) {
    endBlackjackGame("Bust! You lose.");
  }
});

standBtn.addEventListener("click", () => {
  dealerPlay();
  updateBlackjackUI();

  const playerScore = handScore(playerHand);
  const dealerScore = handScore(dealerHand);

  if (dealerScore > 21 || playerScore > dealerScore) {
    endBlackjackGame("You win!", 2);
  } else if (dealerScore === playerScore) {
    currentUserData.balance += blackjackWager; // return wager on tie
    saveUserData(currentUserData);
    updateBalances(currentUserData);
    endBlackjackGame("Push! Bet returned.");
  } else {
    endBlackjackGame("You lose.");
  }
});

doubleBtn.addEventListener("click", () => {
  if (!canDouble) return alert("You can only double on your first move!");
  if (blackjackWager * 2 > currentUserData.balance + blackjackWager) return alert("Insufficient balance to double down.");

  currentUserData.balance -= blackjackWager;
  blackjackWager *= 2;
  saveUserData(currentUserData);
  updateBalances(currentUserData);

  playerHand.push(blackjackDeck.pop());
  updateBlackjackUI();

  if (handScore(playerHand) > 21) {
    endBlackjackGame("Bust after doubling down! You lose.");
  } else {
    dealerPlay();
    updateBlackjackUI();
    const playerScore = handScore(playerHand);
    const dealerScore = handScore(dealerHand);
    if (dealerScore > 21 || playerScore > dealerScore) {
      endBlackjackGame("You win!", 2);
    } else if (dealerScore === playerScore) {
      currentUserData.balance += blackjackWager; // return wager on tie
      saveUserData(currentUserData);
      updateBalances(currentUserData);
      endBlackjackGame("Push! Bet returned.");
    } else {
      endBlackjackGame("You lose.");
    }
  }
});

// --- HIGH-LOW ---

const highlowWagerInput = document.getElementById("highlowWager");
const startHighLowBtn = document.getElementById("startHighLowBtn");
const cashoutHighLowBtn = document.getElementById("cashoutHighLowBtn");
const currentCardDiv = document.getElementById("currentCard");
const guessHigherBtn = document.getElementById("guessHigherBtn");
const guessLowerBtn = document.getElementById("guessLowerBtn");
const highlowMsg = document.getElementById("highlowMsg");
const highlowStreakSpan = document.getElementById("highlowStreak");
const highlowWinningsSpan = document.getElementById("highlowWinnings");
const highlowGameDiv = document.getElementById("highlowGame");

let highlowDeck = [];
let currentHighLowCard = null;
let highlowStreak = 0;
let highlowWager = 0;
let highlowCurrentWinnings = 0;

const cardMultipliers = {
  14: 3, // Ace highest multiplier
  13: 2.5,
  12: 2,
  11: 1.5,
  10: 1.3,
  9: 1.2,
  8: 1.1,
  7: 1,
  6: 0.8,
  5: 0.7,
  4: 0.6,
  3: 0.5,
  2: 0.4
};

function createHighLowDeck() {
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

function shuffleHighLowDeck(deck) {
  for (let i = deck.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function showHighLowCard(card) {
  if (!card) {
    currentCardDiv.textContent = "🂠";
    return;
  }
  const suitColor = (card.suit === "♥" || card.suit === "♦") ? "red" : "white";
  currentCardDiv.innerHTML = `<span style="color:${suitColor}; font-size:5rem">${card.name}${card.suit}</span>`;
}

function startHighLow() {
  if (!currentUserData) {
    alert("Please log in to play!");
    return;
  }
  const wager = parseInt(highlowWagerInput.value);
  if (!wager || wager < 1) {
    alert("Enter a valid wager.");
    return;
  }
  if (wager > currentUserData.balance) {
    alert("Insufficient balance.");
    return;
  }
  highlowWager = wager;
  currentUserData.balance -= wager;
  saveUserData(currentUserData);
  updateBalances(currentUserData);

  highlowDeck = createHighLowDeck();
  shuffleHighLowDeck(highlowDeck);
  currentHighLowCard = highlowDeck.pop();
  highlowStreak = 0;
  highlowCurrentWinnings = 0;

  showHighLowCard(currentHighLowCard);
  highlowMsg.textContent = "Guess if next card is higher or lower!";
  highlowStreakSpan.textContent = highlowStreak;
  highlowWinningsSpan.textContent = highlowCurrentWinnings.toFixed(2);

  startHighLowBtn.classList.add("hidden");
  cashoutHighLowBtn.classList.remove("hidden");
  highlowGameDiv.classList.remove("hidden");
}

function guessHighLow(isHigher) {
  if (highlowDeck.length === 0) {
    highlowMsg.textContent = "Deck exhausted, cashing out!";
    cashOutHighLow();
    return;
  }
  const nextCard = highlowDeck.pop();
  const won = (isHigher && nextCard.value > currentHighLowCard.value) || (!isHigher && nextCard.value < currentHighLowCard.value);
  if (nextCard.value === currentHighLowCard.value) {
    // Equal value treated as loss
    highlowMsg.textContent = `Next card was ${nextCard.name}${nextCard.suit}. It's a tie, you lose!`;
    endHighLow();
    return;
  }
  if (won) {
    highlowStreak++;
    const multiplier = cardMultipliers[nextCard.value] || 1;
    highlowCurrentWinnings += highlowWager * multiplier;
    highlowMsg.textContent = `Next card was ${nextCard.name}${nextCard.suit}. You won! Multiplier: ${multiplier.toFixed(2)}x`;
    currentHighLowCard = nextCard;
    showHighLowCard(currentHighLowCard);
    highlowStreakSpan.textContent = highlowStreak;
    highlowWinningsSpan.textContent = highlowCurrentWinnings.toFixed(2);
  } else {
    highlowMsg.textContent = `Next card was ${nextCard.name}${nextCard.suit}. You lost!`;
    endHighLow();
  }
}

function cashOutHighLow() {
  currentUserData.balance += highlowCurrentWinnings;
  saveUserData(currentUserData);
  updateBalances(currentUserData);
  highlowMsg.textContent = `You cashed out with ${highlowCurrentWinnings.toFixed(2)} LUTT!`;
  endHighLow();
}

function endHighLow() {
  startHighLowBtn.classList.remove("hidden");
  cashoutHighLowBtn.classList.add("hidden");
  highlowGameDiv.classList.add("hidden");
  highlowStreak = 0;
  highlowCurrentWinnings = 0;
  showHighLowCard(null);
}

// High-Low listeners
startHighLowBtn.addEventListener("click", startHighLow);
cashoutHighLowBtn.addEventListener("click", cashOutHighLow);
guessHigherBtn.addEventListener("click", () => guessHighLow(true));
guessLowerBtn.addEventListener("click", () => guessHighLow(false));

// --- PLINKO ---

const plinkoWagerInput = document.getElementById("plinkoWager");
const plinkoDifficultySelect = document.getElementById("plinkoDifficulty");
const plinkoStartBtn = document.getElementById("plinkoStartBtn");
const plinkoBoard = document.getElementById("plinkoBoard");
const plinkoResult = document.getElementById("plinkoResult");

const plinkoRows = 10;
const plinkoCols = 11;

plinkoStartBtn.addEventListener("click", startPlinko);

function generatePlinkoBoard() {
  plinkoBoard.innerHTML = "";
  const pegSpacingX = plinkoBoard.clientWidth / plinkoCols;
  const pegSpacingY = plinkoBoard.clientHeight / plinkoRows;

  for (let r = 0; r < plinkoRows; r++) {
    for (let c = 0; c < plinkoCols; c++) {
      if (r === plinkoRows - 1) {
        // Create slots
        const slot = document.createElement("div");
        slot.classList.add("plinko-slot");
        slot.style.left = `${(c * pegSpacingX)}px`;
        slot.style.width = `${pegSpacingX}px`;
        slot.style.bottom = "0";
        slot.textContent = ""; // Will fill after game starts
        plinkoBoard.appendChild(slot);
      } else if ((r + c) % 2 === 1) {
        // Pegs in staggered pattern
        const peg = document.createElement("div");
        peg.classList.add("plinko-peg");
        peg.style.left = `${c * pegSpacingX + pegSpacingX/2}px`;
        peg.style.top = `${r * pegSpacingY}px`;
        plinkoBoard.appendChild(peg);
      }
    }
  }
}

function normalDistributionPayouts(cols, difficulty) {
  // Normal distribution centered at middle column with payouts inverse to distance
  const payouts = [];
  const center = Math.floor(cols / 2);
  for (let i = 0; i < cols; i++) {
    // distance from center
    let dist = Math.abs(i - center);
    // base payout: easier center tiles pay less, edges pay more
    // Difficulty scaling:
    // Easy: base 1 to 5 LUTT
    // Medium: 2 to 10 LUTT
    // Hard: 5 to 20 LUTT
    let minPay, maxPay;
    switch (difficulty) {
      case "easy":
        minPay = 1;
        maxPay = 5;
        break;
      case "medium":
        minPay = 2;
        maxPay = 10;
        break;
      case "hard":
        minPay = 5;
        maxPay = 20;
        break;
      default:
        minPay = 1;
        maxPay = 5;
    }
    // payout proportional to distance from center
    let payout = minPay + ((maxPay - minPay) * dist) / center;
    payouts.push(Math.round(payout * 100) / 100);
  }
  return payouts;
}

function startPlinko() {
  if (!currentUserData) {
    alert("Please log in to play!");
    return;
  }
  const wager = parseFloat(plinkoWagerInput.value);
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
  updateBalances(currentUserData);

  plinkoResult.textContent = "";
  plinkoStartBtn.disabled = true;
  plinkoBoard.innerHTML = "";

  const difficulty = plinkoDifficultySelect.value;
  const payouts = normalDistributionPayouts(plinkoCols, difficulty);

  generatePlinkoBoard();

  // Show payouts on slots
  const slots = plinkoBoard.querySelectorAll(".plinko-slot");
  slots.forEach((slot, idx) => {
    slot.textContent = payouts[idx] + " LUTT";
  });

  // Drop ball simulation
  let position = Math.floor(plinkoCols / 2);
  const path = [position];

  let step = 0;
  const maxSteps = plinkoRows - 1;

  function stepBall() {
    if (step >= maxSteps) {
      finishPlinko();
      return;
    }
    // Ball moves left or right randomly, but biased toward center for normal dist approx
    const center = Math.floor(plinkoCols / 2);
    const bias = (center - position) * 0.3; // Pull back toward center

    // Random move -1 (left) or +1 (right), with bias
    let move = Math.random() < 0.5 + bias / plinkoCols ? -1 : 1;
    // Clamp position so it doesn't go off board
    position = Math.min(Math.max(position + move, 0), plinkoCols - 1);

    path.push(position);
    step++;

    // Show ball position visually (optional: could animate with a div)
    // For simplicity, no animation here.

    setTimeout(stepBall, 150);
  }

  function finishPlinko() {
    // Determine payout based on final position
    const payout = payouts[position];
    const winnings = wager * payout;
    if (payout > 0) {
      currentUserData.balance += winnings;
      saveUserData(currentUserData);
      updateBalances(currentUserData);
      plinkoResult.textContent = `Ball landed in slot ${position + 1} — You won ${winnings.toFixed(2)} LUTT! 🎉`;
    } else {
      plinkoResult.textContent = `Ball landed in slot ${position + 1} — No winnings this time.`;
    }
    plinkoStartBtn.disabled = false;
  }

  stepBall();
}
