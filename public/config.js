// config.js - Configuración para Netlify
const CONFIG = {
    // IMPORTANTE: Usar siempre serverless endpoint en Netlify
    USE_SERVERLESS_ENDPOINT: true,
    
    // Ruta a la función serverless de Netlify
    SERVERLESS_ENDPOINT: "/.netlify/functions/gemini",
    
    // Número de WhatsApp
    WHATSAPP_PHONE: "5493417558966", // Reemplazá con tu número
    
    // Configuración de precios
    PRICES: {
        WEB_CATALOG: "desde $150.000",
        WHATSAPP_BOT: "desde $80.000 + $20.000/mes",
        MARKETING_MONTHLY: "desde $45.000 por mes",
        ADS_MANAGEMENT: "desde $30.000 + inversión en anuncios",
        AUTOMATION_CUSTOM: "se cotizan según necesidad (desde $120.000)",
        QUOTES_AUTOMATIC: "desde $60.000"
    },
    
    // Nombre del negocio
    BUSINESS_NAME: "Soluciones Digitales para Negocios Locales",
    
    // Configuración del chat
    CHAT: {
        INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇",
        TYPING_DELAY: 1000,
        MAX_HISTORY: 20,
        ENABLE_AI: true // Activar IA real
    }
};

// Hacer config disponible globalmente
window.CONFIG = CONFIG;
