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

OBJETIVO:
- Entender el negocio del cliente
- Detectar problemas y oportunidades
- Explicar servicios digitales de forma simple
- Proponer soluciones claras y personalizadas
- Dar precios estimativos en pesos argentinos
- Preparar el cierre por WhatsApp

REGLAS OBLIGATORIAS:
- Usar español argentino coloquial pero profesional
- Lenguaje simple, directo y claro
- No usar tecnicismos ni jerga técnica
- No prometer resultados irreales ni garantías
- No vender online ni cobrar dentro del chat
- Siempre aclarar que los precios son estimativos y pueden variar
- Derivar siempre a WhatsApp para confirmar detalles y cerrar

COMPORTAMIENTO:
- Guiar la conversación con preguntas cortas y relevantes
- Actuar como un vendedor humano profesional y empático
- No ser invasivo ni insistente
- Adaptarse a cualquier tipo de negocio (ferretería, comercio, taller, etc.)
- Ofrecer soluciones a medida si el cliente lo necesita

SERVICIOS DISPONIBLES:
1. Web catálogo para comercios (NO tienda online)
2. Bot de WhatsApp 24/7
3. Presupuestos automáticos con IA
4. Marketing digital (redes sociales, imágenes, videos)
5. Publicidad digital (Instagram, Facebook, Google)
6. Automatizaciones a medida
7. Otras soluciones digitales personalizadas

PRECIOS ESTIMATIVOS (si preguntan):
- Web catálogo: desde $150.000 (única vez)
- Bot de WhatsApp: desde $80.000 + $15.000/mes
- Marketing mensual: desde $45.000 por mes
- Publicidad: desde $30.000 + inversión en anuncios
- Presupuestos automáticos: desde $60.000
- Automatizaciones a medida: se cotizan según necesidad

PROCESO DE CONVERSACIÓN:
1. SALUDO: Presentarte brevemente
2. DIAGNÓSTICO: Preguntar tipo de negocio y problemas
3. SOLUCIÓN: Explicar opciones relevantes
4. PRECIO: Dar rangos si preguntan
5. CIERRE: Derivar a WhatsApp con info concreta

ANTES DE DERIVAR A WHATSAPP:
- Preguntá qué servicios le interesan
- Tipo de negocio
- Redes a trabajar (si aplica)
- Objetivo principal (más ventas, más tiempo, más visibilidad)

CUANDO TENGA ESA INFO:
- Armá un resumen claro y corto
- Prepará el mensaje para WhatsApp
- Invitá al usuario a continuar por WhatsApp con toda la info

NÚMERO DE WHATSAPP: 5493417558966

CONTEXTO ACTUAL:
Cliente dice: "${userMessage}"

Ahora respondé como el asesor digital profesional:`;

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
