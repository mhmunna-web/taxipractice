// ====== Simple SPA Router for GitHub Pages (hash routing) ======
const pageEl = document.getElementById("page");
const searchEl = document.getElementById("globalSearch");
const themeBtn = document.getElementById("toggleTheme");

let examTimerHandle = null;

const state = {
  sheets: null,
  questionsData: null,
  searchText: "",
  selectedChapterId: null,

  // practice runtime
  practice: {
    topic: "ALL",
    mode: "practice", // practice | quiz
    pool: [],
    index: 0,
    selected: null,
    submitted: false,
    lastResult: null,
    show: 10,
  },

  // exam runtime
  exam: {
    active: false,
    durationSec: 50 * 60,
    endAt: null,          // timestamp (ms)
    startedAt: null,      // timestamp
    index: 0,
    pool: [],             // 50 questions
    answers: {},          // {qid: optionId}
    flagged: {},          // {qid:true}
    submitted: false,
    result: null,         // {score, total, correctIds:Set}
  }
};

// --- LocalStorage helpers ---
const LS = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// --- Theme toggle ---
function applyTheme() {
  const isLight = LS.get("theme_light", false);
  if (isLight) {
    document.documentElement.style.setProperty("--bg", "#f6f7fb");
    document.documentElement.style.setProperty("--panel", "#ffffff");
    document.documentElement.style.setProperty("--card", "#ffffff");
    document.documentElement.style.setProperty("--text", "#111827");
    document.documentElement.style.setProperty("--muted", "#4b5563");
    document.documentElement.style.setProperty("--line", "#e5e7eb");
    themeBtn.textContent = "☀️";
  } else {
    document.documentElement.style.setProperty("--bg", "#0b0f14");
    document.documentElement.style.setProperty("--panel", "#111827");
    document.documentElement.style.setProperty("--card", "#0f172a");
    document.documentElement.style.setProperty("--text", "#e5e7eb");
    document.documentElement.style.setProperty("--muted", "#9ca3af");
    document.documentElement.style.setProperty("--line", "#1f2937");
    themeBtn.textContent = "🌙";
  }
}
themeBtn.addEventListener("click", () => {
  LS.set("theme_light", !LS.get("theme_light", false));
  applyTheme();
});
applyTheme();

// --- Progress storage ---
function getProgress() {
  return LS.get("progress", {
    studiedChapters: 0,
    practiceDone: 0,
    mockHistory: [],      // [{dateISO, score, total, timeSec}]
    bookmarks: { chapters: [] },
    mistakes: []
  });
}
function setProgress(p) {
  LS.set("progress", p);
}

// --- Utils ---
function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function includesText(hay, needle) {
  if (!needle) return false;
  return (hay || "").toLowerCase().includes(needle.toLowerCase());
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function parseQueryStringFromHash() {
  const hash = location.hash || "";
  const idx = hash.indexOf("?");
  if (idx === -1) return {};
  const qs = hash.slice(idx + 1);
  const params = new URLSearchParams(qs);
  const obj = {};
  for (const [k, v] of params.entries()) obj[k] = v;
  return obj;
}
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
function nowMs() { return Date.now(); }

// --- Load data ---
async function loadData() {
  if (state.sheets && state.questionsData) return;

  try {
    const [sheetsRes, questionsRes] = await Promise.all([
      fetch("./data/sheets.json"),
      fetch("./data/questions.json"),
    ]);

    state.sheets = await sheetsRes.json();
    state.questionsData = await questionsRes.json();

    if (!state.selectedChapterId && state.sheets?.chapters?.length) {
      const last = LS.get("selected_chapter_id", null);
      state.selectedChapterId = last || state.sheets.chapters[0].id;
    }

    // init practice defaults
    if (!state.practice.pool.length) resetPracticePool();

    // restore running exam if any
    const savedExam = LS.get("exam_state", null);
    if (savedExam?.active && savedExam?.endAt) {
      // only restore if still time left
      if (savedExam.endAt > nowMs() && Array.isArray(savedExam.pool) && savedExam.pool.length) {
        state.exam = savedExam;
      } else {
        LS.set("exam_state", null);
      }
    }
  } catch (e) {
    console.error(e);
    pageEl.innerHTML = `
      <h1 class="h1">Data load error</h1>
      <p class="lead">Please check <code>data/sheets.json</code> and <code>data/questions.json</code>.</p>
    `;
  }
}

// --- Navigation active link ---
function setActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach(a => {
    a.classList.toggle("active", a.dataset.route === route);
  });
}

// --- Question data ---
function getAllQuestions() {
  return state.questionsData?.questions || [];
}
function getTopics() {
  return state.questionsData?.topics || [];
}

// ===== Home =====
function renderHome() {
  setActiveNav("home");
  const progress = getProgress();
  const lastMock = progress.mockHistory?.[0];

  pageEl.innerHTML = `
    <h1 class="h1">Welcome 👋</h1>
    <p class="lead">
      Study sheets, practice questions, and take a real-time mock exam.
      Everything saves automatically in your browser.
    </p>

    <div class="grid">
      <div class="card">
        <div class="badge">Study</div>
        <h3>📘 Study Sheets</h3>
        <p>Read the preparation sheet with chapters, easy translation, and bookmarks.</p>
        <div class="row">
          <span class="small muted">Bookmarked: ${progress.bookmarks.chapters.length}</span>
          <a class="btn primary" href="#/study">Open</a>
        </div>
      </div>

      <div class="card">
        <div class="badge">Practice</div>
        <h3>📝 Practice Questions</h3>
        <p>Topic-wise MCQ practice with instant answers & explanation.</p>
        <div class="row">
          <span class="small muted">Done: ${progress.practiceDone}</span>
          <a class="btn primary" href="#/practice">Start</a>
        </div>
      </div>

      <div class="card">
        <div class="badge">Mock Exam</div>
        <h3>⏱️ Real Exam (50Q / 50min)</h3>
        <p>Timer + flag + navigator + review.</p>
        <div class="row">
          <span class="small muted">${lastMock ? `Last: ${lastMock.score}/${lastMock.total}` : "No mock yet"}</span>
          <a class="btn primary" href="#/exam">Start</a>
        </div>
      </div>
    </div>

    <div class="hr"></div>
    <div class="row-gap">
      <span class="badge">Search</span>
      <span class="small muted">Type in the top-right search box and press Enter.</span>
      <a class="chip" href="#/search?q=taksi">Demo: taksi</a>
    </div>
  `;
}

// ===== Study (Part 2) =====
function renderStudy() {
  setActiveNav("study");

  const chapters = state.sheets?.chapters || [];
  if (!chapters.length) {
    pageEl.innerHTML = `
      <h1 class="h1">📘 Study Sheets</h1>
      <p class="lead">No chapters found in <code>data/sheets.json</code>.</p>
    `;
    return;
  }

  const progress = getProgress();
  const bookmarked = new Set(progress.bookmarks.chapters || []);
  const selected = chapters.find(c => c.id === state.selectedChapterId) || chapters[0];

  const chapterListHtml = chapters.map(c => {
    const isActive = c.id === selected.id;
    const isBm = bookmarked.has(c.id);
    return `
      <div class="item ${isActive ? "active" : ""}" data-chapter="${escapeHtml(c.id)}">
        <div class="row-gap" style="justify-content:space-between;">
          <div>
            <div style="font-weight:700">${escapeHtml(c.title)}</div>
            <div class="kicker mono">${escapeHtml(c.id)} • ${c.items?.length || 0} lines</div>
          </div>
          <div class="kicker">${isBm ? "⭐" : ""}</div>
        </div>
      </div>
    `;
  }).join("");

  const items = selected.items || [];
  const linesHtml = items.map((it) => `
    <div class="p">
      <span class="fi">${escapeHtml(it.fi || "")}</span>
      <span class="bn">${escapeHtml(it.bn || "")}</span>
      ${it.note ? `<div class="kicker mono">${escapeHtml(it.note)}</div>` : ""}
    </div>
  `).join("");

  const isBookmarked = bookmarked.has(selected.id);

  pageEl.innerHTML = `
    <div class="row-gap" style="justify-content:space-between;">
      <div>
        <h1 class="h1">📘 Study Sheets</h1>
        <p class="lead">Select a chapter from the left. Bookmark important chapters.</p>
      </div>
      <div class="row-gap">
        <button id="bookmarkChapter" class="btn ${isBookmarked ? "primary" : ""}" type="button">
          ${isBookmarked ? "⭐ Bookmarked" : "☆ Bookmark"}
        </button>
        <button id="printChapter" class="btn" type="button">🖨️ Print</button>
      </div>
    </div>

    <div class="two-col" style="margin-top:14px;">
      <div class="panel">
        <div class="row-gap" style="justify-content:space-between; margin-bottom:10px;">
          <div class="badge">Chapters</div>
          <div class="kicker">Total: ${chapters.length}</div>
        </div>
        <div id="chapterList" class="list">${chapterListHtml}</div>
      </div>

      <div class="panel">
        <div class="badge">Reading</div>
        <h2 class="h2" style="margin-top:10px;">${escapeHtml(selected.title)}</h2>
        <div class="kicker mono">Chapter ID: ${escapeHtml(selected.id)} • Lines: ${items.length}</div>
        <div class="hr"></div>
        <div id="chapterContent">${linesHtml || `<p class="lead">No content lines inside this chapter.</p>`}</div>
      </div>
    </div>
  `;

  document.getElementById("chapterList").addEventListener("click", (e) => {
    const item = e.target.closest(".item");
    if (!item) return;
    const id = item.getAttribute("data-chapter");
    state.selectedChapterId = id;
    LS.set("selected_chapter_id", id);
    renderStudy();
  });

  document.getElementById("bookmarkChapter").addEventListener("click", () => {
    const p = getProgress();
    const set = new Set(p.bookmarks.chapters || []);
    if (set.has(selected.id)) set.delete(selected.id);
    else set.add(selected.id);
    p.bookmarks.chapters = [...set];
    setProgress(p);
    renderStudy();
  });

  document.getElementById("printChapter").addEventListener("click", () => window.print());
}

// ===== Search (Part 2) =====
function renderSearch() {
  setActiveNav("");
  const params = parseQueryStringFromHash();
  const q = (params.q || state.searchText || "").trim();

  if (!q) {
    pageEl.innerHTML = `
      <h1 class="h1">🔎 Search</h1>
      <p class="lead">Type something in the top search box and press Enter.</p>
    `;
    return;
  }

  const chapters = state.sheets?.chapters || [];
  const sheetHits = [];
  for (const ch of chapters) {
    const inTitle = includesText(ch.title, q) || includesText(ch.id, q);
    const matchedLines = (ch.items || []).filter(it =>
      includesText(it.fi, q) || includesText(it.bn, q) || includesText(it.note, q)
    );
    if (inTitle || matchedLines.length) {
      sheetHits.push({ id: ch.id, title: ch.title, count: matchedLines.length, sample: matchedLines.slice(0, 2) });
    }
  }

  const qs = getAllQuestions();
  const questionHits = [];
  for (const qu of qs) {
    const inQ = includesText(qu.question_fi, q) || includesText(qu.question_bn, q) || includesText(qu.topic, q);
    const inOpt = (qu.options || []).some(o => includesText(o.fi, q) || includesText(o.bn, q));
    if (inQ || inOpt) questionHits.push(qu);
  }

  const sheetHtml = sheetHits.length ? sheetHits.map(h => {
    const sampleHtml = (h.sample || []).map(s => `
      <div class="p" style="margin:8px 0 0;">
        <span class="fi">${escapeHtml(s.fi || "")}</span>
        <span class="bn">${escapeHtml(s.bn || "")}</span>
      </div>
    `).join("");
    return `
      <div class="item" data-open-chapter="${escapeHtml(h.id)}">
        <div style="font-weight:800">${escapeHtml(h.title)}</div>
        <div class="kicker mono">Chapter ${escapeHtml(h.id)} • matched lines: ${h.count}</div>
        ${sampleHtml}
        <div class="row-gap" style="margin-top:10px;"><span class="chip">Open chapter</span></div>
      </div>
    `;
  }).join("") : `<p class="lead">No matches in sheets.</p>`;

  const qHtml = questionHits.length ? questionHits.slice(0, 20).map(qu => `
    <div class="item">
      <div class="row-gap" style="justify-content:space-between;">
        <div style="font-weight:800">${escapeHtml(qu.topic || "Topic")}</div>
        <div class="kicker mono">${escapeHtml(qu.id)}</div>
      </div>
      <div class="p" style="margin-top:8px;">
        <span class="fi">${escapeHtml(qu.question_fi || "")}</span>
        <span class="bn">${escapeHtml(qu.question_bn || "")}</span>
      </div>
      <div class="row-gap" style="margin-top:10px;">
        <a class="chip" href="#/practice?topic=${encodeURIComponent(qu.topic || "ALL")}">Practice this topic</a>
      </div>
    </div>
  `).join("") : `<p class="lead">No matches in questions.</p>`;

  pageEl.innerHTML = `
    <div class="row-gap" style="justify-content:space-between;">
      <div>
        <h1 class="h1">🔎 Search results</h1>
        <p class="lead">Query: <span class="mono">${escapeHtml(q)}</span></p>
      </div>
      <div class="row-gap">
        <span class="badge">Sheets: ${sheetHits.length}</span>
        <span class="badge">Questions: ${questionHits.length}</span>
      </div>
    </div>

    <div class="two-col" style="margin-top:14px;">
      <div class="panel">
        <div class="badge">📘 Sheet matches</div>
        <div class="hr"></div>
        <div id="sheetResults" class="list">${sheetHtml}</div>
      </div>

      <div class="panel">
        <div class="badge">📝 Question matches</div>
        <div class="hr"></div>
        <div class="list">${qHtml}</div>
      </div>
    </div>
  `;

  document.getElementById("sheetResults")?.addEventListener("click", (e) => {
    const box = e.target.closest(".item");
    if (!box) return;
    const id = box.getAttribute("data-open-chapter");
    if (!id) return;
    state.selectedChapterId = id;
    LS.set("selected_chapter_id", id);
    location.hash = "#/study";
  });
}

// ===== Practice (Part 3) =====
function resetPracticePool(custom = {}) {
  const { topic = state.practice.topic, size = state.practice.show } = custom;
  const all = getAllQuestions();
  const filtered = (topic === "ALL") ? all : all.filter(q => (q.topic || "") === topic);
  const pool = shuffle(filtered).slice(0, Math.max(1, Math.min(size, filtered.length || size)));

  state.practice.pool

