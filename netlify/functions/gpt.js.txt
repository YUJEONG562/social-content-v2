const fetch = require("node-fetch");

exports.handler = async function (event) {
  const body = JSON.parse(event.body || "{}");

  const apiKey = process.env.thread_api_key; // ← 정확히 위에서 설정한 이름과 일치해야 함

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: body.messages || [{ role: "user", content: "안녕 GPT?" }],
    }),
  });

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
