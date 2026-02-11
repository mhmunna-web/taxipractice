const pageEl = document.getElementById("page");

/* ---------------- DATA ---------------- */

let questions = [];
let sheets = [];

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
    <p class="lead">
      Finland Taxi Exam preparation platform.<br>
      Study sheets, practice questions & real exam simulation.
    </p>
  `;
}

/* ---------------- STUDY SHEETS (PNG SHOW) ---------------- */

function renderStudy(){
  if(!sheets.length){
    pageEl.innerHTML = `
      <h1 class="h1">📘 Study Sheets</h1>
      <p class="lead">No sheets found. Add list in <b>data/sheets.json</b>.</p>
    `;
    return;
  }

  const cards = sheets.map((s, i) => {
    const img = s.image || "";
    return `
      <div class="qbox">
        <div class="row-gap" style="justify-content:space-between;">
          <b>${i+1}) ${s.title || "Sheet"}</b>
          <a class="btn" href="./${encodeURI(img)}" target="_blank">Open Full</a>
        </div>
        <div class="hr"></div>
        <img
          src="./${encodeURI(img)}"
          alt="${s.title || "Sheet"}"
          style="width:100%; border-radius:12px; border:1px solid var(--line);"
        />
      </div>
    `;
  }).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📘 Study Sheets</h1>
    <p class="lead">Tap <b>Open Full</b> for full screen.</p>
    ${cards}
  `;
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
        <button class="btn primary" onclick="submitPractice()">Submit</button>
        <button class="btn" onclick="nextPractice()">Next</button>
      </div>

      <div id="result" style="margin-top:10px;"></div>
    </div>
  `;
}

window.submitPractice = function(){
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

  if(val.value === q.answer){
    document.getElementById("result").innerHTML = `<div class="alert">✅ Correct</div>`;
  }else{
    document.getElementById("result").innerHTML = `<div class="alert">❌ Wrong</div>`;
  }
};

window.nextPractice = function(){
  pIndex++;
  if(pIndex >= questions.length) pIndex = 0;
  renderPractice();
};

/* ---------------- REAL EXAM ---------------- */

function renderExam(){
  pageEl.innerHTML = `
    <h1 class="h1">⏱️ Real Time Exam</h1>
    <p class="lead">50 Questions • 50 Minutes</p>
    <div class="alert">Real exam timer system next step e add korbo.</div>
  `;
}

/* ---------------- PROGRESS ---------------- */

function renderProgress(){
  pageEl.innerHTML = `
    <h1 class="h1">📈 Progress</h1>
    <p class="lead">Coming soon.</p>
  `;
}

/* ---------------- RESOURCES ---------------- */

function renderResources(){
  pageEl.innerHTML = `
    <h1 class="h1">🔗 Resources / FAQ</h1>
    <p class="lead">Links will be added.</p>
  `;
}

/* ---------------- ROUTER ---------------- */

function router(){
  const hash = location.hash || "#/home";

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

Promise.all([loadQuestions(), loadSheets()]).then(router);

