// netlify/functions/gemini.js - VERSIÓN CORREGIDA (Modelo Correcto)
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);

    // 1. Obtener API Key de las variables de entorno de Netlify
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API Key no configurada en Netlify',
          tip: 'Ve a Site settings > Environment variables y agrega: GEMINI_API_KEY'
        })
      };
    }

    // 2. URL CORREGIDA: Usar el modelo gemini-2.5-flash según la documentación
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // 3. Preparar el cuerpo de la solicitud según el formato esperado por la API
    const requestBody = {
      contents: messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts[0].text }]
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    };

    // 4. Llamar a la API de Gemini usando fetch nativo (Node 18+)
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error('Error de Gemini API:', response.status, errorDetail);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Error ${response.status} de Gemini API`,
          detail: errorDetail.substring(0, 300) // Limitar longitud para log
        })
      };
    }

    const data = await response.json();
    
    // 5. Extraer y devolver la respuesta
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar una respuesta.';
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: aiText,
        model: "gemini-2.5-flash" // Confirmar el modelo usado
      })
    };

  } catch (error) {
    console.error('Error en la función serverless:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        message: error.message
      })
    };
  }
};
