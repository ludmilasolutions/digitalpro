// config.js - Archivo de configuración editable

const CONFIG = {
    // ====================
    // 1. CONFIGURACIÓN DE GEMINI API
    // ====================
    
    // OPCIÓN A: Usar endpoint serverless (RECOMENDADO para producción)
    // Crea un endpoint en Vercel/Netlify para proteger tu API Key
    USE_SERVERLESS_ENDPOINT: true,
    
    // URL de tu endpoint serverless (ej: https://tu-proyecto.vercel.app/api/gemini)
    SERVERLESS_ENDPOINT: "https://digitalproduction.netlify.app/server/api/gemini.js",
    
    // OPCIÓN B: Usar API Key directamente (SOLO para desarrollo/pruebas)
    GEMINI_API_KEY: "AIzaSyC46YPd2USPJaI8IRcwyAkMzT3VUPMUzLY",
    
    // ====================
    // 2. CONFIGURACIÓN DE WHATSAPP
    // ====================
    
    // Número de WhatsApp (con código de país, sin + ni espacios)
    // Ejemplo para Argentina: 5491112345678
    WHATSAPP_PHONE: "5491112345678",
    
    // ====================
    // 3. CONFIGURACIÓN DE PRECIOS (EDITABLES)
    // ====================
    
    PRICES: {
        WEB_CATALOG: "desde $150.000",
        WHATSAPP_BOT: "desde $80.000 + $15.000/mes",
        MARKETING_MONTHLY: "desde $45.000 por mes",
        ADS_MANAGEMENT: "desde $30.000 + inversión en anuncios",
        AUTOMATION_CUSTOM: "se cotizan según necesidad (desde $120.000)",
        QUOTES_AUTOMATIC: "desde $60.000"
    },
    
    // ====================
    // 4. INFORMACIÓN DEL NEGOCIO
    // ====================
    
    BUSINESS_NAME: "Soluciones Digitales para Negocios Locales",
    
    // ====================
    // 5. CONFIGURACIÓN DEL CHAT
    // ====================
    
    CHAT: {
        INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇",
        TYPING_DELAY: 1000, // milisegundos
        MAX_HISTORY: 20 // mensajes a mantener en historial
    }
};

// Hacer config global
window.CONFIG = CONFIG;
