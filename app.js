const scoreline = document.getElementById('scoreline');
const status = document.getElementById('status');
const liveToggle = document.getElementById('toggle-live');
const pollResult = document.getElementById('poll-result');
const favoritesOutput = document.getElementById('favorites-output');
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const scoreStates = [
  { score: 'IND 147/3 (15.2)', text: 'India need 29 runs in 28 balls' },
  { score: 'IND 153/3 (16.0)', text: 'India need 23 runs in 24 balls' },
  { score: 'IND 165/4 (17.1)', text: 'India need 11 runs in 17 balls' },
  { score: 'IND 172/4 (18.0)', text: 'India need 4 runs in 12 balls' },
  { score: 'IND 176/4 (18.3)', text: 'India win by 6 wickets!' }
];

let live = true;
let idx = 0;
let votes = { India: 0, Australia: 0 };
const favorites = new Set();

function renderScore() {
  const state = scoreStates[idx % scoreStates.length];
  scoreline.textContent = state.score;
  status.textContent = state.text;
  idx += 1;
}

const liveInterval = setInterval(() => {
  if (live) renderScore();
}, 2500);

liveToggle.addEventListener('click', () => {
  live = !live;
  liveToggle.textContent = live ? 'Pause Live' : 'Resume Live';
});

document.querySelectorAll('.vote').forEach((btn) => {
  btn.addEventListener('click', () => {
    votes[btn.dataset.team] += 1;
    const total = votes.India + votes.Australia;
    const indiaPct = total ? Math.round((votes.India / total) * 100) : 0;
    const ausPct = total ? 100 - indiaPct : 0;
    pollResult.textContent = `India ${indiaPct}% • Australia ${ausPct}% (${total} votes)`;
  });
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');
    const name = chip.dataset.name;
    if (favorites.has(name)) favorites.delete(name);
    else favorites.add(name);
    favoritesOutput.textContent = favorites.size
      ? `Following: ${Array.from(favorites).join(', ')}`
      : 'No favorites selected.';
  });
});

function addChatMessage(user, text) {
  const p = document.createElement('p');
  p.className = 'chat-message';
  p.innerHTML = `<strong>${user}:</strong> ${text}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

addChatMessage('Ayesha', 'What a finish this is turning into!');
addChatMessage('Ravi', 'Need one big over and India seals it.');

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addChatMessage('You', text);
  chatInput.value = '';

  const replies = ['Agreed!', 'Huge moment coming up.', 'This is why I love live chat!'];
  setTimeout(() => {
    addChatMessage('CricPulse Bot', replies[Math.floor(Math.random() * replies.length)]);
  }, 500);
});

window.addEventListener('beforeunload', () => clearInterval(liveInterval));
