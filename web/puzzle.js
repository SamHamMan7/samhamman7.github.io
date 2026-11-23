// The official BattleRoom owns the battlefield, choices and targets. This
// adapter substitutes a single local puzzle worker for the Showdown socket.
import {parsePuzzleChoice} from './puzzle-choice.js';

const roomElement = document.getElementById('puzzle-room');
const roomId = 'battle-offline-puzzle';
const storageKey = 'puzzle-stats';
let stats = {played: 0, best: 0, loss: 0};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && Number.isFinite(saved.played) && Number.isFinite(saved.best) && Number.isFinite(saved.loss)) stats = saved;
} catch {}

const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function button(text, action) {
  const node = element('button', text, 'button');
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

let worker, room, puzzle, feedback, requestId = 0, phase = 'loading';
const newFeedback = () => {
  const panel = element('section', '', 'puzzle-feedback');
  panel.setAttribute('aria-live', 'polite');
  return panel;
};

function paint() {
  if (!room) return;
  if (phase === 'choosing') return;
  if (room.$controls[0]?.firstChild !== feedback) room.$controls.empty().append(feedback);
}

function showStatus(text, retry = false) {
  feedback = newFeedback();
  feedback.append(element('p', text));
  if (retry) feedback.append(button('Try another puzzle', ask));
  if (room) paint();
  else roomElement.replaceChildren(feedback);
}

function send(message, id) {
  if (id !== roomId || phase !== 'choosing' || !message.startsWith('/choose ')) return;
  const choice = parsePuzzleChoice(message, requestId, puzzle.legal);
  if (!choice) {
    // The pinned room may generate an unavailable command as the active
    // list changes. Reset its actual choice builder after endTurn() finishes.
    queueMicrotask(() => {
      if (phase === 'choosing') {
        room.clearChoice();
        window.alert('That combination is unavailable. Choose another play.');
      }
    });
    return;
  }
  phase = 'grading';
  queueMicrotask(() => showStatus('Discharge is checking your play…'));
  worker.postMessage({type: 'puzzle-answer', choice});
}

// BattleRoom's shared App hooks only. There is no App connection, chat input
// or account operation inside the puzzle room.
window.app = {
  user: new Backbone.Model(),
  topbar: {updateTabbar() {}},
  roomTitleChanged() {},
  dismissPopups() {},
  addPopupMessage(message) { window.alert(message); },
  send,
};
const PuzzleRoom = BattleRoom.extend({
  initialize(data) {
    this.id = roomId;
    BattleRoom.prototype.initialize.call(this, data);
  },
  notifyRequest() {},
  closeNotification() {},
  updateControls() {
    if (phase === 'choosing') return BattleRoom.prototype.updateControls.call(this);
    paint();
  },
});

function render(position) {
  if (position.request?.side?.id !== 'p1' || !position.request.active?.length) throw new Error('Missing puzzle player request');
  const host = element('div', '', 'ps-room');
  roomElement.replaceChildren(host);
  puzzle = position;
  phase = 'choosing';
  room = new PuzzleRoom({el: host, nojoin: true, title: 'What would you do?'});
  room.autoTimerActivated = true;
  room.$options.hide();
  room.updateLayout();
  room.receive('|init|battle\n|title|What would you do?\n' + position.log.join('\n'));
  room.receive('|request|' + JSON.stringify({...position.request, rqid: ++requestId, noCancel: true}));
}

function showResult({step, lines}) {
  if (phase !== 'grading') return;
  phase = 'result';
  feedback = newFeedback();
  if (step.bot?.label && Number.isFinite(step.bot.chance)) {
    feedback.append(element('h3', 'Discharge recommends'));
    feedback.append(element('p', step.bot.label, 'broadcast-blue'));
    if (Number.isFinite(step.yours?.chance)) {
      const loss = Math.max(0, step.loss || 0);
      stats.played++;
      stats.loss += loss;
      if (step.same || loss <= 1) stats.best++;
      try { localStorage.setItem(storageKey, JSON.stringify(stats)); } catch {}
      feedback.append(element('p', `You played ${step.yours.label}.`));
      feedback.append(element('p', `Estimated win chance: your play ${step.yours.chance}%, Discharge’s pick ${step.bot.chance}%.`));
    }
    if (step.rows?.length) {
      const details = element('details');
      details.append(element('summary', 'Other options Discharge checked'));
      const list = element('ul');
      for (const row of step.rows) list.append(element('li', `${row.label} · ${row.chance}% estimated win chance`));
      details.append(list);
      feedback.append(details);
    }
  } else {
    feedback.append(element('p', step.error || 'Discharge could not grade this position.'));
  }
  feedback.append(button('Next puzzle', ask));
  paint();
  room.request = null;
  room.side = '';
  if (lines?.length) {
    room.battle.play();
    room.add(lines.join('\n'));
  }
}

function ask() {
  phase = 'loading';
  if (room) {
    room.battle.subscribe(null);
    room.battle.scene.stopAnimation();
    room.battle.destroy();
    room.remove();
    room = null;
  }
  showStatus('Setting up a position…');
  worker.postMessage({type: 'puzzle', seed: crypto.getRandomValues(new Uint32Array(1))[0] || 1});
}

function showError(error) {
  phase = 'error';
  showStatus(error, !!worker);
}

try {
  worker = new Worker(new URL('./champions.worker.js', import.meta.url), {type: 'module'});
  worker.onerror = () => showError('Could not load the puzzle simulator. Reload to try again.');
  worker.onmessage = ({data}) => {
    try {
      if (data.type === 'ready') ask();
      else if (data.type === 'puzzle') render(data.puzzle);
      else if (data.type === 'puzzle-result') showResult(data.result);
      else if (data.type === 'error') showError(data.message);
    } catch (error) {
      showError(error.message);
    }
  };
} catch {
  showError('This browser could not start the puzzle simulator.');
}

addEventListener('resize', () => room?.updateLayout());
addEventListener('pagehide', () => worker?.terminate());
