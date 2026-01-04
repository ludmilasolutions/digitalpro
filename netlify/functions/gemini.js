// netlify/functions/gemini.js - VERSIÓN CORREGIDA CON MODELO REAL
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
                empresa: 'Digital Rosario',
                ia_modelo: 'Gemini 2.0 Flash Experimental',
                timestamp: new Date().toISOString(),
                nota: 'Modelo actual: gemini-2.0-flash-exp'
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
                    tip: 'Configura GEMINI_API_KEY en Netlify > Environment Variables',
                    instrucciones: '1. Ve a https://aistudio.google.com/app/apikey\n2. Crea API Key\n3. En Netlify: Site Settings > Environment Variables'
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

        // 3. PROMPT CORREGIDO
        const systemPrompt = `Eres Digital Rosario, asesor digital para negocios en Argentina. 
Conversación natural, pregunta por el negocio y sus problemas.
Objetivo: Recolectar información para ofrecer soluciones digitales.
Cuando tengas datos suficientes, invita a continuar por WhatsApp: https://wa.me/5493417558966

INSTRUCCIONES:
- Hablá en español argentino
- Sé amigable y profesional
- Pregunta de a una cosa por vez
- No te repitas
- No te presentes de nuevo
- Avanza la conversación naturalmente

INFORMACIÓN A OBTENER:
1. Tipo de negocio
2. Problema o necesidad
3. Objetivo (ahorrar tiempo, vender más, organizarse)
4. Presupuesto aproximado

SERVICIOS QUE OFRECEMOS:
- Webs catálogo
- Bots de WhatsApp
- Sistemas de gestión
- Automatizaciones
- Marketing digital

PRECIOS:
- Básico: desde $180.000
- Avanzado: desde $350.000

Al final, genera resumen y enlace a WhatsApp.`;

        // 4. Preparar historial - FORMATO CORRECTO
        const geminiMessages = [];
        
        // Agregar historial de conversación
        messages.slice(-10).forEach(msg => {
            geminiMessages.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        // Agregar último mensaje del usuario
        if (userMessage) {
            geminiMessages.push({
                role: "user",
                parts: [{ text: userMessage }]
            });
        }

        // 5. Payload CORRECTO para Gemini 2.0 Flash Experimental
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt + "\n\nHistorial de chat:\n" + JSON.stringify(geminiMessages) }]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 1000,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        console.log('🤖 Enviando a Gemini 2.0 Flash Experimental...');
        console.log('Mensaje del usuario:', userMessage.substring(0, 100));

        // 6. Llamar a Gemini API - ENDPOINT CORRECTO
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
            console.error('❌ Error Gemini:', response.status, errorText.substring(0, 200));
            
            // Respuesta de fallback más inteligente
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Soy Digital Rosario, tu asesor digital. 🚀

Parece que hay un pequeño problema técnico, pero igual puedo ayudarte.

¿Me contás qué tipo de negocio tenés y qué te gustaría mejorar?

Por ejemplo:
• ¿Tenés un local, servicio o vendés online?
• ¿Qué problema querés resolver? (tiempo, ventas, organización)
• ¿Tenés un presupuesto aproximado?

Así te puedo orientar mejor con soluciones digitales. 😊

O si preferís, hablamos directo por WhatsApp: https://wa.me/5493417558966`,
                    error: false,
                    fallback: true
                })
            };
        }

        // 8. Éxito
        const data = await response.json();
        console.log('✅ Respuesta de Gemini recibida');
        
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      '¡Hola! ¿En qué puedo ayudarte con tu negocio hoy? Cuéntame qué hacés y qué necesitás mejorar.';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: aiText,
                success: true,
                empresa: 'Digital Rosario',
                modelo: 'gemini-2.0-flash-exp',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('🔥 Error crítico:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Buenas! Soy Digital Rosario, asesor digital para negocios. 

Ayudo a emprendedores y negocios como el tuyo a:
• Vender más con menos esfuerzo
• Organizar procesos digitalmente
• Atraer clientes nuevos
• Automatizar tareas repetitivas

Contame:
1. ¿Qué tipo de negocio tenés?
2. ¿Qué desafío te gustaría resolver?

O si querés, hablamos directo por WhatsApp: 
👉 https://wa.me/5493417558966

¡Estoy aquí para ayudarte! 💪`,
                error: error.message,
                fallback: true
            })
        };
    }
};
