// netlify/functions/gemini.js - SISTEMA COMPLETO CON GEMINI 2.5 FLASH
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
                ia_modelo: 'Gemini 2.5 Flash',
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

        const userMessage = requestBody.message || '';
        const messages = requestBody.messages || [];

        // 3. PROMPT EXACTO DE GEMINI (OBLIGATORIO)
        const systemPrompt = `Actuás como un asesor comercial digital para negocios locales en Argentina.
Este asistente utiliza como motor de inteligencia artificial Gemini 2.5 Flash.

TU FUNCIÓN PRINCIPAL:
Escuchar activamente al cliente, interpretar lo que dice, extraer información útil y completar los datos faltantes sin repetir preguntas ni reiniciar la conversación.

NO actuás como un bot con guión fijo.
Actuás como un asesor humano con experiencia comercial.

REGLAS ABSOLUTAS:
- Nunca repitas el mismo mensaje ni estructura.
- Nunca vuelvas a presentarte.
- Nunca reinicies la conversación.
- Nunca hagas más de UNA pregunta por mensaje.
- Nunca vuelvas a preguntar algo que el cliente ya dijo.
- Interpretá cada mensaje del cliente como información válida.
- Si el cliente expresa una necesidad, asumila como confirmada.
- Cada respuesta debe hacer avanzar la conversación.

INFORMACIÓN A RECOLECTAR (SIN PEDIR TODO):
- Tipo de negocio (si lo menciona)
- Problema principal
- Qué quiere resolver
- Cómo trabaja hoy
- Objetivo (orden, control, tiempo, ventas)

FORMA DE RESPONDER:
1. Confirmar brevemente lo entendido
2. Aportar valor con una idea concreta
3. Hacer UNA pregunta puntual

SERVICIOS:
- Sistemas web a medida
- Aplicaciones de gestión (facturación, pedidos, control)
- Automatizaciones
- Manejo de redes sociales
- Publicidad digital

PRECIOS:
- Sistemas simples: desde $180.000 (estimativo)

CIERRE:
Cuando la información esté completa:
1. Generar resumen claro
2. Preparar mensaje listo para WhatsApp
3. Invitar a continuar por WhatsApp

WhatsApp: https://wa.me/5493417558966`;

        // 4. Preparar mensajes para Gemini (según documentación oficial)
        const contents = [
            {
                parts: [{ text: systemPrompt + "\n\nINICIA LA CONVERSACIÓN:" }]
            }
        ];

        // Agregar historial de conversación
        messages.forEach(msg => {
            if (msg.role && msg.content) {
                contents.push({
                    parts: [{ text: msg.content }]
                });
            }
        });

        // Agregar último mensaje del usuario
        if (userMessage) {
            contents.push({
                parts: [{ text: userMessage }]
            });
        }

        console.log('🤖 Enviando a Gemini 2.5 Flash...');
        console.log('Historial:', messages.length, 'mensajes');

        // 5. Payload según documentación oficial
        const payload = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 800,
            }
        };

        // 6. Llamar a Gemini 2.5 Flash API (CORRECTO según docs)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        // 7. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Gemini:', response.status, errorText.substring(0, 200));
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Perfecto, te escucho.\n\nPara ayudarte mejor, contame:\n▸ ¿Qué tipo de negocio tenés?\n▸ ¿Qué querés lograr o mejorar con tecnología?\n\nAsí te puedo dar una propuesta concreta y precio estimativo.`,
                    error: true,
                    fallback: true
                })
            };
        }

        // 8. Éxito
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      '¡Hola! Contame sobre tu negocio para ayudarte mejor.';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: aiText,
                success: true,
                empresa: 'Digital Rosario',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('🔥 Error crítico:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Hola! Veo que querés mejorar tu negocio.\n\nPara darte una propuesta personalizada:\n▸ ¿Qué tipo de negocio tenés?\n▸ ¿Qué problema querés resolver?\n\nO si preferís, escribinos directo:\n📱 https://wa.me/5493417558966`,
                error: error.message,
                fallback: true
            })
        };
    }
};
