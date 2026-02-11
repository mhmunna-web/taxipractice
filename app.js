const pageEl = document.getElementById("page");
const navLinksEl = document.getElementById("navLinks");

let questions = [];
let sheets = [];

/* ---------------- NAV (Dynamic Menu) ---------------- */

const NAV_ITEMS = [
  { hash:"#/home",     label:"Home",            icon:"🏠" },
  { hash:"#/study",    label:"Study Sheets",    icon:"📘" },
  { hash:"#/practice", label:"Practice Questions", icon:"📝" },
  { hash:"#/exam",     label:"Real Time Exam",  icon:"⏱️" },
  { hash:"#/progress", label:"Progress",        icon:"📈" },
  { hash:"#/resources",label:"Resources / FAQ", icon:"🔗" }
];

function renderNav(currentHash){
  if(!navLinksEl) return;

  // Home page => show all
  const showAll = (currentHash === "#/home" || !currentHash);

  let itemsToShow = [];
  if(showAll){
    itemsToShow = NAV_ITEMS;
  }else{
    const currentItem = NAV_ITEMS.find(x => x.hash === currentHash);
    const homeItem = NAV_ITEMS.find(x => x.hash === "#/home");
    itemsToShow = [homeItem, currentItem].filter(Boolean);
  }

  navLinksEl.innerHTML = `
    <div class="navlist">
      ${itemsToShow.map(it => `
        <a class="navitem ${it.hash === currentHash ? "active":""}" href="${it.hash}">
          <span class="navicon">${it.icon}</span>
          <span>${it.label}</span>
        </a>
      `).join("")}
    </div>
  `;
}

/* ---------------- LOAD ---------------- */

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

/* ---------------- HOME ---------------- */

function renderHome(){
  pageEl.innerHTML = `
    <h1 class="h1">Welcome 👋</h1>
    <p class="lead">Study sheets, practice questions & real exam.</p>
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
      <p class="lead">No sheets found in data/sheets.json</p>
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
        <div class="pill" style="padding:6px 10px;border-radius:999px;border:1px solid var(--line);">
          Zoom: <b id="zoomLabel">Fit</b>
        </div>
        <button class="btn" id="btnZoomIn">+</button>
      </div>

      <div class="hr"></div>

      <div id="imgWrap" style="overflow:auto; max-height:70vh; border-radius:12px;">
        <img id="sheetImg" src="${src}" alt="sheet"
             style="display:block; width:100%; border-radius:12px; border:1px solid var(--line);" />
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
        <div style="font-weight:700">${o.fi || ""}</div>
        <div class="muted small">${o.bn || ""}</div>
      </div>
    </label>
  `).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📝 Practice Questions</h1>
    <div class="qbox">
      <div><b>${q.question_fi || ""}</b></div>
      <div class="muted">${q.question_bn || ""}</div>

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
      ? `<div class="alert">✅ Correct</div>`
      : `<div class="alert">❌ Wrong</div>`;
}

function nextPractice(){
  pIndex = (pIndex + 1) % questions.length;
  renderPractice();
}

/* ---------------- OTHER PAGES ---------------- */

function renderExam(){
  pageEl.innerHTML = `
    <h1 class="h1">⏱️ Real Time Exam</h1>
    <p class="lead">50 Questions • 50 Minutes</p>
    <div class="alert">Timer system next step e add korbo.</div>
  `;
}

function renderProgress(){
  pageEl.innerHTML = `<h1 class="h1">📈 Progress</h1><p class="lead">Coming soon.</p>`;
}

function renderResources(){
  pageEl.innerHTML = `<h1 class="h1">🔗 Resources / FAQ</h1><p class="lead">Links will be added.</p>`;
}

/* ---------------- ROUTER ---------------- */

function router(){
  const hash = location.hash || "#/home";

  // ✅ render menu based on current page
  renderNav(hash);

  if(hash === "#/home") renderHome();
  else if(hash === "#/study") renderStudy();
  else if(hash === "#/practice") renderPractice();
  else if(hash === "#/exam") renderExam();
  else if(hash === "#/progress") renderProgress();
  else if(hash === "#/resources") renderResources();
  else renderHome();
}

window.addEventListener("hashchange", router);

/* ---------------- INIT ---------------- */

(async function init(){
  await Promise.all([loadQuestions(), loadSheets()]);
  router();
})();
