// netlify/functions/gemini.js - VERSIÓN CORREGIDA
exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
    };

    // Manejar OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { 
            statusCode: 200, 
            headers, 
            body: '' 
        };
    }

    // Para pruebas GET
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'online',
                message: 'Gemini API funcionando',
                timestamp: new Date().toISOString()
            })
        };
    }

    // Solo POST para el chat
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
            console.error('❌ GEMINI_API_KEY no configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'API Key no configurada',
                    tip: 'Configura GEMINI_API_KEY en Netlify'
                })
            };
        }

        // 2. Parsear entrada
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch(e) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'JSON inválido' })
            };
        }

        const userMessage = requestBody.message || '';
        const messages = requestBody.messages || [];

        // 3. Construir el sistema prompt
        const systemPrompt = `Eres un asesor comercial para negocios locales en Argentina. 
Tu objetivo es ayudar a los negocios a digitalizarse.
Responde de forma natural y conversacional.
Pregunta por el tipo de negocio y sus necesidades.
Ofrece soluciones como: sistemas web, aplicaciones de gestión, automatizaciones.
Cuando tengas suficiente información, invita a continuar por WhatsApp.
WhatsApp: https://wa.me/5493417558966`;

        // 4. Construir el historial de mensajes
        let fullPrompt = systemPrompt + "\n\nHistorial de conversación:\n";
        
        messages.slice(-5).forEach(msg => {
            const role = msg.role === 'user' ? 'Cliente' : 'Asistente';
            fullPrompt += `${role}: ${msg.content}\n`;
        });
        
        fullPrompt += `\nCliente: ${userMessage}\nAsistente:`;

        // 5. Payload CORRECTO para Gemini 2.5 Flash
        const payload = {
            contents: [
                {
                    parts: [
                        { text: fullPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
            }
        };

        console.log('📤 Enviando a Gemini API...');

        // 6. Llamar a la API CORRECTA
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify(payload)
            }
        );

        // 7. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Gemini API:', response.status, errorText);
            
            // Respuesta de fallback más amigable
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Soy tu asesor digital de Digital Rosario. 👋\n\nMe especializo en ayudar a negocios como el tuyo a crecer con tecnología.\n\n¿Me podrías contar qué tipo de negocio tenés y qué desafíos enfrentás actualmente?\n\nAsí puedo recomendarte las mejores soluciones digitales para vos.`,
                    success: false,
                    fallback: true
                })
            };
        }

        // 8. Extraer respuesta
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      '¡Hola! ¿En qué puedo ayudarte con tu negocio hoy?';

        console.log('✅ Respuesta recibida de Gemini');

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
        console.error('🔥 Error en la función:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Hola! Soy Digital Rosario, tu asesor digital. 🚀\n\nAyudo a negocios locales a vender más y trabajar menos con tecnología.\n\nContame:\n• ¿Qué tipo de negocio tenés?\n• ¿Qué te gustaría mejorar o automatizar?\n\nO si preferís, hablamos directo por WhatsApp: https://wa.me/5493417558966`,
                error: error.message,
                fallback: true
            })
        };
    }
};
