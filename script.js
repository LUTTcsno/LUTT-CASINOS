// Wait for DOM to load before attaching listeners
document.addEventListener("DOMContentLoaded", () => {

  // Firebase references
  const auth = firebase.auth();
  const db = firebase.firestore();

  // DOM Elements
  const loginDiv = document.getElementById("login");
  const userInfoDiv = document.getElementById("userInfo");
  const nav = document.getElementById("nav");
  const gameTabs = document.querySelectorAll(".gameTab");
  const userEmailSpan = document.getElementById("userEmail");
  const balanceSpan = document.getElementById("balance");
  const streakSpan = document.getElementById("streak");

  // Buttons and UI
  const signUpBtn = document.getElementById("signUpBtn");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const dailyBonusBtn = document.getElementById("dailyBonusBtn");
  const caseBtn = document.getElementById("caseBtn");
  const battleBtn = document.getElementById("battleBtn");
  const battleBetInput = document.getElementById("battleBet");

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

  // Utility to show/hide game tabs
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

  // Clear all game messages
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

  // Show main game UI
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

  // Initialize user data if new
  async function initUserData() {
    const uid = currentUser.uid;
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

  // Load user data from Firestore
  async function loadUserData() {
    const uid = currentUser.uid;
    const userDoc = db.collection("users").doc(uid);
    const doc = await userDoc.get();
    if (doc.exists) {
      return doc.data();
    } else {
      await initUserData();
      return loadUserData();
    }
  }

  // Save user data to Firestore
  async function saveUserData(data) {
    const uid = currentUser.uid;
    const userDoc = db.collection("users").doc(uid);
    await userDoc.set(data);
  }

  // Update leaderboard UI with top 10 users by balance
  async function updateLeaderboard() {
    leaderboardList.innerHTML = "Loading...";
    const usersSnapshot = await db.collection("users")
      .orderBy("balance", "desc")
      .limit(10)
      .get();

    leaderboardList.innerHTML = "";
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      const li = document.createElement("li");
      li.textContent = `${user.email ? user.email : "Anonymous"} - ${user.balance} LUTT`;
      leaderboardList.appendChild(li);
    });
  }

  // --- Auth Event Listeners ---

  signUpBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      currentUser = auth.currentUser;
      await initUserData();
      const data = await loadUserData();
      showGame(data);
      updateLeaderboard();
    } catch (e) {
      alert("Sign Up Error: " + e.message);
    }
  });

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      currentUser = auth.currentUser;
      const data = await loadUserData();
      showGame(data);
      updateLeaderboard();
    } catch (e) {
      alert("Login Error: " + e.message);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    currentUser = null;
    showLogin();
  });

  // Firebase Auth state observer (handle page refresh)
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

  dailyBonusBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");

    const userDoc = db.collection("users").doc(currentUser.uid);
    const doc = await userDoc.get();
    let data = doc.data();

    const today = new Date().toDateString();

    if (data.lastLogin === today) {
      dailyMsg.innerText = "Already claimed today!";
      return;
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
    balanceSpan.innerText = data.balance;
    streakSpan.innerText = data.streak;
    dailyMsg.innerText = `+${reward} LUTT (Streak x${data.st
