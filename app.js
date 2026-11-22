const numberOne = document.querySelector('.numberOne');
const numberTwo = document.querySelector('.numberTwo');
const operationButtons = document.querySelectorAll('.operation button');
const submitBtn = document.querySelector('.submit');
const resultSpan = document.getElementById('result');
const historyList = document.getElementById('historyList');
const resetBtn = document.querySelector('.reset');
const buttonGroup = document.querySelector('.buttonGroup');
const spanError = document.getElementById('numberError');
let selectedOperation = null;

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
    alert('Nguyen Van Dang');
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

  const operationSymbols = {
    add: '+',
    subtract: '-',
    multiply: 'x',
    divide: '/'
  };

  const historyItem = document.createElement('li');
  historyItem.textContent = `${firstNumber} ${operationSymbols[operation]} ${secondNumber} = ${result}`;
  historyList.prepend(historyItem);
}