// script.js - Lógica principal del sitio y chat IA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema cargado correctamente');
    
    // ===== ELEMENTOS DEL DOM =====
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBody = document.querySelector('.chat-body');
    const chatHeader = document.querySelector('.chat-header');
    
    // ===== VARIABLES DE ESTADO =====
    let chatInitialized = false;
    let conversationHistory = [];
    let userData = {
        businessType: '',
        interestedServices: [],
        networks: '',
        mainGoal: '',
        problems: []
    };
    
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        CHAT: {
            INITIAL_MESSAGE: '¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇',
            MAX_HISTORY: 15
        },
        WHATSAPP_PHONE: '5491111111111'
    };
    
    // ===== SISTEMA DE CHAT - MEJORADO =====
    
    // 1. Función para agregar mensaje inicial UNA SOLA VEZ
    function addInitialMessage() {
        if (!chatInitialized && chatMessages && chatMessages.children.length === 0) {
            const initialMessage = document.createElement('div');
            initialMessage.className = 'message ai';
            initialMessage.innerHTML = `
                <div class="message-content">
                    <p>${CONFIG.CHAT.INITIAL_MESSAGE}</p>
                </div>
            `;
            chatMessages.appendChild(initialMessage);
            chatInitialized = true;
            
            // Agregar al historial
            conversationHistory.push({
                role: 'assistant',
                content: CONFIG.CHAT.INITIAL_MESSAGE,
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Mensaje inicial agregado');
        }
    }
    
    // 2. Inicializar chat
    addInitialMessage();
    
    // 3. Toggle del chat - MEJORADO
    if (chatToggle && chatBody) {
        chatToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Alternar clase 'collapsed'
            chatBody.classList.toggle('collapsed');
            
            // Cambiar ícono
            const icon = this.querySelector('i');
            if (chatBody.classList.contains('collapsed')) {
                icon.className = 'fas fa-chevron-up';
            } else {
                icon.className = 'fas fa-chevron-down';
                // Hacer scroll al final al abrir
                setTimeout(scrollToBottom, 100);
            }
        });
        
        // También permitir abrir/cerrar haciendo clic en el header
        if (chatHeader) {
            chatHeader.addEventListener('click', function(e) {
                if (e.target !== chatToggle && !chatToggle.contains(e.target)) {
                    chatToggle.click();
                }
            });
        }
    }
    
    // 4. Auto-resize del textarea
    if (userInput) {
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Enviar mensaje con Enter (sin Shift)
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    
    // 5. Botón de enviar
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    // 6. Función para hacer scroll al final
    function scrollToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // 7. Función para agregar mensaje
    function addMessage(text, sender = 'ai') {
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Limpiar y formatear el texto para HTML seguro
        const formattedText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        contentDiv.innerHTML = `<p>${formattedText}</p>`;
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Asegurar que el chat esté abierto
        if (chatBody && chatBody.classList.contains('collapsed')) {
            chatBody.classList.remove('collapsed');
            if (chatToggle) {
                chatToggle.querySelector('i').className = 'fas fa-chevron-down';
            }
        }
        
        // Hacer scroll al final
        setTimeout(scrollToBottom, 50);
        
        // Agregar al historial
        conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });
        
        // Limitar historial
        if (conversationHistory.length > CONFIG.CHAT.MAX_HISTORY) {
            conversationHistory = conversationHistory.slice(-CONFIG.CHAT.MAX_HISTORY);
        }
    }
    
    // 8. Extraer datos del usuario de la conversación - MEJORADO
    function extractUserDataFromMessage(message) {
        const lowerMsg = message.toLowerCase();
        
        console.log('🔍 Analizando mensaje:', lowerMsg);
        
        // Detectar tipo de negocio (más opciones)
        const businessTypes = [
            { keywords: ['ferretería', 'ferreteria', 'ferretero', 'ferreter'], value: 'Ferretería' },
            { keywords: ['comercio', 'negocio', 'local', 'tienda', 'almacén', 'almacen', 'kiosco', 'kiosko'], value: 'Comercio local' },
            { keywords: ['taller', 'mecánico', 'mecanico', 'reparación', 'reparacion'], value: 'Taller' },
            { keywords: ['corralón', 'corralon', 'materiales', 'construcción', 'construccion'], value: 'Corralón de materiales' },
            { keywords: ['pyme', 'empresa', 'emprendimiento', 'emprendedor'], value: 'Pyme/Emprendimiento' },
            { keywords: ['restaurant', 'restaurante', 'cafetería', 'cafeteria', 'bar', 'comida'], value: 'Restaurante/Cafetería' },
            { keywords: ['peluquería', 'peluqueria', 'barbería', 'barberia', 'estética', 'estetica'], value: 'Peluquería/Estética' },
            { keywords: ['farmacia', 'farmacéutico', 'farmaceutico'], value: 'Farmacia' },
            { keywords: ['veterinaria', 'veterinario', 'mascota'], value: 'Veterinaria' },
            { keywords: ['ropa', 'indumentaria', 'moda', 'vestimenta'], value: 'Tienda de ropa' }
        ];
        
        businessTypes.forEach(type => {
            if (type.keywords.some(keyword => lowerMsg.includes(keyword))) {
                userData.businessType = type.value;
                console.log(`🏪 Tipo de negocio detectado: ${type.value}`);
            }
        });
        
        // Detectar servicios de interés (más específico)
        const services = [
            { 
                key: 'web', 
                terms: ['web', 'catálogo', 'catalogo', 'página web', 'pagina web', 'sitio web', 'online', 'internet'] 
            },
            { 
                key: 'bot', 
                terms: ['bot', 'whatsapp', 'automático', 'automatico', 'atención automática', 'atencion automatica', 'chatbot'] 
            },
            { 
                key: 'marketing', 
                terms: ['marketing', 'redes sociales', 'instagram', 'facebook', 'contenido', 'redes', 'social media'] 
            },
            { 
                key: 'publicidad', 
                terms: ['publicidad', 'anuncios', 'ads', 'promocionar', 'promoción', 'promocion'] 
            },
            { 
                key: 'automatización', 
                terms: ['automatiz', 'automatización', 'automatizacion', 'proceso', 'sistema', 'automatizar'] 
            },
            { 
                key: 'presupuesto', 
                terms: ['presupuesto', 'cotización', 'cotizacion', 'precio automático', 'presupuestar'] 
            },
            { 
                key: 'imagenes', 
                terms: ['imágenes', 'imagenes', 'fotos', 'fotografía', 'fotografia', 'video', 'videos'] 
            }
        ];
        
        services.forEach(service => {
            if (service.terms.some(term => lowerMsg.includes(term))) {
                if (!userData.interestedServices.includes(service.key)) {
                    userData.interestedServices.push(service.key);
                    console.log(`📱 Servicio detectado: ${service.key}`);
                }
            }
        });
        
        // Detectar redes sociales
        const networks = [
            { keyword: 'instagram', value: 'Instagram' },
            { keyword: 'facebook', value: 'Facebook' },
            { keyword: 'tiktok', value: 'TikTok' },
            { keyword: 'twitter', value: 'Twitter/X' },
            { keyword: 'linkedin', value: 'LinkedIn' }
        ];
        
        networks.forEach(network => {
            if (lowerMsg.includes(network.keyword)) {
                if (userData.networks) {
                    if (!userData.networks.includes(network.value)) {
                        userData.networks += ', ' + network.value;
                    }
                } else {
                    userData.networks = network.value;
                }
            }
        });
        
        // Detectar problemas
        const problems = [
            { keyword: 'tiempo', value: 'Falta de tiempo' },
            { keyword: 'no tengo tiempo', value: 'Falta de tiempo' },
            { keyword: 'no llego', value: 'No llego a responder/atender' },
            { keyword: 'no respondo', value: 'No llego a responder/atender' },
            { keyword: 'no atiendo', value: 'No llego a responder/atender' },
            { keyword: 'mensaje', value: 'Muchos mensajes/consultas' },
            { keyword: 'consulta', value: 'Muchos mensajes/consultas' },
            { keyword: 'visible', value: 'No soy visible/No me conocen' },
            { keyword: 'competencia', value: 'La competencia me supera' },
            { keyword: 'venta', value: 'Bajo volumen de ventas' },
            { keyword: 'no vendo', value: 'Bajo volumen de ventas' },
            { keyword: 'manual', value: 'Procesos manuales/lentos' },
            { keyword: 'lento', value: 'Procesos manuales/lentos' },
            { keyword: 'error', value: 'Errores en procesos' }
        ];
        
        problems.forEach(problem => {
            if (lowerMsg.includes(problem.keyword) && !userData.problems.includes(problem.value)) {
                userData.problems.push(problem.value);
                console.log(`⚠️ Problema detectado: ${problem.value}`);
            }
        });
        
        // Detectar objetivos principales
        if (lowerMsg.includes('vender') || lowerMsg.includes('venta') || lowerMsg.includes('ingreso') || lowerMsg.includes('dinero')) {
            userData.mainGoal = 'Vender más/aumentar ingresos';
        } else if (lowerMsg.includes('tiempo') || lowerMsg.includes('automatizar') || lowerMsg.includes('automatico') || lowerMsg.includes('optimizar')) {
            userData.mainGoal = 'Ahorrar tiempo/automatizar procesos';
        } else if (lowerMsg.includes('cliente') || lowerMsg.includes('atención') || lowerMsg.includes('atencion') || lowerMsg.includes('servicio')) {
            userData.mainGoal = 'Mejorar atención/servicio al cliente';
        } else if (lowerMsg.includes('visible') || lowerMsg.includes('conocido') || lowerMsg.includes('presencia') || lowerMsg.includes('reconocimiento')) {
            userData.mainGoal = 'Mayor presencia/reconocimiento digital';
        } else if (lowerMsg.includes('organizar') || lowerMsg.includes('orden') || lowerMsg.includes('proceso') || lowerMsg.includes('eficiencia')) {
            userData.mainGoal = 'Organizar procesos/mejorar eficiencia';
        }
        
        if (userData.mainGoal) {
            console.log(`🎯 Objetivo detectado: ${userData.mainGoal}`);
        }
        
        console.log('📊 Datos actuales del usuario:', userData);
    }
    
    // 9. Generar resumen para WhatsApp - MEJORADO
    function generateWhatsAppSummary() {
        const serviceMap = {
            'web': 'Web catálogo',
            'bot': 'Bot de WhatsApp',
            'marketing': 'Marketing digital',
            'publicidad': 'Publicidad digital',
            'automatización': 'Automatizaciones a medida',
            'presupuesto': 'Presupuestos automáticos',
            'imagenes': 'Creación de imágenes/videos'
        };
        
        const servicesText = userData.interestedServices
            .map(key => serviceMap[key] || key)
            .join('\n- ');
        
        const problemsText = userData.problems.length > 0 
            ? `Problemas identificados:\n${userData.problems.join('\n')}`
            : 'Problemas: Por definir';
        
        return `Hola, quiero consultar por soluciones digitales para mi negocio:

Tipo de negocio: ${userData.businessType || 'Por definir'}

Servicios que me interesan:
- ${servicesText || 'Por definir'}

${problemsText}

Redes a trabajar: ${userData.networks || 'Por definir'}
Objetivo principal: ${userData.mainGoal || 'Por definir'}`;
    }
    
    // 10. Función para agregar mensaje con botón de WhatsApp
    function addMessageWithWhatsAppButton(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${messageText.replace(/\n/g, '<br>')}</p>`;
        
        // Crear botón de WhatsApp
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'whatsapp-action-btn';
        whatsappBtn.style.cssText = `
            margin-top: 15px;
            width: 100%;
            padding: 12px 16px;
            background: #25D366;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-family: 'Open Sans', sans-serif;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: all 0.3s ease;
            text-align: center;
        `;
        
        whatsappBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                <i class="fab fa-whatsapp" style="font-size: 18px;"></i> 
                <strong style="font-size: 15px;">Continuar por WhatsApp</strong>
            </div>
            <small style="font-weight: normal; font-size: 12px; opacity: 0.9;">
                Te llevamos con toda la información que conversamos
            </small>
        `;
        
        whatsappBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(37, 211, 102, 0.3)';
        });
        
        whatsappBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        whatsappBtn.addEventListener('click', function() {
            const summary = generateWhatsAppSummary();
            const encodedMessage = encodeURIComponent(summary);
            const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
            
            // Agregar mensaje de confirmación
            addMessage('¡Perfecto! Te derivé a WhatsApp con todo lo que hablamos. ¡Nos vemos allá! 👍');
            
            // Deshabilitar botón
            whatsappBtn.disabled = true;
            whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> ¡WhatsApp abierto!';
            whatsappBtn.style.opacity = '0.7';
            whatsappBtn.style.cursor = 'default';
        });
        
        contentDiv.appendChild(whatsappBtn);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll al final
        setTimeout(scrollToBottom, 50);
        
        // Agregar al historial
        conversationHistory.push({
            role: 'assistant',
            content: messageText,
            timestamp: new Date().toISOString()
        });
    }
    
    // 11. Función para enviar mensaje
    function handleSendMessage() {
        if (!userInput || !chatMessages) return;
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Agregar mensaje del usuario
        addMessage(message, 'user');
        
        // Extraer datos del usuario
        extractUserDataFromMessage(message);
        
        // Limpiar input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Mostrar indicador de "escribiendo"
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message ai typing';
        typingIndicator.innerHTML = '<div class="message-content"><p><i class="fas fa-ellipsis-h"></i> Analizando tu mensaje...</p></div>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // Generar respuesta después de un delay (simulando procesamiento)
        setTimeout(() => {
            // Remover indicador
            if (typingIndicator.parentNode === chatMessages) {
                chatMessages.removeChild(typingIndicator);
            }
            
            // Generar respuesta basada en el mensaje del usuario
            getAIResponse(message);
        }, 1000);
    }
    
    // 12. SISTEMA DE RESPUESTAS INTELIGENTES - COMPLETAMENTE REHECHO
    function getAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        console.log('🤖 Procesando respuesta para:', lowerMessage);
        
        // MAPA DE INTENCIONES Y RESPUESTAS
        const intentResponses = {
            // Saludos
            'saludo': {
                keywords: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'buenas noches', 'hi', 'hello'],
                response: '¡Hola! 😊 Soy tu asesor digital para negocios locales. ¿Me podés contar qué tipo de negocio tenés?'
            },
            
            // Tipo de negocio
            'negocio': {
                keywords: ['tengo', 'soy', 'trabajo en', 'mi negocio es', 'ferretería', 'ferreteria', 'comercio', 'tienda', 'taller', 'corralón', 'corralon', 'pyme', 'empresa'],
                response: `¡Excelente! Trabajamos mucho con ${userData.businessType || 'negocios como el tuyo'}. 
                
¿Qué es lo que más te gustaría mejorar? Por ejemplo:
• Atender más consultas automáticamente
• Vender más por redes sociales
• Tener una web con tus productos
• Automatizar presupuestos
• Crear contenido profesional

¿Alguna de estas te interesa?`
            },
            
            // Problemas específicos
            'problema_tiempo': {
                keywords: ['no tengo tiempo', 'no me da el tiempo', 'estoy muy ocupado', 'mucho trabajo', 'no llego'],
                response: `¡Te entiendo perfectamente! El tiempo es lo más valioso que tenés.

Con nuestras soluciones podés:
• **Reducir hasta el 70%** de tareas manuales
• Atender consultas **automáticamente 24/7**
• Generar presupuestos **en segundos**
• Manejar redes sociales **sin dedicar horas**

¿Qué tarea te consume más tiempo actualmente?`
            },
            
            'problema_consultas': {
                keywords: ['muchos mensajes', 'no respondo', 'whatsapp lleno', 'instagram lleno', 'no atiendo', 'consultas'],
                response: `¡Es muy común! Muchos negocios pierden ventas por no poder responder a tiempo.

Te propongo un **Bot de WhatsApp** que:
• Atiende consultas frecuentes **automáticamente**
• Envía presupuestos **al instante**
• Deriva consultas complejas a vos
• Funciona **24/7**, incluso de madrugada

¿Te gustaría saber más sobre cómo funciona?`
            },
            
            'problema_ventas': {
                keywords: ['no vendo', 'pocas ventas', 'quiero vender más', 'aumentar ventas', 'más clientes'],
                response: `¡Vamos a solucionarlo! Para vender más necesitás:

1. **Más visibilidad** (redes sociales + publicidad)
2. **Mejor atención** (respuestas rápidas 24/7)
3. **Presencia online** (web catálogo accesible)
4. **Seguimiento automatizado** (no perder oportunidades)

¿Por dónde te gustaría empezar?`
            },
            
            'problema_visible': {
                keywords: ['no me conocen', 'no soy visible', 'la competencia', 'no aparezco', 'instagram', 'facebook'],
                response: `La visibilidad es clave hoy en día. Te ayudo con:

📱 **Marketing Digital Completo:**
• Contenido semanal para redes
• Imágenes y videos profesionales
• Estrategia de publicidad
• Crecimiento orgánico

🌐 **Web Catálogo:**
• Tus productos online 24/7
• Diseño profesional
• Optimizada para celulares
• Contacto directo

¿Te interesa alguna opción?`
            },
            
            // Servicios específicos
            'servicio_web': {
                keywords: ['web', 'página web', 'pagina web', 'sitio web', 'online', 'internet', 'catálogo', 'catalogo'],
                response: `¡La web catálogo es ideal para negocios locales!

**¿Qué incluye?**
• Diseño profesional adaptado a tu negocio
• Catálogo de productos/servicios
• Información de contacto visible
• Optimizada para celulares
• Integración con WhatsApp

**Inversión:** Desde $150.000 (única vez)

**No es una tienda online** - es tu vitrina digital para que los clientes te conozcan y te contacten.

¿Te gustaría ver ejemplos?`
            },
            
            'servicio_bot': {
                keywords: ['bot', 'whatsapp', 'automático', 'automatico', 'chatbot', 'atención automática'],
                response: `El **Bot de WhatsApp** es nuestro servicio más solicitado:

**Beneficios:**
• Atiende consultas **24/7 sin tu intervención**
• Envía presupuestos **automáticamente**
• Responde preguntas frecuentes
• Toma datos para seguimiento
• Deriva a humano cuando es necesario

**Inversión:** 
• Desarrollo: Desde $80.000
• Mensualidad: $15.000/mes (mantenimiento y actualizaciones)

**Ejemplo de uso:**
Cliente escribe: "¿Tienen tornillos 3x20?"
Bot responde: "¡Sí! Tenemos tornillos 3x20. ¿Cuántas unidades necesitás? El precio por 100 unidades es $4.500"

¿Te sirve para tu negocio?`
            },
            
            'servicio_marketing': {
                keywords: ['marketing', 'redes sociales', 'instagram', 'facebook', 'contenido', 'redes'],
                response: `¡El marketing digital es esencial hoy!

**Nuestro servicio incluye:**

📅 **Primer mes (especial):**
• 3 imágenes profesionales
• 1 video promocional
• Estrategia personalizada

📅 **Meses siguientes (por semana):**
• 2 videos cortos
• 4 imágenes
• Historias diarias
• Interacción con seguidores

**Inversión:** Desde $45.000 por mes

**Todo basado en:** Tus productos, promociones, novedades y lo que haga único tu negocio.

¿Te gustaría saber más?`
            },
            
            'servicio_publicidad': {
                keywords: ['publicidad', 'anuncios', 'ads', 'promocionar', 'aparecer primero'],
                response: `La publicidad digital te pone frente a clientes locales:

**Campañas en:**
• Instagram y Facebook
• Google (búsquedas locales)
• Audiencias específicas

**Inversión:**
• Nuestro trabajo: Desde $30.000
• Inversión en anuncios: Vos decidís el presupuesto (recomendamos $10.000-$50.000/mes para empezar)

**Controlamos:**
• Optimización diaria
• Segmentación precisa
• Resultados medibles
• Ajustes constantes

¿Para qué rubro querés hacer publicidad?`
            },
            
            // Precios y costos
            'precio': {
                keywords: ['precio', 'cuesta', 'costo', 'cuánto', 'cuanto', 'valor', 'inversión', 'inversion'],
                response: `Los precios varían según cada solución:

**Desarrollo único:**
• Web catálogo: **Desde $150.000**
• Bot de WhatsApp: **Desde $80.000**
• Presupuestos automáticos: **Desde $60.000**
• Automatizaciones: **Desde $120.000** (según complejidad)

**Servicios mensuales:**
• Bot de WhatsApp: **$15.000/mes**
• Marketing digital: **Desde $45.000/mes**
• Publicidad: **Desde $30.000/mes** + inversión en anuncios

**¡Importante!** Los precios son estimativos. El precio final depende de las necesidades específicas de tu negocio y se confirma en la consulta por WhatsApp.

¿Qué servicio te interesa para darte más detalles?`
            },
            
            // WhatsApp y contacto
            'whatsapp': {
                keywords: ['whatsapp', 'contacto', 'hablar', 'llamar', 'consultar', 'asesor', 'persona'],
                response: `¡Claro! Para una atención más personalizada y confirmar precios exactos, te recomiendo continuar por WhatsApp.

Allí podés:
• Consultar precios específicos para tu negocio
• Ver ejemplos reales de trabajos
• Coordinar una reunión virtual
• Resolver todas tus dudas

¿Te preparo un resumen con todo lo que hablamos para continuar por WhatsApp?`
            },
            
            // Despedidas
            'despedida': {
                keywords: ['gracias', 'chau', 'adiós', 'adios', 'bye', 'nos vemos', 'hasta luego'],
                response: `¡Gracias a vos por consultar! 😊

Recordá que estoy acá para ayudarte con cualquier duda sobre digitalizar tu negocio.

Si querés avanzar con alguna solución, te recomiendo continuar por WhatsApp para atención personalizada.

¡Que tengas un excelente día!`
            }
        };
        
        // DETECTAR LA INTENCIÓN PRINCIPAL
        let detectedIntent = null;
        let maxMatches = 0;
        
        for (const [intent, data] of Object.entries(intentResponses)) {
            let matches = 0;
            data.keywords.forEach(keyword => {
                if (lowerMessage.includes(keyword)) {
                    matches++;
                }
            });
            
            if (matches > maxMatches) {
                maxMatches = matches;
                detectedIntent = intent;
            }
        }
        
        // GENERAR RESPUESTA BASADA EN LA INTENCIÓN
        let response = '';
        
        if (detectedIntent && maxMatches > 0) {
            response = intentResponses[detectedIntent].response;
            console.log(`🎯 Intención detectada: ${detectedIntent} (${maxMatches} coincidencias)`);
        } else {
            // RESPUESTA POR DEFECTO (cuando no se detecta intención clara)
            response = `Entiendo. Para ayudarte mejor, contame:

1. **¿Qué tipo de negocio tenés?** (ferretería, comercio, taller, etc.)
2. **¿Cuál es tu principal desafío?**
   - No tengo tiempo para atender consultas
   - Quiero vender más pero no sé cómo
   - No soy visible en redes/internet
   - Mis procesos son muy manuales/lentos
3. **¿Tenés preferencia por alguna solución?**
   - Web catálogo
   - Bot de WhatsApp
   - Marketing en redes
   - Publicidad digital
   - Automatizaciones

¡Así te puedo dar recomendaciones específicas para tu caso! 😊`;
        }
        
        // DECIDIR SI MOSTRAR BOTÓN DE WHATSAPP
        const hasBasicInfo = userData.businessType || userData.mainGoal || userData.interestedServices.length > 0;
        const wantsWhatsApp = lowerMessage.includes('whatsapp') || 
                             lowerMessage.includes('contacto') || 
                             lowerMessage.includes('hablar') ||
                             lowerMessage.includes('asesor') ||
                             lowerMessage.includes('consultar') ||
                             detectedIntent === 'whatsapp' ||
                             detectedIntent === 'precio';
        
        const showWhatsAppButton = (hasBasicInfo && wantsWhatsApp) || 
                                  (userData.interestedServices.length >= 2) ||
                                  (userData.businessType && userData.mainGoal);
        
        console.log(`📊 Decisión WhatsApp: ${showWhatsAppButton ? 'SI' : 'NO'} (Info: ${hasBasicInfo}, Quiere: ${wantsWhatsApp})`);
        
        if (showWhatsAppButton) {
            // Agregar texto adicional si vamos a mostrar el botón
            if (!response.includes('WhatsApp') && !response.includes('whatsapp')) {
                response += '\n\n**¿Te gustaría que preparemos un plan personalizado y continuemos por WhatsApp?**';
            }
            addMessageWithWhatsAppButton(response);
        } else {
            addMessage(response);
        }
        
        scrollToBottom();
    }
    
    // ===== FUNCIONALIDADES DE LA LANDING PAGE =====
    
    // Tabs de servicios
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Agregar active al seleccionado
            this.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
    
    // Configurar click en tarjetas de servicio para el chat
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3')?.textContent || 'este servicio';
            const price = this.querySelector('.price')?.textContent || '';
            
            let message = '';
            
            if (title.includes('Bot de WhatsApp')) {
                message = 'Me interesa el Bot de WhatsApp. ¿Podrían contarme más detalles de cómo funciona y los precios?';
            } else if (title.includes('Web catálogo')) {
                message = 'Quiero saber más sobre la Web catálogo para comercios. ¿Qué incluye exactamente?';
            } else if (title.includes('redes sociales')) {
                message = 'Me gustaría consultar sobre el manejo de redes sociales. ¿Qué contenido incluye?';
            } else if (title.includes('Publicidad digital')) {
                message = 'Quiero información sobre publicidad digital. ¿En qué redes trabajan y cuánto debo invertir?';
            } else if (title.includes('Presupuestos automáticos')) {
                message = 'Me interesa el sistema de presupuestos automáticos. ¿Cómo funciona con IA?';
            } else if (title.includes('imágenes y videos')) {
                message = 'Quiero saber sobre la creación de imágenes y videos profesionales para mi negocio.';
            } else {
                message = `Me interesa el servicio de ${title}. ¿Podrían darme más información?`;
            }
            
            // Insertar en el chat
            if (userInput) {
                userInput.value = message;
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
                
                // Hacer foco en el chat si está minimizado
                if (chatBody && chatBody.classList.contains('collapsed')) {
                    chatBody.classList.remove('collapsed');
                    if (chatToggle) {
                        chatToggle.querySelector('i').className = 'fas fa-chevron-down';
                    }
                }
                
                userInput.focus();
                
                // Desplazar la vista al chat
                document.querySelector('.chat-widget').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        });
    });
    
    // Menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            this.setAttribute('aria-expanded', mainNav.classList.contains('active'));
        });
        
        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                if (mobileMenuBtn) {
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }
    
    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                e.preventDefault();
                const headerHeight = document.querySelector('.main-header')?.offsetHeight || 70;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Cerrar menú móvil si está abierto
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    if (mobileMenuBtn) {
                        mobileMenuBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        });
    });
    
    // Prevenir logos grandes
    window.addEventListener('load', function() {
        const logos = document.querySelectorAll('img[src*="logo"]');
        logos.forEach(logo => {
            logo.style.objectFit = 'contain';
            logo.style.maxWidth = '100%';
            logo.style.maxHeight = '100%';
        });
        
        // Asegurar que el chat esté abierto al cargar
        if (chatBody && chatBody.classList.contains('collapsed')) {
            chatBody.classList.remove('collapsed');
            if (chatToggle) {
                chatToggle.querySelector('i').className = 'fas fa-chevron-down';
            }
        }
    });
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', function() {
        // Reajustar altura del textarea
        if (userInput) {
            userInput.style.height = 'auto';
            userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
        }
    });
    
    // Inicialización completa
    console.log('✅ Sistema de chat inicializado correctamente');
    console.log('💡 Tip: Escribe sobre tu negocio, problemas o preguntas sobre precios');
});
