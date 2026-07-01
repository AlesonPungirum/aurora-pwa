/* Aurora PWA — foco, tarefas e hábitos. Offline-first, sem dependências. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, def) { try { return JSON.parse(localStorage.getItem('aurora.' + k)) ?? def; } catch { return def; } },
    set(k, v) { localStorage.setItem('aurora.' + k, JSON.stringify(v)); },
  };
  const todayKey = () => new Date().toISOString().slice(0, 10);
  const toast = (() => {
    const el = $('#toast'); let t;
    return (msg) => { el.textContent = msg; el.classList.add('show'); clearTimeout(t); t = setTimeout(() => el.classList.remove('show'), 2200); };
  })();

  /* ---------- Tema ---------- */
  const applyTheme = (th) => { document.documentElement.setAttribute('data-theme', th);
    $('meta[name=theme-color]').setAttribute('content', th === 'light' ? '#eef1fb' : '#0b1020'); };
  let theme = store.get('theme', 'dark');
  applyTheme(theme);
  $('#themeBtn').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; store.set('theme', theme); applyTheme(theme); });

  /* ---------- Saudação ---------- */
  (() => { const h = new Date().getHours();
    $('#greeting').textContent = h < 6 ? 'boa madrugada' : h < 12 ? 'bom dia ☀️' : h < 18 ? 'boa tarde 🌤️' : 'boa noite 🌙'; })();

  /* ---------- Navegação ---------- */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.remove('active'));
    $$('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    $('#view-' + tab.dataset.view).classList.add('active');
  }));

  /* ================= POMODORO ================= */
  const RING = 2 * Math.PI * 108; // circunferência
  const ringProg = $('.ring-prog');
  ringProg.style.strokeDasharray = RING;
  let mode = 'focus', total = 25 * 60, remaining = total, running = false, tick = null;

  const stats = store.get('stats', {});
  const todayStats = () => (stats[todayKey()] ||= { focus: 0, minutes: 0 });

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  function renderTimer() {
    $('#time').textContent = fmt(remaining);
    ringProg.style.strokeDashoffset = RING * (1 - remaining / total);
    document.title = running ? `${fmt(remaining)} · Aurora` : 'Aurora · Foco & Hábitos';
  }
  function renderStats() {
    const s = todayStats();
    $('#focusCount').textContent = s.focus;
    $('#focusMinutes').textContent = s.minutes;
    const dots = $('#sessionDots');
    dots.innerHTML = '';
    const n = Math.max(4, Math.min(8, s.focus + (s.focus % 4 === 0 ? 4 : 4 - s.focus % 4)));
    for (let i = 0; i < n; i++) { const d = document.createElement('span'); if (i < s.focus) d.classList.add('on'); dots.appendChild(d); }
  }
  function setMode(m, min) {
    mode = m; total = min * 60; remaining = total; stop();
    $$('.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
    $('#ringLabel').textContent = m === 'focus' ? 'pronto pra focar' : 'hora da pausa';
    renderTimer();
  }
  function start() {
    if (running) return stop();
    running = true; $('#startBtn').textContent = 'Pausar'; $('#startBtn').classList.add('running');
    $('#ringLabel').textContent = mode === 'focus' ? 'focando…' : 'descansando…';
    const startedAt = Date.now(); let base = remaining;
    tick = setInterval(() => {
      remaining = base - Math.round((Date.now() - startedAt) / 1000);
      if (remaining <= 0) { remaining = 0; renderTimer(); complete(); return; }
      renderTimer();
    }, 250);
    renderTimer();
  }
  function stop() {
    running = false; clearInterval(tick); tick = null;
    $('#startBtn').textContent = 'Iniciar'; $('#startBtn').classList.remove('running');
  }
  function complete() {
    stop();
    if (mode === 'focus') {
      const s = todayStats(); s.focus++; s.minutes += Math.round(total / 60);
      store.set('stats', stats); renderStats();
      toast('🎉 Sessão concluída! Faça uma pausa.');
      setMode('short', 5);
    } else { toast('⏰ Pausa encerrada. Bora focar!'); setMode('focus', 25); }
    beep(); vibrate([200, 100, 200]);
    $('#ringLabel').textContent = 'concluído ✓';
  }
  function beep() {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(.001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(.3, ctx.currentTime + .02);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .6);
      o.start(); o.stop(ctx.currentTime + .6);
    } catch {}
  }
  const vibrate = (p) => { if (navigator.vibrate) navigator.vibrate(p); };

  $('#startBtn').addEventListener('click', start);
  $('#resetBtn').addEventListener('click', () => { remaining = total; stop(); $('#ringLabel').textContent = 'pronto pra focar'; renderTimer(); });
  $('#skipBtn').addEventListener('click', complete);
  $$('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode, +b.dataset.min)));
  renderTimer(); renderStats();

  /* ================= TAREFAS ================= */
  let tasks = store.get('tasks', []);
  const taskList = $('#taskList');
  function renderTasks() {
    taskList.innerHTML = '';
    const done = tasks.filter(t => t.done).length;
    $('#taskCounter').textContent = `${done}/${tasks.length}`;
    $('#taskEmpty').style.display = tasks.length ? 'none' : 'block';
    tasks.forEach(t => {
      const li = document.createElement('li'); li.className = t.done ? 'done' : '';
      li.innerHTML = `<button class="check" aria-label="Concluir"><svg viewBox="0 0 24 24" fill="none" stroke-width="3"><path d="M5 12l4 4L19 7"/></svg></button>
        <span class="task-text"></span>
        <button class="del" aria-label="Excluir">✕</button>`;
      li.querySelector('.task-text').textContent = t.text;
      li.querySelector('.check').addEventListener('click', () => { t.done = !t.done; store.set('tasks', tasks); renderTasks(); vibrate(15); });
      li.querySelector('.del').addEventListener('click', () => { tasks = tasks.filter(x => x.id !== t.id); store.set('tasks', tasks); renderTasks(); });
      taskList.appendChild(li);
    });
  }
  $('#taskForm').addEventListener('submit', e => {
    e.preventDefault(); const inp = $('#taskInput'); const v = inp.value.trim(); if (!v) return;
    tasks.unshift({ id: Date.now(), text: v, done: false }); store.set('tasks', tasks); inp.value = ''; renderTasks();
  });
  renderTasks();

  /* ================= HÁBITOS ================= */
  let habits = store.get('habits', []);
  const habitList = $('#habitList');
  const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  function last7() { const arr = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); arr.push(d.toISOString().slice(0, 10)); } return arr; }
  function streakOf(h) {
    let n = 0; const d = new Date();
    if (!h.days.includes(todayKey())) d.setDate(d.getDate() - 1);
    for (;;) { const k = d.toISOString().slice(0, 10); if (h.days.includes(k)) { n++; d.setDate(d.getDate() - 1); } else break; }
    return n;
  }
  function renderHabits() {
    habitList.innerHTML = '';
    $('#habitCounter').textContent = `${habits.length} ativo${habits.length === 1 ? '' : 's'}`;
    $('#habitEmpty').style.display = habits.length ? 'none' : 'block';
    const week = last7();
    habits.forEach(h => {
      const doneToday = h.days.includes(todayKey());
      const streak = streakOf(h);
      const li = document.createElement('li');
      li.innerHTML = `<div class="habit-top">
          <span class="habit-name"></span>
          <span class="streak">🔥 <b>${streak}</b></span>
          <button class="habit-toggle ${doneToday ? 'done' : ''}">${doneToday ? 'Feito ✓' : 'Marcar'}</button>
          <button class="del" aria-label="Excluir">✕</button>
        </div>
        <div class="week">${week.map(k => {
          const dt = new Date(k + 'T00:00');
          const on = h.days.includes(k); const isToday = k === todayKey();
          return `<div class="day ${on ? 'on' : ''} ${isToday ? 'today' : ''}"><i>${dayLetters[dt.getDay()]}</i><b></b></div>`;
        }).join('')}</div>`;
      li.querySelector('.habit-name').textContent = h.name;
      li.querySelector('.habit-toggle').addEventListener('click', () => {
        const k = todayKey();
        if (h.days.includes(k)) h.days = h.days.filter(x => x !== k);
        else { h.days.push(k); vibrate(20); toast('🔥 Sequência mantida!'); }
        store.set('habits', habits); renderHabits();
      });
      li.querySelector('.del').addEventListener('click', () => { habits = habits.filter(x => x.id !== h.id); store.set('habits', habits); renderHabits(); });
      habitList.appendChild(li);
    });
  }
  $('#habitForm').addEventListener('submit', e => {
    e.preventDefault(); const inp = $('#habitInput'); const v = inp.value.trim(); if (!v) return;
    habits.push({ id: Date.now(), name: v, days: [] }); store.set('habits', habits); inp.value = ''; renderHabits();
  });
  renderHabits();

  /* ================= INSTALAÇÃO PWA ================= */
  let deferredPrompt = null;
  const installBtn = $('#installBtn');       // botão no topo (fallback)
  const screen = $('#installScreen');
  const cta = $('#installCta');
  const manual = $('#installManual');
  const manualIos = $('#manualIos');
  const manualGeneric = $('#manualGeneric');
  const skip = $('#installSkip');

  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);

  function hideScreen() { screen.hidden = true; }
  function showManual() {
    cta.hidden = true; manual.hidden = false;
    if (isIOS) manualIos.hidden = false; else manualGeneric.hidden = false;
  }
  function openScreen() {
    if (isStandalone() || store.get('installDismissed', false)) return; // já instalado ou dispensado antes
    screen.hidden = false;
    if (isIOS) showManual();          // iOS não dispara beforeinstallprompt
    // Android/desktop: espera o evento; se não vier em 1,2s, mostra instruções manuais
    else if (!deferredPrompt) setTimeout(() => { if (!deferredPrompt && !screen.hidden) showManual(); }, 1200);
  }

  async function doInstall() {
    if (!deferredPrompt) { showManual(); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; installBtn.classList.add('hidden');
    if (outcome === 'accepted') { toast('Instalando… 🚀'); }
    else { toast('Você pode instalar depois pelo botão ↑'); hideScreen(); }
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    installBtn.classList.remove('hidden');   // fallback no topo
    if (!screen.hidden) { cta.hidden = false; manual.hidden = true; } // garante CTA nativa na tela
  });

  cta.addEventListener('click', doInstall);
  installBtn.addEventListener('click', doInstall);
  skip.addEventListener('click', () => { store.set('installDismissed', true); hideScreen(); });

  window.addEventListener('appinstalled', () => {
    installBtn.classList.add('hidden'); hideScreen(); toast('Aurora instalado 🎉');
  });

  openScreen();

  /* ================= SERVICE WORKER ================= */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // Recalcula stats à meia-noite se a aba ficar aberta
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderStats(); renderHabits(); } });
})();
