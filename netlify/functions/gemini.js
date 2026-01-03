// netlify/functions/gemini.js - VERSIÓN DEFINITIVA
exports.handler = async function(event, context) {
    // Configurar headers para CORS
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
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' })
        };
    }

    try {
        // 1. Obtener API Key de Netlify Environment
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error('❌ ERROR: GEMINI_API_KEY no configurada en Netlify');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Configura GEMINI_API_KEY en Netlify Dashboard',
                    tip: 'Ve a Site Settings > Environment Variables'
                })
            };
        }

        console.log('✅ API Key encontrada, longitud:', API_KEY.length);

        // 2. Parsear el cuerpo de la petición
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
            console.log('📦 Cuerpo recibido:', JSON.stringify(requestBody).substring(0, 200));
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'JSON inválido en el cuerpo de la petición',
                    detail: parseError.message 
                })
            };
        }

        // 3. Validar estructura básica
        if (!requestBody || typeof requestBody !== 'object') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Cuerpo debe ser un objeto JSON' })
            };
        }

        // 4. Tomar el mensaje del usuario (formato simple)
        let userMessage = 'Hola, ¿cómo estás?';
        
        if (requestBody.messages && Array.isArray(requestBody.messages)) {
            // Buscar el último mensaje del usuario
            const userMessages = requestBody.messages.filter(msg => 
                msg.role === 'user' || msg.sender === 'user'
            );
            if (userMessages.length > 0) {
                userMessage = userMessages[userMessages.length - 1].content || userMessage;
            }
        } else if (requestBody.message) {
            userMessage = requestBody.message;
        } else if (requestBody.content) {
            userMessage = requestBody.content;
        }

        console.log('💬 Mensaje del usuario:', userMessage.substring(0, 100));

        // 5. Crear prompt para el asistente
        const prompt = `Eres un asistente digital especializado en soluciones para negocios locales en Argentina.

Servicios que ofrecemos:
1. Web catálogo para comercios: desde $150.000
2. Bot de WhatsApp: desde $80.000 + $15.000/mes
3. Marketing digital: desde $45.000/mes
4. Publicidad en redes: desde $30.000 + inversión en anuncios
5. Presupuestos automáticos con IA: desde $60.000
6. Automatizaciones a medida: desde $120.000

Responde de manera amigable, profesional y útil. Si preguntan por precios, sé claro. Si quieren contactar, ofréceles WhatsApp.

Usuario pregunta: "${userMessage}"

Responde en español argentino, de forma natural y enfocada en soluciones prácticas:`;

        console.log('🚀 Enviando a Gemini API...');

        // 6. Llamar a Gemini API
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
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.8,
                        maxOutputTokens: 800,
                    }
                })
            }
        );

        // 7. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Gemini API:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 300)
            });
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: `Error ${response.status} al conectar con IA`,
                    detail: 'Problema temporal con el servicio de Google'
                })
            };
        }

        const data = await response.json();
        console.log('✅ Respuesta Gemini recibida exitosamente');
        
        // 8. Extraer texto de respuesta
        let aiText = '¡Hola! Soy tu asesor digital. ¿En qué puedo ayudarte con tu negocio hoy?';
        
        if (data.candidates && data.candidates[0]) {
            aiText = data.candidates[0].content?.parts?.[0]?.text || aiText;
        } else if (data.choices && data.choices[0]) {
            aiText = data.choices[0].message?.content || aiText;
        }

        console.log('🤖 Respuesta generada (primeros 100 chars):', aiText.substring(0, 100));

        // 9. Devolver respuesta exitosa
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
        console.error('🔥 ERROR CRÍTICO en función gemini:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Error interno del servidor',
                message: error.message,
                tip: 'Verifica los logs en Netlify Functions'
            })
        };
    }
};
