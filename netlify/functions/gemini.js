// netlify/functions/gemini.js - VERSIÓN CORREGIDA
exports.handler = async (event) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight (OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Solo POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    // Parsear body
    const body = JSON.parse(event.body);
    const { messages } = body;

    // Obtener API Key de Netlify
    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API Key no configurada',
          tip: 'Configura GEMINI_API_KEY en Netlify > Environment Variables'
        })
      };
    }

    // URL de Gemini API (usando gemini-1.5-flash que es más rápido y barato)
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // Preparar mensajes para Gemini
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.parts[0].text }]
    }));

    // Llamar a Gemini API usando fetch nativo (Node 18+)
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      
      // Si es error de API Key
      if (response.status === 400 || response.status === 401) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Error de autenticación con Gemini',
            tip: 'Verifica que tu API Key sea válida y tenga permisos'
          })
        };
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Error ${response.status} de Gemini API`,
          detail: errorText.substring(0, 200)
        })
      };
    }

    const data = await response.json();
    
    // Extraer texto de respuesta
    let aiText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      aiText = data.candidates[0].content.parts[0].text;
    } else {
      aiText = 'Lo siento, no pude generar una respuesta. ¿Podrías reformular tu pregunta?';
    }

    // Log para debug
    console.log('✅ Respuesta generada:', aiText.substring(0, 100) + '...');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: aiText,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('🔥 Error crítico en función:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
