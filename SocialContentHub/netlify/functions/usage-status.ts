import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // For Netlify deployment, we'll use a simple approach
  // In a production app, you'd want to use a database or external storage
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      usedCount: 0,
      remainingCount: 10,
      maxDaily: 10,
      limitReached: false,
    }),
  };
};