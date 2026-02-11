const pageEl = document.getElementById("page");

let questions = [];
let sheets = [];

/* ---------------- ROUTES (4 items only) ---------------- */

const NAV_ITEMS = [
  { hash:"#/home",  label:"Home",            icon:"🏠" },
  { hash:"#/study", label:"Study Sheets",    icon:"📘" },
  { hash:"#/practice", label:"Practice Questions", icon:"📝" },
  { hash:"#/exam",  label:"Real Time Exam",  icon:"⏱️" }
];

function setActiveNav(currentHash){
  const links = document.querySelectorAll(".nav .nav-link");
  links.forEach(a => {
    const route = a.getAttribute("href");
    a.classList.toggle("active", route === currentHash);
  });
}

/* ---------------- LOAD DATA ---------------- */

async function loadQuestions(){
  try{
    const res = await fetch("./data/questions.json");
    const data = await res.json();
    questions = data.questions || [];
  }catch{
    questions = [];
  }
}

async function loadSheets(){
  try{
    const res = await fetch("./data/sheets.json");
    const data = await res.json();
    sheets = Array.isArray(data) ? data : [];
  }catch{
    sheets = [];
  }
}

/* ---------------- HOME (UPDATED CONTENT) ---------------- */

function renderHome(){
  const totalSheets = sheets.length || 0;
  const totalQ = questions.length || 0;

  pageEl.innerHTML = `
    <div class="hero">
      <div class="hero-badge">FINLAND • TAXI EXAM • PREP</div>

      <h1 class="hero-title">Welcome 👋</h1>
      <p class="hero-sub">
        This is a focused learning platform for <b>Finland Taxi Exam</b> preparation — built for quick revision,
        realistic practice, and bilingual support (Bangla + Finnish).
      </p>

      <div class="hero-points">
        <div class="point">✅ Study Sheets: easy reading + zoom + page jump</div>
        <div class="point">✅ Practice Questions: instant correct/wrong result</div>
        <div class="point">✅ Real Time Exam: 50Q/50min (next step: timer + score)</div>
      </div>

      <div class="hero-actions">
        <a class="btn primary" href="#/study">📘 Start Study</a>
        <a class="btn" href="#/practice">📝 Practice</a>
        <a class="btn" href="#/exam">⏱️ Real Exam</a>
      </div>

      <div class="stat-grid">
        <div class="stat">
          <div class="stat-num">${totalSheets}</div>
          <div class="stat-label">Sheets</div>
        </div>
        <div class="stat">
          <div class="stat-num">${totalQ}</div>
          <div class="stat-label">Questions</div>
        </div>
        <div class="stat">
          <div class="stat-num">50</div>
          <div class="stat-label">Exam Q</div>
        </div>
        <div class="stat">
          <div class="stat-num">50m</div>
          <div class="stat-label">Target Time</div>
        </div>
      </div>

      <div class="hero-note">
        <b>Tip:</b> Start with sheets → then practice → then real exam.
      </div>
    </div>
  `;
}

/* ---------------- STUDY VIEWER ---------------- */

let sheetIndex = 0;
let zoom = 1;
let fitMode = true;

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function currentSheet(){
  if(!sheets.length) return null;
  sheetIndex = clamp(sheetIndex, 0, sheets.length - 1);
  return sheets[sheetIndex];
}

function applyZoom(){
  const img = document.getElementById("sheetImg");
  const zLabel = document.getElementById("zoomLabel");
  if(!img || !zLabel) return;

  if(fitMode){
    img.style.width = "100%";
    img.style.maxWidth = "100%";
    img.style.transform = "scale(1)";
    zLabel.textContent = "Fit";
  }else{
    img.style.width = "auto";
    img.style.maxWidth = "none";
    img.style.transformOrigin = "top center";
    img.style.transform = `scale(${zoom})`;
    zLabel.textContent = Math.round(zoom * 100) + "%";
  }
}

function buildPageOptions(){
  return sheets.map((_, i) => {
    const n = i + 1;
    const sel = i === sheetIndex ? "selected" : "";
    return `<option value="${i}" ${sel}>Page ${String(n).padStart(2,"0")}</option>`;
  }).join("");
}

function renderStudy(){
  if(!sheets.length){
    pageEl.innerHTML = `
      <h1 class="h1">📘 Study Sheets</h1>
      <p class="lead">No sheets found in <b>data/sheets.json</b></p>
      <div class="alert">Please check: data/sheets.json → image path should match assets/sheets/...</div>
    `;
    return;
  }

  const s = currentSheet();
  const src = "./" + encodeURI(s.image);

  pageEl.innerHTML = `
    <h1 class="h1">📘 Study Sheets</h1>

    <div class="qbox">
      <div class="row-gap" style="justify-content:space-between; align-items:center;">
        <div>
          <b id="sheetTitle">${s.title || "Sheet"}</b><br>
          <span class="muted small">
            Page <b id="pageNum">${sheetIndex + 1}</b> / <b id="pageTotal">${sheets.length}</b>
          </span>
        </div>

        <div class="row-gap">
          <select class="select" id="pageJump">${buildPageOptions()}</select>
          <a class="btn" href="${src}" target="_blank">Open Full</a>
        </div>
      </div>

      <div class="hr"></div>

      <div class="row-gap" style="flex-wrap:wrap;">
        <button class="btn" id="btnPrev">⬅ Prev</button>
        <button class="btn" id="btnNext">Next ➡</button>

        <button class="btn" id="btnFit">Fit/Reset</button>
        <button class="btn" id="btnZoomOut">−</button>
        <div class="pill">
          Zoom: <b id="zoomLabel">Fit</b>
        </div>
        <button class="btn" id="btnZoomIn">+</button>
      </div>

      <div class="hr"></div>

      <div id="imgWrap" class="imgwrap">
        <img id="sheetImg" src="${src}" alt="sheet" class="sheetimg" />
      </div>
    </div>
  `;

  document.getElementById("btnPrev").onclick = () => goPrev();
  document.getElementById("btnNext").onclick = () => goNext();

  document.getElementById("btnFit").onclick = () => { fitMode = true; zoom = 1; applyZoom(); };
  document.getElementById("btnZoomIn").onclick = () => { fitMode = false; zoom = clamp(zoom + 0.1, 1, 3); applyZoom(); };
  document.getElementById("btnZoomOut").onclick = () => { fitMode = false; zoom = clamp(zoom - 0.1, 1, 3); applyZoom(); };

  document.getElementById("pageJump").onchange = (e) => {
    sheetIndex = Number(e.target.value);
    updateStudyUI(true);
  };

  const img = document.getElementById("sheetImg");
  img.onload = () => applyZoom();
}

function updateStudyUI(resetScroll){
  const s = currentSheet();
  const img = document.getElementById("sheetImg");
  const title = document.getElementById("sheetTitle");
  const pageNum = document.getElementById("pageNum");
  const pageTotal = document.getElementById("pageTotal");
  const jump = document.getElementById("pageJump");
  const wrap = document.getElementById("imgWrap");

  if(!s || !img || !title || !pageNum || !pageTotal || !jump) return;

  const src = "./" + encodeURI(s.image);

  title.textContent = s.title || "Sheet";
  pageNum.textContent = String(sheetIndex + 1);
  pageTotal.textContent = String(sheets.length);

  jump.innerHTML = buildPageOptions();
  if(resetScroll && wrap) wrap.scrollTop = 0;

  img.src = src;
}

function goNext(){
  sheetIndex = (sheetIndex + 1) % sheets.length;
  updateStudyUI(true);
}
function goPrev(){
  sheetIndex = (sheetIndex - 1 + sheets.length) % sheets.length;
  updateStudyUI(true);
}

/* ---------------- PRACTICE ---------------- */

let pIndex = 0;

function renderPractice(){
  if(!questions.length){
    pageEl.innerHTML = `
      <h1 class="h1">📝 Practice Questions</h1>
      <p class="lead">No questions found yet.</p>
    `;
    return;
  }

  const q = questions[pIndex];
  const opts = (q.options || []).map(o=>`
    <label class="option">
      <input type="radio" name="opt" value="${o.id}">
      <div>
        <div class="opt-fi">${o.fi || ""}</div>
        <div class="muted small">${o.bn || ""}</div>
      </div>
    </label>
  `).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📝 Practice Questions</h1>
    <div class="qbox">
      <div class="qtitle"><b>${q.question_fi || ""}</b></div>
      <div class="muted">${q.question_bn || ""}</div>

      <div class="hr"></div>

      ${opts}

      <div class="row-gap" style="margin-top:12px;">
        <button class="btn primary" id="btnSubmit">Submit</button>
        <button class="btn" id="btnNextQ">Next</button>
      </div>

      <div id="result" style="margin-top:10px;"></div>
    </div>
  `;

  document.getElementById("btnSubmit").onclick = submitPractice;
  document.getElementById("btnNextQ").onclick = nextPractice;
}

function submitPractice(){
  const q = questions[pIndex];
  const val = document.querySelector("input[name=opt]:checked");

  if(!val){
    alert("Select answer first");
    return;
  }

  if(!q.answer){
    document.getElementById("result").innerHTML = `<div class="alert">ℹ️ Answer not set yet</div>`;
    return;
  }

  document.getElementById("result").innerHTML =
    (val.value === q.answer)
      ? `<div class="alert ok">✅ Correct<br><span class="small muted">${q.explain_fi || ""}</span></div>`
      : `<div class="alert bad">❌ Wrong<br><span class="small muted">${q.explain_fi || ""}</span></div>`;
}

function nextPractice(){
  pIndex = (pIndex + 1) % questions.length;
  renderPractice();
}

/* ---------------- EXAM (placeholder) ---------------- */

function renderExam(){
  pageEl.innerHTML = `
    <h1 class="h1">⏱️ Real Time Exam</h1>
    <p class="lead">50 Questions • 50 Minutes</p>
    <div class="alert">Timer + score system next step e add korbo.</div>
  `;
}

/* ---------------- ROUTER ---------------- */

function router(){
  const hash = location.hash || "#/home";
  setActiveNav(hash);

  if(hash === "#/home") renderHome();
  else if(hash === "#/study") renderStudy();
  else if(hash === "#/practice") renderPractice();
  else if(hash === "#/exam") renderExam();
  else renderHome();
}

window.addEventListener("hashchange", router);

/* ---------------- INIT ---------------- */

(async function init(){
  await Promise.all([loadQuestions(), loadSheets()]);
  router();
})();
