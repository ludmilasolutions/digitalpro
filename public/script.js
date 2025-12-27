// script.js - Lógica principal del sitio y chat IA

document.addEventListener('DOMContentLoaded', function() {
    // ====================
    // 1. CONFIGURACIÓN INICIAL
    // ====================
    
    console.log('🚀 Sistema cargado correctamente');
    console.log('📡 Modo:', CONFIG.USE_SERVERLESS_ENDPOINT ? 'Serverless' : 'Directo');
    
    // Elementos del DOM
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatToggle = document.querySelector('.chat-toggle');
    const chatBody = document.querySelector('.chat-body');
    const finalWhatsAppBtn = document.getElementById('finalWhatsAppBtn');
    const heroWhatsAppBtn = document.getElementById('heroWhatsAppBtn');
    
    // Estado de la conversación
    let conversationHistory = [];
    let userData = {
        businessType: '',
        interestedServices: [],
        networks: '',
        mainGoal: ''
    };
    
    // ====================
    // 2. SYSTEM PROMPT DE GEMINI
    // ====================
    
    const systemPrompt = `Actuás como un asesor comercial digital para negocios locales en Argentina.

Tu objetivo es:
- Entender el negocio del cliente
- Detectar problemas y oportunidades
- Explicar servicios digitales de forma simple
- Proponer soluciones claras y personalizadas
- Dar precios estimativos en pesos argentinos
- Preparar el cierre por WhatsApp

Reglas obligatorias:
- Usar español argentino
- Lenguaje simple, directo y profesional
- No usar tecnicismos
- No prometer resultados irreales
- No vender online ni cobrar dentro del chat
- Siempre aclarar que los precios son estimativos
- Derivar siempre a WhatsApp para confirmar y cerrar

Comportamiento:
- Guiar la conversación con preguntas cortas
- Actuar como un vendedor humano profesional
- No ser invasivo
- Adaptarse a cualquier tipo de negocio
- Ofrecer soluciones a medida si el cliente lo necesita

Servicios disponibles:
1. Web catálogo para comercios
2. Bot de WhatsApp
3. Presupuestos automáticos con IA
4. Marketing digital (redes, imágenes, videos)
5. Publicidad digital
6. Automatizaciones a medida
7. Otras soluciones digitales personalizadas

Precios estimativos (MODIFICABLES EN config.js):
- Web catálogo: desde $150.000
- Bot de WhatsApp: desde $80.000 + $15.000/mes
- Marketing mensual: desde $45.000 por mes
- Publicidad digital: desde $30.000 + inversión en anuncios
- Automatizaciones a medida: se cotizan según necesidad (desde $120.000)
- Presupuestos automáticos: desde $60.000

SIEMPRE ACLARAR: "El precio final depende del negocio y se confirma por WhatsApp"

ANTES DE DERIVAR A WHATSAPP, DEBÉS:
1. Preguntar qué servicios le interesan
2. Preguntar tipo de negocio (ferretería, comercio, taller, etc.)
3. Preguntar redes a trabajar (si aplica a marketing)
4. Preguntar objetivo principal

CUANDO TENGAS ESA INFORMACIÓN:
- Armá un resumen claro y corto
- Prepará el mensaje para WhatsApp con este formato EXACTO:

Hola, quiero consultar por los siguientes servicios:
- [servicio 1]
- [servicio 2]

Tipo de negocio: [tipo]
Redes a trabajar: [redes o "no aplica"]
Objetivo principal: [objetivo]

- Invitá al usuario a continuar por WhatsApp con el mensaje prellenado

Comportamiento conversacional:
- Empezá preguntando por el tipo de negocio
- Sé amable pero profesional
- Usá emojis moderadamente (1-2 por mensaje)
- Hacé preguntas específicas para entender necesidades
- Ofrecé ejemplos concretos del rubro del cliente

NO:
- No des precios exactos, solo rangos estimativos
- No aceptes pagos ni tomes datos de tarjetas
- No des información de contacto alternativa
- No prometas plazos exactos de implementación

CONTEXTO ACTUAL:
Fecha: ${new Date().toLocaleDateString('es-AR')}
Cliente: Visitante web
Origen: Landing page de soluciones digitales

Ahora, iniciá la conversación con un saludo amable y preguntando por el negocio del cliente.`;
    
    // ====================
    // 3. FUNCIONES DEL CHAT
    // ====================
    
    // Ajustar altura del textarea automáticamente
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
    }
    
    userInput.addEventListener('input', autoResizeTextarea);
    
    // Toggle del chat (minimizar/maximizar)
    chatToggle.addEventListener('click', function() {
        const isVisible = chatBody.style.display !== 'none';
        
        if (isVisible) {
            chatBody.style.display = 'none';
            chatToggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            chatBody.style.display = 'flex';
            chatToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
            // Hacer scroll al final de los mensajes
            setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 100);
        }
    });
    
    // Agregar mensaje al chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const paragraph = document.createElement('p');
        paragraph.innerHTML = text;
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Agregar al historial
        conversationHistory.push({
            role: isUser ? 'user' : 'assistant',
            content: text
        });
        
        // Limitar historial para no exceder tokens
        if (conversationHistory.length > CONFIG.CHAT.MAX_HISTORY) {
            conversationHistory = conversationHistory.slice(-CONFIG.CHAT.MAX_HISTORY);
        }
    }
    
    // Extraer datos del usuario de la conversación
    function extractUserDataFromMessage(message) {
        const lowerMsg = message.toLowerCase();
        
        // Detectar tipo de negocio
        if (lowerMsg.includes('ferretería') || lowerMsg.includes('ferreteria')) {
            userData.businessType = 'Ferretería';
        } else if (lowerMsg.includes('comercio') || lowerMsg.includes('negocio') || lowerMsg.includes('local')) {
            userData.businessType = 'Comercio local';
        } else if (lowerMsg.includes('taller')) {
            userData.businessType = 'Taller';
        } else if (lowerMsg.includes('corralón') || lowerMsg.includes('corralon')) {
            userData.businessType = 'Corralón';
        } else if (lowerMsg.includes('pyme') || lowerMsg.includes('empresa')) {
            userData.businessType = 'Pyme';
        } else if (lowerMsg.includes('tienda') || lowerMsg.includes('almacén') || lowerMsg.includes('almacen')) {
            userData.businessType = 'Tienda';
        }
        
        // Detectar servicios de interés
        const services = [
            { key: 'web', terms: ['web', 'catálogo', 'catalogo', 'página', 'pagina', 'sitio'] },
            { key: 'bot', terms: ['bot', 'whatsapp', 'automático', 'automatico', 'atención automática', 'atencion automatica'] },
            { key: 'marketing', terms: ['marketing', 'redes', 'social', 'instagram', 'facebook', 'contenido'] },
            { key: 'publicidad', terms: ['publicidad', 'anuncios', 'ads', 'promocionar'] },
            { key: 'automatización', terms: ['automatiz', 'automatización', 'automatizacion', 'proceso', 'sistema'] },
            { key: 'presupuesto', terms: ['presupuesto', 'cotización', 'cotizacion', 'precio automático'] }
        ];
        
        services.forEach(service => {
            if (service.terms.some(term => lowerMsg.includes(term))) {
                if (!userData.interestedServices.includes(service.key)) {
                    userData.interestedServices.push(service.key);
                }
            }
        });
        
        // Detectar redes sociales
        if (lowerMsg.includes('instagram')) {
            userData.networks = 'Instagram';
        } else if (lowerMsg.includes('facebook')) {
            userData.networks = userData.networks ? userData.networks + ', Facebook' : 'Facebook';
        } else if (lowerMsg.includes('tiktok')) {
            userData.networks = userData.networks ? userData.networks + ', TikTok' : 'TikTok';
        }
        
        // Detectar objetivos
        if (lowerMsg.includes('vender') || lowerMsg.includes('venta') || lowerMsg.includes('ingreso')) {
            userData.mainGoal = 'Vender más';
        } else if (lowerMsg.includes('tiempo') || lowerMsg.includes('automatizar') || lowerMsg.includes('automatico')) {
            userData.mainGoal = 'Ahorrar tiempo y automatizar';
        } else if (lowerMsg.includes('cliente') || lowerMsg.includes('atención') || lowerMsg.includes('atencion')) {
            userData.mainGoal = 'Mejorar la atención al cliente';
        } else if (lowerMsg.includes('visible') || lowerMsg.includes('conocido') || lowerMsg.includes('presencia')) {
            userData.mainGoal = 'Mayor presencia digital';
        } else if (lowerMsg.includes('organizar') || lowerMsg.includes('orden')) {
            userData.mainGoal = 'Organizar mejor el negocio';
        }
    }
    
    // Generar resumen para WhatsApp
    function generateWhatsAppSummary() {
        const serviceMap = {
            'web': 'Web catálogo',
            'bot': 'Bot de WhatsApp',
            'marketing': 'Marketing digital',
            'publicidad': 'Publicidad digital',
            'automatización': 'Automatizaciones a medida',
            'presupuesto': 'Presupuestos automáticos'
        };
        
        const servicesText = userData.interestedServices
            .map(key => serviceMap[key] || key)
            .join('\n- ');
        
        return `Hola, quiero consultar por los siguientes servicios:
- ${servicesText || 'Por definir'}

Tipo de negocio: ${userData.businessType || 'Por definir'}
Redes a trabajar: ${userData.networks || 'Por definir'}
Objetivo principal: ${userData.mainGoal || 'Por definir'}`;
    }
    
    // Crear link de WhatsApp con mensaje prellenado
    function createWhatsAppLink() {
        const summary = generateWhatsAppSummary();
        const encodedMessage = encodeURIComponent(summary);
        const phoneNumber = CONFIG.WHATSAPP_PHONE;
        
        return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    }
    
    // Función auxiliar para agregar mensaje con botón de WhatsApp
    function addMessageWithWhatsAppButton(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${messageText}</p>`;
        
        // Crear botón de WhatsApp
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'btn btn-primary whatsapp-action-btn';
        whatsappBtn.style.marginTop = '15px';
        whatsappBtn.style.width = '100%';
        whatsappBtn.style.padding = '12px';
        whatsappBtn.innerHTML = `
            <i class="fab fa-whatsapp"></i> 
            <strong>Continuar por WhatsApp</strong>
            <small style="display: block; font-weight: normal; margin-top: 5px;">
                Te llevamos con toda la información que conversamos
            </small>
        `;
        
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
        });
        
        contentDiv.appendChild(whatsappBtn);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Agregar al historial
        conversationHistory.push({
            role: 'assistant',
            content: messageText
        });
    }
    
    // Enviar mensaje a Gemini API
    async function sendToGemini(userMessage) {
        try {
            // Mostrar indicador de "escribiendo"
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message ai typing';
            typingIndicator.innerHTML = '<div class="message-content"><p><i class="fas fa-ellipsis-h"></i> Escribiendo...</p></div>';
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Extraer datos del mensaje del usuario
            extractUserDataFromMessage(userMessage);
            
            // Preparar mensajes para la API
            const messages = [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                ...conversationHistory.map(msg => ({
                    role: msg.role === 'user' ? "user" : "model",
                    parts: [{ text: msg.content }]
                })),
                {
                    role: "user",
                    parts: [{ text: userMessage }]
                }
            ];
            
            // CONSTRUIR LA URL CORRECTAMENTE
            let endpoint;
            
            if (CONFIG.USE_SERVERLESS_ENDPOINT) {
                // Para Netlify: ruta relativa que se convierte en absoluta
                endpoint = window.location.origin + CONFIG.SERVERLESS_ENDPOINT;
                
                // Debug: mostrar la URL que se está usando
                console.log('🌐 Enviando a:', endpoint);
            } else {
                // Modo desarrollo directo (no recomendado)
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
            }
            
            // Hacer la solicitud
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: messages,
                    userData: userData
                })
            });
            
            // Verificar respuesta
            if (!response.ok) {
                // Intentar obtener más información del error
                let errorDetail = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorDetail = JSON.stringify(errorData);
                } catch (e) {
                    // Si no se puede parsear JSON, usar texto
                    const errorText = await response.text();
                    if (errorText) errorDetail = errorText;
                }
                
                throw new Error(errorDetail);
            }
            
            const data = await response.json();
            
            // Remover indicador de "escribiendo"
            chatMessages.removeChild(typingIndicator);
            
            // Procesar respuesta
            const aiResponse = data.text;
            
            // Verificar si debemos mostrar botón de WhatsApp
            const lowerResponse = aiResponse.toLowerCase();
            const hasEnoughData = userData.businessType && 
                                 userData.interestedServices.length > 0 && 
                                 userData.mainGoal;
            
            if (hasEnoughData && (lowerResponse.includes('whatsapp') || lowerResponse.includes('resumen'))) {
                // Crear mensaje con botón de WhatsApp
                addMessageWithWhatsAppButton(aiResponse);
            } else {
                // Respuesta normal
                addMessage(aiResponse);
            }
            
            // Actualizar userData si viene del servidor
            if (data.userData) {
                userData = { ...userData, ...data.userData };
            }
            
        } catch (error) {
            console.error('❌ Error con Gemini API:', error);
            
            // Remover indicador de "escribiendo"
            const typingIndicator = document.querySelector('.typing');
            if (typingIndicator) {
                chatMessages.removeChild(typingIndicator);
            }
            
            // Mensaje de error amigable con opción alternativa
            const errorMessage = `
                <p>Disculpá, hubo un error técnico momentáneo. 😅</p>
                <p>Te sugiero que directamente me cuentes:</p>
                <ul>
                    <li>¿Qué tipo de negocio tenés?</li>
                    <li>¿Qué es lo que más te gustaría mejorar?</li>
                    <li>¿Tenés preferencia por algún servicio en particular?</li>
                </ul>
                <p>O si preferís, podés contactarnos directamente por WhatsApp 👇</p>
                <button class="btn btn-primary whatsapp-fallback-btn" style="margin-top: 10px; width: 100%;">
                    <i class="fab fa-whatsapp"></i> Hablar por WhatsApp ahora
                </button>
            `;
            
            addMessage(errorMessage);
            
            // Configurar botón de WhatsApp de respaldo
            setTimeout(() => {
                const whatsappBtn = document.querySelector('.whatsapp-fallback-btn');
                if (whatsappBtn) {
                    whatsappBtn.addEventListener('click', function() {
                        const defaultMessage = `Hola, quiero consultar por soluciones digitales para mi negocio.`;
                        const encodedMessage = encodeURIComponent(defaultMessage);
                        window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodedMessage}`, '_blank');
                    });
                }
            }, 100);
        }
    }
    
    // Manejar envío de mensaje
    function handleSendMessage() {
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Agregar mensaje del usuario
        addMessage(message, true);
        
        // Limpiar input
        userInput.value = '';
        autoResizeTextarea();
        
        // Enviar a Gemini
        sendToGemini(message);
    }
    
    // Event listeners
    sendButton.addEventListener('click', handleSendMessage);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // ====================
    // 4. FUNCIONALIDADES DE LA LANDING PAGE
    // ====================
    
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
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Configurar botones de WhatsApp
    function setupWhatsAppButton(button, message) {
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${encodedMessage}`, '_blank');
            });
        }
    }
    
    // Configurar botones de WhatsApp en la página
    setupWhatsAppButton(finalWhatsAppBtn, 'Hola, vi su página y quiero consultar por soluciones digitales para mi negocio.');
    setupWhatsAppButton(heroWhatsAppBtn, 'Hola, quiero consultar por soluciones digitales para mi negocio.');
    
    // Configurar botones de WhatsApp en los servicios
    document.querySelectorAll('.service-card').forEach(card => {
        const title = card.querySelector('h3')?.textContent || 'Servicio digital';
        const price = card.querySelector('.price')?.textContent || '';
        
        card.addEventListener('click', function() {
            const message = `Hola, me interesa el servicio de ${title} ${price ? `(${price})` : ''}. ¿Podrían darme más información?`;
            userInput.value = message;
            autoResizeTextarea();
            
            // Hacer foco en el chat si está minimizado
            if (chatBody.style.display === 'none') {
                chatBody.style.display = 'flex';
                chatToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
            }
            
            userInput.focus();
        });
    });
    
    // Animación de aparición de elementos al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observar elementos para animación
    document.querySelectorAll('.problem-card, .service-card, .benefit-card, .step').forEach(el => {
        observer.observe(el);
    });
    
    // ====================
    // 5. INICIALIZACIÓN DEL CHAT
    // ====================
    
    // Agregar mensaje inicial del asistente
    setTimeout(() => {
        addMessage(CONFIG.CHAT.INITIAL_MESSAGE);
    }, 1000);
    
    console.log('✅ Sistema inicializado correctamente');
});
