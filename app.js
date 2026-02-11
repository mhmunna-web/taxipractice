const pageEl = document.getElementById("page");

let questions = [];
let sheets = [];

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
    sheets = await res.json(); // expecting array
    if(!Array.isArray(sheets)) sheets = [];
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

/* ---------------- STUDY (SHOW PNG SHEETS) ---------------- */

function renderStudy(){
  if(!sheets.length){
    pageEl.innerHTML = `
      <h1 class="h1">📘 Study Sheets</h1>
      <p class="lead">No sheets found. Add images in assets/sheets and list them in data/sheets.json</p>
    `;
    return;
  }

  const cards = sheets.map((s, i) => {
    const imgPath = s.image || "";
    const safeSrc = encodeURI("./" + imgPath); // handles spaces
    const safeLink = encodeURI("./" + imgPath);

    return `
      <div class="qbox">
        <div class="row-gap" style="justify-content:space-between;">
          <b>${i+1}) ${s.title || "Sheet"}</b>
          <a class="btn" href="${safeLink}" target="_blank">Open</a>
        </div>
        <div class="hr"></div>
        <img
          src="${safeSrc}"
          alt="${(s.title || "Sheet")}"
          style="width:100%; border-radius:12px; border:1px solid var(--line);"
        />
      </div>
    `;
  }).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📘 Study Sheets</h1>
    <p class="lead">Tap Open to view full image.</p>
    ${cards}
  `;
}

/* ---------------- PRACTICE ---------------- */

let pIndex = 0;

function renderPractice(){
  if(!questions.length){
    pageEl.innerHTML = `<h1 class="h1">📝 Practice Questions</h1><p class="lead">No questions found.</p>`;
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
    <div class="alert">Exam timer system next step e add korbo.</div>
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

  if(hash === "#/study") renderStudy();
  else if(hash === "#/practice") renderPractice();
  else if(hash === "#/exam") renderExam();
  else if(hash === "#/progress") renderProgress();
  else if(hash === "#/resources") renderResources();
  else renderHome();
}

window.addEventListener("hashchange", router);

/* ---------------- INIT ---------------- */

Promise.all([loadQuestions(), loadSheets()]).then(router);
