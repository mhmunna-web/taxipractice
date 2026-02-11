const pageEl = document.getElementById("page");

/* ---------------- LOAD QUESTIONS ---------------- */

let questions = [];

async function loadQuestions(){
  try{
    const res = await fetch("./data/questions.json");
    const data = await res.json();
    questions = data.questions || [];
  }catch{
    questions = [];
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

    <div class="alert">
      <div style="font-weight:800">🚕 Ready to Start</div>
      <div class="hr"></div>
      <div class="muted small">
        Use the sidebar menu to begin your preparation.
      </div>
    </div>
  `;
}

/* ---------------- STUDY ---------------- */

function renderStudy(){
  pageEl.innerHTML = `
    <h1 class="h1">📘 Study Sheets</h1>
    <p class="lead"> will be added here

.</p>
  `;
}

/* ---------------- PRACTICE ---------------- */

let pIndex = 0;

function renderPractice(){

  if(!questions.length){
    pageEl.innerHTML = `<h1>No Questions Found</h1>`;
    return;
  }

  const q = questions[pIndex];

  const opts = q.options.map(o=>`
    <label class="option">
      <input type="radio" name="opt" value="${o.id}">
      ${o.fi}
    </label>
  `).join("");

  pageEl.innerHTML = `
    <h1 class="h1">📝 Practice Questions</h1>

    <div class="qbox">
      <div><b>${q.question_fi}</b></div>

      ${opts}

      <br>
      <button onclick="submitPractice()">Submit</button>
      <button onclick="nextPractice()">Next</button>

      <div id="result"></div>
    </div>
  `;
}

function submitPractice(){

  const q = questions[pIndex];
  const val = document.querySelector("input[name=opt]:checked");

  if(!val){
    alert("Select answer first");
    return;
  }

  if(!q.answer){
    document.getElementById("result").innerHTML =
      "ℹ️ Answer not set yet";
    return;
  }

  if(val.value === q.answer){
    document.getElementById("result").innerHTML =
      "✅ Correct";
  }else{
    document.getElementById("result").innerHTML =
      "❌ Wrong";
  }
}

function nextPractice(){
  pIndex++;
  if(pIndex >= questions.length) pIndex = 0;
  renderPractice();
}

/* ---------------- REAL EXAM ---------------- */

function renderExam(){
  pageEl.innerHTML = `
    <h1 class="h1">⏱️ Real Time Exam</h1>
    <p class="lead">50 Questions • 50 Minutes</p>

    <button onclick="startExam()">Start Exam</button>
  `;
}

function startExam(){
  pageEl.innerHTML = `
    <h2>Exam Started</h2>
    <p>Real exam timer & result system next step e add korbo.</p>
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

loadQuestions().then(router);
