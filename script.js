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
    dailyMsg.innerText = `+${reward} LUTT (Streak x${data.streak})`;
  });

  // --- Case Open ---

  caseBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");

    const userDoc = db.collection("users").doc(currentUser.uid);
    const doc = await userDoc.get();
    let data = doc.data();

    const today = new Date().toDateString();
    if (data.lastCase === today) {
      caseResult.innerText = "Case already opened today.";
      return;
    }

    // Animate case opening
    caseResult.innerText = "";
    const caseAnimation = document.getElementById("caseAnimation");
    caseAnimation.classList.remove("hidden");

    setTimeout(async () => {
      caseAnimation.classList.add("hidden");

      // Random reward from case
      const rewards = [100, 200, 300, 500, 1000];
      const reward = rewards[Math.floor(Math.random() * rewards.length)];
      data.balance += reward;
      data.lastCase = today;
      await saveUserData(data);
      balanceSpan.innerText = data.balance;
      caseResult.innerText = `You got +${reward} LUTT from the case!`;
    }, 1800);
  });

  // --- Case Battle ---

  battleBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");

    const bet = parseInt(battleBetInput.value);
    if (isNaN(bet) || bet <= 0) return alert("Enter a valid bet amount");
    if (bet > currentUserData.balance) return alert("Insufficient balance");

    battleResult.innerText = "";
    battleAnimation.classList.remove("hidden");

    setTimeout(async () => {
      battleAnimation.classList.add("hidden");

      // Simple battle logic: 50% win chance
      const win = Math.random() < 0.5;
      if (win) {
        currentUserData.balance += bet;
        battleResult.innerText = `You won the battle! +${bet} LUTT`;
      } else {
        currentUserData.balance -= bet;
        battleResult.innerText = `You lost the battle! -${bet} LUTT`;
      }
      balanceSpan.innerText = currentUserData.balance;
      await saveUserData(currentUserData);
    }, 2000);
  });

  // --- Blackjack ---

  blackjackPlayBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");
    if (currentUserData.balance < 100) return alert("Not enough LUTT");

    currentUserData.balance -= 100;

    // Simple Blackjack: user always draws 2 random cards 1-11 sum, dealer 2 cards, compare sums
    function getCard() {
      return Math.floor(Math.random() * 11) + 1;
    }

    let playerCards = [getCard(), getCard()];
    let dealerCards = [getCard(), getCard()];
    let playerSum = playerCards.reduce((a, b) => a + b, 0);
    let dealerSum = dealerCards.reduce((a, b) => a + b, 0);

    blackjackCardsDiv.innerHTML = `
      <div class="cardVisual">You: ${playerCards.join(", ")}</div>
      <div class="cardVisual">Dealer: ${dealerCards.join(", ")}</div>
    `;

    let result = "";

    if (playerSum > 21) result = "Bust! You lose.";
    else if (dealerSum > 21) {
      result = "Dealer busts! You win 200 LUTT!";
      currentUserData.balance += 200;
    }
    else if (playerSum > dealerSum) {
      result = "You win 200 LUTT!";
      currentUserData.balance += 200;
    }
    else if (playerSum === dealerSum) {
      result = "Push! Bet returned.";
      currentUserData.balance += 100;
    }
    else result = "You lose!";

    balanceSpan.innerText = currentUserData.balance;
    blackjackResult.innerText = result;
    await saveUserData(currentUserData);
  });

  // --- Roulette ---

  rouletteSpinBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");
    if (currentUserData.balance < 50) return alert("Not enough LUTT");

    currentUserData.balance -= 50;

    // Roulette colors and numbers 0-36 (simplified)
    const numbers = [...Array(37).keys()]; // 0 to 36
    const winningNumber = numbers[Math.floor(Math.random() * numbers.length)];

    // Animate wheel spin
    rouletteWheelDiv.style.transition = "transform 4s ease-out";
    const rotationDegrees = 3600 + winningNumber * 10; // multiple spins + offset
    rouletteWheelDiv.style.transform = `rotate(${rotationDegrees}deg)`;

    setTimeout(async () => {
      rouletteWheelDiv.style.transition = "none";
      rouletteWheelDiv.style.transform = "rotate(0deg)";

      // Payouts: if even number win double, odd lose
      if (winningNumber !== 0 && winningNumber % 2 === 0) {
        currentUserData.balance += 100; // double bet
        rouletteResult.innerText = `Number ${winningNumber} - You win 100 LUTT!`;
      } else {
        rouletteResult.innerText = `Number ${winningNumber} - You lose!`;
      }
      balanceSpan.innerText = currentUserData.balance;
      await saveUserData(currentUserData);
    }, 4100);
  });

  // --- Poker (simplified) ---

  pokerPlayBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");
    if (currentUserData.balance < 150) return alert("Not enough LUTT");

    currentUserData.balance -= 150;

    // Simplified: 40% chance win
    const win = Math.random() < 0.4;
    if (win) {
      currentUserData.balance += 300;
      pokerResult.innerText = "You won 300 LUTT!";
    } else {
      pokerResult.innerText = "You lost 150 LUTT!";
    }

    balanceSpan.innerText = currentUserData.balance;
    await saveUserData(currentUserData);
  });

  // --- Baccarat (simplified) ---

  baccaratPlayBtn.addEventListener("click", async () => {
    if (!currentUser) return alert("Please log in");
    if (currentUserData.balance < 100) return alert("Not enough LUTT");

    currentUserData.balance -= 100;

    // Simplified: 45% chance win
    const win = Math.random() < 0.45;
    if (win) {
      currentUserData.balance += 190;
      baccaratResult.innerText = "You won 190 LUTT!";
    } else {
      baccaratResult.innerText = "You lost 100 LUTT!";
    }

    balanceSpan.innerText = currentUserData.balance;
    await saveUserData(currentUserData);
  });

  // --- Nav tab switching ---

  nav.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      showGameTab(btn.dataset.tab);
      if (btn.dataset.tab === "leaderboard") updateLeaderboard();
      clearGameMessages();
    });
  });

});
