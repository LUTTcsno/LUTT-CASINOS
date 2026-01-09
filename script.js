document.addEventListener("DOMContentLoaded", () => {

  const auth = firebase.auth();
  const db = firebase.firestore();

  // DOM elements
  const loginDiv = document.getElementById("login");
  const userInfoDiv = document.getElementById("userInfo");
  const nav = document.getElementById("nav");
  const gameTabs = document.querySelectorAll(".gameTab");
  const userNameDisplay = document.getElementById("userNameDisplay");
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

  // Blackjack elements
  const blackjackPlayBtn = document.getElementById("blackjackPlayBtn");
  const dealerCardsDiv = document.getElementById("dealerCards");
  const playerCardsDiv = document.getElementById("playerCards");
  const hitBtn = document.getElementById("hitBtn");
  const standBtn = document.getElementById("standBtn");
  const doubleBtn = document.getElementById("doubleBtn");
  const blackjackResult = document.getElementById("blackjackResult");

  let currentUser = null;
  let currentUserData = null;

  // Prize list
  const prizes = [100, 200, 300, 500, 1000];

  // --- Helper functions ---

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
    blackjackResult.innerText = "";
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
    userNameDisplay.innerText = data.username || currentUser.email;
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
      // Grab username from input on signup or fallback to email prefix
      const usernameInput = document.getElementById("username");
      const username = usernameInput ? usernameInput.value.trim() : currentUser.email.split("@")[0];

      await userDoc.set({
        balance: 1000,
        streak: 0,
        lastLogin: null,
        lastCase: null,
        email: currentUser.email || "",
        username: username
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
      const displayName = user.username || user.email || "Anonymous";
      const li = document.createElement("li");
      li.textContent = `${displayName} - ${user.balance} LUTT`;
      leaderboardList.appendChild(li);
    });
  }

  // --- Auth event handlers ---

  signUpBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const username = document.getElementById("username").value.trim();

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
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      currentUser = userCredential.user;

      currentUserData = await loadUserData();
      showGame(currentUserData);
      updateLeaderboard();
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
      updateLeaderboard();
    } else {
      currentUser = null;
      currentUserData = null;
      showLogin();
    }
  });

  // --- Navigation buttons ---
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

    balanceSpan.innerText = currentUserData.balance;
    streakSpan.innerText = currentUserData.streak;
    dailyMsg.innerText = `You received 200 LUTT! Streak: ${currentUserData.streak} days.`;
    updateLeaderboard();
  });

  // --- Case Open ---

  function createSpinnerItems(track, items) {
    track.innerHTML = "";
    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "spinner-item";
      div.textContent = item + " LUTT";
      track.appendChild(div);
    });
  }

  caseBtn.addEventListener("click", async () => {
    if (!currentUserData) return;

    if (currentUserData.balance < 100) {
      caseResult.innerText = "You need at least 100 LUTT to open a case.";
      return;
    }

    currentUserData.balance -= 100;
    await saveUserData(currentUserData);
    balanceSpan.innerText = currentUserData.balance;
    caseResult.innerText = "";
    caseSpinner.classList.remove("hidden");

    // Create a spinner with repeated prizes for smooth animation
    const spins = 30; // total items to scroll through
    let spinnerItems = [];
    for (let i = 0; i < spins; i++) {
      spinnerItems.push(prizes[Math.floor(Math.random() * prizes.length)]);
    }
    createSpinnerItems(spinnerTrack, spinnerItems);

    // Animate spinner
    let position = 0;
    const itemWidth = 85; // approx width + margin

    function spinAnimation() {
      position += 20;
      spinnerTrack.style.transform = `translateX(${-position}px)`;
      if (position < itemWidth * spins) {
        requestAnimationFrame(spinAnimation);
      } else {
        spinnerTrack.style.transform = `translateX(${-position}px)`;
        finishSpin();
      }
    }

    function finishSpin() {
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      caseResult.innerText = `You won ${prize} LUTT!`;
      currentUserData.balance += prize;
      balanceSpan.innerText = currentUserData.balance;
      saveUserData(currentUserData);
      caseSpinner.classList.add("hidden");
      updateLeaderboard();
    }

    spinAnimation();
  });

  // --- Blackjack ---

  let deck = [];
  let playerHand = [];
  let dealerHand = [];
  let blackjackBet = 100;
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
    hitBtn.disabled = false;
    standBtn.disabled = false;
    doubleBtn.disabled = false;
  }

  blackjackPlayBtn.addEventListener("click", async () => {
    if (!currentUserData || currentUserData.balance < blackjackBet) {
      alert("Not enough balance");
      return;
    }
    resetBlackjack();

    currentUserData.balance -= blackjackBet;
    balanceSpan.innerText = currentUserData.balance;
    await saveUserData(currentUserData);

    await dealCard(playerHand);
    await dealCard(dealerHand);
    await dealCard(playerHand);
    await dealCard(dealerHand);

    playerTurn = true;

    if (handValue(playerHand) === 21) {
      blackjackResult.textContent = "Blackjack! You win!";
      currentUserData.balance += blackjackBet * 2.5;
      balanceSpan.innerText = currentUserData.balance;
      await saveUserData(currentUserData);
      hitBtn.disabled = true;
      standBtn.disabled = true;
      doubleBtn.disabled = true;
      playerTurn = false;
    } else {
      hitBtn.disabled = false;
      standBtn.disabled = false;
      doubleBtn.disabled = false;
    }
  });

  hitBtn.addEventListener("click", async () => {
    if (!playerTurn) return;
    await dealCard(playerHand);
    if (handValue(playerHand) > 21) {
      blackjackResult.textContent = "Bust! You lose.";
      hitBtn.disabled = true;
      standBtn.disabled = true;
      doubleBtn.disabled = true;
      playerTurn = false;
    }
  });

  standBtn.addEventListener("click", async () => {
    if (!playerTurn) return;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    playerTurn = false;
    await dealerPlay();

    const playerVal = handValue(playerHand);
    const dealerVal = handValue(dealerHand);

    if (dealerVal > 21 || playerVal > dealerVal) {
      blackjackResult.textContent = "You win!";
      currentUserData.balance += blackjackBet * 2;
    } else if (dealerVal === playerVal) {
      blackjackResult.textContent = "Push (tie)";
      currentUserData.balance += blackjackBet;
    } else {
      blackjackResult.textContent = "You lose!";
    }
    balanceSpan.innerText = currentUserData.balance;
    await saveUserData(currentUserData);
  });

  doubleBtn.addEventListener("click", async () => {
    if (!playerTurn || currentUserData.balance < blackjackBet) return alert("Insufficient balance to double");
    currentUserData.balance -= blackjackBet;
    blackjackBet *= 2;
    balanceSpan.innerText = currentUserData.balance;
    await saveUserData(currentUserData);

    await dealCard(playerHand);
    if (handValue(playerHand) > 21) {
      blackjackResult.textContent = "Bust! You lose.";
    } else {
      await standBtn.click();
    }
    hitBtn.disabled = true;
    standBtn.disabled = true;
    doubleBtn.disabled = true;
    playerTurn = false;
  });

  // --- Case Battle ---

  // Helper to create spinner items for case battle
  function createBattleSpinnerItems(track, items) {
    track.innerHTML = "";
    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "spinner-item";
      div.textContent = item + " LUTT";
      track.appendChild(div);
    });
  }

  battleBtn.addEventListener("click", async () => {
    if (!currentUserData) return;

    const bet = parseInt(battleBetInput.value);
    if (!bet || bet < 1) {
      battleResult.innerText = "Please enter a valid bet amount.";
      return;
    }
    if (currentUserData.balance < bet) {
      battleResult.innerText = "Insufficient balance.";
      return;
    }

    currentUserData.balance -= bet;
    await saveUserData(currentUserData);
    balanceSpan.innerText = currentUserData.balance;

    battleResult.innerText = "";
    battleSpinnerContainer.classList.remove("hidden");

    // Create spinner sequences
    const spins = 40;
    const playerItems = [];
    const botItems = [];
    for (let i = 0; i < spins; i++) {
      playerItems.push(prizes[Math.floor(Math.random() * prizes.length)]);
      botItems.push(prizes[Math.floor(Math.random() * prizes.length)]);
    }

    createBattleSpinnerItems(playerSpinnerTrack, playerItems);
    createBattleSpinnerItems(botSpinnerTrack, botItems);

    // Animate spinners asynchronously
    let playerPos = 0;
    let botPos = 0;
    const itemWidth = 85;

    function animateSpinner(track, position, targetSpin, callback) {
      let count = 0;
      function step() {
        position += 20;
        track.style.transform = `translateX(${-position}px)`;
        count++;
        if (count < targetSpin) {
          requestAnimationFrame(step);
        } else {
          callback(position);
        }
      }
      step();
    }

    // Start animations and then determine winner
    animateSpinner(playerSpinnerTrack, playerPos, 60, (finalPlayerPos) => {
      animateSpinner(botSpinnerTrack, botPos, 80, (finalBotPos) => {
        const playerIndex = Math.floor(finalPlayerPos / itemWidth) % prizes.length;
        const botIndex = Math.floor(finalBotPos / itemWidth) % prizes.length;

        const playerPrize = playerItems[playerIndex];
        const botPrize = botItems[botIndex];

        let resultText = `You won ${playerPrize} LUTT. Bot won ${botPrize} LUTT. `;

        if (playerPrize > botPrize) {
          resultText += "You win the battle!";
          currentUserData.balance += bet + playerPrize * 2;
        } else if (botPrize > playerPrize) {
          resultText += "Bot wins!";
        } else {
          resultText += "It's a tie!";
          currentUserData.balance += bet;
        }

        battleResult.innerText = resultText;
        balanceSpan.innerText = currentUserData.balance;
        saveUserData(currentUserData);
        updateLeaderboard();
      });
    });

  });

});
