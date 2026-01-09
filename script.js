// Cached DOM elements
const loginDiv = document.getElementById("login");
const userInfoDiv = document.getElementById("userInfo");
const nav = document.getElementById("nav");
const gameTabs = document.querySelectorAll(".gameTab");
const userEmailSpan = document.getElementById("userEmail");
const balanceSpan = document.getElementById("balance");
const streakSpan = document.getElementById("streak");

// Buttons and interactive elements
const signUpBtn = document.getElementById("signUpBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const dailyBonusBtn = document.getElementById("dailyBonusBtn");
const caseBtn = document.getElementById("caseBtn");
const battleBtn = document.getElementById("battleBtn");
const battleBetInput = document.getElementById("battleBet");

// Game result areas
const dailyMsg = document.getElementById("dailyMsg");
const caseResult = document.getElementById("caseResult");
const battleResult = document.getElementById("battleResult");
const battleAnimation = document.getElementById("battleAnimation");

const blackjackPlayBtn = document.getElementById("blackjackPlayBtn");
const blackjackResult = document.getElementById("blackjackResult");
const blackjackCardsDiv = document.getElementById("blackjackCards");

const rouletteSpinBtn = document.getElementById("rouletteSpinBtn");
const rouletteResult = document.getElementById("rouletteResult");
const rouletteWheelDiv = document.getElementById("rouletteWheel");

const pokerPlayBtn = document.getElementById("pokerPlayBtn");
const pokerResult = document.getElementById("pokerResult");

const baccaratPlayBtn = document.getElementById("baccaratPlayBtn");
const baccaratResult = document.getElementById("baccaratResult");

const leaderboardList = document.getElementById("leaderboardList");

let currentUser = null;
let currentUserData = null;

// Show/hide tabs
function showGameTab(tabName) {
  gameTabs.forEach(tab => {
    if (tab.id === tabName) {
      tab.classList.remove("hidden");
    } else {
      tab.classList.add("hidden");
    }
  });
  clearGameMessages();
}

// Clear messages
function clearGameMessages() {
  dailyMsg.innerText = "";
  caseResult.innerText = "";
  battleResult.innerText = "";
  blackjackResult.innerText = "";
  rouletteResult.innerText = "";
  pokerResult.innerText = "";
  baccaratResult.innerText = "";
}

// Show login screen
function showLogin() {
  loginDiv.classList.remove("hidden");
  userInfoDiv.classList.add("hidden");
  nav.classList.add("hidden");
  showGameTab(null);
}

// Show game screen
function showGame(data) {
  loginDiv.classList.add("hidden");
  userInfoDiv.classList.remove("hidden");
  nav.classList.remove("hidden");
  userEmailSpan.innerText = currentUser.email;
  balanceSpan.innerText = data.balance;
  streakSpan.innerText = data.streak;
  currentUserData = data;
  showGameTab("dailyBonus");
}

// --- Firebase Auth handlers ---
signUpBtn.addEventListener("click", handleSignUp);
loginBtn.addEventListener("click", handleLogin);
logoutBtn.addEventListener("click", logout);
dailyBonusBtn.addEventListener("click", claimDaily);
caseBtn.addEventListener("click", openCase);
battleBtn.addEventListener("click", caseBattle);

blackjackPlayBtn.addEventListener("click", playBlackjack);
rouletteSpinBtn.addEventListener("click", playRoulette);
pokerPlayBtn.addEventListener("click", playPoker);
baccaratPlayBtn.addEventListener("click", playBaccarat);

document.querySelectorAll("nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    showGameTab(btn.dataset.tab);
    if(btn.dataset.tab === "leaderboard") updateLeaderboard();
  });
});

// Sign Up function
async function handleSignUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    await initUserData();
  } catch (e) {
    alert("Sign Up Error: " + e.message);
  }
}

// Login function
async function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    alert("Login Error: " + e.message);
  }
}

// Logout function
function logout() {
  auth.signOut();
}

// Initialize user data if new
async function initUserData() {
  const uid = auth.currentUser.uid;
  const userDoc = db.collection("users").doc(uid);
  const doc = await userDoc.get();

  if (!doc.exists) {
    await userDoc.set({
      balance: 1000,
      streak: 0,
      lastLogin: null,
      lastCase: null
    });
  }
}

// Load user data
async function loadUserData() {
  const uid = auth.currentUser.uid;
  const userDoc = db.collection("users").doc(uid);
  const doc = await userDoc.get();
  if (doc.exists) {
    return doc.data();
  } else {
    await initUserData();
    return loadUserData();
  }
}

// Save user data
async function saveUserData(data) {
  const uid = auth.currentUser.uid;
  const userDoc = db.collection("users").doc(uid);
  await userDoc.set(data);
}

// Listen for auth state changes
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const data = await loadUserData();
    showGame(data);
    updateLeaderboard();
  } else {
    currentUser = null;
    showLogin();
  }
});

// --- Daily Bonus ---
async function claimDaily() {
  if (!currentUser) return alert("Please log in");

  const userDoc = db.collection("users").doc(currentUser.uid);
  const doc = await userDoc.get();
  let data = doc.data();

  const today = new Date().toDateString();

  if (data.lastLogin === today) {
    return msg("dailyMsg", "Already claimed today!");
  }

  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (data.lastLogin === yesterday.toDateString()) {
    data.streak++;
  } else {
    data.streak = 1;
  }

  const reward = 200 + data.streak * 50;
  data.balance += reward;
  data.lastLogin = today;

  await saveUserData(data);
  showGame(data);
  msg("dailyMsg", `+${reward} LUTT (Streak x${data.streak})`);
}

// --- Case Open ---
async function openCase() {
  if (!currentUser) return alert("Please log in");

  const userDoc = db.collection("users").doc(currentUser.uid);
  const doc = await userDoc.get();
  let data = doc.data();

  const today = new Date().toDateString();

  if (data.lastCase === today) {
    return msg("caseResult", "You already opened your case today!");
  }

  const anim = document.getElementById("caseAnimation");
  anim.classList.remove("hidden");

  setTimeout(async () =>
