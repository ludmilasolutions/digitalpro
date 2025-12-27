const CONFIG = {
    // Para Netlify, usa esta URL:
    USE_SERVERLESS_ENDPOINT: true,
    SERVERLESS_ENDPOINT: "/.netlify/functions/gemini", // ← IMPORTANTE: Ruta relativa
    
    // Para desarrollo local:
    // SERVERLESS_ENDPOINT: "http://localhost:8888/.netlify/functions/gemini",
    
    WHATSAPP_PHONE: "5491112345678",
    
    PRICES: {
        WEB_CATALOG: "desde $150.000",
        WHATSAPP_BOT: "desde $80.000 + $15.000/mes",
        MARKETING_MONTHLY: "desde $45.000 por mes",
        ADS_MANAGEMENT: "desde $30.000 + inversión en anuncios",
        AUTOMATION_CUSTOM: "se cotizan según necesidad (desde $120.000)",
        QUOTES_AUTOMATIC: "desde $60.000"
    },
    
    BUSINESS_NAME: "Soluciones Digitales para Negocios Locales",
    
    CHAT: {
        INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇",
        TYPING_DELAY: 1000,
        MAX_HISTORY: 20
    }
};

window.CONFIG = CONFIG;
