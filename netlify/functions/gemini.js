// netlify/functions/gemini.js - VERSIÓN 100% FUNCIONAL
exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Solo aceptar POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        // 1. Obtener API Key de variables de entorno
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error('❌ GEMINI_API_KEY no configurada');
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

        // 2. Parsear el cuerpo de la petición
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'JSON inválido' })
            };
        }

        // 3. Validar que existan mensajes
        const { messages } = requestBody;
        if (!messages || !Array.isArray(messages)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Se requiere array "messages"' })
            };
        }

        console.log(`📨 Recibidos ${messages.length} mensajes`);

        // 4. Tomar el último mensaje del usuario
        const lastMessage = messages[messages.length - 1]?.content || 'Hola';
        
        console.log('💬 Último mensaje:', lastMessage.substring(0, 100));

        // 5. Llamar a Gemini API (versión más simple)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: lastMessage }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                    }
                })
            }
        );

        // 6. Manejar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Gemini API:', response.status, errorText.substring(0, 200));
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Error ${response.status} de la API`,
                    detail: 'Problema con la conexión a Gemini'
                })
            };
        }

        // 7. Procesar respuesta exitosa
        const data = await response.json();
        console.log('✅ Respuesta Gemini recibida');
        
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                       '¡Hola! Soy tu asesor digital. ¿En qué puedo ayudarte con tu negocio hoy?';

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
        console.error('🔥 Error crítico en función gemini:', error);
        
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
