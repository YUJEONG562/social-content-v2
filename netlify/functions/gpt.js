const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

export default async (event, context) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  if (!body || !body.messages) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing "messages" in request body' })
    };
  }

  const messages = body.messages;
  const apiKey = process.env.thread_api_key;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages
    })
  });

  const data = await res.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
