// netlify/functions/gemini.js - VERSIÓN SIMPLIFICADA (Node 18+)
exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
    };

    // Para pruebas GET
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'online',
                message: 'Función Gemini funcionando',
                timestamp: new Date().toISOString()
            })
        };
    }

    // Manejar OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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
        // 1. Verificar API Key
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.error('❌ GEMINI_API_KEY no configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'API Key no configurada',
                    tip: 'Configura GEMINI_API_KEY en Netlify > Environment Variables'
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

        const userMessage = requestBody.message || 'Hola';

        // 3. Payload para Gemini (formato CORRECTO)
        const payload = {
            contents: [{
                parts: [{ text: userMessage }]
            }]
        };

        // 4. Llamar a Gemini API
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': API_KEY
                },
                body: JSON.stringify(payload)
            }
        );

        // 5. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Gemini:', response.status, errorText);
            
            // Respuesta de fallback amigable
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Soy Digital Rosario. Hubo un problema técnico.\n\nTe sugiero contactarnos por WhatsApp: https://wa.me/5493417558966\n\nMientras tanto, te cuento que ofrecemos:\n• Web catálogo desde $150.000\n• Bot de WhatsApp desde $80.000\n• Marketing digital desde $45.000/mes`,
                    error: true,
                    fallback: true
                })
            };
        }

        // 6. Éxito
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      '¡Hola! ¿En qué puedo ayudarte?';

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
        console.error('🔥 Error crítico:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Hola! Hubo un error. Contactanos por WhatsApp: https://wa.me/5493417558966`,
                error: error.message,
                fallback: true
            })
        };
    }
};
