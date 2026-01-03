// config.js - CONFIGURACIÓN ACTUALIZADA
const CONFIG = {
    // Configuración de endpoints
    USE_SERVERLESS_ENDPOINT: true,
    SERVERLESS_ENDPOINT: "/.netlify/functions/gemini",
    
    // WhatsApp (usa tu número real)
    WHATSAPP_PHONE: "5493417558966",
    
    // Configuración del chat IA
    CHAT: {
        INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital IA. Contame sobre tu negocio y te ayudo con soluciones 👇",
        ENABLE_REAL_AI: true, // Activar IA real
        MAX_HISTORY: 8
    }
};

// Asegurar que se exporte globalmente
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    console.log('✅ Config.js cargado correctamente', CONFIG);
}

// También exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
