let players = JSON.parse(localStorage.getItem("players")) || {};
let user = null;

function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Enter username");

  if (!players[name]) players[name] = { balance: 1000 };
  user = name;
  save();
  showGame();
}

function logout() {
  user = null;
  document.getElementById("game").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}

function showGame() {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  update();
}

function update() {
  document.getElementById("balance").innerText = players[user].balance;
  updateLeaderboard();
}

function save() {
  localStorage.setItem("players", JSON.stringify(players));
}

function coinFlip() {
  betGame("betFlip", Math.random() < 0.5, 1, "flipResult");
}

function dice() {
  betGame("betDice", Math.ceil(Math.random()*6) > 3, 1, "diceResult");
}

function roulette() {
  const pick = Number(document.getElementById("rouletteNum").value);
  const bet = Number(document.getElementById("betRoulette").value);
  if (bet <= 0 || bet > players[user].balance) return alert("Invalid bet");

  const spin = Math.floor(Math.random()*10);
  if (spin === pick) {
    players[user].balance += bet * 5;
    document.getElementById("rouletteResult").innerText = "WIN! Number: " + spin;
  } else {
    players[user].balance -= bet;
    document.getElementById("rouletteResult").innerText = "Lost. Number: " + spin;
  }
  save(); update();
}

function blackjack() {
  const bet = Number(document.getElementById("betBJ").value);
  if (bet <= 0 || bet > players[user].balance) return alert("Invalid bet");

  const player = Math.floor(Math.random()*10)+12;
  const dealer = Math.floor(Math.random()*10)+12;

  if (player > dealer && player <= 21 || dealer > 21) {
    players[user].balance += bet;
    document.getElementById("bjResult").innerText = "You win!";
  } else {
    players[user].balance -= bet;
    document.getElementById("bjResult").innerText = "You lose!";
  }
  save(); update();
}

function betGame(inputId, win, multiplier, resultId) {
  const bet = Number(document.getElementById(inputId).value);
  if (bet <= 0 || bet > players[user].balance) return alert("Invalid bet");

  players[user].balance += win ? bet * multiplier : -bet;
  document.getElementById(resultId).innerText = win ? "You won!" : "You lost!";
  save(); update();
}

function updateLeaderboard() {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";
  Object.entries(players)
    .sort((a,b)=>b[1].balance-a[1].balance)
    .forEach(([name,data])=>{
      const li=document.createElement("li");
      li.textContent=`${name}: ${data.balance} LUTT`;
      list.appendChild(li);
    });
}
