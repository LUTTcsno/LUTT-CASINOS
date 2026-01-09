body {
  background: #0d0d0d;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}

.card {
  background: #1f1f1f;
  padding: 15px;
  margin: 15px auto;
  width: 320px;
  border-radius: 10px;
  position: relative;
}

input {
  padding: 6px;
  margin: 5px;
  width: 80%;
}

button {
  background: #00ff99;
  border: none;
  padding: 8px 15px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

button:hover {
  transform: scale(1.05);
}

.hidden {
  display: none;
}

.disclaimer {
  font-size: 12px;
  opacity: 0.6;
}

.case-animation {
  margin: 10px auto;
  width: 200px;
  height: 100px;
  background: linear-gradient(90deg, #00ff99 20%, #007f55 50%, #00ff99 80%);
  border-radius: 10px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
