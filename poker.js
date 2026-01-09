// Firebase config (SAME AS YOUR MAIN SITE)
const firebaseConfig = {
  apiKey: "AIzaSyD6CNjm2upOaD4BP3f7MBUPh0u1IDkHjh4",
  authDomain: "lutt-casinos.firebaseapp.com",
  projectId: "lutt-casinos",
  storageBucket: "lutt-casinos.firebasestorage.app",
  messagingSenderId: "1061450870530",
  appId: "1:1061450870530:web:27cd82b5e433cc6320dc1b"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// UI
const lobby = document.getElementById("lobby");
const table = document.getElementById("table");
const roomList = document.getElementById("room-list");
const roomNameInput = document.getElementById("room-name");
const createRoomBtn = document.getElementById("create-room");

const tableName = document.getElementById("table-name");
const playersDiv = document.getElementById("players");
const communityDiv = document.getElementById("community-cards");
const potDiv = document.getElementById("pot");

const betInput = document.getElementById("bet-amount");
const checkBtn = document.getElementById("check");
const callBtn = document.getElementById("call");
const raiseBtn = document.getElementById("raise");
const foldBtn = document.getElementById("fold");
const messageDiv = document.getElementById("message");

let currentUser;
let roomId = new URLSearchParams(window.location.search).get("room");
let roomRef = null;

// AUTH
auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("Login required");
    window.location.href = "index.html";
    return;
  }
  currentUser = user;

  if (roomId) {
    enterRoom(roomId);
  } else {
    loadLobby();
  }
});

// LOBBY
function loadLobby() {
  lobby.classList.remove("hidden");
  table.classList.add("hidden");

  db.collection("pokerRooms")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      roomList.innerHTML = "";
      snapshot.forEach(doc => {
        const room = doc.data();
        const btn = document.createElement("button");
        btn.textContent = `${room.name} (${room.players.length}/8)`;
        btn.onclick = () => {
          window.location.href = `poker.html?room=${doc.id}`;
        };
        roomList.appendChild(btn);
      });
    });
}

createRoomBtn.onclick = async () => {
  const name = roomNameInput.value.trim();
  if (!name) return alert("Enter room name");

  const ref = await db.collection("pokerRooms").add({
    name,
    players: [],
    pot: 0,
    communityCards: [],
    phase: "waiting",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  window.location.href = `poker.html?room=${ref.id}`;
};

// ROOM
async function enterRoom(id) {
  lobby.classList.add("hidden");
  table.classList.remove("hidden");

  roomRef = db.collection("pokerRooms").doc(id);

  const userDoc = await db.collection("users").doc(currentUser.uid).get();
  const username = userDoc.data().username;

  await roomRef.update({
    players: firebase.firestore.FieldValue.arrayUnion({
      uid: currentUser.uid,
      username,
      bet: 0,
      folded: false
    })
  });

  roomRef.onSnapshot(doc => {
    const data = doc.data();
    renderRoom(data);
  });
}

function renderRoom(room) {
  tableName.textContent = room.name;
  potDiv.textContent = `Pot: ${room.pot} LUTT`;
  communityDiv.textContent = room.communityCards.join(" ");

  playersDiv.innerHTML = "";
  room.players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `<strong>${p.username}</strong><br>Bet: ${p.bet}<br>${p.folded ? "❌ Folded" : ""}`;
    playersDiv.appendChild(div);
  });
}

// BASIC ACTIONS (placeholder logic)
raiseBtn.onclick = async () => {
  const amount = Number(betInput.value);
  if (!amount || amount <= 0) return;

  await roomRef.update({
    pot: firebase.firestore.FieldValue.increment(amount)
  });
};

foldBtn.onclick = async () => {
  const snap = await roomRef.get();
  const players = snap.data().players.map(p =>
    p.uid === currentUser.uid ? { ...p, folded: true } : p
  );
  await roomRef.update({ players });
};
