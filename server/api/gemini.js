// server/api/gemini.js - Endpoint serverless para proteger API Key

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }
    
    try {
        const { messages, userData } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Formato de mensajes inválido' });
        }
        
        // Tu API Key de Google AI Studio (variable de entorno)
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY no configurada en variables de entorno');
            return res.status(500).json({ error: 'Error de configuración del servidor' });
        }
        
        // Llamar a Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            console.error('❌ Error de Gemini API:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `Error de Gemini API: ${response.status}` 
            });
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]) {
            return res.status(500).json({ error: 'Respuesta inesperada de la API' });
        }
        
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Devolver respuesta
        return res.status(200).json({
            text: aiResponse,
            userData: userData || {}
        });
        
    } catch (error) {
        console.error('❌ Error en endpoint serverless:', error);
        return res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
}