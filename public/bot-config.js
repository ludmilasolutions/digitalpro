// bot-config.js
// Configuración del bot - Preguntas y textos editables
const BOT_CONFIG = {
    whatsappNumber: '5493417558966',
    questions: [
        {
            id: 'rubro',
            text: '¿A qué se dedica tu negocio?',
            placeholder: 'Ej: Gastronomía, Comercio, Servicios...'
        },
        {
            id: 'actividad',
            text: '¿Qué tipo de productos o servicios ofrecés?',
            placeholder: 'Ej: Comida rápida, Ropa, Consultoría...'
        },
        {
            id: 'canales',
            text: '¿Por dónde te escriben hoy los clientes?',
            placeholder: 'Ej: WhatsApp, Instagram, Teléfono...'
        },
        {
            id: 'problema',
            text: '¿Qué es lo que más te cuesta actualmente?',
            placeholder: 'Ej: No llego a responder, Pierdo ventas...'
        },
        {
            id: 'objetivo',
            text: '¿Qué te gustaría mejorar?',
            placeholder: 'Ej: Automatizar respuestas, Vender más...'
        }
    ],
    texts: {
        welcome: '¡Hola! Soy el Asesor Digital de Digital Rosario. Voy a hacerte algunas preguntas para preparar un resumen de tu negocio y después podemos continuar por WhatsApp.',
        thanks: '¡Gracias por toda la información!',
        summaryTitle: '✅ Información completa',
        summaryMessage: 'Ya tengo toda la información para preparar tu caso. Podés continuar directamente por WhatsApp:',
        whatsappCTA: 'Continuar por WhatsApp',
        disclaimer: 'Se enviará automáticamente el resumen de tu consulta'
    },
    styles: {
        primaryColor: '#6675FF',
        whatsappColor: '#25D366'
    }
};
