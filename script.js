'use strict';

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  current:     '0',
  previous:    '',
  operator:    null,
  shouldReset: false,
};

// ── DOM refs ───────────────────────────────────────────────────────────────
const displayEl    = document.getElementById('display');
const expressionEl = document.getElementById('expression');
const buttons      = document.querySelectorAll('.btn');

// ── Helpers ────────────────────────────────────────────────────────────────
function updateDisplay() {
  displayEl.textContent = state.current;
  const len = state.current.length;
  displayEl.classList.toggle('small',  len > 9);
  displayEl.classList.toggle('xsmall', len > 13);
}

function setExpression(text) {
  expressionEl.textContent = text;
}

function clearActiveOp() {
  buttons.forEach(b => b.classList.remove('active-op'));
}

function highlightOp(symbol) {
  clearActiveOp();
  buttons.forEach(b => {
    if (b.dataset.value === symbol && b.dataset.action === 'operator') {
      b.classList.add('active-op');
    }
  });
}

function popAnimation(btn) {
  btn.classList.remove('pop');
  void btn.offsetWidth;
  btn.classList.add('pop');
}

// ── Core maths ─────────────────────────────────────────────────────────────
function calculate(a, b, op) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  switch (op) {
    case '+': return numA + numB;
    case '−': return numA - numB;
    case '×': return numA * numB;
    case '÷': return numB !== 0 ? numA / numB : 'Error';
    default:  return numB;
  }
}

function formatResult(num) {
  if (num === 'Error') return 'Error';
  const rounded = parseFloat(num.toPrecision(12));
  if (Math.abs(rounded) > 1e15 || (Math.abs(rounded) < 1e-7 && rounded !== 0)) {
    return rounded.toExponential(4);
  }
  return String(rounded);
}

// ── Action handlers ────────────────────────────────────────────────────────
function handleDigit(value) {
  if (state.shouldReset) {
    state.current     = value === '0' ? '0' : value;
    state.shouldReset = false;
  } else {
    if (state.current === '0') {
      state.current = value;
    } else {
      if (state.current.replace('-', '').replace('.', '').length >= 15) return;
      state.current += value;
    }
  }
  updateDisplay();
}

function handleDecimal() {
  if (state.shouldReset) {
    state.current     = '0.';
    state.shouldReset = false;
    updateDisplay();
    return;
  }
  if (!state.current.includes('.')) {
    state.current += '.';
    updateDisplay();
  }
}

function handleOperator(op) {
  if (state.operator && !state.shouldReset) {
    const result = calculate(state.previous, state.current, state.operator);
    state.current = formatResult(result);
    updateDisplay();
  }
  state.previous    = state.current;
  state.operator    = op;
  state.shouldReset = true;
  setExpression(`${state.previous} ${op}`);
  highlightOp(op);
}

function handleEquals() {
  if (!state.operator) return;
  const expr   = `${state.previous} ${state.operator} ${state.current}`;
  const result = calculate(state.previous, state.current, state.operator);
  setExpression(`${expr} =`);
  state.current     = formatResult(result);
  state.previous    = '';
  state.operator    = null;
  state.shouldReset = true;
  clearActiveOp();
  updateDisplay();
}

function handleClear() {
  state.current     = '0';
  state.previous    = '';
  state.operator    = null;
  state.shouldReset = false;
  setExpression('');
  clearActiveOp();
  updateDisplay();
}

function handleToggleSign() {
  if (state.current === '0' || state.current === 'Error') return;
  state.current = state.current.startsWith('-')
    ? state.current.slice(1)
    : '-' + state.current;
  updateDisplay();
}

function handlePercent() {
  if (state.current === 'Error') return;
  const num = parseFloat(state.current);
  if (state.previous !== '' && state.operator) {
    state.current = formatResult((parseFloat(state.previous) * num) / 100);
  } else {
    state.current = formatResult(num / 100);
  }
  state.shouldReset = false;
  updateDisplay();
}

// ── Event delegation ───────────────────────────────────────────────────────
document.querySelector('.buttons').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  popAnimation(btn);
  const { action, value } = btn.dataset;
  switch (action) {
    case 'digit':       handleDigit(value);    break;
    case 'decimal':     handleDecimal();        break;
    case 'operator':    handleOperator(value);  break;
    case 'equals':      handleEquals();         break;
    case 'clear':       handleClear();          break;
    case 'toggle-sign': handleToggleSign();     break;
    case 'percent':     handlePercent();        break;
  }
});

// ── Keyboard support ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key >= '0' && e.key <= '9') { handleDigit(e.key); return; }
  const map = {
    '.':        handleDecimal,
    ',':        handleDecimal,
    '+':        () => handleOperator('+'),
    '-':        () => handleOperator('−'),
    '*':        () => handleOperator('×'),
    '/':        () => handleOperator('÷'),
    'Enter':    handleEquals,
    '=':        handleEquals,
    'Escape':   handleClear,
    '%':        handlePercent,
    'Backspace': () => {
      if (state.shouldReset || state.current === 'Error') return;
      if (state.current.length === 1 ||
          (state.current.length === 2 && state.current.startsWith('-'))) {
        state.current = '0';
      } else {
        state.current = state.current.slice(0, -1);
      }
      updateDisplay();
    },
  };
  if (map[e.key]) { e.preventDefault(); map[e.key](); }
});

// ── Init ───────────────────────────────────────────────────────────────────
updateDisplay();