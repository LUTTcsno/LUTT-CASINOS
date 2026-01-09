// Firebase config (same as your main site)
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

const TABLE_ID = "main-table";
let currentUser;
let tableRef = db.collection("pokerTables").doc(TABLE_ID);

auth.onAuthStateChanged(async user => {
  if (!user) {
    alert("Please log in first");
    window.location.href = "index.html";
    return;
  }
  currentUser = user;
  joinTable();
});

async function joinTable() {
  const userDoc = await db.collection("users").doc(currentUser.uid).get();
  const username = userDoc.data().username;

  const tableSnap = await tableRef.get();
  if (!tableSnap.exists) {
    await tableRef.set({
      players: [],
      pot: 0,
      currentTurn: null,
      communityCards: [],
      phase: "waiting"
    });
  }

  await tableRef.update({
    players: firebase.firestore.FieldValue.arrayUnion({
      uid: currentUser.uid,
      username,
      bet: 0,
      folded: false
    })
  });

  tableRef.onSnapshot(renderTable);
}

function renderTable(doc) {
  const data = doc.data();
  document.getElementById("pot-display").textContent = `Pot: ${data.pot} LUTT`;

  const playersDiv = document.getElementById("players");
  playersDiv.innerHTML = "";

  data.players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player";
    div.innerHTML = `<strong>${p.username}</strong><br>Bet: ${p.bet}<br>${p.folded ? "❌ Folded" : ""}`;
    playersDiv.appendChild(div);
  });

  document.getElementById("community-cards").textContent =
    data.communityCards.join(" ");
}
