const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = __dirname;
const historyFile = process.env.HISTORY_FILE || path.join(root, 'history.txt');
const port = Number(process.env.PORT || 3000);
const operations = new Set(['add', 'subtract', 'multiply', 'divide']);
const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8']
};
let pendingUpdates = Promise.resolve();

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

async function readHistory() {
  try {
    const contents = await fs.readFile(historyFile, 'utf8');
    const history = JSON.parse(contents);
    if (!Array.isArray(history)) {
      throw new Error('History database must contain a JSON array.');
    }
    return history;
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(historyFile, '[]\n', 'utf8');
      return [];
    }
    throw error;
  }
}

function updateHistory(update) {
  const operation = pendingUpdates.then(async () => {
    const currentHistory = await readHistory();
    const { history, result } = update(currentHistory);
    await fs.writeFile(historyFile, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
    return result;
  });
  pendingUpdates = operation.then(() => undefined, () => undefined);
  return operation;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    request.on('data', chunk => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        settled = true;
        reject(new Error('Request body is too large.'));
        request.resume();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (settled) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    request.on('error', error => {
      if (!settled) reject(error);
    });
  });
}

function calculateResult(firstNumber, secondNumber, operation) {
  switch (operation) {
    case 'add':
      return firstNumber + secondNumber;
    case 'subtract':
      return firstNumber - secondNumber;
    case 'multiply':
      return firstNumber * secondNumber;
    case 'divide':
      return firstNumber / secondNumber;
  }
}

async function handleApi(request, response, pathname) {
  if (pathname !== '/api/history') {
    sendJson(response, 404, { error: 'API route not found.' });
    return;
  }

  if (request.method === 'GET') {
    await pendingUpdates;
    sendJson(response, 200, await readHistory());
    return;
  }

  if (request.method === 'POST') {
    const body = await readJsonBody(request);
    if (
      !body ||
      !Number.isFinite(body.firstNumber) ||
      !Number.isFinite(body.secondNumber) ||
      !operations.has(body.operation)
    ) {
      sendJson(response, 400, { error: 'Provide two finite numbers and a supported operation.' });
      return;
    }

    const result = calculateResult(body.firstNumber, body.secondNumber, body.operation);
    if (!Number.isFinite(result)) {
      sendJson(response, 400, { error: 'The calculation result must be finite.' });
      return;
    }

    const item = {
      id: randomUUID(),
      firstNumber: body.firstNumber,
      secondNumber: body.secondNumber,
      operation: body.operation,
      result,
      createdAt: new Date().toISOString()
    };
    await updateHistory(history => ({
      history: [item, ...history],
      result: item
    }));
    sendJson(response, 201, item);
    return;
  }

  response.setHeader('Allow', 'GET, POST');
  sendJson(response, 405, { error: 'Method not allowed.' });
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = new URL(request.url, 'http://localhost').pathname;
  } catch {
    sendJson(response, 400, { error: 'Invalid request URL.' });
    return;
  }

  if (pathname.startsWith('/api/')) {
    handleApi(request, response, pathname).catch(error => {
      console.error('API request failed:', error);
      if (!response.headersSent) {
        sendJson(response, 500, { error: 'The API could not complete the request.' });
      } else {
        response.destroy();
      }
    });
    return;
  }

  const file = staticFiles[pathname];
  if (!file || (request.method !== 'GET' && request.method !== 'HEAD')) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found.');
    return;
  }

  fs.readFile(path.join(root, file[0])).then(contents => {
    response.writeHead(200, { 'Content-Type': file[1] });
    response.end(request.method === 'HEAD' ? undefined : contents);
  }).catch(error => {
    console.error('Static file request failed:', error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Unable to serve the requested file.');
  });
});

server.listen(port, () => {
  console.log(`Calculator app and history API listening on http://localhost:${port}`);
});