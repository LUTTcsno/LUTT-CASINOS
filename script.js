// Firebase config (use your provided keys)
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

// UI Elements
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

const nav = document.querySelector("nav");
const gameTabs = document.querySelectorAll(".gameTab");

const leaderboardList = document.getElementById("leaderboardList");

// Blackjack UI
const blackjackPlayBtn = document.getElementById("blackjackPlayBtn");
const blackjackWagerInput = document.getElementById("blackjackWager");
const dealerCardsDiv = document.getElementById("dealerHand");
const playerCardsDiv = document.getElementById("playerHand");
const blackjackResult = document.getElementById("blackjackResult");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const balanceBlackjackSpan = document.getElementById("balanceBlackjack");

// Case Battle UI
const battleWagerInput = document.getElementById("battleWager");
const battleCasesInput = document.getElementById("battleCases");
const battleCaseTypeSelect = document.getElementById("battleCaseType");
const createBattleBtn = document.getElementById("createBattleBtn");
const joinBattleBtn = document.getElementById("joinBattleBtn");
const activeBattlesList = document.getElementById("activeBattlesList");
const battleSpinnerContainer = document.getElementById("battleSpinnerContainer");
const playerSpinnerTrack = document.getElementById("playerSpinnerTrack");
const opponentSpinnerTrack = document.getElementById("opponentSpinnerTrack");
const battleResult = document.getElementById("battleResult");
const balanceCaseBattleSpan = document.getElementById("balanceCaseBattle");

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
  balanceBlackjackSpan.innerText = data.balance;
  balanceCaseBattleSpan.innerText = data.balance;
  streakSpan.innerText = data.streak || 0;
}

function showGameTab(tabName) {
  gameTabs.forEach(tab => {
    if (tab.id === tabName) tab.classList.remove("hidden");
    else tab.classList.add("hidden");
  });
}

// --- Leaderboard ---
async function updateLeaderboard() {
  leaderboardList.innerHTML = "";
  const usersSnapshot = await db.collection("users").orderBy("balance", "desc").limit(10).get();

  usersSnapshot.forEach(doc => {
    const user = doc.data();
    const displayName = user.username || user.email || "Anonymous";
    const li = document.createElement("li");
    li.textContent = `${displayName} - ${user.balance} LUTT`;
    leaderboardList.appendChild(li);
  });
}

// --- Auth Handlers ---
signUpBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const username = usernameInput.value.trim();

  if (!email || !password || !username) {
    alert("Please enter email, password, and username");
    return;
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    currentUser = userCredential.user;

    await initUserData();
    currentUserData = await loadUserData();
    showGame(currentUserData);
  } catch (e) {
    alert("Sign Up Error: " + e.message);
  }
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    currentUser = userCredential.user;

    currentUserData = await loadUserData();
    showGame(currentUserData);
  } catch (e) {
    alert("Login Error: " + e.message);
  }
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    currentUserData = await loadUserData();
    showGame(currentUserData);
  } else {
    currentUser = null;
    currentUserData = null;
    showLogin();
  }
});

// --- Navigation ---
nav.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON") {
    const tab = e.target.getAttribute("data-tab");
    if (tab) showGameTab(tab);
  }
});

// --- Daily Bonus ---
dailyBonusBtn.addEventListener("click", async () => {
  if (!currentUserData) return;
  const today = new Date().toDateString();

  if (currentUserData.lastLogin === today) {
    dailyMsg.innerText = `Already claimed today's bonus! Come back tomorrow.`;
    return;
  }

  currentUserData.balance += 200; // Bonus amount
  currentUserData.streak = currentUserData.streak ? currentUserData.streak + 1 : 1;
  currentUserData.lastLogin = today;
  await saveUserData(currentUserData);

  updateBalances(currentUserData);
  dailyMsg.innerText = `You received 200 LUTT! Streak: ${currentUserData.streak} days.`;
  updateLeaderboard();
});

// --- Blackjack Game Logic ---

let deck = [];
let playerHand = [];
let dealerHand = [];
let blackjackBet = 0;
let playerTurn = false;

function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return Number(card.rank);
}

function handValue(hand) {
  let val = 0;
  let aces = 0;
  for (const card of hand) {
    val += cardValue(card);
    if (card.rank === "A") aces++;
  }
  while (val > 21 && aces > 0) {
    val -= 10;
    aces--;
  }
  return val;
}

function createCardElement(card) {
  const div = document.createElement("div");
  div.className = "cardVisual";
  div.textContent = card.rank + card.suit;
  return div;
}

function renderHands() {
  dealerCardsDiv.innerHTML = "";
  playerCardsDiv.innerHTML = "";

  dealerHand.forEach(card => {
    dealerCardsDiv.appendChild(createCardElement(card));
  });

  playerHand.forEach(card => {
    playerCardsDiv.appendChild(createCardElement(card));
  });
}

async function dealCard(hand) {
  if (deck.length === 0) deck = createDeck();
  const card = deck.pop();
  hand.push(card);
  renderHands();
  await new Promise(r => setTimeout(r, 500));
}

async function dealerPlay() {
  while (handValue(dealerHand) < 17) {
    await dealCard(dealerHand);
  }
}

function resetBlackjack() {
  deck = createDeck();
  playerHand = [];
  dealerHand = [];
  blackjackResult.textContent = "";
  hitBtn.disabled = true;
  standBtn.disabled = true;
  doubleBtn.disabled = true;
  blackjackBet = 0;
}

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

// --- PvP Case Battle ---

let activeBattles = [];
let selectedBattleId = null;
let isInBattle = false;
let battleData = null;

const casePrizes = {
  cheap: [50, 100, 150, 200, 300],
  medium: [200, 300, 400, 500, 600],
  expensive: [500, 1000, 1500, 2000, 3000]
};

async function fetchActiveBattles() {
  const battlesSnapshot = await db.collection("caseBattles")
    .where("status", "==", "waiting")
    .get();
  activeBattles = [];
  activeBattlesList.innerHTML = "";

  battlesSnapshot.forEach(doc => {
    const battle = { id: doc.id, ...doc.data() };
    activeBattles.push(battle);

    const li = document.createElement("li");
    li.textContent = `Host: ${battle.hostUsername} | Wager: ${battle.wager} LUTT | Cases: ${battle.cases} | Type: ${battle.caseType}`;
    li.dataset.battleId = doc.id;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
      Array.from(activeBattlesList.children).forEach(c => c.style.background = "");
      li.style.background = "#004400";
      selectedBattleId = doc.id;
      joinBattleBtn.disabled = false;
    });
    activeBattlesList.appendChild(li);
  });

  if (activeBattles.length === 0) {
    activeBattlesList.innerHTML = "<i>No active battles available</i>";
    joinBattleBtn.disabled = true;
    selectedBattleId = null;
  }
}

createBattleBtn.addEventListener("click", async () => {
  if (!currentUserData) return;
  if (isInBattle) return alert("Finish your current battle first.");
  const wager = parseInt(battleWagerInput.value);
  const casesCount = parseInt(battleCasesInput.value);
  const caseType = battleCaseTypeSelect.value;

  if (!wager || wager < 1 || !casesCount || casesCount < 1) {
    return alert("Enter valid wager and cases count.");
  }
  const totalCost = wager * casesCount;
  if (totalCost > currentUserData.balance) return alert("Insufficient balance.");

  currentUserData.balance -= totalCost;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  const newBattle = {
    hostUid: currentUser.uid,
    hostUsername: currentUserData.username,
    wager,
    cases: casesCount,
    caseType,
    status: "waiting",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection("caseBattles").add(newBattle);

  alert("Battle created! Waiting for opponent to join.");
  isInBattle = true;
  battleData = { ...newBattle, id: docRef.id, yourRole: "host", yourTotalWin: 0, opponentTotalWin: 0 };

  await fetchActiveBattles();
  showGameTab("caseBattle");
});

joinBattleBtn.addEventListener("click", async () => {
  if (!currentUserData) return;
  if (!selectedBattleId) return alert("Select a battle to join.");
  if (isInBattle) return alert("Finish your current battle first.");

  const battleRef = db.collection("caseBattles").doc(selectedBattleId);
  const battleDoc = await battleRef.get();

  if (!battleDoc.exists) {
    alert("Battle no longer exists.");
    await fetchActiveBattles();
    return;
  }

  const battle = battleDoc.data();

  const totalCost = battle.wager * battle.cases;
  if (totalCost > currentUserData.balance) return alert("Insufficient balance to join.");

  currentUserData.balance -= totalCost;
  await saveUserData(currentUserData);
  updateBalances(currentUserData);

  await battleRef.update({
    opponentUid: currentUser.uid,
    opponentUsername: currentUserData.username,
    status: "active",
    startedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  isInBattle = true;
  battleData = { ...battle, id: selectedBattleId, yourRole: "opponent", yourTotalWin: 0, opponentTotalWin: 0 };

  alert("Joined battle! Get ready to open cases.");
  showGameTab("caseBattle");

  startPvPCaseBattle();
});

async function animateCaseSpinner(track, items) {
  track.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "spinner-item";
    div.textContent = item + " LUTT";
    track.appendChild(div);
  });

  return new Promise(resolve => {
    let position = 0;
    const itemWidth = 90;
    const spins = items.length * 10;

    function step() {
      position += 20;
      track.style.transform = `translateX(${-position}px)`;
      if (position < itemWidth * spins) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    step();
  });
}

async function startPvPCaseBattle() {
  if (!battleData) return;
  battleSpinnerContainer.classList.remove("hidden");
  battleResult.innerText = "";

  const prizePool = casePrizes[battleData.caseType];
  const casesToOpen = battleData.cases;
  const wager = battleData.wager;

  const playerWins = [];
  const opponentWins = [];

  for (let i = 0; i < casesToOpen; i++) {
    const playerPrize = prizePool[Math.floor(Math.random() * prizePool.length)];
    const opponentPrize = prizePool[Math.floor(Math.random() * prizePool.length)];

    playerWins.push(playerPrize);
    opponentWins.push(opponentPrize);
  }

  await animateCaseSpinner(playerSpinnerTrack, playerWins);
  await animateCaseSpinner(opponentSpinnerTrack, opponentWins);

  const playerTotal = playerWins.reduce((a, b) => a + b, 0);
  const opponentTotal = opponentWins.reduce((a, b) => a + b, 0);

  battleData.yourTotalWin = playerTotal;
  battleData.opponentTotalWin = opponentTotal;

  let resultText = `You won ${playerTotal} LUTT. Opponent won ${opponentTotal} LUTT. `;

  if (playerTotal > opponentTotal) {
    resultText += "You win the battle!";
    const pot = wager * casesToOpen * 2;
    currentUserData.balance += pot;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
  } else if (playerTotal === opponentTotal) {
    resultText += "It's a tie! Bets returned.";
    const refund = wager * casesToOpen;
    currentUserData.balance += refund;
    await saveUserData(currentUserData);
    updateBalances(currentUserData);
  } else {
    resultText += "You lose!";
  }

  battleResult.innerText = resultText;

  await db.collection("caseBattles").doc(battleData.id).update({
    status: "finished",
    winnerUid: playerTotal > opponentTotal ? currentUser.uid : null,
    finishedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  isInBattle = false;
  battleData = null;
  fetchActiveBattles();
  updateLeaderboard();
}

// --- Initial calls ---
fetchActiveBattles();
