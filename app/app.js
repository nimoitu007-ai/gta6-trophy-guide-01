// Leonida Trophy Ledger: turns data/trophies.json into a filterable checklist.
// Ticks live in localStorage, export to a file and import back. Spoiler mode
// keeps hidden story trophies masked until they are earned. The page works
// fully offline: it fetches only its own data file and nothing else.
const EARNED_STORE = 'leonida-ledger-earned-v3';
const SPOILER_STORE = 'leonida-ledger-spoilers-v3';

const listNode = document.getElementById('trophyList');
const searchNode = document.getElementById('search');
const gradeNode = document.getElementById('grade');
const kindNode = document.getElementById('kind');
const statusNode = document.getElementById('status');
const sortNode = document.getElementById('sort');
const spoilerNode = document.getElementById('spoilers');
const hiddenOnlyNode = document.getElementById('hiddenOnly');
const countNode = document.getElementById('resultCount');
const emptyNode = document.getElementById('emptyState');

const state = {
  trophies: [],
  earned: new Set(loadSlugs(EARNED_STORE)),
  open: null,
};

function loadSlugs(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry) => typeof entry === 'string') : [];
  } catch {
    return [];
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_STORE, JSON.stringify([...state.earned].sort()));
}

function saveSpoilers() {
  localStorage.setItem(SPOILER_STORE, JSON.stringify(spoilerNode.checked));
}

function spoilersOn() {
  try {
    return localStorage.getItem(SPOILER_STORE) === 'true';
  } catch {
    return false;
  }
}

function targetLabel(trophy) {
  if (trophy.count == null) return '';
  if (trophy.count >= 1000) return 'Target: $' + trophy.count.toLocaleString('en-US');
  if (trophy.count === 100 && trophy.name === 'A Long Road') return 'Target: 100%';
  return 'Target: ' + trophy.count;
}

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

// Order a filtered list the way the Sort control asks: list order keeps
// the file's order, grade puts the platinum first, stage follows the
// roadmap, and name sorts alphabetically (case-insensitive).
function sortTrophies(list) {
  const mode = sortNode.value;
  if (mode === 'list') return list;
  const sorted = [...list];
  if (mode === 'grade') {
    sorted.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
  } else if (mode === 'stage') {
    sorted.sort((a, b) => a.stage - b.stage || GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]);
  } else if (mode === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

function passesFilters(trophy) {  const query = searchNode.value.trim().toLowerCase();
  if (query) {
    const haystack = [trophy.name, trophy.description, trophy.guide, trophy.chapter, trophy.kind]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (gradeNode.value !== 'all' && trophy.grade !== gradeNode.value) return false;
  if (kindNode.value !== 'all' && trophy.kind !== kindNode.value) return false;
  if (statusNode.value === 'earned' && !state.earned.has(trophy.slug)) return false;
  if (statusNode.value === 'remaining' && state.earned.has(trophy.slug)) return false;
  if (hiddenOnlyNode.checked && !trophy.hidden) return false;
  return true;
}

function chip(text, cls) {
  const span = document.createElement('span');
  span.className = 'badge ' + cls;
  span.textContent = text;
  return span;
}

function buildCard(trophy) {
  const got = state.earned.has(trophy.slug);
  const masked = spoilerNode.checked && trophy.hidden && !got;
  const card = document.createElement('article');
  card.className = 'trophy' + (got ? ' earned' : '') + (masked ? ' masked' : '');
  card.id = 'trophy-' + trophy.slug;
  card.setAttribute('aria-expanded', String(state.open === trophy.slug));

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = got;
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(trophy.slug);
    else state.earned.delete(trophy.slug);
    saveEarned();
    render();
  });
  const titles = document.createElement('div');
  const nameNode = document.createElement('div');
  nameNode.className = 'trophy-name';
  nameNode.textContent = masked ? 'Hidden trophy' : trophy.name;
  const descNode = document.createElement('div');
  descNode.className = 'trophy-desc';
  descNode.textContent = masked
    ? 'Spoiler hidden — earn this trophy to reveal its name and description.'
    : trophy.description;
  titles.append(nameNode, descNode);
  head.append(box, titles);

  const chips = document.createElement('div');
  chips.className = 'badges';
  chips.append(chip(trophy.grade, trophy.grade));
  if (trophy.kind !== 'missable') chips.append(chip(trophy.kind, 'tag'));
  if (trophy.hidden) chips.append(chip('Hidden', 'hidden-tag'));
  if (trophy.missable) chips.append(chip('Missable', 'missable'));
  if (trophy.count != null) chips.append(chip(targetLabel(trophy), 'count'));
  card.append(head, chips);

  const guideNode = document.createElement('div');
  guideNode.className = 'guide';
  const guidePara = document.createElement('p');
  guidePara.textContent = trophy.guide;
  guideNode.append(guidePara);
  if (trophy.steps && trophy.steps.length > 0) {
    const steps = document.createElement('ol');
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    guideNode.append(steps);
  }
  const sourcePara = document.createElement('p');
  sourcePara.className = 'source';
  sourcePara.textContent = 'Source: ' + trophy.source + (trophy.source_url ? ' — ' : '');
  if (trophy.source_url) {
    const link = document.createElement('a');
    link.href = trophy.source_url;
    link.textContent = 'open the source guide';
    link.rel = 'noopener';
    sourcePara.append(link);
  }
  guideNode.append(sourcePara);
  const metaPara = document.createElement('p');
  metaPara.className = 'meta';
  metaPara.textContent = 'Where: ' + trophy.chapter + ' · Roadmap stage ' + trophy.stage + ' of 5';
  guideNode.append(metaPara);
  card.append(guideNode);

  card.addEventListener('click', () => {
    state.open = state.open === trophy.slug ? null : trophy.slug;
    render();
    if (state.open) history.replaceState(null, '', '#trophy-' + trophy.slug);
  });
  if (state.open === trophy.slug) card.classList.add('open');
  return card;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.trophies.filter((t) => state.earned.has(t.slug)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById('progressText').textContent = done + ' of ' + total + ' earned';
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressBar').style.width = pct + '%';
  const perGrade = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const inGrade = state.trophies.filter((t) => t.grade === grade);
    const got = inGrade.filter((t) => state.earned.has(t.slug)).length;
    return got + '/' + inGrade.length + ' ' + grade;
  });
  document.getElementById('gradeCounts').textContent =
    perGrade.join(' · ') + ' · about 200 hours to platinum';
  for (const el of document.querySelectorAll('.stage-progress')) {
    const stage = Number(el.dataset.stage);
    const inStage = state.trophies.filter((t) => t.stage === stage);
    const got = inStage.filter((t) => state.earned.has(t.slug)).length;
    el.textContent = '· ' + got + '/' + inStage.length + ' earned';
  }
}

function render() {
  renderProgress();
  listNode.replaceChildren();
  const shown = sortTrophies(state.trophies.filter(passesFilters));
  for (const trophy of shown) listNode.append(buildCard(trophy));
  countNode.textContent =
    'Showing ' + shown.length + ' of ' + state.trophies.length + ' trophies' +
    (state.earned.size > 0 ? ' · ' + state.earned.size + ' earned' : '');
  emptyNode.hidden = shown.length !== 0;
}

function applyHash() {
  const hash = location.hash || '';
  if (hash === '#spoilers') {
    spoilerNode.checked = true;
    saveSpoilers();
  } else if (hash.startsWith('#trophy-')) {
    const slug = hash.slice('#trophy-'.length);
    if (state.trophies.some((t) => t.slug === slug)) {
      state.open = slug;
      render();
      const el = document.getElementById('trophy-' + slug);
      if (el) el.scrollIntoView({ block: 'start' });
      return;
    }
  }
  render();
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    earned: [...state.earned].sort(),
    exported_at: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    alert('That file is not valid JSON progress.');
    return;
  }
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) {
    alert('That file does not hold trophy progress.');
    return;
  }
  const known = new Set(state.trophies.map((t) => t.slug));
  state.earned = new Set(names.filter((name) => typeof name === 'string' && known.has(name)));
  saveEarned();
  render();
}

for (const el of [searchNode, gradeNode, kindNode, statusNode, sortNode, hiddenOnlyNode]) {
  el.addEventListener('input', render);
  el.addEventListener('change', render);
}
spoilerNode.addEventListener('change', () => {
  saveSpoilers();
  render();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  state.earned = new Set();
  saveEarned();
  render();
});
window.addEventListener('hashchange', applyHash);

spoilerNode.checked = spoilersOn();
const data = await (await fetch('data/trophies.json')).json();
state.trophies = data.trophies;
applyHash();
