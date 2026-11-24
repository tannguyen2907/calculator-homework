const numberOne = document.querySelector('.numberOne');
const numberTwo = document.querySelector('.numberTwo');
const operationButtons = document.querySelectorAll('.operation button');
const submitBtn = document.querySelector('.submit');
const resultSpan = document.getElementById('result');
const historyList = document.getElementById('historyList');
const buttonGroup = document.querySelector('.buttonGroup');
const spanError = document.getElementById('numberError');
const historyStatus = document.getElementById('historyStatus');
const operationSymbols = {
  add: '+',
  subtract: '-',
  multiply: 'x',
  divide: '/'
};
let selectedOperation = null;

function renderHistory(items) {
  historyList.replaceChildren();
  items.forEach(item => {
    const historyItem = document.createElement('li');
    historyItem.textContent = `${item.firstNumber} ${operationSymbols[item.operation]} ${item.secondNumber} = ${item.result}`;
    historyList.append(historyItem);
  });
}

async function loadHistory() {
  try {
    const response = await fetch('/api/history');
    const items = await response.json();
    if (!response.ok) {
      throw new Error(items.error || 'Unable to load history.');
    }
    renderHistory(items);
    historyStatus.textContent = '';
    historyStatus.classList.remove('error');
  } catch (error) {
    historyStatus.textContent = `Could not load history: ${error.message}`;
    historyStatus.classList.add('error');
  }
}

async function saveHistoryItem(item) {
  try {
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Unable to save history.');
    }
    await loadHistory();
  } catch (error) {
    historyStatus.textContent = `Could not save history: ${error.message}`;
    historyStatus.classList.add('error');
  }
}

operationButtons.forEach(button => {
  button.addEventListener('click', () => {
    operationButtons.forEach(operationButton => {
      operationButton.classList.remove('selected');
    });
    button.classList.add('selected');
    selectedOperation = button.classList[0];
  });
});

submitBtn.addEventListener('click', () => {
  calculate(selectedOperation);
});

buttonGroup.addEventListener('click', (event) => {
  if (event.target === buttonGroup) {
    alert('Please click Reset or Submit.');
  }
});

function calculate(operation) {
  const firstNumber = Number(numberOne.value);
  const secondNumber = Number(numberTwo.value);
  if((numberOne.value.trim() === '' || numberTwo.value.trim() === '')) {
    spanError.textContent = `Please enter ${numberOne.value.trim() === '' ? 'Number 1' : 'Number 2'}`;
    return;
  }
  let result;

  switch (operation) {
    case 'add':
      result = firstNumber + secondNumber;
      break;
    case 'subtract':
      result = firstNumber - secondNumber;
      break;
    case 'multiply':
      result = firstNumber * secondNumber;
      break;
    case 'divide':
      result = firstNumber / secondNumber;
      break;
    default:
      resultSpan.classList.add('error');
      resultSpan.textContent = 'Please select an operation';
      return;
  }

  resultSpan.classList.remove('error');
  resultSpan.textContent = result;

  const historyItem = document.createElement('li');
  historyItem.textContent = `${firstNumber} ${operationSymbols[operation]} ${secondNumber} = ${result}`;
  historyList.prepend(historyItem);
  saveHistoryItem({ firstNumber, secondNumber, operation });
}

loadHistory();
