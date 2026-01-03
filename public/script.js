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
    // Usar CONFIG de config.js, con valores por defecto si no está disponible
    const CONFIG = window.CONFIG || {
        CHAT: {
            INITIAL_MESSAGE: '¡Hola! Soy tu asesor digital. <strong>Contame un poco de tu negocio</strong> y te digo cómo podemos ayudarte 👇',
            MAX_HISTORY: 15,
            ENABLE_AI: true
        },
        WHATSAPP_PHONE: '5493417558966'
    };
    
    // ===== SISTEMA DE CHAT =====
    
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
    
    // 3. Toggle del chat
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
        if (conversationHistory.length > (CONFIG.CHAT.MAX_HISTORY || 15)) {
            conversationHistory = conversationHistory.slice(-(CONFIG.CHAT.MAX_HISTORY || 15));
        }
    }
    
    // 8. Función para llamar a la API de Gemini
    async function callGeminiAPI() {
        try {
            console.log('🔗 Conectando con Gemini API...');
            
            // Formatear mensajes para Gemini
            const formattedMessages = conversationHistory.map(msg => {
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                };
            });

            // Asegurar que config.js se cargó
            if (!window.CONFIG) {
                console.warn('⚠️ CONFIG no está disponible, usando valores por defecto');
                window.CONFIG = {
                    USE_SERVERLESS_ENDPOINT: true,
                    SERVERLESS_ENDPOINT: '/.netlify/functions/gemini'
                };
            }

            // Determinar endpoint
            let endpoint;
            if (window.CONFIG.USE_SERVERLESS_ENDPOINT) {
                endpoint = window.CONFIG.SERVERLESS_ENDPOINT;
                console.log(`🌐 Usando endpoint serverless: ${endpoint}`);
            } else {
                throw new Error('Endpoint directo no disponible');
            }

            // Hacer la petición
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: formattedMessages
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error en respuesta:', errorData);
                throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
            }

            const data = await response.json();
            console.log('✅ Respuesta recibida:', data.text ? 'Texto OK' : 'Sin texto');
            
            return data.text || 'Disculpá, no pude generar una respuesta en este momento.';

        } catch (error) {
            console.error('🔥 Error en callGeminiAPI:', error);
            
            // Respuesta de fallback
            return `Lo siento, hubo un error al conectar con el servidor. 
    
    Puedes:
    1. Intentar nuevamente en un momento
    2. Contactarnos directamente por WhatsApp
    3. Recargar la página
    
    Error: ${error.message}`;
        }
    }
    
    // 9. Extraer datos del usuario de la conversación
    function extractUserDataFromMessage(message) {
        const lowerMsg = message.toLowerCase();
        
        console.log('🔍 Analizando mensaje:', lowerMsg);
        
        // Detectar tipo de negocio
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
        
        // Detectar servicios de interés
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
    
    // 10. Generar resumen para WhatsApp
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
    
    // 11. Función para agregar mensaje con botón de WhatsApp
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
    
    // 12. Función para enviar mensaje
    async function handleSendMessage() {
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
        typingIndicator.innerHTML = '<div class="message-content"><p><i class="fas fa-ellipsis-h"></i> Pensando respuesta...</p></div>';
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        try {
            // Llamar a Gemini API solo si está habilitado
            let aiResponse;
            if (CONFIG.CHAT.ENABLE_AI !== false) {
                aiResponse = await callGeminiAPI();
            } else {
                // Respuesta de fallback si la IA está deshabilitada
                aiResponse = "La función de IA está temporalmente deshabilitada. Por favor, contactanos directamente por WhatsApp para más información.";
            }
            
            // Remover indicador
            if (typingIndicator.parentNode === chatMessages) {
                chatMessages.removeChild(typingIndicator);
            }
            
            // Agregar respuesta de la IA
            addMessage(aiResponse);
            
        } catch (error) {
            // Remover indicador
            if (typingIndicator.parentNode === chatMessages) {
                chatMessages.removeChild(typingIndicator);
            }
            
            console.error('Error al obtener respuesta:', error);
            
            // Respuesta de fallback
            addMessage(`Hmm, parece que hubo un problema técnico. Te sugiero:

1. **Continuar por WhatsApp directo:** Te puedo preparar un resumen de lo que hablamos para que hables con un asesor humano.
2. **Intentar de nuevo:** A veces es un problema temporal.

¿Qué prefieres hacer?`);
        }
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
