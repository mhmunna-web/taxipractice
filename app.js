const pageEl = document.getElementById("page");
const themeBtn = document.getElementById("toggleTheme");
const searchEl = document.getElementById("globalSearch");

const state = {
  sheets: null,
  questionsData: null,
  selectedChapterId: null,
  practice: {
    topic: "ALL",
    pool: [],
    index: 0,
    selected: null,
    submitted: false,
    show: 10
  }
};

const LS = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

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

function setActiveNav(route) {
  document.querySelectorAll(".nav-link").forEach(a => {
    a.classList.toggle("active", a.dataset.route === route);
  });
}

function escapeHtml(s="") {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function loadData() {
  if (state.sheets && state.questionsData) return;

  const sheetsRes = await fetch("./data/sheets.json");
  const questionsRes = await fetch("./data/questions.json");

  if (!sheetsRes.ok) throw new Error("sheets.json not found");
  if (!questionsRes.ok) throw new Error("questions.json not found");

  state.sheets = await sheetsRes.json();
  state.questionsData = await questionsRes.json();

  if (!state.selectedChapterId && state.sheets?.chapters?.length) {
    state.selectedChapterId = state.sheets.chapters[0].id;
  }
  resetPracticePool();
}

function getAllQuestions() {
  return state.questionsData?.questions || [];
}
function getTopics() {
  const t = state.questionsData?.topics || [];
  return t.length ? t : ["ALL"];
}

function resetPracticePool() {
  const all = getAllQuestions();
  const filtered = state.practice.topic === "ALL"
    ? all
    : all.filter(q => q.topic === state.practice.topic);

  state.practice.pool = shuffle(filtered).slice(0, Math.min(state.practice.show, filtered.length || state.practice.show));
  state.practice.index = 0;
  state.practice.selected = null;
  state.practice.submitted = false;
}

function renderHome() {
  setActiveNav("home");
  pageEl.innerHTML = `
    <h1 class="h1">Welcome 👋</h1>
    <p class="lead">Study sheets + practice questions.</p>

    <div class="grid">
      <div class="card">
        <div class="badge">Study</div>
        <h3>📘 Study Sheets</h3>
        <p>Read chapters with FI + BN.</p>
        <div class="row">
          <span class="small muted">Chapters: ${(state.sheets?.chapters?.length || 0)}</span>
          <a class="btn primary" href="#/study">Open</a>
        </div>
      </div>

      <div class="card">
        <div class="badge">Practice</div>
        <h3>📝 Practice Questions</h3>
        <p>MCQ practice with result.</p>
        <div class="row">
          <span class="small muted">Questions: ${getAllQuestions().length}</span>
          <a class="btn primary" href="#/practice">Start</a>
        </div>
      </div>

      <div class="card">
        <div class="badge">Progress</div>
        <h3>📈 Progress</h3>
        <p>Will be added later.</p>
        <div class="row">
          <span class="small muted">Coming soon</span>
          <a class="btn" href="#/progress">Open</a>
        </div>
      </div>
    </div>
  `;
}

function renderStudy() {
  setActiveNav("study");
  const chapters = state.sheets?.chapters || [];
  if (!chapters.length) {
    pageEl.innerHTML = `<h1 class="h1">📘 Study Sheets</h1><p class="lead">No chapters found.</p>`;
    return;
  }

  const selected = chapters.find(c => c.id === state.selectedChapterId) || chapters[0];

  const listHtml = chapters.map(c => `
    <div class="item ${c.id===selected.id ? "active" : ""}" data-ch="${escapeHtml(c.id)}">
      <div style="font-weight:800">${escapeHtml(c.title)}</div>
      <div class="small muted">${escapeHtml(c.id)} • ${(c.items?.length||0)} lines</div>
    </div>
  `).join("");

  const contentHtml = (selected.items || []).map(it => `
    <div style="margin:12px 0; line-height:1.7;">
      <div style="font-weight:700">${escapeHtml(it.fi || "")}</div>
      <div class="muted">${escapeHtml(it.bn || "")}</div>
    </div>
  `).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📘 Study Sheets</h1>
    <p class="lead">Select a chapter.</p>

    <div class="two-col" style="margin-top:14px;">
      <div class="panel">
        <div class="badge">Chapters</div>
        <div class="hr"></div>
        <div id="chapterList" class="list">${listHtml}</div>
      </div>

      <div class="panel">
        <div class="badge">Reading</div>
        <h2 style="margin:10px 0 0;">${escapeHtml(selected.title)}</h2>
        <div class="hr"></div>
        ${contentHtml || `<p class="lead">No content.</p>`}
      </div>
    </div>
  `;

  document.getElementById("chapterList").addEventListener("click", (e) => {
    const it = e.target.closest(".item");
    if (!it) return;
    state.selectedChapterId = it.getAttribute("data-ch");
    renderStudy();
  });
}

function renderPractice() {
  setActiveNav("practice");
  const all = getAllQuestions();
  if (!all.length) {
    pageEl.innerHTML = `<h1 class="h1">📝 Practice</h1><p class="lead">No questions found.</p>`;
    return;
  }
  if (!state.practice.pool.length) resetPracticePool();
  const q = state.practice.pool[state.practice.index];

  const topics = ["ALL", ...getTopics().filter(t => t !== "ALL")];

  const optsHtml = (q.options || []).map(opt => {
    const checked = state.practice.selected === opt.id ? "checked" : "";
    let cls = "option";
    if (state.practice.submitted && q.answer) {
      if (opt.id === q.answer) cls += " correct";
      else if (opt.id === state.practice.selected) cls += " wrong";
    }
    return `
      <label class="${cls}">
        <input type="radio" name="opt" value="${escapeHtml(opt.id)}" ${checked} ${state.practice.submitted ? "disabled" : ""}/>
        <div>
          <div style="font-weight:700">${escapeHtml(opt.fi || "")}</div>
          <div class="muted small">${escapeHtml(opt.bn || "")}</div>
        </div>
      </label>
    `;
  }).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📝 Practice Questions</h1>
    <p class="lead">Submit to see result.</p>

    <div class="controls">
      <div class="row-gap">
        <span class="small muted">Topic</span>
        <select id="topicSel" class="select">
          ${topics.map(t => `<option value="${escapeHtml(t)}" ${t===state.practice.topic ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
        </select>

        <span class="small muted">Set</span>
        <select id="sizeSel" class="select">
          ${[10,20,30,50].map(n => `<option value="${n}" ${n===state.practice.show ? "selected" : ""}>${n} questions</option>`).join("")}
        </select>

        <button id="newSet" class="btn" type="button">🔁 New set</button>
      </div>

      <div class="row-gap">
        <span class="badge">Q: ${state.practice.index+1}/${state.practice.pool.length}</span>
        <span class="badge">${escapeHtml(q.topic || "Topic")}</span>
      </div>
    </div>

    <div class="qbox">
      <div class="small muted">${escapeHtml(q.id || "")}</div>
      <div style="margin-top:10px; line-height:1.7;">
        <div style="font-weight:800">${escapeHtml(q.question_fi || "")}</div>
        <div class="muted">${escapeHtml(q.question_bn || "")}</div>
      </div>

      <div id="opts">${optsHtml}</div>

      <div class="row-gap" style="margin-top:14px; justify-content:space-between;">
        <div class="row-gap">
          <button id="submitBtn" class="btn primary" type="button" ${state.practice.submitted ? "disabled" : ""}>Submit</button>
          <button id="nextBtn" class="btn" type="button" ${state.practice.submitted ? "" : "disabled"}>Next ▶</button>
        </div>
      </div>

      <div id="feedback"></div>
    </div>
  `;

  document.getElementById("opts").addEventListener("change", (e) => {
    const r = e.target.closest("input[type=radio]");
    if (!r) return;
    state.practice.selected = r.value;
  });

  document.getElementById("topicSel").addEventListener("change", (e) => {
    state.practice.topic = e.target.value;
    resetPracticePool();
    renderPractice();
  });

  document.getElementById("sizeSel").addEventListener("change", (e) => {
    state.practice.show = Number(e.target.value);
    resetPracticePool();
    renderPractice();
  });

  document.getElementById("newSet").addEventListener("click", () => {
    resetPracticePool();
    renderPractice();
  });

  document.getElementById("submitBtn").addEventListener("click", () => {
    if (!state.practice.selected) {
      document.getElementById("feedback").innerHTML = `<div class="alert">⚠️ Select an option first.</div>`;
      return;
    }

    // ✅ answer না থাকলে
    if (!q.answer) {
      state.practice.submitted = true;
      document.getElementById("feedback").innerHTML = `
        <div class="alert">
          <div style="font-weight:800">ℹ️ Answer not set yet</div>
          <div class="hr"></div>
          <div class="muted">This question is added, but the correct answer is not set yet.</div>
        </div>
      `;
      renderPractice();
      return;
    }

    state.practice.submitted = true;
    const correct = state.practice.selected === q.answer;

    document.getElementById("feedback").innerHTML = `
      <div class="alert">
        <div style="font-weight:800">${correct ? "✅ Correct" : "❌ Wrong"}</div>
        <div class="hr"></div>
        <div class="small muted">${escapeHtml(q.explain_fi || "")}</div>
        <div class="small muted">${escapeHtml(q.explain_bn || "")}</div>
      </div>
    `;
    renderPractice();
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    state.practice.index = Math.min(state.practice.index + 1, state.practice.pool.length - 1);
    state.practice.selected = null;
    state.practice.submitted = false;
    renderPractice();
  });
}

function renderProgress() {
  setActiveNav("progress");
  pageEl.innerHTML = `<h1 class="h1">📈 Progress</h1><p class="lead">Coming soon.</p>`;
}

function renderResources() {
  setActiveNav("resources");
  pageEl.innerHTML = `<h1 class="h1">🔗 Resources / FAQ</h1><p class="lead">Add links later.</p>`;
}

async function router() {
  try {
    await loadData();
  } catch (e) {
    pageEl.innerHTML = `<h1 class="h1">Error</h1><p class="lead">${escapeHtml(String(e.message || e))}</p>`;
    return;
  }

  const hash = location.hash || "#/home";
  const path = hash.replace("#","");

  if (path.startsWith("/home")) return renderHome();
  if (path.startsWith("/study")) return renderStudy();
  if (path.startsWith("/practice")) return renderPractice();
  if (path.startsWith("/progress")) return renderProgress();
  if (path.startsWith("/resources")) return renderResources();

  location.hash = "#/home";
}

window.addEventListener("hashchange", router);

searchEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") alert("Search will be added later.");
});

router();
