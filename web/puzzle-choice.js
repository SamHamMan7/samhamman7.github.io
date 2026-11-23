// BattleRoom may put the Mega toggle before the target. The puzzle worker
// enumerates moves with the target first. Match semantics and submit the exact
// legal command from the worker rather than forwarding an unchecked string.
function normalized(choice) {
  return choice.trim().toLowerCase().split(/\s*,\s*/).map(part => {
    const match = /^move\s+(\d+)(.*)$/.exec(part);
    if (!match) return part.replace(/\s+/g, ' ');
    const args = match[2].trim().split(/\s+/).filter(Boolean);
    return ['move', match[1], ...args.sort()].join(' ');
  }).join(', ');
}

export function parsePuzzleChoice(message, requestId, legal) {
  const match = /^\/choose ([^|]+)\|(\d+)$/.exec(message);
  if (!match || Number(match[2]) !== requestId) return null;
  const key = normalized(match[1]);
  return legal.find(choice => normalized(choice) === key) ?? null;
}
