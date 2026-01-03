// netlify/functions/gemini.js - VERSIÓN CORREGIDA (formato oficial)
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
    };

    // Manejar OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Permitir GET para pruebas
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'online',
                message: 'Función Gemini funcionando',
                endpoint: '/.netlify/functions/gemini',
                timestamp: new Date().toISOString()
            })
        };
    }

    // Solo aceptar POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' })
        };
    }

    try {
        console.log('=== INICIO FUNCIÓN GEMINI ===');
        
        // 1. Obtener API Key de Netlify
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error('❌ ERROR: GEMINI_API_KEY no configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'API Key no configurada en Netlify',
                    tip: 'Configura GEMINI_API_KEY en Environment Variables'
                })
            };
        }

        console.log('✅ API Key encontrada');
        
        // 2. Parsear cuerpo de la solicitud
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
            console.log('📦 Cuerpo recibido:', JSON.stringify(requestBody).substring(0, 200));
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError.message);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'JSON inválido',
                    detail: 'El cuerpo debe ser un JSON válido'
                })
            };
        }

        // 3. Extraer el mensaje del usuario
        let userMessage = 'Hola, ¿cómo estás?';
        
        if (requestBody.message) {
            userMessage = requestBody.message;
        } else if (requestBody.messages && Array.isArray(requestBody.messages)) {
            // Buscar el último mensaje del usuario
            const userMessages = requestBody.messages.filter(msg => 
                msg.role === 'user' || msg.sender === 'user'
            );
            if (userMessages.length > 0) {
                userMessage = userMessages[userMessages.length - 1].content || userMessage;
            }
        }

        console.log('💬 Mensaje a procesar:', userMessage.substring(0, 100));

        // 4. FORMATO CORRECTO según la documentación de Gemini API
        // Esto es lo que estaba mal en tu versión anterior
        const payload = {
            contents: [
                {
                    parts: [
                        { text: userMessage }
                    ]
                }
            ]
        };

        console.log('🚀 Enviando a Gemini API con formato correcto...');
        
        // 5. Llamar a Gemini API CON EL FORMATO CORRECTO
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY  // FORMATO CORRECTO del header
                },
                body: JSON.stringify(payload)
            }
        );

        // 6. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Gemini API:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 300)
            });
            
            // Respuesta de fallback para el frontend
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Soy tu asistente digital. Hubo un error técnico (${response.status}).\n\nMientras tanto, te cuento que ofrecemos:\n• Web catálogo desde $150.000\n• Bot de WhatsApp desde $80.000\n• Marketing digital desde $45.000/mes\n\n¿Te interesa alguno?`,
                    error: true,
                    fallback: true
                })
            };
        }

        const data = await response.json();
        console.log('✅ Respuesta Gemini recibida exitosamente');
        
        // 7. Extraer texto de respuesta
        let aiText = '¡Hola! ¿En qué puedo ayudarte con tu negocio hoy?';
        
        if (data.candidates && data.candidates[0]) {
            aiText = data.candidates[0].content?.parts?.[0]?.text || aiText;
        }

        console.log('🤖 Respuesta generada:', aiText.substring(0, 150));

        // 8. Devolver éxito
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: aiText,
                success: true,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('🔥 ERROR CRÍTICO:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Hola! Soy tu asistente. Hubo un error inesperado.\n\nTe sugiero contactarnos por WhatsApp directo: https://wa.me/5493417558966\n\nMientras, te cuento sobre nuestros servicios:\n📱 Bot de WhatsApp\n🌐 Web catálogo\n📣 Marketing digital\n\n¿Qué te interesa?`,
                error: error.message,
                fallback: true,
                emergency: true
            })
        };
    }
};
