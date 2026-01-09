document.addEventListener("DOMContentLoaded", () => {

  const auth = firebase.auth();
  const db = firebase.firestore();

  // DOM elements
  const loginDiv = document.getElementById("login");
  const userInfoDiv = document.getElementById("userInfo");
  const nav = document.getElementById("nav");
  const gameTabs = document.querySelectorAll(".gameTab");
  const userEmailSpan = document.getElementById("userEmail");
  const balanceSpan = document.getElementById("balance");
  const streakSpan = document.getElementById("streak");

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

  const caseSpinner = document.getElementById("caseSpinner");
  const spinnerTrack = document.getElementById("spinnerTrack");

  const playerSpinnerTrack = document.getElementById("playerSpinnerTrack");
  const botSpinnerTrack = document.getElementById("botSpinnerTrack");
  const battleSpinnerContainer = document.getElementById("battleSpinnerContainer");

  const leaderboardList = document.getElementById("leaderboardList");

  let currentUser = null;
  let currentUserData = null;

  // Prize list
  const prizes = [100, 200, 300, 500, 1000];

  function showGameTab(tabName) {
    gameTabs.forEach(tab => {
      if (tab.id === tabName) tab.classList.remove("hidden");
      else tab.classList.add("hidden");
    });
    clearGameMessages();
  }

  function clearGameMessages() {
    dailyMsg.innerText = "";
    caseResult.innerText = "";
    battleResult.innerText = "";
  }

  function showLogin() {
    loginDiv.classList.remove("hidden");
    userInfoDiv.classList.add("hidden");
    nav.classList.add("hidden");
    showGameTab(null);
  }

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

  async function initUserData() {
    const uid = currentUser.uid;
    const userDoc = db.collection("users").doc(uid);
    const doc = await userDoc.get();
    if (!doc.exists) {
      await userDoc.set({
        balance: 1000,
        streak: 0,
        lastLogin: null,
        lastCase: null,
        email: currentUser.email || ""
      });
    }
  }

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

  async function saveUserData(data) {
    const uid = currentUser.uid;
    const userDoc = db.collection("users").doc(uid);
    await userDoc.set(data);
  }

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
      li.textContent = `${user.email || "Anonymous"} - ${user.balance} LUTT`;
      leaderboardList.appendChild(li);
    });
  }

  // Sign Up
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

  // Login
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

  // Logout
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    currentUser = null;
    showLogin();
  });

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

  // Daily Bonus
  document.getElementById("dailyBonusBtn").addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");

    const userDoc = db.collection("users").doc(currentUser.uid);
    const doc = await userDoc.get();
    let
