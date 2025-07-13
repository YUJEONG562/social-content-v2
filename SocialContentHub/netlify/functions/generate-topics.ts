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
    const { contentType, industry } = JSON.parse(event.body || '{}');

    if (!contentType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Content type is required' }),
      };
    }

    let prompt = '';
    
    if (contentType === 'profile') {
      prompt = `한국 SNS에서 인기 있는 인스타그램/스레드 프로필 주제 5개를 추천해주세요.
      
조건:
- 실제로 많이 사용되는 주제
- 개성 있고 매력적인 소재
- 다양한 분야 포함
- 각 주제는 한 줄로 간단히

형식: 주제1, 주제2, 주제3, 주제4, 주제5`;
    } else if (contentType === 'review') {
      const industryText = industry ? ` (${industry} 분야)` : '';
      prompt = `한국 SNS에서 리뷰하기 좋은 주제${industryText} 5개를 추천해주세요.
      
조건:
- 실제 사용 후기를 쓸 수 있는 제품/서비스
- 다양한 가격대와 카테고리
- 관심도가 높은 아이템
- 각 주제는 한 줄로 간단히

형식: 주제1, 주제2, 주제3, 주제4, 주제5`;
    } else if (contentType === 'info') {
      const industryText = industry ? ` (${industry} 분야)` : '';
      prompt = `한국 SNS에서 인기 있는 유용한 정보 주제${industryText} 5개를 추천해주세요.
      
조건:
- 실생활에 도움되는 정보
- 많은 사람들이 궁금해하는 내용
- 팁이나 노하우 형태
- 각 주제는 한 줄로 간단히

형식: 주제1, 주제2, 주제3, 주제4, 주제5`;
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
      max_tokens: 300,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content?.trim() || '';
    const topics = content.split(',').map(topic => topic.trim()).filter(topic => topic.length > 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        topics: topics.slice(0, 5),
        contentType,
      }),
    };

  } catch (error) {
    console.error('Error generating topics:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate topics' }),
    };
  }
};