import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { topic, contentType, tone } = JSON.parse(event.body || '{}');

    if (!topic || !contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Topic and content type are required' }),
      };
    }

    let prompt = '';
    
    if (contentType === 'profile') {
      prompt = `당신은 한국 SNS 마케팅 전문가입니다. 주어진 주제로 인스타그램/스레드 프로필 소개글을 작성해주세요.

주제: ${topic}

조건:
- 3-4줄로 구성
- 이모지 2-3개 사용
- 개행문자(\\n)로 줄바꿈 표시
- 매력적이고 개성있게
- 팔로우하고 싶은 느낌으로
- 마케팅 색채 없이 자연스럽게

예시 형식:
💡 "AI가 만드는 영상, 상상을 현실로 만들어드려요 ✨
매일 새로운 창작 아이디어를 공유하는 크리에이터 🎬
함께 만들어가는 디지털 세상 이야기"

위 형식을 참고해서 ${topic}에 대한 프로필 소개글을 작성해주세요:`;
    } else if (contentType === 'review') {
      const reviewTone = tone === 'casual' ? '반말체(해, 야, 지)' : '존댓말';
      prompt = `당신은 한국 SNS 리뷰 작성 전문가입니다. 주어진 주제로 실제 경험한 것처럼 리뷰를 작성해주세요.

주제: ${topic}
말투: ${reviewTone}

조건:
- 실제 사용 후기처럼 자연스럽게
- 구체적인 경험과 느낌 포함
- 3-5문장으로 구성
- 이모지 1-2개 사용
- 진정성 있게 작성
- ** 마크다운 문법 절대 사용 금지

${topic}에 대한 리뷰를 작성해주세요:`;
    } else if (contentType === 'info') {
      const infoTone = tone === 'casual' ? '반말체(해, 야, 지)' : '존댓말';
      prompt = `당신은 한국 SNS 정보 콘텐츠 전문가입니다. 주어진 주제로 유용한 정보를 제공하는 글을 작성해주세요.

주제: ${topic}
말투: ${infoTone}

조건:
- 실용적이고 유용한 정보 제공
- 3-5문장으로 구성
- 이모지 1-2개 사용
- 읽기 쉽게 구성
- ** 마크다운 문법 절대 사용 금지
- 볼드체나 강조 표시 없이 순수 텍스트로만

${topic}에 대한 정보 콘텐츠를 작성해주세요:`;
    }

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' }),
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content?.trim() || '';
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: Date.now(),
        content,
        contentType,
        topic,
      }),
    };

  } catch (error) {
    console.error('Error generating content:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate content' }),
    };
  }
};