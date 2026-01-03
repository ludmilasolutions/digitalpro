// netlify/functions/gemini.js - VERSIÓN SEGURA
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://digitalrosario.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Validar origen (seguridad adicional)
  const origin = event.headers.origin || event.headers.Origin;
  const allowedOrigins = [
    'https://digitalrosario.netlify.app',
    'http://localhost:8888',
    'http://localhost:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    // Validar que venga de tu dominio
    if (!origin || !allowedOrigins.includes(origin)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Origen no autorizado' })
      };
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('❌ API Key no configurada en Netlify');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Error de configuración del servidor',
          tip: 'Contacta al administrador del sitio'
        })
      };
    }

    const body = JSON.parse(event.body);
    const { messages } = body;

    // Validar estructura de mensajes
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Formato de mensajes inválido' })
      };
    }

    // Llamar a Gemini API con el modelo correcto
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Gemini API:', response.status, errorText);
      
      // Manejar específicamente errores de API Key
      if (response.status === 403 || response.status === 401) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Error de autenticación',
            tip: 'La API Key puede estar bloqueada. Crea una nueva con restricciones de seguridad.'
          })
        };
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Error ${response.status} de la API`,
          detail: errorText.substring(0, 200)
        })
      };
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                   'Disculpá, no pude generar una respuesta en este momento.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        text: aiText,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('🔥 Error en función:', error);
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
