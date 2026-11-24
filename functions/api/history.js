const historyObjectKey = 'history.txt';
const operations = new Set(['add', 'subtract', 'multiply', 'divide']);

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function readHistory(namespace) {
  const contents = await namespace.get(historyObjectKey);
  if (contents === null) {
    return [];
  }

  const history = JSON.parse(contents);
  if (!Array.isArray(history)) {
    throw new Error('History object must contain a JSON array.');
  }
  return history;
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

export async function onRequest({ request, env }) {
  if (!env.HISTORY_KV) {
    return jsonResponse({ error: 'History storage is not configured.' }, 500);
  }

  try {
    if (request.method === 'GET') {
      return jsonResponse(await readHistory(env.HISTORY_KV));
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
      }

      if (
        !body ||
        !Number.isFinite(body.firstNumber) ||
        !Number.isFinite(body.secondNumber) ||
        !operations.has(body.operation)
      ) {
        return jsonResponse(
          { error: 'Provide two finite numbers and a supported operation.' },
          400
        );
      }

      const result = calculateResult(body.firstNumber, body.secondNumber, body.operation);
      if (!Number.isFinite(result)) {
        return jsonResponse({ error: 'The calculation result must be finite.' }, 400);
      }

      const item = {
        id: crypto.randomUUID(),
        firstNumber: body.firstNumber,
        secondNumber: body.secondNumber,
        operation: body.operation,
        result,
        createdAt: new Date().toISOString()
      };
      const history = await readHistory(env.HISTORY_KV);
      await env.HISTORY_KV.put(
        historyObjectKey,
        `${JSON.stringify([item, ...history], null, 2)}\n`
      );
      return jsonResponse(item, 201);
    }

    return jsonResponse({ error: 'Method not allowed.' }, 405);
  } catch (error) {
    console.error('History API request failed:', error);
    return jsonResponse({ error: 'The history API could not complete the request.' }, 500);
  }
}
