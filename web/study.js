// Study help: practice questions by subject, with progress kept on this device.
(() => {
  const problems = window.STUDY_PROBLEMS, topics = window.STUDY_TOPICS, links = window.STUDY_LINKS || [], root = document.getElementById('study');
  if (!problems || !root) return;
  const $ = id => document.getElementById(id);
  const subject = $('study-subject'), picker = $('study-picker'), options = $('study-options'), feedback = $('study-feedback');
  let solved = new Set();
  try { solved = new Set(JSON.parse(localStorage.getItem('study-solved') || '[]')); } catch {}
  let filtered = problems, current;
  for (const name of [...new Set(problems.map(p => p.subject))]) subject.append(new Option(name, name));
  function progress() {
    const done = filtered.filter(p => solved.has(p.id)).length;
    $('study-progress').textContent = `${done} of ${filtered.length} solved`;
    $('study-progress-bar').value = done; $('study-progress-bar').max = filtered.length;
  }
  function label(p) { return (solved.has(p.id) ? '✓ ' : '') + p.topic + ' · ' + p.title; }
  function show(id) {
    current = filtered.find(p => p.id === id) || filtered[0]; picker.value = current.id;
    $('study-category').textContent = current.subject + ' · ' + current.topic;
    $('study-title').textContent = current.title; $('study-statement').textContent = current.statement;
    $('study-hint-text').textContent = current.hint; $('study-solution-text').textContent = current.solution;
    $('study-hint').open = false; $('study-solution').open = false;
    $('study-position').textContent = `${filtered.indexOf(current) + 1} / ${filtered.length}`;
    options.replaceChildren(); const legend = document.createElement('legend'); legend.textContent = 'Your answer'; options.append(legend);
    current.choices.forEach((choice, index) => {
      const row = document.createElement('label'), input = document.createElement('input');
      input.type = 'radio'; input.name = 'study-choice'; input.value = index; input.required = true;
      row.append(input, `${String.fromCharCode(65 + index)}. ${choice}`); options.append(row);
    });
    feedback.textContent = ''; feedback.className = '';
  }
  function fill() {
    filtered = problems.filter(p => p.subject === subject.value);
    picker.replaceChildren(...filtered.map(p => new Option(label(p), p.id)));
    const list = $('study-topics'); list.replaceChildren(...(topics[subject.value] || []).map(t => { const li = document.createElement('li'); li.textContent = t; return li; }));
    progress(); show((filtered.find(p => !solved.has(p.id)) || filtered[0]).id);
  }
  subject.addEventListener('change', fill);
  picker.addEventListener('change', () => show(picker.value));
  $('study-previous').addEventListener('click', () => show(filtered[(filtered.indexOf(current) + filtered.length - 1) % filtered.length].id));
  $('study-next').addEventListener('click', () => show(filtered[(filtered.indexOf(current) + 1) % filtered.length].id));
  $('study-form').addEventListener('submit', event => {
    event.preventDefault();
    const pick = new FormData(event.currentTarget).get('study-choice'), correct = pick !== null && Number(pick) === current.answer;
    feedback.textContent = correct ? 'Correct.' : 'Not quite. Try again, or open the hint.'; feedback.className = correct ? 'correct' : 'incorrect';
    if (correct && !solved.has(current.id)) {
      solved.add(current.id); try { localStorage.setItem('study-solved', JSON.stringify([...solved])); } catch {}
      picker.selectedOptions[0].textContent = label(current); progress();
    }
  });
  $('study-reset').addEventListener('click', () => { for (const p of filtered) solved.delete(p.id); try { localStorage.setItem('study-solved', JSON.stringify([...solved])); } catch {} fill(); });
  $('study-links').replaceChildren(...links.map(([name, url]) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = url; a.textContent = name; a.target = '_blank'; a.rel = 'noopener'; li.append(a); return li; }));
  fill();
})();
