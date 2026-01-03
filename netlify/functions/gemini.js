// netlify/functions/gemini.js - VERSIÓN CORREGIDA Y SIMPLIFICADA
exports.handler = async (event) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*', // Temporalmente permitir todo para pruebas
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Manejar preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Método no permitido' }) 
    };
  }

  try {
    // 1. Verificar API Key
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('❌ API Key no configurada en Netlify');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configura GEMINI_API_KEY en Netlify Dashboard > Environment Variables'
        })
      };
    }

    // 2. Parsear cuerpo
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'JSON inválido' })
      };
    }

    const { messages } = body;
    
    // 3. Validar mensajes
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Se requiere array de mensajes' })
      };
    }

    console.log('📤 Mensajes recibidos:', JSON.stringify(messages, null, 2));

    // 4. Formatear para Gemini API (ESTRUCTURA CORRECTA)
    const contents = messages.map(msg => {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    // 5. Llamar a Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Gemini API:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
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
    console.log('✅ Respuesta Gemini:', JSON.stringify(data, null, 2));

    // 6. Extraer texto de respuesta
    let aiText = 'Disculpá, no pude generar una respuesta en este momento.';
    
    if (data.candidates && data.candidates[0]) {
      aiText = data.candidates[0].content?.parts?.[0]?.text || aiText;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        text: aiText,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('🔥 Error en función gemini:', error);
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
