// netlify/functions/gemini.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar OPTIONS (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Método no permitido' };
  }

  try {
    // Parsear body
    const body = JSON.parse(event.body);
    const { messages } = body;

    // Obtener API Key de Netlify
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      throw new Error('API Key no configurada en Netlify');
    }

    // Llamar a Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    const data = await response.json();
    
    // Devolver respuesta
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: data.candidates[0].content.parts[0].text
      })
    };

  } catch (error) {
    console.error('Error en función:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        tip: 'Configura GEMINI_API_KEY en Netlify'
      })
    };
  }
};
