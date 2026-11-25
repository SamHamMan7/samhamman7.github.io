const key = 'puzzle-feedback';
const verdicts = new Set(['mine', 'both', 'bot']);

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
