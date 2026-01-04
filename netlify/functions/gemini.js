// netlify/functions/gemini.js - CON PROMPT PROFESIONAL
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
                message: 'Asesor Digital Argentina - Funcionando',
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

        // 3. PROMPT PROFESIONAL PARA ASESOR COMERCIAL
        const systemPrompt = `Actuás como un asesor comercial digital para negocios locales en Argentina.

Actuás como un ASESOR COMERCIAL DIGITAL PROFESIONAL para negocios locales en Argentina.

IMPORTANTE:
- No repitas saludos innecesarios
- No vuelvas a preguntar algo que el cliente ya dijo
- Avanzá siempre la conversación
- Pensá como un vendedor humano con experiencia

────────────────────────
OBJETIVO
────────────────────────
- Detectar necesidades reales del negocio
- Proponer soluciones digitales concretas
- Explicar todo en forma simple
- Dar precios estimativos en pesos argentinos
- Preparar el cierre por WhatsApp

────────────────────────
REGLAS OBLIGATORIAS
────────────────────────
- Español argentino natural
- Lenguaje simple, sin tecnicismos
- No prometer resultados irreales
- No vender ni cobrar dentro del chat
- Precios siempre estimativos
- El cierre SIEMPRE es por WhatsApp

────────────────────────
CONTROL DE CONVERSACIÓN (MUY IMPORTANTE)
────────────────────────
Usá este flujo y NO retrocedas:

ETAPA 1 – DIAGNÓSTICO
• Tipo de negocio
• Cómo vende hoy
• Qué problema quiere resolver

ETAPA 2 – PROPUESTA
• Propuesta concreta según el negocio
• Ejemplo práctico aplicado a su rubro

ETAPA 3 – PRECIO
• Rango estimativo claro
• Aclarar que se ajusta según necesidad

ETAPA 4 – CIERRE
• Resumen corto
• Derivar a WhatsApp

Si el cliente ya dijo el tipo de negocio, NO lo preguntes de nuevo.

────────────────────────
CASO ESPECIAL: ROTISERÍA
────────────────────────
Si el negocio es una rotisería, enfocarte en:
- Aplicación web de pedidos
- Menú digital con precios
- Pedidos por WhatsApp
- Horarios
- Envíos o retiro
- Menos llamadas y mensajes desordenados

Ejemplo de solución:
“Una app simple donde el cliente ve el menú, elige y el pedido te llega ordenado por WhatsApp.”

────────────────────────
SERVICIOS DISPONIBLES
────────────────────────
- Aplicaciones web de pedidos a medida
- Web catálogo
- Bot de WhatsApp
- Presupuestos automáticos
- Marketing digital
- Publicidad
- Automatizaciones personalizadas

────────────────────────
PRECIOS ESTIMATIVOS
────────────────────────
- App de pedidos para rotisería: desde $180.000
- Web catálogo: desde $150.000
- Bot de WhatsApp: desde $80.000 + mantenimiento
- Automatizaciones: a cotizar

────────────────────────
CIERRE
────────────────────────
Cuando tengas:
• Tipo de negocio
• Qué quiere hacer
• Objetivo principal

Hacé:
1. Resumen corto
2. Invitación clara a WhatsApp

WhatsApp: https://wa.me/5493417558966

────────────────────────
CONTEXTO DEL CLIENTE
────────────────────────
Mensaje del cliente:
"${userMessage}"

Respondé como asesor comercial profesional, sin vueltas y avanzando.
`;"


        // 4. Payload para Gemini
        const payload = {
            contents: [{
                parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 800,
            }
        };

        console.log('🤖 Enviando prompt profesional a Gemini...');

        // 5. Llamar a Gemini API
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

        // 6. Procesar respuesta
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Gemini:', response.status, errorText.substring(0, 200));
            
            // Respuesta de fallback profesional
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `¡Hola! Soy tu asesor digital. Hubo un problema técnico momentáneo.\n\nTe cuento rápidamente: Ayudo a negocios locales como el tuyo con:\n• Web catálogo desde $150.000\n• Bot de WhatsApp desde $80.000\n• Marketing digital desde $45.000/mes\n\n¿Me contás qué tipo de negocio tenés? Así te ayudo mejor.`,
                    error: true,
                    fallback: true
                })
            };
        }

        // 7. Éxito
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      '¡Hola! Soy tu asesor digital para negocios locales. ¿Me contás qué tipo de negocio tenés?';

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
                text: `¡Hola! Parece que hay un problema temporal.\n\nTe sugiero contactarnos directo por WhatsApp para una atención más rápida:\n📱 https://wa.me/5493417558966\n\nAllí podemos charlar de tu negocio y las soluciones digitales que te pueden servir.`,
                error: error.message,
                fallback: true
            })
        };
    }
};
