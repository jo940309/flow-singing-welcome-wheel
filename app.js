const els = {
  wheel: document.querySelector('#wheel'),
  spinButton: document.querySelector('#spin-button'),
  resultCard: document.querySelector('#result-card'),
  resultTitle: document.querySelector('#result-title'),
  resultDescription: document.querySelector('#result-description'),
  taskButton: document.querySelector('#task-button'),
  rerollButton: document.querySelector('#reroll-button'),
  probabilityList: document.querySelector('#probability-list'),
  siteTitle: document.querySelector('#site-title'),
  siteSubtitle: document.querySelector('#site-subtitle'),
  rewardText: document.querySelector('#reward-text'),
  joinButton: document.querySelector('#join-button'),
  joinHint: document.querySelector('#join-hint'),
  taskSection: document.querySelector('#task-section'),
  taskTitle: document.querySelector('#task-section-title'),
  taskContent: document.querySelector('#task-content'),
  closeTask: document.querySelector('#close-task'),
  completeButton: document.querySelector('#complete-button'),
  rewardBanner: document.querySelector('#reward-banner'),
  completeMessage: document.querySelector('#complete-message'),
  completeJoinButton: document.querySelector('#complete-join-button'),
  toast: document.querySelector('#toast')
};

const state = {
  data: null,
  tasks: [],
  currentTask: null,
  currentRotation: 0,
  spinning: false,
  lastRandomItemIndex: new Map()
};

const palette = [
  '#ff4a16', '#ffc52b', '#a9bfdd', '#fff0c7', '#4e80c4', '#ff8b45', '#ffd96b'
];

async function init() {
  try {
    const response = await fetch('data/tasks.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.data = await response.json();
    state.tasks = state.data.tasks || [];
    validateTasks(state.tasks);
    applySiteConfig();
    renderProbabilityList();
    drawWheel();
    bindEvents();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `
      <main style="max-width:760px;margin:60px auto;padding:24px;font-family:system-ui;line-height:1.7">
        <h1>資料讀取失敗</h1>
        <p>請確認 <code>data/tasks.json</code> 存在，而且網頁是透過網站伺服器開啟。</p>
        <p>如果你是直接雙擊 index.html，瀏覽器可能會阻擋 JSON 載入。建議依 README 用 GitHub Pages / Netlify，或在資料夾內執行簡易伺服器。</p>
      </main>`;
  }
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks) || !tasks.length) throw new Error('tasks.json 沒有任務資料');
  tasks.forEach((task) => {
    if (!task.id || !task.label || typeof task.probability !== 'number') {
      throw new Error('每個任務至少需要 id、label、probability');
    }
  });
}

function applySiteConfig() {
  const site = state.data.site || {};
  document.title = site.title || '流行歌唱社｜社博任務轉盤';
  if (site.headline) {
    const parts = String(site.headline).split('\n');
    els.siteTitle.innerHTML = `${escapeHtml(parts[0] || '')}${parts[1] ? `<br><span>${escapeHtml(parts.slice(1).join(' '))}</span>` : ''}`;
  }
  els.siteSubtitle.textContent = site.subtitle || '';
  els.rewardText.textContent = site.rewardText || '';
  els.completeMessage.textContent = site.completeMessage || '';
}

function renderProbabilityList() {
  els.probabilityList.innerHTML = state.tasks.map(task => `
    <div class="probability-row">
      <span>${escapeHtml(task.label)}</span>
      <b>${formatProbability(task.probability)}</b>
    </div>
  `).join('');
}

function drawWheel() {
  const canvas = els.wheel;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const totalWeight = state.tasks.reduce((sum, t) => sum + t.probability, 0);
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  state.tasks.forEach((task, index) => {
    const segmentAngle = (task.probability / totalWeight) * Math.PI * 2;
    const endAngle = startAngle + segmentAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = palette[index % palette.length];
    ctx.fill();
    ctx.strokeStyle = '#0b2e59';
    ctx.lineWidth = 7;
    ctx.stroke();

    drawSegmentLabel(ctx, task, startAngle, segmentAngle, center, radius);
    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.arc(center, center, 95, 0, Math.PI * 2);
  ctx.fillStyle = '#fff0c7';
  ctx.fill();
  ctx.strokeStyle = '#0b2e59';
  ctx.lineWidth = 7;
  ctx.stroke();
}

function drawSegmentLabel(ctx, task, startAngle, segmentAngle, center, radius) {
  const mid = startAngle + segmentAngle / 2;
  const labelRadius = radius * 0.66;
  const x = center + Math.cos(mid) * labelRadius;
  const y = center + Math.sin(mid) * labelRadius;
  const lines = String(task.shortLabel || task.label).split('\n');
  const probability = formatProbability(task.probability);
  const spanFactor = Math.min(1, segmentAngle / 0.6);
  const fontSize = Math.max(22, 31 * spanFactor);

  ctx.save();
  ctx.translate(x, y);
  let rotation = mid + Math.PI / 2;
  if (rotation > Math.PI / 2 && rotation < Math.PI * 1.5) rotation += Math.PI;
  ctx.rotate(rotation);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#0b2e59';
  ctx.fillStyle = '#fff8df';
  ctx.lineWidth = 7;
  ctx.font = `900 ${fontSize}px "Noto Sans TC", sans-serif`;

  const lineHeight = fontSize * 1.12;
  const totalLines = lines.length + 1;
  const startY = -(totalLines - 1) * lineHeight / 2;
  lines.forEach((line, idx) => {
    ctx.strokeText(line, 0, startY + idx * lineHeight);
    ctx.fillText(line, 0, startY + idx * lineHeight);
  });

  ctx.fillStyle = '#0b2e59';
  ctx.lineWidth = 0;
  ctx.font = `900 ${Math.max(18, fontSize * .72)}px "Baloo 2", sans-serif`;
  ctx.fillText(probability, 0, startY + lines.length * lineHeight + 2);
  ctx.restore();
}

function bindEvents() {
  els.spinButton.addEventListener('click', spin);
  els.rerollButton.addEventListener('click', spin);
  els.taskButton.addEventListener('click', () => openTask(state.currentTask));
  els.closeTask.addEventListener('click', closeTask);
  els.completeButton.addEventListener('click', markComplete);
  els.joinButton.addEventListener('click', openMembershipForm);
  els.completeJoinButton.addEventListener('click', openMembershipForm);
  window.addEventListener('resize', () => {});
}

function spin() {
  if (state.spinning) return;
  state.spinning = true;
  closeTask();
  els.rewardBanner.hidden = true;
  els.resultCard.hidden = true;
  els.spinButton.disabled = true;
  els.rerollButton.disabled = true;

  const selected = weightedRandom(state.tasks);
  state.currentTask = selected.task;

  const targetDeg = getRandomAngleInsideSegment(selected.index);
  const currentMod = normalizeDeg(state.currentRotation);
  const desiredMod = normalizeDeg(-90 - targetDeg);
  const alignDelta = normalizeDeg(desiredMod - currentMod);
  const fullTurns = 5 + Math.floor(Math.random() * 2);
  const delta = fullTurns * 360 + alignDelta;
  state.currentRotation += delta;

  els.wheel.style.transform = `rotate(${state.currentRotation}deg)`;

  window.setTimeout(() => {
    state.spinning = false;
    els.spinButton.disabled = false;
    els.rerollButton.disabled = false;
    showResult(state.currentTask);
  }, 5350);
}

function weightedRandom(tasks) {
  const total = tasks.reduce((sum, task) => sum + task.probability, 0);
  let r = Math.random() * total;
  for (let i = 0; i < tasks.length; i += 1) {
    r -= tasks[i].probability;
    if (r < 0) return { task: tasks[i], index: i };
  }
  return { task: tasks[tasks.length - 1], index: tasks.length - 1 };
}

function getRandomAngleInsideSegment(index) {
  const total = state.tasks.reduce((sum, task) => sum + task.probability, 0);
  let start = -90;
  for (let i = 0; i < index; i += 1) {
    start += (state.tasks[i].probability / total) * 360;
  }
  const span = (state.tasks[index].probability / total) * 360;
  const safeMargin = Math.min(span * .18, 5);
  const usable = Math.max(0, span - safeMargin * 2);
  return start + safeMargin + Math.random() * usable;
}

function showResult(task) {
  els.resultTitle.textContent = task.label;
  els.resultDescription.textContent = task.description || '請依照任務畫面完成挑戰。';
  els.resultCard.hidden = false;
  els.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openTask(task) {
  if (!task) return;
  els.taskTitle.textContent = task.label;
  els.taskContent.innerHTML = renderTaskContent(task);
  els.taskSection.hidden = false;
  els.taskSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  wireTaskSpecificButtons(task);
}

function closeTask() {
  els.taskSection.hidden = true;
  els.taskContent.innerHTML = '';
}

function renderTaskContent(task) {
  const intro = `
    <div class="task-intro">
      <div class="task-badge">${escapeHtml(task.badge || 'GO')}</div>
      <div>
        <h3>${escapeHtml(task.label)}</h3>
        <p>${escapeHtml(task.description || '')}</p>
      </div>
    </div>`;

  if (task.type === 'songSuggestions') {
    return intro + renderSongSuggestions(task);
  }
  if (task.type === 'introGuess') {
    return intro + renderIntroGuess(task);
  }
  if (task.type === 'prompt') {
    return intro + renderPrompt(task);
  }
  if (task.type === 'albumCover') {
    return intro + renderAlbumCover(task);
  }

  return intro + `<div class="prompt-card"><p>這個任務尚未設定內容，請到 <code>data/tasks.json</code> 修改。</p></div>`;
}

function renderSongSuggestions(task) {
  const count = Math.min(task.suggestionCount || 3, task.items?.length || 0);
  const items = sampleWithoutReplacement(task.items || [], count);
  return `
    <div class="cards-grid" id="song-cards">
      ${items.map((item, index) => songCard(item, index)).join('')}
    </div>
    <div class="action-row">
      <button class="btn btn-secondary" id="shuffle-songs" type="button">換一批參考歌曲</button>
      <button class="btn btn-ghost" type="button" onclick="showToast('也可以唱你自己想唱的歌！')">我想唱自己的歌</button>
    </div>`;
}

function songCard(item, index) {
  return `
    <article class="suggestion-card">
      <span class="num">0${index + 1}</span>
      <h4>${escapeHtml(item.title || '未命名歌曲')}</h4>
      <p>${escapeHtml(item.artist || '')}</p>
    </article>`;
}

function renderIntroGuess(task) {
  const item = randomItem(task.items || [], task.id);
  if (!item) return `<div class="prompt-card"><p>請先在 JSON 加入前奏音檔資料。</p></div>`;
  return `
    <div class="audio-wrap" id="intro-area">
      <article class="audio-card">
        <strong>🎧 前奏題目</strong>
        <p>先按播放，猜到後再按「看答案」。</p>
        <audio controls preload="metadata" src="${escapeAttr(item.audio || '')}"></audio>
        <p class="file-error" hidden>找不到音檔。請確認 JSON 的 audio 路徑與 assets/audio 裡的檔名一致。</p>
        <div class="answer-box" id="intro-answer" hidden>
          答案：${escapeHtml(item.title || '')}${item.artist ? ` — ${escapeHtml(item.artist)}` : ''}
        </div>
      </article>
    </div>
    <div class="action-row">
      <button class="btn btn-primary" id="reveal-answer" type="button">看答案</button>
      <button class="btn btn-secondary" id="next-intro" type="button">換一題</button>
    </div>`;
}

function renderPrompt(task) {
  const item = randomItem(task.items || [], task.id);
  if (!item) return `<div class="prompt-card"><p>請先在 JSON 加入接歌題目。</p></div>`;
  return `
    <article class="prompt-card" id="prompt-area">
      <p>你的接歌關鍵字是</p>
      <span class="prompt-word">${escapeHtml(item.prompt || '?')}</span>
      <p>${escapeHtml(item.hint || '')}</p>
    </article>
    <div class="action-row">
      <button class="btn btn-secondary" id="next-prompt" type="button">換一個關鍵字</button>
    </div>`;
}

function renderAlbumCover(task) {
  const item = randomItem(task.items || [], task.id);
  if (!item) return `<div class="prompt-card"><p>請先在 JSON 加入封面圖片資料。</p></div>`;
  return `
    <div class="cover-stage" id="cover-area">
      <div class="cover-frame">
        <img src="${escapeAttr(item.image || '')}" alt="${escapeAttr(item.title || '專輯封面')}" />
      </div>
      <div class="cover-copy">
        <p class="kicker">POSE LIKE THIS</p>
        <h4>${escapeHtml(item.title || '未命名封面')}</h4>
        <p>${item.artist ? `歌手／備註：${escapeHtml(item.artist)}` : '照著畫面的表情、姿勢或構圖模仿即可。'}</p>
        <div class="action-row">
          <button class="btn btn-secondary" id="next-cover" type="button">換一張封面</button>
        </div>
      </div>
    </div>`;
}

function wireTaskSpecificButtons(task) {
  if (task.type === 'songSuggestions') {
    document.querySelector('#shuffle-songs')?.addEventListener('click', () => {
      const count = Math.min(task.suggestionCount || 3, task.items?.length || 0);
      const items = sampleWithoutReplacement(task.items || [], count);
      document.querySelector('#song-cards').innerHTML = items.map((item, i) => songCard(item, i)).join('');
    });
  }

  if (task.type === 'introGuess') {
    wireAudioError();
    document.querySelector('#reveal-answer')?.addEventListener('click', () => {
      document.querySelector('#intro-answer').hidden = false;
    });
    document.querySelector('#next-intro')?.addEventListener('click', () => {
      els.taskContent.innerHTML = renderTaskContent(task);
      wireTaskSpecificButtons(task);
    });
  }

  if (task.type === 'prompt') {
    document.querySelector('#next-prompt')?.addEventListener('click', () => {
      els.taskContent.innerHTML = renderTaskContent(task);
      wireTaskSpecificButtons(task);
    });
  }

  if (task.type === 'albumCover') {
    document.querySelector('#next-cover')?.addEventListener('click', () => {
      els.taskContent.innerHTML = renderTaskContent(task);
      wireTaskSpecificButtons(task);
    });
    const img = document.querySelector('#cover-area img');
    img?.addEventListener('error', () => {
      showToast('找不到封面圖片，請檢查 JSON 路徑與 assets/covers 檔名。');
    });
  }
}

function wireAudioError() {
  const audio = document.querySelector('#intro-area audio');
  const errorText = document.querySelector('#intro-area .file-error');
  audio?.addEventListener('error', () => {
    if (errorText) errorText.hidden = false;
  });
}

function markComplete() {
  els.rewardBanner.hidden = false;
  els.rewardBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('任務完成！請找工作人員確認。');
}

function openMembershipForm() {
  const url = state.data?.site?.membershipFormUrl?.trim();
  if (!url) {
    showToast('尚未設定入社單連結，請到 data/tasks.json 填入 membershipFormUrl。');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function randomItem(items, key) {
  if (!items.length) return null;
  let index = Math.floor(Math.random() * items.length);
  if (items.length > 1 && state.lastRandomItemIndex.get(key) === index) {
    index = (index + 1 + Math.floor(Math.random() * (items.length - 1))) % items.length;
  }
  state.lastRandomItemIndex.set(key, index);
  return items[index];
}

function sampleWithoutReplacement(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

function formatProbability(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

function normalizeDeg(value) {
  return ((value % 360) + 360) % 360;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 2800);
}
window.showToast = showToast;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function escapeAttr(value) { return escapeHtml(value); }

init();
