// netlify/functions/gemini.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Manejar preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }
    
    try {
        const { messages, userData } = JSON.parse(event.body);
        
        if (!messages || !Array.isArray(messages)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Formato de mensajes inválido' })
            };
        }
        
        // API Key desde variables de entorno
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY no configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Error de configuración' })
            };
        }
        
        // Llamar a Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messages,
                    generationConfig: {
                        temperature: 0.7,
                        topK: 1,
                        topP: 0.8,
                        maxOutputTokens: 800,
                    }
                })
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Gemini API:', response.status, errorText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Error de Gemini API: ${response.status}` 
                })
            };
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Respuesta inesperada' })
            };
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                text: data.candidates[0].content.parts[0].text,
                userData: userData || {}
            })
        };
        
    } catch (error) {
        console.error('Error en función:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Error interno',
                message: error.message 
            })
        };
    }
};
