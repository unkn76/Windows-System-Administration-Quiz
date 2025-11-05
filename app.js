const $=id=>document.getElementById(id);
const screens={start:$('screenStart'),quiz:$('screenQuiz'),result:$('screenResult')};
const els={themeToggle:$('themeToggle'),categorySelect:$('categorySelect'),difficultySelect:$('difficultySelect'),timerMode:$('timerMode'),timerMinutes:$('timerMinutes'),shuffleToggle:$('shuffleToggle'),feedbackToggle:$('feedbackToggle'),startBtn:$('startBtn'),progressLabel:$('progressLabel'),progress:$('progress'),timerRow:$('timerRow'),timerText:$('timerText'),questionText:$('questionText'),choicesForm:$('choicesForm'),backBtn:$('backBtn'),nextBtn:$('nextBtn'),submitBtn:$('submitBtn'),feedback:$('feedback'),resultSummary:$('resultSummary'),reviewBtn:$('reviewBtn'),restartBtn:$('restartBtn'),homeBtn:$('homeBtn'),reviewList:$('reviewList')};
const state={bank:[],questions:[],current:0,selections:{},timer:{mode:'none',perQuestionMs:0,totalMs:0,remainingMs:0,interval:null},settings:{category:'',difficulty:'',shuffle:true,immediateFeedback:false,minutes:10,timerMode:'none',theme:'light'}};

function fmt(ms){const s=Math.max(0,Math.floor(ms/1000));const m=Math.floor(s/60);const ss=(s%60).toString().padStart(2,'0');return m.toString().padStart(2,'0')+':'+ss}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function loadBank(){const res=await fetch('questions.json',{cache:'no-store'});if(!res.ok) throw new Error('Failed to load questions.json');state.bank=await res.json()}
function computeCategories(){const cats=Array.from(new Set(state.bank.map(q=>q.category).filter(Boolean))).sort();els.categorySelect.innerHTML='<option value="">Any</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('')}

function applyFilters(){let qs=[...state.bank];const {category,difficulty}=state.settings;if(category) qs=qs.filter(q=>q.category===category);if(difficulty) qs=qs.filter(q=>(q.difficulty||'').toLowerCase()===difficulty);state.questions=qs}
function applyShuffle(){if(state.settings.shuffle){state.questions=shuffle(state.questions).map(q=>({...q,choices:shuffle(q.choices)}))}else{state.questions=state.questions.map(q=>({...q,choices:[...q.choices]}))}}

function initTimer(){clearInterval(state.timer.interval);state.timer.mode=state.settings.timerMode;const ms=(Number(state.settings.minutes)||1)*60*1000;if(state.timer.mode==='quiz'){state.timer.totalMs=ms;state.timer.remainingMs=ms;els.timerRow.hidden=false}else if(state.timer.mode==='perQuestion'){state.timer.perQuestionMs=ms;state.timer.remainingMs=ms;els.timerRow.hidden=false}else{els.timerRow.hidden=true}els.timerText.textContent=fmt(state.timer.remainingMs||0)}
function startTicking(){if(state.timer.mode==='none')return;clearInterval(state.timer.interval);state.timer.interval=setInterval(()=>{state.timer.remainingMs-=1000;els.timerText.textContent=fmt(state.timer.remainingMs);if(state.timer.remainingMs<=0){if(state.timer.mode==='quiz'){submitQuiz()}else if(state.timer.mode==='perQuestion'){nextQuestion(true)}}},1000)}
function resetPerQuestionTimer(){if(state.timer.mode!=='perQuestion')return;state.timer.remainingMs=state.timer.perQuestionMs;els.timerText.textContent=fmt(state.timer.remainingMs)}

function renderQuestion(){const q=state.questions[state.current];els.questionText.textContent=q.text;els.choicesForm.innerHTML='';els.feedback.hidden=true;els.feedback.classList.remove('bad');q.choices.forEach(choice=>{const id=`${q.id}-${choice.id}`;const label=document.createElement('label');label.className='choice';label.htmlFor=id;const input=document.createElement('input');input.type=q.multi?'checkbox':'radio';input.name=q.id;input.id=id;input.value=choice.id;if(q.multi){const selected=new Set(state.selections[q.id]||[]);input.checked=selected.has(choice.id)}else{input.checked=state.selections[q.id]===choice.id}input.addEventListener('change',()=>onSelect(q,input));const span=document.createElement('span');span.textContent=choice.text;label.appendChild(input);label.appendChild(span);els.choicesForm.appendChild(label)});els.progress.max=state.questions.length;els.progress.value=state.current+1;els.progressLabel.textContent=`Question ${state.current+1} of ${state.questions.length}`;els.backBtn.disabled=state.current===0;els.nextBtn.disabled=state.current===state.questions.length-1;resetPerQuestionTimer()}

function onSelect(q,inputEl){if(q.multi){const set=new Set(state.selections[q.id]||[]);if(inputEl.checked) set.add(inputEl.value); else set.delete(inputEl.value);state.selections[q.id]=Array.from(set)}else{state.selections[q.id]=inputEl.value}if(state.settings.immediateFeedback){const correct=isCorrect(q,state.selections[q.id]);showFeedback(correct,q)}}
function isCorrect(q,selected){if(q.multi){const need=new Set(q.answerIds||[]);const chosen=new Set(selected||[]);if(need.size!==chosen.size) return false;for(const v of need){if(!chosen.has(v)) return false}return true}else{return selected===q.answerId}}
function showFeedback(ok,q){els.feedback.hidden=false;els.feedback.classList.toggle('bad',!ok);els.feedback.innerHTML=(ok?'✅ Correct!':'❌ Not quite.')+(q.explanation?`<div class="explanation">${q.explanation}</div>`:'')}

function nextQuestion(auto=false){if(state.current<state.questions.length-1){state.current++;renderQuestion()}if(state.timer.mode==='perQuestion' && !auto){resetPerQuestionTimer()}}
function prevQuestion(){if(state.current>0){state.current--;renderQuestion()}}

function resetQuizRuntime(){clearInterval(state.timer.interval);state.current=0;state.selections={};state.timer={mode:'none',perQuestionMs:0,totalMs:0,remainingMs:0,interval:null};}
function submitQuiz(){clearInterval(state.timer.interval);const details=state.questions.map(q=>{const selected=state.selections[q.id];const correct=isCorrect(q,selected);return {q,selected,correct}});const score=details.filter(d=>d.correct).length;const percent=Math.round((score/state.questions.length)*100);els.resultSummary.innerHTML=`<h2>Results</h2><p>You scored <strong>${score}/${state.questions.length}</strong> (${percent}%).</p>`;els.reviewList.innerHTML=details.map(d=>{const chosen=d.q.multi?(d.selected||[]).map(id=>d.q.choices.find(c=>c.id===id)?.text??id).join(', ')||'No answer':(d.q.choices.find(c=>c.id===d.selected)?.text??'No answer');const correctText=d.q.multi?(d.q.answerIds||[]).map(id=>d.q.choices.find(c=>c.id===id)?.text??id).join(', '):(d.q.choices.find(c=>c.id===d.q.answerId)?.text??'');return `<div class="reviewItem"><strong>${d.q.text}</strong><br/>You chose: ${chosen}<br/>Correct: ${correctText}${d.q.explanation?`<div class="explanation">${d.q.explanation}</div>`:''}</div>`}).join('');showScreen('result')}

function showScreen(name){Object.entries(screens).forEach(([k,el])=>el.hidden=(k!==name))}
function readSettingsFromUI(){state.settings.category=els.categorySelect.value;state.settings.difficulty=els.difficultySelect.value;state.settings.shuffle=els.shuffleToggle.checked;state.settings.immediateFeedback=els.feedbackToggle.checked;state.settings.minutes=Number(els.timerMinutes.value)||10;state.settings.timerMode=els.timerMode.value}
function startQuiz(){state.current=0;state.selections={};applyFilters();applyShuffle();if(state.questions.length===0){alert('No questions match your filters.');return}initTimer();renderQuestion();startTicking();showScreen('quiz')}
function saveTheme(t){localStorage.setItem('quiz-theme',t)}function loadTheme(){const t=localStorage.getItem('quiz-theme')||'light';document.documentElement.setAttribute('data-theme',t);state.settings.theme=t}function toggleTheme(){const next=state.settings.theme==='light'?'dark':'light';document.documentElement.setAttribute('data-theme',next);state.settings.theme=next;saveTheme(next)}

document.addEventListener('DOMContentLoaded',async()=>{try{loadTheme();const res=await fetch('questions.json',{cache:'no-store'});if(!res.ok) throw new Error('Failed to load questions.json');state.bank=await res.json();computeCategories();els.timerMode.value='none';els.timerMinutes.value='10';els.shuffleToggle.checked=true;els.feedbackToggle.checked=false;}catch(e){console.error(e);alert('Could not load questions.json');}});

els.themeToggle.addEventListener('click',toggleTheme);
els.startBtn.addEventListener('click',()=>{readSettingsFromUI();startQuiz()});
els.backBtn.addEventListener('click',prevQuestion);
els.nextBtn.addEventListener('click',()=>nextQuestion(false));
els.submitBtn.addEventListener('click',submitQuiz);
els.reviewBtn.addEventListener('click',()=>{els.reviewList.hidden=!els.reviewList.hidden;els.reviewBtn.textContent=els.reviewList.hidden?'Review answers':'Hide review'});
els.restartBtn.addEventListener('click',()=>{resetQuizRuntime();startQuiz()});
els.homeBtn.addEventListener('click',()=>{resetQuizRuntime();showScreen('start')});
