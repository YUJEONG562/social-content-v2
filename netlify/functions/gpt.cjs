const { OpenAI } = require("openai");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "POST 요청만 가능합니다",
    };
  }

  const { messages } = JSON.parse(event.body || "{}");

  if (!messages) {
    return {
      statusCode: 400,
      body: "메시지가 없습니다",
    };
  }

  const openai = new OpenAI({ apiKey: process.env.thread_api_key });

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ reply: response.choices[0].message.content }),
  };
};
