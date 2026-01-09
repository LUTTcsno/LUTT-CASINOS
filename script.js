const loginDiv = document.getElementById("login");
const gameDiv = document.getElementById("game");
const balanceSpan = document.getElementById("balance");
const streakSpan = document.getElementById("streak");
const dailyMsg = document.getElementById("dailyMsg");

let currentUser = null;

function showLogin() {
  loginDiv.classList.remove("hidden");
  gameDiv.classList.add("hidden");
}

function showGame() {
  loginDiv.classList.add("hidden");
  gameDiv.classList.remove("hidden");
}

function updateUI(data) {
  balanceSpan.innerText = data.balance;
  streakSpan.innerText = data.streak;
}

function msg(id, text) {
  document.getElementById(id).innerText = text;
}

async function handleSignUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.createUserWithEmailAndPassword(email, password);
    initUserData();
  } catch (e) {
    alert("Sign Up Error: " + e.message);
  }
}

async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    alert("Login Error: " + e.message);
  }
}

function logout() {
  auth.signOut();
}

// Initialize user data in Firestore if new
async function initUserData() {
  const uid = auth.currentUser.uid;
  const userDoc = db.collection("users").doc(uid);
  const doc = await userDoc.get();

  if (!doc.exists) {
    await userDoc.set({
      balance: 1000,
      streak: 0,
      lastLogin: null,
      lastCase: null,
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

// Listen for auth state changes (login/logout)
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    const data = await loadUserData();
    updateUI(data);
    showGame();
  } else {
    currentUser = null;
    showLogin();
  }
});

// Example: claim daily bonus function (you can build more later)
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
  updateUI(data);
  msg("dailyMsg", `+${reward} LUTT (Streak x${data.streak})`);
}
