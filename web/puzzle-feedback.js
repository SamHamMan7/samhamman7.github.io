const key = 'puzzle-feedback';
const verdicts = new Set(['mine', 'both', 'bot']);
const progressKey = 'puzzle-stats';

export function loadPuzzleProgress(storage) {
  try {
    const stats = JSON.parse(storage.getItem(progressKey));
    if (Number.isSafeInteger(stats?.played) && stats.played >= 0 &&
        Number.isSafeInteger(stats.best) && stats.best >= 0 && stats.best <= stats.played &&
        Number.isFinite(stats.loss) && stats.loss >= 0) return stats;
  } catch {}
  return {played: 0, best: 0, loss: 0};
}

export function recordPuzzleGrade(storage, stats, {same, loss}) {
  const gap = Number.isFinite(loss) ? Math.max(0, loss) : 0;
  stats.played++;
  stats.loss += gap;
  if (same || gap <= 1) stats.best++;
  try { storage.setItem(progressKey, JSON.stringify(stats)); } catch {}
}

export function puzzleProgressText({played, best, loss}) {
  if (!played) return '';
  return `${played} graded · ${best} within 1 pt · avg gap ${(loss / played).toFixed(1)} pts`;
}

export function feedbackEntry(position, {step, lines, foe}) {
  if (!position?.record || step?.error || step?.turn !== position.turn ||
      !Number.isFinite(step.yours?.chance) || !Number.isFinite(step.bot?.chance)) return null;
  return structuredClone({
    turn: position.turn, record: position.record,
    you: step.yours, discharge: step.bot, loss: step.loss ?? 0, same: !!step.same,
    options: step.rows ?? [], replies: step.replies ?? [], foeReply: foe ?? null,
    outcome: (lines ?? []).filter(line => /^\|(move|-damage|-heal|faint|switch|-crit|-supereffective|-resisted|-miss|cant)\|/.test(line)),
  });
}

export function loadFeedback(storage) {
  try {
    const list = JSON.parse(storage.getItem(key));
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export function saveFeedback(storage, entry, verdict, comment) {
  const note = comment.trim().slice(0,2000);
  if (!entry || (verdict !== null && !verdicts.has(verdict)) || (!verdict && !note)) return false;
  try {
    const saved = {...entry,verdict,comment:note,saved:new Date().toISOString()};
    storage.setItem(key,JSON.stringify([...loadFeedback(storage),saved].slice(-500)));
    return true;
  } catch { return false; }
}
