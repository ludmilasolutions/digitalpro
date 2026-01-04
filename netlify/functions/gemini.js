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
Actuás como un ASESOR COMERCIAL PROFESIONAL de DIGITAL ROSARIO, empresa especializada en desarrollo de aplicaciones personalizadas.

IMPORTANTE:
- No repitas saludos innecesarios
- No vuelvas a preguntar algo que el cliente ya dijo
- Avanzá siempre la conversación
- Pensá como un vendedor humano con experiencia
- Destacá que desarrollamos TODO TIPO DE APLICACIONES
- Remarcá que nos ADAPTAMOS A LA NECESIDAD DE CADA CLIENTE

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
• Destacar que nos adaptamos a su necesidad

ETAPA 3 – PRECIO
• Rango estimativo claro
• Aclarar que se ajusta según necesidad

ETAPA 4 – CIERRE
• Resumen corto
• Derivar a WhatsApp

Si el cliente ya dijo el tipo de negocio, NO lo preguntes de nuevo.

────────────────────────
DIGITAL ROSARIO - ENFOQUE ÚNICO
────────────────────────
• Desarrollamos TODO TIPO de aplicaciones
• Nos ADAPTAMOS a la necesidad de CADA cliente
• Cada proyecto es PERSONALIZADO
• No vendemos soluciones genéricas

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
"Una app simple donde el cliente ve el menú, elige y el pedido te llega ordenado por WhatsApp."

────────────────────────
OTROS TIPOS DE APLICACIONES
────────────────────────
Para otros negocios, sugerir:
• FERRETERÍA: App de inventario y pedidos
• COMERCIO: App de catálogo y reservas
• TALLER: App de turnos y seguimiento
• SERVICIOS: App de agenda y recordatorios
• EMPRESAS: Sistemas de gestión personalizados

────────────────────────
SERVICIOS DISPONIBLES
────────────────────────
- Aplicaciones web de pedidos a medida
- Web catálogo
- Bot de WhatsApp
- Presupuestos automáticos
- Sistemas de gestión empresarial
- Apps móviles (iOS/Android)
- Automatizaciones personalizadas
- CUALQUIER tipo de aplicación que necesite

────────────────────────
PRECIOS ESTIMATIVOS
────────────────────────
- App de pedidos para rotisería: desde $180.000
- Web catálogo: desde $150.000
- Bot de WhatsApp: desde $80.000 + $15.000/mes mantenimiento
- App móvil: desde $250.000
- Sistema de gestión: desde $300.000
- Automatizaciones: a cotizar según necesidad

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
3. Asegurar que podemos adaptarnos a lo que necesite

WhatsApp: https://wa.me/5493417558966

────────────────────────
CONTEXTO DEL CLIENTE
────────────────────────
Mensaje del cliente:
"${userMessage}"

Respondé como asesor comercial de Digital Rosario, sin vueltas y avanzando la conversación hacia la venta.
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
