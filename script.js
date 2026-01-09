let players = JSON.parse(localStorage.getItem("players")) || {};
let user = null;
const today = new Date().toDateString();

function login() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Enter username");

  if (!players[name]) {
    players[name] = {
      balance: 1000,
      lastLogin: "",
      streak: 0,
      lastCase: ""
    };
  }
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
  updateUI();
}

function updateUI() {
  document.getElementById("balance").innerText = players[user].balance;
  document.getElementById("streak").innerText = players[user].streak;
  updateLeaderboard();
}

function save() {
  localStorage.setItem("players", JSON.stringify(players));
}

/* 🎁 DAILY LOGIN */
function claimDaily() {
  const p = players[user];
  if (p.lastLogin === today)
    return msg("dailyMsg", "Already claimed today!");

  if (new Date(p.lastLogin).getTime() + 86400000 >= Date.now())
    p.streak++;
  else
    p.streak = 1;

  const reward = 200 + p.streak * 50;
  p.balance += reward;
  p.lastLogin = today;

  save();
  updateUI();
  msg("dailyMsg", `+${reward} LUTT (Streak x${p.streak})`);
}

/* 📦 CASE OPENING */
function openCase() {
  const p = players[user];
  if (p.lastCase === today)
    return msg("caseResult", "Case already opened today!");

  const rewards = [50, 100, 200, 500, 1000];
  const reward = rewards[Math.floor(Math.random() * rewards.length)];

  p.balance += reward;
  p.lastCase = today;

  save();
  updateUI();
  msg("caseResult", `📦 You won ${reward} LUTT!`);
}

/* ⚔️ CASE BATTLE */
function caseBattle() {
  const bet = Number(document.getElementById("battleBet").value);
  const p = players[user];
  if (bet <= 0 || bet > p.balance) return alert("Invalid bet");

  const you = Math.floor(Math.random() * 1000);
  const bot = Math.floor(Math.random() * 1000);

  if (you > bot) {
    p.balance += bet;
    msg("battleResult", `You win! (${you} vs ${bot})`);
  } else {
    p.balance -= bet;
    msg("battleResult", `You lose! (${you} vs ${bot})`);
  }

  save();
  updateUI();
}

/* 🏆 LEADERBOARD */
function updateLeaderboard() {
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";
  Object.entries(players)
    .sort((a,b)=>b[1].balance-a[1].balance)
    .forEach(([n,d])=>{
      const li=document.createElement("li");
      li.textContent=`${n}: ${d.balance} LUTT`;
      list.appendChild(li);
    });
}

function msg(id, text) {
  document.getElementById(id).innerText = text;
}
