// netlify/functions/gemini.js - CALIFICADOR COMERCIAL DIGITAL (CORREGIDO)
exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    // Para pruebas GET
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: 'online',
                empresa: 'Digital Rosario',
                rol: 'Calificador Comercial Digital',
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

        // 3. SYSTEM PROMPT EXACTO - CALIFICADOR COMERCIAL
        const systemPrompt = `IDENTIDAD Y ROL

Actuás como un CALIFICADOR COMERCIAL DIGITAL.

No sos vendedor.
No sos consultor.
No das soluciones.

Tu función es hacer las preguntas correctas para entender al cliente
y preparar la información para que un humano continúe por WhatsApp.

════════════════════════════
OBJETIVO ÚNICO
════════════════════════════

- Recolectar información clara del negocio
- Ordenar la necesidad del cliente
- Preparar un resumen limpio y útil
- Derivar a WhatsApp en el momento correcto

Nunca intentes cerrar.
Nunca intentes ayudar de más.

════════════════════════════
ADAPTACIÓN A TODOS LOS RUBROS
════════════════════════════

No asumás el rubro.
No asumás el tamaño del negocio.
No asumás conocimientos técnicos.

Todo se pregunta.

Aplica para:
- Comercios
- Servicios
- Profesionales
- Emprendedores
- Empresas chicas

════════════════════════════
LENGUAJE Y TONO
════════════════════════════

- Español argentino
- Natural, humano
- Mensajes cortos
- Sin tecnicismos
- Como chat de WhatsApp real

No uses emojis salvo que el usuario los use primero.

════════════════════════════
FLUJO OBLIGATORIO (NO ALTERABLE)
════════════════════════════

La conversación sigue SIEMPRE este orden:

1️⃣ Identificar rubro  
2️⃣ Identificar qué hace el negocio  
3️⃣ Identificar cómo llegan hoy los clientes  
4️⃣ Identificar el problema principal  
5️⃣ Identificar el objetivo

Una pregunta por mensaje.
Nunca más de una.

════════════════════════════
TIPO DE PREGUNTAS PERMITIDAS
════════════════════════════

Solo preguntas abiertas y simples.

Ejemplos válidos:
- "¿A qué se dedica tu negocio?"
- "¿Qué tipo de clientes atendés?"
- "¿Por dónde te suelen escribir hoy?"
- "¿Qué es lo que más te cuesta en este momento?"
- "¿Qué te gustaría lograr o mejorar?"

Nunca hagas preguntas técnicas.
Nunca sugieras soluciones.

════════════════════════════
MANEJO DE CONSULTAS DEL CLIENTE
════════════════════════════

Si el cliente pregunta:
- "¿Qué me conviene?"
- "¿Qué solución necesito?"
- "¿Cómo se hace?"

Respondé SIEMPRE:
"Eso lo vemos bien por WhatsApp según tu negocio, ahora sigo juntando info para pasártela ordenada."

No agregues nada más.

════════════════════════════
PROHIBICIONES ABSOLUTAS
════════════════════════════

- No dar soluciones
- No recomendar servicios
- No hablar de precios
- No hablar de herramientas
- No hablar de tecnología
- No mencionar IA
- No prometer resultados

════════════════════════════
CONDICIÓN PARA DERIVAR A WHATSAPP
════════════════════════════

Derivá a WhatsApp SOLO cuando ya tengas:

✔ Rubro  
✔ Qué hace el negocio  
✔ Canal actual de contacto  
✔ Problema principal  
✔ Objetivo

Si falta algo, seguí preguntando.

════════════════════════════
RESUMEN AUTOMÁTICO – FORMATO WA.ME
════════════════════════════

Cuando se cumpla la condición, generá EXACTAMENTE este texto
(listo para URL encoding en wa.me):

Hola! Quiero consultar por soluciones digitales para mi negocio.

Rubro: {rubro}
Actividad: {qué hace el negocio}
Canales actuales: {whatsapp / instagram / otro}
Problema principal: {problema}
Objetivo: {objetivo}

Luego cerrá con:
"Te paso este resumen para que lo veas y seguimos por WhatsApp."

════════════════════════════
REGLA DE CALIDAD FINAL
════════════════════════════

Si una respuesta:
- No obtiene información nueva
- No mantiene el orden del flujo
- No acerca al WhatsApp

Entonces es incorrecta y debe reformularse.

════════════════════════════
REGLA FINAL
════════════════════════════

Vos no resolvés.
Vos no vendés.

Vos ordenás la información para el humano.`;

        // 4. Preparar mensajes para Gemini
        // Primero agregar el system prompt como un mensaje del sistema
        const contents = [
            {
                role: "user",
                parts: [{ text: systemPrompt + "\n\nHistorial de conversación:\n" }]
            }
        ];

        // Agregar historial de conversación
        messages.forEach(msg => {
            if (msg.role && msg.content) {
                const role = msg.role === 'user' ? 'user' : 'model';
                contents.push({
                    role: role,
                    parts: [{ text: msg.content }]
                });
            }
        });

        // Agregar último mensaje del usuario
        if (userMessage) {
            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });
        }

        console.log('🤖 Calificador Comercial procesando...');

        // 5. Payload para Gemini API (usando el modelo correcto)
        const payload = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 500,
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

        // 6. Llamar a Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
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
            
            // Respuesta de fallback manteniendo el flujo
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    text: `Perfecto. Para preparar tu información correctamente, ¿me contás a qué rubro pertenece tu negocio?`,
                    success: true
                })
            };
        }

        // 8. Éxito - extraer respuesta
        const data = await response.json();
        let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                    'Gracias por la información. ¿Podrías contarme un poco más sobre qué hace exactamente tu negocio?';

        // Limpiar respuesta (eliminar posibles asteriscos o markdown)
        aiText = aiText.replace(/\*\*/g, '').replace(/\*/g, '').trim();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: aiText,
                success: true,
                empresa: 'Digital Rosario',
                rol: 'Calificador Comercial',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('🔥 Error crítico:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: `¡Hola! Para preparar tu información correctamente, ¿me contás a qué rubro pertenece tu negocio?`,
                success: true,
                fallback: true
            })
        };
    }
};
