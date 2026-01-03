// config.js - Configuración para Netlify
const CONFIG = {
    // Siempre usar serverless endpoint en Netlify
    USE_SERVERLESS_ENDPOINT: true,
    
    // Ruta ABSOLUTA a la función (importante para Netlify)
    SERVERLESS_ENDPOINT: "/.netlify/functions/gemini",
    
    // Número de WhatsApp
    WHATSAPP_PHONE: "5493417558966",
    
    // Precios
    PRICES: {
        WEB_CATALOG: "desde $150.000",
        WHATSAPP_BOT: "desde $80.000 + $15.000/mes",
        MARKETING_MONTHLY: "desde $45.000 por mes",
        ADS_MANAGEMENT: "desde $30.000 + inversión en anuncios",
        AUTOMATION_CUSTOM: "desde $120.000",
        QUOTES_AUTOMATIC: "desde $60.000"
    },
    
    // Chat config
    CHAT: {
        INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital IA. <strong>Contame sobre tu negocio</strong> y te ayudo con soluciones 👇",
        MAX_HISTORY: 15
    }
};

// Exportar globalmente
window.CONFIG = CONFIG;
console.log('✅ Config.js cargado:', CONFIG.SERVERLESS_ENDPOINT);
