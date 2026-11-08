(() => {
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function showTab() {
    const requested = location.hash.slice(1), selected = tabs.find(t => t.hash.slice(1) === requested) || tabs[0];
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
    document.title = selected.textContent === 'Home' ? 'my site' : selected.textContent + ' · my site';
  }
  window.addEventListener('hashchange', showTab); showTab();
  document.querySelector('[role=tablist]').addEventListener('keydown', event => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0) return;
    let target;
    if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') target = tabs[0];
    if (event.key === 'End') target = tabs[tabs.length - 1];
    if (target) { event.preventDefault(); target.focus(); location.hash = target.hash; }
  });

  const problems = window.PRACTICE_PROBLEMS;
  const set = document.getElementById('problem-set'), picker = document.getElementById('problem-picker');
  const answerOptions = document.getElementById('answer-options'), integer = document.getElementById('answer-integer'), feedback = document.getElementById('answer-feedback');
  let filtered = problems, current;
  function showProblem(id) {
    current = filtered.find(p => p.id === id) || filtered[0]; picker.value = current.id;
    document.getElementById('problem-category').textContent = current.set + ' style · ' + current.topic;
    document.getElementById('problem-title').textContent = current.title;
    document.getElementById('problem-statement').textContent = current.statement;
    document.getElementById('hint-text').textContent = current.hint;
    document.getElementById('solution-text').textContent = current.solution;
    document.getElementById('problem-hint').open = false; document.getElementById('problem-solution').open = false;
    document.getElementById('problem-position').textContent = `${filtered.indexOf(current) + 1} / ${filtered.length}`;
    const aime = current.set === 'AIME';
    answerOptions.hidden = aime; document.getElementById('integer-answer').hidden = !aime;
    integer.disabled = !aime; integer.required = aime; integer.value = '';
    answerOptions.replaceChildren();
    const legend = document.createElement('legend'); legend.textContent = 'Your answer'; answerOptions.append(legend);
    for (const [index, choice] of (current.choices || []).entries()) {
      const label = document.createElement('label'), input = document.createElement('input');
      input.type = 'radio'; input.name = 'choice'; input.value = index; input.required = true;
      label.append(input, `${String.fromCharCode(65 + index)}. ${choice}`); answerOptions.append(label);
    }
    feedback.textContent = ''; feedback.className = '';
  }
  function fillPicker() {
    filtered = problems.filter(p => set.value === 'all' || p.set === set.value);
    picker.replaceChildren(...filtered.map(p => new Option(p.id.toUpperCase() + ' · ' + p.title,p.id)));
    showProblem(filtered[0].id);
  }
  set.addEventListener('change', fillPicker);
  picker.addEventListener('change', () => showProblem(picker.value));
  document.getElementById('random-problem').addEventListener('click', () => {
    const others = filtered.filter(p => p !== current); showProblem(others[Math.floor(Math.random() * others.length)].id);
  });
  document.getElementById('previous-problem').addEventListener('click', () => showProblem(filtered[(filtered.indexOf(current) + filtered.length - 1) % filtered.length].id));
  document.getElementById('next-problem').addEventListener('click', () => showProblem(filtered[(filtered.indexOf(current) + 1) % filtered.length].id));
  document.getElementById('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = new FormData(event.currentTarget).get(current.set === 'AIME' ? 'integer' : 'choice');
    const correct = selected !== null && String(selected).trim() !== '' && Number(selected) === current.answer;
    feedback.textContent = correct ? 'Correct.' : 'Not quite. Try again, or open the hint.';
    feedback.className = correct ? 'correct' : 'incorrect';
  });
  fillPicker();

  const button = document.getElementById('download-offline');
  const status = document.getElementById('download-status');
  const progress = document.getElementById('download-progress');
  let registration, manifest, downloading = false;
  function show(message) { status.textContent = message; }
  function rpc(worker, type) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => reject(new Error('The offline service did not respond. Reload and try again.')), 30000);
      channel.port1.onmessage = ({data}) => { clearTimeout(timer); channel.port1.close(); data.error ? reject(new Error(data.error)) : resolve(data); };
      worker.postMessage({type}, [channel.port2]);
    });
  }
  function update(data) {
    if (data.type === 'download-progress') {
      progress.hidden = false;
      progress.value = Math.round(data.loaded / data.total * 100);
      show(`Downloading ${Math.round(data.loaded / 1048576)} of ${Math.ceil(data.total / 1048576)} MB… Keep this page open.`);
    }
    if (data.type === 'download-complete') finish();
    if (data.type === 'download-error') {
      downloading = false; button.disabled = false; button.firstChild.textContent = 'Retry offline download ';
      show(data.error + ' Finished files are kept; you can retry on Wi-Fi.');
    }
  }
  function finish() {
    downloading = false; button.disabled = false; progress.hidden = true;
    button.firstChild.textContent = 'Check offline download ';
    show('Ready for offline. The game and sprites are saved on this device.');
  }
  async function init() {
    if (!('serviceWorker' in navigator)) { button.disabled = true; show('Offline saving is unavailable in this browser. You can still play while online.'); return; }
    try {
      registration = await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      navigator.serviceWorker.addEventListener('message', event => update(event.data));
      const response = await fetch('./offline-manifest.json');
      if (!response.ok) throw new Error('Could not load the download list.');
      manifest = await response.json();
      const result = await rpc(registration.active, 'status');
      if (result.ready) finish();
      else show(`Optional download: about ${Math.ceil(manifest.totalBytes / 1048576)} MB. Use Wi-Fi before your trip.`);
    } catch (error) { show('Offline saving could not start: ' + error.message); }
  }
  button.addEventListener('click', async () => {
    if (downloading) return;
    try {
      if (!registration?.active) throw new Error('Reload this page to start the offline service.');
      const result = await rpc(registration.active, 'status');
      if (result.ready) { finish(); return; }
      downloading = true; button.disabled = true; progress.hidden = false; progress.value = 0;
      show('Preparing the offline download…');
      registration.active.postMessage({type: 'download'});
      navigator.storage?.persist?.().catch(() => {});
    } catch (error) { show(error.message); downloading = false; button.disabled = false; }
  });
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && registration?.active) {
      try { const result = await rpc(registration.active, 'status'); if (result.ready) finish(); else if (downloading && !result.downloading) { downloading = false; button.disabled = false; show('Download paused. Press the button to resume.'); } } catch {}
    }
  });
  init();
})();
