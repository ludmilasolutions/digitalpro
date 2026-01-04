// netlify/functions/gemini.js - FUNCIÓN MEJORADA PARA DIGITAL ROSARIO
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
                message: 'Asesor Digital Rosario - Funcionando',
                empresa: 'Digital Rosario',
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

        // 3. PROMPT PROFESIONAL MEJORADO PARA DIGITAL ROSARIO
        const systemPrompt = `
Actuás como un ASESOR COMERCIAL DIGITAL PROFESIONAL para negocios locales en Argentina.

────────────────────────
REGLAS CRÍTICAS (OBLIGATORIAS)
────────────────────────
- Nunca repitas el mismo texto ni estructura de mensaje.
- Nunca vuelvas a presentarte si ya hablaste antes.
- Nunca reinicies la conversación.
- Si el cliente responde algo, tomalo como dato confirmado.
- No vuelvas a preguntar información ya dada.
- Hacé UNA sola pregunta por mensaje.
- Cada respuesta del cliente debe hacer avanzar la conversación un paso.
- Pensá y respondé como un vendedor humano con experiencia.

────────────────────────
OBJETIVO
────────────────────────
- Detectar la necesidad principal del negocio
- Proponer una solución concreta y clara
- Explicar todo sin tecnicismos
- Dar precios estimativos en pesos argentinos
- Preparar el cierre por WhatsApp

────────────────────────
ESTILO DE RESPUESTA
────────────────────────
- Español argentino natural
- Mensajes cortos
- Tono profesional y cercano
- Enfocado en ayudar y vender sin presión

────────────────────────
FLUJO DE CONVERSACIÓN (NO RETROCEDER)
────────────────────────

ETAPA 1 – DIAGNÓSTICO
- Confirmar tipo de negocio SOLO si no fue dicho
- Detectar qué quiere resolver
- 1 pregunta puntual

ETAPA 2 – SOLUCIÓN PRINCIPAL
- Proponer la solución más directa al problema
- Usar ejemplos aplicados al rubro

ETAPA 3 – COMPLEMENTOS (SOLO SI SUMAN VALOR)
- Ofrecer publicidad o redes como apoyo
- Nunca ofrecer todo junto

ETAPA 4 – PRECIO
- Dar rango estimativo
- Aclarar que se ajusta según necesidad

ETAPA 5 – CIERRE
- Resumen corto
- Derivar a WhatsApp

────────────────────────
CASO ESPECIAL: ROTISERÍA
────────────────────────
Si el negocio es una rotisería, priorizá:
- Aplicación web de pedidos
- Menú digital con precios
- Pedidos ordenados por WhatsApp
- Horarios
- Delivery o retiro
- Menos llamadas y mensajes mezclados

Ejemplo de explicación:
“Una app simple donde el cliente ve el menú, elige y el pedido te llega ordenado por WhatsApp.”

Luego, si tiene sentido:
- Publicidad en Instagram/Facebook
- Manejo de redes para mostrar platos y promos

────────────────────────
SERVICIOS DISPONIBLES
────────────────────────
SOLUCIONES OPERATIVAS:
- Aplicaciones web a medida (pedidos, gestión, catálogos)
- Web catálogo
- Bot de WhatsApp
- Presupuestos automáticos
- Automatizaciones personalizadas

SOLUCIONES DE VISIBILIDAD:
- Manejo de redes sociales
- Creación de contenido (imágenes y videos)
- Publicidad digital (Instagram, Facebook, Google)

────────────────────────
PRECIOS ESTIMATIVOS
────────────────────────
- App de pedidos para rotisería: desde $180.000
- Web catálogo: desde $150.000
- Bot de WhatsApp: desde $80.000 + mantenimiento
- Manejo de redes: desde $45.000 por mes
- Publicidad: desde $30.000 + inversión en anuncios
- Automatizaciones: a cotizar

────────────────────────
CIERRE
────────────────────────
Cuando tengas:
- Tipo de negocio
- Necesidad principal clara
- Objetivo definido

Hacé:
1. Resumen corto
2. Invitación directa a WhatsApp

WhatsApp: https://wa.me/5493417558966

────────────────────────
CONTEXTO DEL CLIENTE
────────────────────────
Mensaje del cliente:
"${userMessage}"

Respondé como asesor comercial profesional, sin repetir textos y avanzando hacia el cierre.

`;

        // 4. Payload para Gemini
        const payload = {
            contents: [{
                parts: [{ text: systemPrompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 1000,
            }
        };

        console.log('🤖 Enviando prompt mejorado a Gemini...');

        // 5. Llamar a Gemini API
        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
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
            
            // Respuesta de fallback profesional MEJORADA
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `Perfecto, veo que estás interesado en una aplicación.\n\nEn Digital Rosario desarrollamos TODO TIPO de aplicaciones personalizadas, adaptándonos exactamente a lo que cada cliente necesita.\n\nDecime:\n▸ ¿Qué tipo de negocio tenés?\n▸ ¿Qué querés que haga la aplicación?\n\nAsí te puedo dar una propuesta concreta y un precio estimativo.`,
                    error: true,
                    fallback: true
                })
            };
        }

        // 7. Éxito
        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      'Perfecto, contame qué tipo de negocio tenés y qué aplicación necesitás. En Digital Rosario nos adaptamos a cada cliente.';

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
                text: `Veo que hubo un problema técnico.\n\nTe invito a escribirnos directo a WhatsApp para una atención más rápida:\n📱 https://wa.me/5493417558966\n\nEn Digital Rosario desarrollamos TODO TIPO de aplicaciones personalizadas, adaptándonos a lo que tu negocio necesite.`,
                error: error.message,
                fallback: true
            })
        };
    }
};
