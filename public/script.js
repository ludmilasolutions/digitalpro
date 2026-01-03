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
    const finalWhatsAppBtn = document.getElementById('finalWhatsAppBtn');
    const heroWhatsAppBtn = document.getElementById('heroWhatsAppBtn');
    
    // ===== VARIABLES DE ESTADO =====
    let chatInitialized = false;
    let conversationHistory = [];
    let userData = {
        businessType: '',
        interestedServices: [],
        networks: '',
        mainGoal: ''
    };
    
    // ===== CONFIGURACIÓN =====
    const CONFIG = {
        CHAT: {
            INITIAL_MESSAGE: '¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇',
            MAX_HISTORY: 10
        },
        WHATSAPP_PHONE: '5491111111111', // Reemplazar con tu número real
        USE_SERVERLESS_ENDPOINT: false,
        GEMINI_API_KEY: ''
    };
    
    // ===== SISTEMA DE CHAT - CORREGIDO =====
    
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
                content: CONFIG.CHAT.INITIAL_MESSAGE
            });
            
            console.log('✅ Mensaje inicial agregado');
        }
    }
    
    // 2. Inicializar chat
    addInitialMessage();
    
    // 3. Toggle del chat - COMPLETAMENTE CORREGIDO
    if (chatToggle && chatBody) {
        chatToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Alternar clase 'collapsed'
            chatBody.classList.toggle('collapsed');
            
            // Cambiar ícono
            const icon = this.querySelector('i');
            if (chatBody.classList.contains('collapsed')) {
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
            } else {
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
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
        
        const paragraph = document.createElement('p');
        paragraph.innerHTML = text;
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Asegurar que el chat esté abierto
        if (chatBody && chatBody.classList.contains('collapsed')) {
            chatBody.classList.remove('collapsed');
            if (chatToggle) {
                chatToggle.querySelector('i').classList.remove('fa-chevron-up');
                chatToggle.querySelector('i').classList.add('fa-chevron-down');
            }
        }
        
        // Hacer scroll al final
        setTimeout(scrollToBottom, 50);
        
        // Agregar al historial
        conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text
        });
        
        // Limitar historial
        if (conversationHistory.length > CONFIG.CHAT.MAX_HISTORY) {
            conversationHistory = conversationHistory.slice(-CONFIG.CHAT.MAX_HISTORY);
        }
    }
    
    // 8. Extraer datos del usuario de la conversación
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
        
        console.log('📊 Datos del usuario actualizados:', userData);
    }
    
    // 9. Generar resumen para WhatsApp
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
    
    // 10. Función para agregar mensaje con botón de WhatsApp
    function addMessageWithWhatsAppButton(messageText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${messageText}</p>`;
        
        // Crear botón de WhatsApp
        const whatsappBtn = document.createElement('button');
        whatsappBtn.className = 'btn btn-primary whatsapp-action-btn';
        whatsappBtn.style.cssText = `
            margin-top: 15px;
            width: 100%;
            padding: 12px;
            background: #25D366;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-family: inherit;
            font-size: 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: all 0.3s ease;
        `;
        
        whatsappBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fab fa-whatsapp"></i> 
                <strong>Continuar por WhatsApp</strong>
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
            content: messageText
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
        typingIndicator.innerHTML = '<div class="message-content"><p><i class="fas fa-ellipsis-h"></i> Escribiendo...</p></div>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        // Simular respuesta de IA después de un delay
        setTimeout(() => {
            // Remover indicador
            if (typingIndicator.parentNode === chatMessages) {
                chatMessages.removeChild(typingIndicator);
            }
            
            // Generar respuesta basada en el mensaje del usuario
            getAIResponse(message);
        }, 1500);
    }
    
    // 12. Respuestas automáticas de IA
    function getAIResponse(userMessage) {
        let response = '';
        const lowerMessage = userMessage.toLowerCase();
        
        // SYSTEM PROMPT
        const systemPrompt = `Eres un asesor comercial digital para negocios locales en Argentina.
        
        Tu objetivo es entender el negocio del cliente y recomendar soluciones digitales.
        
        Servicios disponibles:
        1. Web catálogo para comercios
        2. Bot de WhatsApp
        3. Presupuestos automáticos con IA
        4. Marketing digital (redes, imágenes, videos)
        5. Publicidad digital
        6. Automatizaciones a medida
        
        Precios estimativos:
        - Web catálogo: desde $150.000
        - Bot de WhatsApp: desde $80.000 + $15.000/mes
        - Marketing mensual: desde $45.000 por mes
        - Publicidad digital: desde $30.000 + inversión en anuncios
        - Automatizaciones a medida: desde $120.000
        - Presupuestos automáticos: desde $60.000
        
        Siempre aclarar que los precios son estimativos y se confirman por WhatsApp.`;
        
        // Lógica de respuestas contextuales
        if (lowerMessage.includes('precio') || lowerMessage.includes('cuesta') || lowerMessage.includes('costo')) {
            response = 'Los precios varían según las soluciones. Te puedo dar una estimación:\n\n' +
                      '• Bot de WhatsApp: desde $80.000 + $15.000/mes\n' +
                      '• Web catálogo: desde $150.000\n' +
                      '• Redes sociales: desde $45.000/mes\n' +
                      '• Publicidad digital: desde $30.000 + inversión en anuncios\n' +
                      '• Automatizaciones a medida: desde $120.000\n' +
                      '• Presupuestos automáticos: desde $60.000\n\n' +
                      '¿Te interesa alguna en particular?';
                      
        } else if (lowerMessage.includes('hola') || lowerMessage.includes('buenas') || lowerMessage.includes('buenos')) {
            response = '¡Hola! 😊 Soy tu asesor digital. ¿Qué tipo de negocio tenés?';
            
        } else if (lowerMessage.includes('ferretería') || lowerMsg.includes('ferreteria') || 
                   lowerMessage.includes('comercio') || lowerMessage.includes('negocio') || 
                   lowerMessage.includes('taller') || lowerMessage.includes('tienda')) {
            response = '¡Perfecto! Trabajamos especialmente con negocios locales como el tuyo. ¿Qué es lo que más te gustaría mejorar o automatizar?';
            
        } else if (lowerMessage.includes('redes') || lowerMessage.includes('instagram') || lowerMessage.includes('facebook')) {
            response = 'El manejo de redes sociales es clave hoy en día. Incluye contenido semanal:\n\n' +
                      '• Primera semana: 3 imágenes + 1 video\n' +
                      '• Semanas siguientes: 2 videos + 4 imágenes por semana\n\n' +
                      'Todo optimizado para tu negocio. ¿Te gustaría saber más?';
                      
        } else if (lowerMessage.includes('whatsapp') || lowerMessage.includes('bot')) {
            response = 'El bot de WhatsApp es una gran solución. Atiende automáticamente 24/7 y puede:\n\n' +
                      '• Responder consultas frecuentes\n' +
                      '• Enviar presupuestos automáticos\n' +
                      '• Confirmar pedidos\n' +
                      '• Derivar a un humano si es necesario\n\n' +
                      '¿Te gustaría que te cuente más detalles?';
                      
        } else if (lowerMessage.includes('web') || lowerMessage.includes('página') || lowerMessage.includes('pagina') || lowerMessage.includes('sitio')) {
            response = 'La web catálogo es perfecta para mostrar tus productos online. No es una tienda (no vende online), pero sirve para que los clientes:\n\n' +
                      '• Vean tus productos y precios\n' +
                      '• Te contacten directamente\n' +
                      '• Reciban atención 24/7\n\n' +
                      'Se hace a medida para tu negocio. ¿Te interesa?';
                      
        } else if (lowerMessage.includes('tiempo') || lowerMessage.includes('ocupado') || lowerMessage.includes('mucho trabajo')) {
            response = 'Entiendo, el tiempo es oro. Por eso nuestras soluciones te ayudan a:\n\n' +
                      '• Automatizar consultas y presupuestos\n' +
                      '• Reducir tareas manuales hasta un 70%\n' +
                      '• Atender más clientes en menos tiempo\n\n' +
                      '¿Qué tarea te consume más tiempo actualmente?';
                      
        } else if (lowerMessage.includes('vender') || lowerMessage.includes('ventas') || lowerMessage.includes('clientes')) {
            response = '¡Excelente enfoque! Para vender más podemos trabajar en:\n\n' +
                      '1. Más visibilidad (redes + publicidad)\n' +
                      '2. Mejor atención (bots 24/7)\n' +
                      '3. Seguimiento automatizado\n' +
                      '4. Catálogo online accesible\n\n' +
                      '¿Por dónde te gustaría empezar?';
                      
        } else if (lowerMessage.includes('gracias') || lowerMessage.includes('gracias')) {
            response = '¡De nada! 😊 Mi trabajo es ayudarte a encontrar la mejor solución para tu negocio. ¿Hay algo más en lo que te pueda ayudar?';
            
        } else {
            // Respuesta por defecto
            response = 'Entiendo. Para recomendarte la mejor solución, contame:\n\n' +
                      '1. ¿Qué tipo de negocio tenés? (ferretería, comercio, taller, etc.)\n' +
                      '2. ¿Cuál es tu principal desafío? (tiempo, ventas, visibilidad, etc.)\n' +
                      '3. ¿Tenés preferencia por alguna solución digital?\n\n' +
                      'Así te puedo orientar mejor 👍';
        }
        
        // Verificar si tenemos suficiente información para sugerir WhatsApp
        const hasEnoughData = userData.businessType && 
                             userData.interestedServices.length > 0 && 
                             userData.mainGoal;
        
        // Verificar si el mensaje sugiere continuar por WhatsApp
        const wantsWhatsApp = lowerMessage.includes('whatsapp') || 
                             lowerMessage.includes('contacto') || 
                             lowerMessage.includes('hablar') ||
                             lowerMessage.includes('consultar') ||
                             lowerMessage.includes('asesor');
        
        if (hasEnoughData || wantsWhatsApp) {
            addMessageWithWhatsAppButton(response);
        } else {
            // Respuesta normal sin botón de WhatsApp
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
    
    // Configurar botones de WhatsApp en la página
    if (finalWhatsAppBtn) {
        // Ya tiene href directo en el HTML
        finalWhatsAppBtn.addEventListener('click', function(e) {
            console.log('Botón WhatsApp footer clickeado');
            // Puedes agregar tracking aquí si es necesario
        });
    }
    
    if (heroWhatsAppBtn) {
        // Ya tiene href directo en el HTML
        heroWhatsAppBtn.addEventListener('click', function(e) {
            console.log('Botón WhatsApp hero clickeado');
            // Puedes agregar tracking aquí si es necesario
        });
    }
    
    // Configurar botones de WhatsApp en los servicios
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3')?.textContent || 'Servicio digital';
            const price = this.querySelector('.price')?.textContent || '';
            
            const message = `Hola, me interesa el servicio de ${title} ${price ? `(${price})` : ''}. ¿Podrían darme más información?`;
            
            // Insertar en el chat
            if (userInput) {
                userInput.value = message;
                userInput.style.height = 'auto';
                userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
                
                // Hacer foco en el chat si está minimizado
                if (chatBody && chatBody.classList.contains('collapsed')) {
                    chatBody.classList.remove('collapsed');
                    if (chatToggle) {
                        chatToggle.querySelector('i').classList.remove('fa-chevron-up');
                        chatToggle.querySelector('i').classList.add('fa-chevron-down');
                    }
                }
                
                userInput.focus();
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
                chatToggle.querySelector('i').classList.remove('fa-chevron-up');
                chatToggle.querySelector('i').classList.add('fa-chevron-down');
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
    
    console.log('✅ Sistema inicializado correctamente');
});
