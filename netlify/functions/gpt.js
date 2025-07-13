const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

export default async (request) => {
  let body;
  try {
    body = JSON.parse(request.body || '{}');
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body.messages) {
    return new Response(
      JSON.stringify({ error: 'Missing "messages" in request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.thread_api_key;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: body.messages
    })
  });

  const data = await res.json();

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
