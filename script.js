const screens = [...document.querySelectorAll('.screen')];
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');

let selectedPlayers = 2;
let selectedGameId = 'one-card';
let pendingReadyAction = null;

const GAMES = [
  { id: 'one-card', icon: '🂡', name: 'One Card', min: 2, max: 6, status: 'PLAYABLE', description: 'Match suits or ranks, attack with Aces and Jokers, and be the first to empty your hand.' },
  { id: 'go-fish', icon: '🐟', name: 'Go Fish', min: 2, max: 6, status: 'COMING SOON', description: 'Ask your friends for ranks and collect matching sets.' },
  { id: 'bs', icon: '🤥', name: 'BS / Cheat', min: 3, max: 6, status: 'COMING SOON', description: 'Play cards face down, bluff, and call out your friends.' },
  { id: 'high-card', icon: '🃏', name: 'High Card Battle', min: 2, max: 6, status: 'COMING SOON', description: 'Pick secretly, reveal together, and let the highest card win.' }
];

function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo(0, 0);
}

function makePlayerButtons() {
  const box = document.getElementById('player-count-buttons');
  box.innerHTML = '';
  for (let n = 2; n <= 6; n++) {
    const b = document.createElement('button');
    b.className = 'player-choice';
    b.innerHTML = `${n}<span>Players</span>`;
    b.onclick = () => {
      selectedPlayers = n;
      renderGameList();
      showScreen('screen-games');
    };
    box.appendChild(b);
  }
}

function renderGameList() {
  document.getElementById('games-title').textContent = `Games for ${selectedPlayers} players`;
  document.getElementById('player-pill').textContent = `${selectedPlayers} Players`;
  const list = document.getElementById('game-list');
  list.innerHTML = '';
  GAMES.filter(g => selectedPlayers >= g.min && selectedPlayers <= g.max).forEach(game => {
    const btn = document.createElement('button');
    const disabled = game.status !== 'PLAYABLE';
    btn.className = `game-card${disabled ? ' disabled' : ''}`;
    btn.innerHTML = `
      <div class="game-card-icon">${game.icon}</div>
      <div><h3>${game.name}</h3><p>${game.description}</p></div>
      <span class="game-tag">${game.status}</span>`;
    if (!disabled) btn.onclick = () => openGameDetail(game.id);
    list.appendChild(btn);
  });
}

function openGameDetail(gameId) {
  selectedGameId = gameId;
  const game = GAMES.find(g => g.id === gameId);
  document.getElementById('detail-icon').textContent = game.icon;
  document.getElementById('detail-title').textContent = game.name;
  document.getElementById('detail-player-range').textContent = `${game.min}-${game.max} PLAYERS`;
  document.getElementById('detail-description').textContent = game.description;
  showScreen('screen-game-detail');
}

function oneCardRulesHtml() {
  return `
    <h2>How to Play: One Card</h2>
    <div class="rule-callout"><strong>Goal:</strong> Be the first player to get rid of every card in your hand.</div>
    <ol class="rules-list">
      <li>On your turn, play a card that matches the <strong>suit</strong> or <strong>rank</strong> of the top card.</li>
      <li>If you cannot play, tap the draw pile. You draw 1 card and your turn ends.</li>
      <li><strong>Ace (A):</strong> attacks the next player for <strong>+3 cards</strong>.</li>
      <li><strong>3:</strong> can defend an Ace attack only when the 3 has the <strong>same suit</strong> as that Ace. The attack is canceled.</li>
      <li><strong>Black Joker:</strong> attacks for <strong>+5</strong>. <strong>Red Joker:</strong> attacks for <strong>+7</strong>.</li>
      <li>A Joker attack can only be passed by playing <strong>another Joker</strong>.</li>
      <li>If you take a Black Joker attack, after drawing you choose <strong>♠ Spades</strong> or <strong>♣ Clubs</strong> for the next suit.</li>
      <li>If you take a Red Joker attack, after drawing you choose <strong>♥ Hearts</strong> or <strong>♦ Diamonds</strong> for the next suit.</li>
      <li>When you have one card left, the game shows <strong>ONE CARD!</strong></li>
    </ol>
    <p class="muted">This version uses the custom house rules you gave me.</p>`;
}

function openRules() {
  modalContent.innerHTML = oneCardRulesHtml();
  modal.classList.remove('hidden');
}
function closeModal() { modal.classList.add('hidden'); }

// ---------- ONE CARD GAME ----------
let state = null;
const SUITS = [
  { code: 'S', name: 'spades', symbol: '♠', color: 'black' },
  { code: 'H', name: 'hearts', symbol: '♥', color: 'red' },
  { code: 'D', name: 'diamonds', symbol: '♦', color: 'red' },
  { code: 'C', name: 'clubs', symbol: '♣', color: 'black' }
];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function cardImage(name) { return `./assets/cards/${name}.png`; }

function createDeck() {
  const cards = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ type:'normal', rank, suit:suit.code, suitName:suit.name, symbol:suit.symbol, color:suit.color, image:cardImage(`${rank}${suit.code}`) });
    }
  }
  cards.push({ type:'joker', rank:'JOKER', jokerColor:'black', color:'black', image:cardImage('black-joker') });
  cards.push({ type:'joker', rank:'JOKER', jokerColor:'red', color:'red', image:cardImage('red-joker') });
  return cards;
}

function shuffle(array) {
  for (let i=array.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

function startOneCard() {
  const deck = shuffle(createDeck());
  const players = Array.from({length:selectedPlayers}, (_,i)=>({ name:`Player ${i+1}`, hand:[] }));
  for (let r=0; r<7; r++) players.forEach(p => p.hand.push(deck.pop()));

  // Start with a normal non-Ace card so setup is easy to understand.
  let firstIndex = deck.findIndex(c => c.type === 'normal' && c.rank !== 'A');
  if (firstIndex < 0) firstIndex = 0;
  const [top] = deck.splice(firstIndex,1);

  state = {
    players,
    drawPile: deck,
    discard: [top],
    current: 0,
    chosenSuit: null,
    attack: null,
    turnLocked: false,
    winner: null
  };
  showPassScreen(0, 'start');
}

function showPassScreen(playerIndex, mode='turn') {
  const player = state.players[playerIndex];
  document.getElementById('pass-title').textContent = `Pass to ${player.name}`;
  document.getElementById('pass-message').textContent = `Everyone else look away. ${player.name}, tap the button when the phone is yours.`;
  document.getElementById('ready-button').textContent = `I'm ${player.name}`;
  pendingReadyAction = () => {
    showScreen('screen-one-card');
    renderOneCard();
  };
  showScreen('screen-pass');
}

function topCard() { return state.discard[state.discard.length - 1]; }
function currentPlayer() { return state.players[state.current]; }

function effectiveSuit() {
  if (state.chosenSuit) return state.chosenSuit;
  const top = topCard();
  return top.type === 'normal' ? top.suit : null;
}

function isPlayable(card) {
  const top = topCard();
  if (state.attack) {
    if (state.attack.kind === 'ace') {
      return card.type === 'normal' && card.rank === '3' && card.suit === state.attack.suit;
    }
    if (state.attack.kind === 'joker') return card.type === 'joker';
  }
  if (card.type === 'joker') return true;
  if (top.type === 'joker') return card.suit === effectiveSuit();
  return card.suit === effectiveSuit() || card.rank === top.rank;
}

function renderOneCard() {
  const player = currentPlayer();
  document.getElementById('turn-title').textContent = `${player.name}'s turn`;
  document.getElementById('top-card').src = topCard().image;
  document.getElementById('hand-count').textContent = `${player.hand.length} card${player.hand.length === 1 ? '' : 's'}`;
  document.getElementById('one-card-badge').classList.toggle('hidden', player.hand.length !== 1);

  const suitBadge = document.getElementById('chosen-suit-badge');
  if (state.chosenSuit) {
    const suit = SUITS.find(s => s.code === state.chosenSuit);
    suitBadge.textContent = suit.symbol;
    suitBadge.classList.remove('hidden');
  } else suitBadge.classList.add('hidden');

  const status = document.getElementById('game-message');
  status.classList.toggle('attack', !!state.attack);
  if (state.attack?.kind === 'ace') {
    const s = SUITS.find(x=>x.code===state.attack.suit);
    status.textContent = `⚠️ +3 attack! Defend with 3${s.symbol}, or draw 3.`;
  } else if (state.attack?.kind === 'joker') {
    status.textContent = `⚠️ Joker attack +${state.attack.amount}! Play another Joker or draw ${state.attack.amount}.`;
  } else if (state.chosenSuit) {
    const s = SUITS.find(x=>x.code===state.chosenSuit);
    status.textContent = `Chosen suit: ${s.symbol} ${s.name}. Match that suit.`;
  } else status.textContent = 'Match the suit or rank. Jokers can be played anytime.';

  const opponents = document.getElementById('opponent-strip');
  opponents.innerHTML = '';
  state.players.forEach((p,i) => {
    const chip = document.createElement('span');
    chip.className = `opponent-chip${i===state.current ? ' current' : ''}`;
    chip.textContent = `${p.name}: ${p.hand.length}`;
    opponents.appendChild(chip);
  });

  const hand = document.getElementById('player-hand');
  hand.innerHTML = '';
  player.hand.forEach((card,index) => {
    const playable = isPlayable(card) && !state.turnLocked;
    const btn = document.createElement('button');
    btn.className = `hand-card ${playable ? 'playable' : 'unplayable'}`;
    btn.disabled = !playable;
    btn.innerHTML = `<img src="${card.image}" alt="${cardLabel(card)}">`;
    btn.onclick = () => playCard(index);
    hand.appendChild(btn);
  });
  document.getElementById('draw-pile').disabled = state.turnLocked;
}

function cardLabel(card) {
  if (card.type === 'joker') return `${card.jokerColor} joker`;
  return `${card.rank} of ${card.suitName}`;
}

function playCard(handIndex) {
  if (state.turnLocked) return;
  const player = currentPlayer();
  const card = player.hand[handIndex];
  if (!isPlayable(card)) return;

  player.hand.splice(handIndex,1);
  state.discard.push(card);
  state.chosenSuit = null;

  if (state.attack?.kind === 'ace' && card.type === 'normal' && card.rank === '3') {
    state.attack = null; // matching-suit 3 blocks the Ace attack
  } else if (card.type === 'normal' && card.rank === 'A') {
    state.attack = { kind:'ace', amount:3, suit:card.suit };
  } else if (card.type === 'joker') {
    state.attack = { kind:'joker', amount: card.jokerColor === 'black' ? 5 : 7, color: card.jokerColor };
  } else {
    state.attack = null;
  }

  if (player.hand.length === 0) {
    state.winner = state.current;
    showWinner();
    return;
  }
  endTurn();
}

function refillDrawPileIfNeeded() {
  if (state.drawPile.length > 0) return;
  if (state.discard.length <= 1) return;
  const top = state.discard.pop();
  state.drawPile = shuffle(state.discard.splice(0));
  state.discard = [top];
}

function drawCards(count) {
  const hand = currentPlayer().hand;
  for (let i=0; i<count; i++) {
    refillDrawPileIfNeeded();
    if (!state.drawPile.length) break;
    hand.push(state.drawPile.pop());
  }
}

function onDrawPile() {
  if (state.turnLocked) return;
  if (state.attack?.kind === 'ace') {
    drawCards(3);
    state.attack = null;
    endTurn();
    return;
  }
  if (state.attack?.kind === 'joker') {
    const attack = {...state.attack};
    drawCards(attack.amount);
    state.attack = null;
    askSuitAfterJoker(attack.color);
    return;
  }
  drawCards(1);
  endTurn();
}

function askSuitAfterJoker(color) {
  state.turnLocked = true;
  renderOneCard();
  const choices = color === 'black'
    ? SUITS.filter(s=>s.color==='black')
    : SUITS.filter(s=>s.color==='red');
  modalContent.innerHTML = `
    <h2>Choose the next suit</h2>
    <p class="muted">You drew from a ${color} Joker. Choose one of its two suits for the next player.</p>
    <div class="suit-grid">
      ${choices.map(s=>`<button class="suit-choice ${s.color}" data-suit="${s.code}">${s.symbol} ${s.name}</button>`).join('')}
    </div>`;
  modal.classList.remove('hidden');
  modalContent.querySelectorAll('[data-suit]').forEach(btn => {
    btn.onclick = () => {
      state.chosenSuit = btn.dataset.suit;
      state.turnLocked = false;
      closeModal();
      endTurn();
    };
  });
}

function endTurn() {
  state.current = (state.current + 1) % state.players.length;
  showPassScreen(state.current);
}

function showWinner() {
  const winner = currentPlayer();
  modalContent.innerHTML = `
    <div class="winner">
      <div class="trophy">🏆</div>
      <p class="eyebrow">WINNER</p>
      <h2>${winner.name} wins!</h2>
      <p class="muted">They got rid of every card first.</p>
      <div class="detail-actions">
        <button id="play-again" class="primary big">Play Again</button>
        <button id="winner-games" class="secondary big">Game List</button>
      </div>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('play-again').onclick = () => { closeModal(); startOneCard(); };
  document.getElementById('winner-games').onclick = () => { closeModal(); showScreen('screen-games'); };
}

function quitGame() {
  modalContent.innerHTML = `
    <h2>Quit this game?</h2>
    <p class="muted">Your current One Card game will be lost.</p>
    <div class="detail-actions">
      <button id="confirm-quit" class="primary big">Quit</button>
      <button id="cancel-quit" class="secondary big">Keep Playing</button>
    </div>`;
  modal.classList.remove('hidden');
  document.getElementById('confirm-quit').onclick = () => { closeModal(); state=null; showScreen('screen-games'); };
  document.getElementById('cancel-quit').onclick = closeModal;
}

// Navigation / events
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (!action) return;
  if (action === 'go-home') showScreen('screen-home');
  if (action === 'go-player-count') showScreen('screen-player-count');
  if (action === 'go-games') showScreen('screen-games');
});

document.getElementById('start-selected-game').onclick = () => {
  if (selectedGameId === 'one-card') startOneCard();
};
document.getElementById('how-to-play').onclick = openRules;
document.getElementById('rules-small').onclick = openRules;
document.getElementById('modal-close').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal && !state?.turnLocked) closeModal(); });
document.getElementById('ready-button').onclick = () => pendingReadyAction?.();
document.getElementById('draw-pile').onclick = onDrawPile;
document.getElementById('quit-game').onclick = quitGame;

makePlayerButtons();
