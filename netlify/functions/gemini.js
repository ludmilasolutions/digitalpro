// netlify/functions/gemini.js
// SISTEMA ESTABLE CON GEMINI 2.5 FLASH (PRODUCCIÓN)

exports.handler = async function (event, context) {
    // ===== CORS =====
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET'
    };

    // ===== GET (TEST) =====
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'online',
                empresa: 'Digital Rosario',
                ia_modelo: 'Gemini 2.5 Flash',
                timestamp: new Date().toISOString()
            })
        };
    }

    // ===== OPTIONS =====
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // ===== SOLO POST =====
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' })
        };
    }

    try {
        // ===== API KEY =====
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'GEMINI_API_KEY no configurada'
                })
            };
        }

        // ===== BODY =====
        let body;
        try {
            body = JSON.parse(event.body);
        } catch {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'JSON inválido' })
            };
        }

        const userMessage = body.message || '';
        const messages = body.messages || [];

        // ===== SYSTEM PROMPT (CORRECTO) =====
        const systemPrompt = `
Actuás como un asesor comercial digital para negocios locales en Argentina.
Motor de IA: Gemini 2.5 Flash.

ROL:
Sos un asesor humano, profesional y comercial. No sos un bot.

OBJETIVO:
Entender la necesidad del cliente y avanzar hacia una solución concreta sin fricción.

REGLAS ABSOLUTAS:
- Nunca te vuelvas a presentar.
- Nunca reinicies la conversación.
- Nunca repitas preguntas.
- Nunca hagas más de UNA pregunta por mensaje.
- Interpretá lo que el cliente dice como información válida.
- Si expresa una necesidad, asumila como confirmada.
- Cada respuesta debe hacer avanzar la venta.

FORMA DE RESPONDER:
1. Confirmar brevemente lo entendido
2. Aportar valor concreto
3. Hacer UNA sola pregunta puntual

SERVICIOS:
- Sistemas web a medida
- Apps de gestión (facturación, pedidos, control)
- Automatizaciones
- Manejo de redes sociales
- Publicidad digital

PRECIOS:
- Sistemas simples desde $180.000 (estimativo)

CIERRE:
Cuando la info esté completa:
- Resumir
- Armar mensaje listo para WhatsApp
- Invitar a continuar por WhatsApp

WhatsApp: https://wa.me/5493417558966
`.trim();

        // ===== HISTORIAL =====
        const contents = [];

        messages.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        if (userMessage) {
            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });
        }

        // ===== PAYLOAD =====
        const payload = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                maxOutputTokens: 700
            }
        };

        // ===== CALL GEMINI =====
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

        if (!response.ok) {
            const text = await response.text();
            console.error('Gemini error:', response.status, text);
            throw new Error('Error Gemini');
        }

        const data = await response.json();
        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            'Perfecto, contame un poco más sobre tu negocio.';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text,
                success: true
            })
        };

    } catch (err) {
        console.error('ERROR:', err);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text:
                    'Perfecto. Para ayudarte mejor, contame qué tipo de negocio tenés y qué querés mejorar. ' +
                    'Si preferís, escribinos directo por WhatsApp: https://wa.me/5493417558966',
                fallback: true
            })
        };
    }
};
