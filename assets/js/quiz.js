const questions = [
  {
    q: "What does 'Tauko' mean?",
    options: ["Break", "Taxi stand", "Fine"],
    answer: 0
  },
  {
    q: "Customer asks you to stop in an unsafe place. What should you do?",
    options: [
      "Stop anywhere customer wants",
      "Find a safer place so customer can exit safely",
      "Let customer decide and take risk"
    ],
    answer: 1
  }
];

const quizBox = document.getElementById("quizBox");
const resultBox = document.getElementById("resultBox");

function render(){
  quizBox.innerHTML = questions.map((it,i)=>`
    <div class="item" style="margin:14px 0;">
      <div><b>Q${i+1}. ${it.q}</b></div>
      <div style="margin-top:8px;">
        ${it.options.map((op,idx)=>`
          <label style="display:block; padding:8px 0;">
            <input type="radio" name="q${i}" value="${idx}"> ${op}
          </label>
        `).join("")}
      </div>
    </div>
  `).join("");
  resultBox.innerHTML = "";
}

function getAns(i){
  const s = document.querySelector(`input[name="q${i}"]:checked`);
  return s ? Number(s.value) : null;
}

document.getElementById("submitBtn").onclick = () => {
  let correct=0, wrong=0, na=0;
  let review = "";

  questions.forEach((it,i)=>{
    const a = getAns(i);
    if(a===null){
      na++;
      review += `<div class="item"><b>Q${i+1}</b> — Not answered</div>`;
    } else if(a===it.answer){
      correct++;
      review += `<div class="item">✅ <b>Q${i+1}</b> Correct</div>`;
    } else {
      wrong++;
      review += `<div class="item">❌ <b>Q${i+1}</b> Wrong<br><span class="small"><b>Correct:</b> ${it.options[it.answer]}</span></div>`;
    }
  });

  resultBox.innerHTML = `
    <div class="item">
      ✅ Correct: <b>${correct}</b><br>
      ❌ Wrong: <b>${wrong}</b><br>
      ⏳ Not answered: <b>${na}</b>
    </div>
    <div style="margin-top:14px;">
      <h3>Review</h3>
      ${review}
    </div>
  `;
};

document.getElementById("resetBtn").onclick = () => {
  document.querySelectorAll("input[type=radio]").forEach(r=>r.checked=false);
  resultBox.innerHTML = "";
};

render();
