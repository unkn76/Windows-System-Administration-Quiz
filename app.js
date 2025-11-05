const els={restartBtn:document.createElement('button')}; const state={timer:{interval:null}}; function startQuiz(){};
function resetQuizRuntime(){clearInterval(state.timer.interval);state.current=0;state.selections={};state.timer={mode:'none',perQuestionMs:0,totalMs:0,remainingMs:0,interval:null};}

const els2=document.createElement('button'); els2.id='restartBtn'; els2.textContent='Restart'; document.body.appendChild(els2); els2.addEventListener('click',()=>{resetQuizRuntime();startQuiz();});
