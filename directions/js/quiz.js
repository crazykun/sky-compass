/* 辨向闯关：10 道题，选项就是八个方向的方位卡 */
import { DIRECTIONS, dirIndex } from './compass.js';

const QUESTIONS = [
  { scene: '🌅 早上', text: '早上的太阳从<b>哪一边</b>升起？', answer: '东', why: '太阳每天从东方升起，从西方落下。' },
  { scene: '🌅 早上', text: '面向早上的太阳，你的<b>后面</b>是哪一边？', answer: '西', why: '后面总是前面的反方向：面向东，后面就是西。' },
  { scene: '🌅 早上', text: '面向早上的太阳，你的<b>右面</b>是哪一边？', answer: '南', why: '口诀：前东后西，左北右南。' },
  { scene: '🌅 早上', text: '面向早上的太阳，你的<b>左前方</b>是哪个方向？', answer: '东北', why: '左面是北，前面是东，中间就是东北。' },
  { scene: '🌞 中午', text: '中午，太阳在天空的<b>哪一边</b>？', answer: '南', why: '在中国大部分地区，中午的太阳在南方天空。' },
  { scene: '🌞 中午', text: '面向中午的太阳，你的<b>左面</b>是哪一边？', answer: '东', why: '口诀：前南后北，左东右西。' },
  { scene: '🌞 中午', text: '面向中午的太阳，你的<b>后面</b>是哪一边？', answer: '北', why: '面向南站着，后面就是北。' },
  { scene: '🌇 下午', text: '下午，太阳往<b>哪一边</b>落下？', answer: '西', why: '太阳东升西落，傍晚记得看看西边的晚霞。' },
  { scene: '🌇 下午', text: '面向下午的太阳，你的<b>左面</b>是哪一边？', answer: '南', why: '口诀：前西后东，左南右北。' },
  { scene: '🌇 下午', text: '面向下午的太阳，你的<b>右前方</b>是哪个方向？', answer: '西北', why: '右面是北，前面是西，中间就是西北。' }
];

const CHEERS = ['太棒了，答对啦！🎉', '完全正确，你真是小侦探！🔍', '厉害，太阳都难不倒你！☀️'];
const OOPS = ['差一点点，再想想～', '哎呀，方向转反了，看看提示再试！'];
const RANKS = [
  { min: 10, title: '🧭 方向小达人' },
  { min: 8, title: '⭐ 观星小能手' },
  { min: 5, title: '🌱 辨向小学徒' },
  { min: 0, title: '💪 勇敢的起点' }
];

/* 斜方向题给相邻方向做干扰项，正方向题用四个正方向 */
function buildOptions(answer) {
  const i = dirIndex(answer);
  if (i % 2 === 1) {
    return [DIRECTIONS[i], DIRECTIONS[(i + 1) % 8], DIRECTIONS[(i + 7) % 8], DIRECTIONS[(i + 4) % 8]];
  }
  return [DIRECTIONS[0], DIRECTIONS[2], DIRECTIONS[4], DIRECTIONS[6]];
}

export function initQuiz() {
  const stars = document.getElementById('quizStars');
  const sceneEl = document.getElementById('quizScene');
  const questionEl = document.getElementById('quizQuestion');
  const optionsEl = document.getElementById('quizOptions');
  const feedbackEl = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('quizNext');
  const resultEl = document.getElementById('quizResult');
  const scoreEl = document.getElementById('quizScore');
  const noteEl = document.getElementById('quizNote');
  const restartBtn = document.getElementById('quizRestart');

  let index = 0, score = 0, solved = false;

  function renderStars() {
    stars.textContent = '⭐'.repeat(score) + '☆'.repeat(QUESTIONS.length - score - (solved ? 0 : 1));
  }

  function renderQuestion() {
    const q = QUESTIONS[index];
    solved = false;
    sceneEl.textContent = q.scene;
    questionEl.innerHTML = `${index + 1}. ${q.text}`;
    feedbackEl.textContent = '点下面的方位卡选出答案吧！';
    feedbackEl.className = 'quiz-feedback';
    nextBtn.hidden = true;
    optionsEl.innerHTML = '';
    for (const dir of buildOptions(q.answer)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dir-btn';
      btn.textContent = dir;
      btn.addEventListener('click', () => solve(btn, dir));
      optionsEl.appendChild(btn);
    }
    renderStars();
  }

  function solve(btn, dir) {
    if (solved) return;
    solved = true;
    const q = QUESTIONS[index];
    const good = dir === q.answer;
    if (good) {
      score += 1;
      btn.classList.add('good');
      feedbackEl.innerHTML = `${CHEERS[index % CHEERS.length]} ${q.why}`;
      feedbackEl.className = 'quiz-feedback good';
    } else {
      btn.classList.add('bad');
      for (const other of optionsEl.children) {
        if (other.textContent === q.answer) other.classList.add('good');
      }
      feedbackEl.innerHTML = `${OOPS[index % OOPS.length]} 正确答案是「<b>${q.answer}</b>」。${q.why}`;
      feedbackEl.className = 'quiz-feedback bad';
    }
    for (const other of optionsEl.children) other.disabled = true;
    renderStars();
    nextBtn.textContent = index === QUESTIONS.length - 1 ? '看成绩 🏁' : '下一题 →';
    nextBtn.hidden = false;
    nextBtn.focus();
  }

  function finish() {
    const rank = RANKS.find(r => score >= r.min);
    scoreEl.textContent = `${score} / ${QUESTIONS.length}`;
    noteEl.innerHTML = `${rank.title}！${score === QUESTIONS.length ? '太阳已经是你的向导啦！' : '再玩一次，或者到上面的方位卡练一练！'}`;
    resultEl.hidden = false;
    document.getElementById('quizBox').classList.add('done');
  }

  function start() {
    index = 0;
    score = 0;
    resultEl.hidden = true;
    renderQuestion();
  }

  nextBtn.addEventListener('click', () => {
    if (index === QUESTIONS.length - 1) {
      finish();
    } else {
      index += 1;
      renderQuestion();
    }
  });
  restartBtn.addEventListener('click', start);
  start();
}
