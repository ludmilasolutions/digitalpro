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

    // 🚨 IMPORTANTE: Usar el modelo CORRECTO
    // Modelos disponibles: gemini-1.0-pro, gemini-1.5-pro, gemini-pro
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${API_KEY}`;
    // Alternativas si falla:
    // gemini-1.5-pro-latest
    // gemini-pro

    // Preparar mensajes para Gemini
    // La API espera formato: { contents: [{ role: "user", parts: [{ text: "..." }] }] }
    const contents = [];
    
    // Procesar mensajes del historial
    messages.forEach(msg => {
      if (msg.role === "user" && msg.parts) {
        // Mensaje del usuario
        contents.push({
          role: "user",
          parts: [{ text: msg.parts[0].text }]
        });
      } else if (msg.role === "assistant" || msg.role === "model") {
        // Respuesta del modelo
        contents.push({
          role: "model",
          parts: [{ text: msg.parts[0].text }]
        });
      }
    });

    console.log('📤 Enviando a Gemini:', contents.length, 'mensajes');

    // Llamar a Gemini API usando fetch nativo (Node 18+)
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 800,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      
      // Si es error 404, probar otro modelo
      if (response.status === 404) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Modelo no encontrado',
            tip: 'Intenta con gemini-1.5-pro o gemini-pro',
            detail: errorText.substring(0, 200)
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
    console.log('✅ Respuesta recibida de Gemini');
    
    // Extraer texto de respuesta
    let aiText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      aiText = data.candidates[0].content.parts[0].text;
    } else {
      console.warn('Estructura inesperada:', JSON.stringify(data).substring(0, 200));
      aiText = 'Hola, veo que tienes un negocio local. ¿En qué puedo ayudarte hoy? Cuéntame sobre tu emprendimiento.';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        text: aiText,
        timestamp: new Date().toISOString(),
        model: "gemini-1.0-pro"
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
