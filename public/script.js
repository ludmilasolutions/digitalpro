// script.js - SISTEMA COMPLETO CON EFECTOS Y ANIMACIONES
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Digital Rosario - Sistema cargado');
    
    // ===== VARIABLES GLOBALES =====
    let isTyping = false;
    let isChatInitialized = false;
    let messageHistory = [];
    const API_ENDPOINT = '/.netlify/functions/gemini';
    const WHATSAPP_NUMBER = '5493417558966';
    
    // ===== ELEMENTOS DEL DOM =====
    const elements = {
        chatMessages: document.getElementById('chatMessages'),
        userInput: document.getElementById('userInput'),
        sendButton: document.getElementById('sendButton'),
        chatToggle: document.getElementById('chatToggle'),
        chatBody: document.getElementById('chatBody'),
        chatWidget: document.getElementById('chatWidget'),
        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        mainNav: document.querySelector('.main-nav'),
        loadingScreen: document.getElementById('loadingScreen')
    };
    
    // ===== INICIALIZACIÓN =====
    function init() {
        // Ocultar loading screen después de 2 segundos
        setTimeout(() => {
            if (elements.loadingScreen) {
                elements.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 2000);
        
        // Inicializar chat
        initChat();
        
        // Configurar eventos
        setupEventListeners();
        
        // Configurar tarjetas de servicio
        setupServiceCards();
        
        // Configurar menú móvil
        setupMobileMenu();
        
        // Configurar scroll animations
        setupScrollAnimations();
        
        // Configurar intersection observer para animaciones
        setupIntersectionObserver();
        
        console.log('✅ Sistema completamente inicializado');
    }
    
    // ===== CHAT FUNCTIONS =====
    function initChat() {
        if (!elements.chatMessages || isChatInitialized) return;
        
        // Agregar mensaje inicial con animación
        setTimeout(() => {
            addMessage('¡Hola! Soy Digital Rosario, tu asesor digital. Ayudo a negocios como el tuyo a vender más y trabajar menos. ¿Me contás qué tipo de negocio tenés? 👋', 'ai');
            isChatInitialized = true;
        }, 1000);
    }
    
    function addMessage(text, sender = 'ai') {
        if (!elements.chatMessages) return;
        
        const messageId = 'msg-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = messageId;
        msgDiv.className = `message ${sender}`;
        msgDiv.style.opacity = '0';
        msgDiv.style.transform = sender === 'user' ? 'translateX(20px)' : 'translateX(-20px)';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Formatear texto con soporte para HTML seguro
        const formattedText = formatMessageText(text);
        contentDiv.innerHTML = `<p>${formattedText}</p>`;
        
        msgDiv.appendChild(contentDiv);
        elements.chatMessages.appendChild(msgDiv);
        
        // Animar entrada del mensaje
        setTimeout(() => {
            msgDiv.style.opacity = '1';
            msgDiv.style.transform = 'translateX(0)';
            msgDiv.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 50);
        
        // Scroll al final
        scrollToBottom();
        
        // Agregar al historial
        messageHistory.push({
            id: messageId,
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });
        
        // Limitar historial
        if (messageHistory.length > 20) {
            messageHistory = messageHistory.slice(-20);
        }
        
        // Verificar si el mensaje menciona WhatsApp para mostrar CTA
        if (sender === 'ai' && (text.includes('WhatsApp') || text.includes('whatsapp'))) {
            setTimeout(() => addWhatsAppCTA(), 300);
        }
        
        return messageId;
    }
    
    function formatMessageText(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    
    function showTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = typingId;
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-ellipsis-h"></i> Escribiendo...</p>
            </div>
        `;
        elements.chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingId;
    }
    
    function removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement && typingElement.parentNode === elements.chatMessages) {
            typingElement.style.opacity = '0';
            typingElement.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (typingElement.parentNode === elements.chatMessages) {
                    typingElement.remove();
                }
            }, 300);
        }
    }
    
    function scrollToBottom() {
        if (elements.chatMessages) {
            setTimeout(() => {
                elements.chatMessages.scrollTo({
                    top: elements.chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    // ===== EVENT HANDLERS =====
    function setupEventListeners() {
        // Toggle del chat
        if (elements.chatToggle && elements.chatBody) {
            elements.chatToggle.addEventListener('click', toggleChat);
        }
        
        // Enviar mensaje
        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', sendUserMessage);
        }
        
        // Enter en textarea
        if (elements.userInput) {
            elements.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendUserMessage();
                }
            });
            
            // Auto-resize
            elements.userInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 120) + 'px';
            });
            
            // Focus en el chat cuando se hace clic
            elements.userInput.addEventListener('focus', () => {
                if (elements.chatBody && elements.chatBody.classList.contains('collapsed')) {
                    toggleChat();
                }
            });
        }
        
        // Scroll para ocultar/mostrar header
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = document.querySelector('.main-header');
            
            if (header) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    header.classList.add('hidden');
                } else {
                    header.classList.remove('hidden');
                }
            }
            lastScrollTop = scrollTop;
        });
        
        // Tabs de servicios
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId, this);
            });
        });
        
        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (elements.mainNav && window.innerWidth <= 768) {
                    elements.mainNav.classList.remove('active');
                    elements.mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            });
        });
    }
    
    function setupMobileMenu() {
        if (elements.mobileMenuBtn && elements.mainNav) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                elements.mainNav.classList.toggle('active');
                const icon = elements.mobileMenuBtn.querySelector('i');
                if (elements.mainNav.classList.contains('active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            });
        }
    }
    
    function setupServiceCards() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                const service = this.getAttribute('data-service') || 'servicio';
                let message = '';
                
                switch(service) {
                    case 'whatsapp':
                        message = 'Me interesa el Bot de WhatsApp. ¿Cómo funciona exactamente?';
                        break;
                    case 'web':
                        message = 'Quiero saber más sobre la web catálogo. ¿Qué incluye?';
                        break;
                    case 'quotes':
                        message = 'Me interesan los presupuestos automáticos con IA. ¿Cómo trabajan?';
                        break;
                    case 'marketing':
                        message = 'Quiero info sobre marketing digital para mi negocio.';
                        break;
                    case 'ads':
                        message = 'Me interesa la publicidad digital. ¿En qué redes trabajan?';
                        break;
                    case 'content':
                        message = 'Necesito imágenes y videos profesionales para mi negocio.';
                        break;
                    case 'automation':
                        message = 'Quiero automatizar procesos en mi negocio. ¿Qué pueden hacer?';
                        break;
                    default:
                        message = `Me interesa este servicio. ¿Podrían darme más información?`;
                }
                
                if (elements.userInput) {
                    elements.userInput.value = message;
                    elements.userInput.focus();
                    elements.userInput.dispatchEvent(new Event('input'));
                    
                    // Abrir chat si está cerrado
                    if (elements.chatBody && elements.chatBody.classList.contains('collapsed')) {
                        toggleChat();
                    }
                    
                    // Scroll suave al chat
                    elements.chatWidget.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }
            });
        });
    }
    
    // ===== CHAT LOGIC =====
    async function sendUserMessage() {
        if (!elements.userInput || isTyping) return;
        
        const message = elements.userInput.value.trim();
        if (!message) return;
        
        // Agregar mensaje del usuario
        addMessage(message, 'user');
        
        // Limpiar input
        elements.userInput.value = '';
        elements.userInput.style.height = 'auto';
        elements.userInput.focus();
        
        // Mostrar indicador de typing
        const typingId = showTypingIndicator();
        
        // Marcar como procesando
        isTyping = true;
        
        try {
            // Llamar a la IA
            const response = await callAI(message);
            
            // Quitar indicador de typing
            removeTypingIndicator(typingId);
            
            // Agregar respuesta de la IA
            addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error en sendUserMessage:', error);
            removeTypingIndicator(typingId);
            
            // Respuesta de fallback profesional
            addMessage(`¡Hola! Hubo un problema técnico momentáneo. 😅

Te sugiero:

📱 **Contactar por WhatsApp directo:** 
<a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: underline;">
    Hacé clic aquí para chatear ahora mismo
</a>

💡 **O intentá de nuevo en un momento.**

Mientras tanto, te cuento rápidamente:
• **Web catálogo:** Desde $150.000
• **Bot de WhatsApp:** Desde $80.000 + $15.000/mes
• **Marketing digital:** Desde $45.000/mes

¿Qué tipo de negocio tenés?`, 'ai');
        } finally {
            isTyping = false;
        }
    }
    
    async function callAI(userMessage) {
        try {
            console.log('🤖 Enviando mensaje a IA:', userMessage.substring(0, 50));
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messageHistory.slice(-5) // Enviar últimos 5 mensajes para contexto
                })
            });
            
            console.log('📥 Status de respuesta:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta de IA recibida');
            
            return data.text || '¡Hola! ¿En qué puedo ayudarte con tu negocio hoy?';
            
        } catch (error) {
            console.error('❌ Error en callAI:', error);
            throw error;
        }
    }
    
    // ===== UI FUNCTIONS =====
    function toggleChat() {
        if (!elements.chatBody || !elements.chatToggle) return;
        
        elements.chatBody.classList.toggle('collapsed');
        const icon = elements.chatToggle.querySelector('i');
        
        if (elements.chatBody.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-up';
            // Agregar animación de cierre
            elements.chatWidget.style.animation = 'none';
            setTimeout(() => {
                elements.chatWidget.style.animation = 'scaleIn 0.3s ease';
            }, 10);
        } else {
            icon.className = 'fas fa-chevron-down';
            // Scroll al final al abrir
            setTimeout(scrollToBottom, 300);
        }
    }
    
    function switchTab(tabId, clickedButton) {
        // Remover clase active de todos los botones y contenidos
        document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // Agregar active al botón clickeado
        clickedButton.classList.add('active');
        
        // Mostrar el contenido correspondiente
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('active');
            // Animación de entrada
            targetTab.style.opacity = '0';
            targetTab.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                targetTab.style.opacity = '1';
                targetTab.style.transform = 'translateY(0)';
                targetTab.style.transition = 'all 0.4s ease';
            }, 10);
        }
    }
    
    function addWhatsAppCTA() {
        // Evitar duplicados
        if (document.querySelector('.whatsapp-cta')) return;
        
        const ctaDiv = document.createElement('div');
        ctaDiv.className = 'whatsapp-cta';
        ctaDiv.innerHTML = `
            <h4><i class="fab fa-whatsapp"></i> ¿Listo para avanzar?</h4>
            <p>Continuá por WhatsApp para confirmar precios, ver ejemplos y coordinar una reunión virtual sin compromiso.</p>
            <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">
                <i class="fab fa-whatsapp"></i> Ir a WhatsApp ahora
            </a>
        `;
        
        if (elements.chatMessages) {
            elements.chatMessages.appendChild(ctaDiv);
            scrollToBottom();
        }
    }
    
    // ===== ANIMATIONS =====
    function setupScrollAnimations() {
        // Animar elementos al hacer scroll
        const animatedElements = document.querySelectorAll('.problem-card, .service-card, .step, .stat');
        
        animatedElements.forEach((el, index) => {
            el.style.setProperty('--animation-order', index);
        });
    }
    
    function setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, observerOptions);
        
        // Observar elementos para animaciones
        document.querySelectorAll('.problem-card, .service-card, .step, .stat').forEach(el => {
            observer.observe(el);
        });
    }
    
    // ===== UTILITY FUNCTIONS =====
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // ===== INITIALIZE =====
    init();
    
    // ===== EXPORT FUNCTIONS FOR DEBUGGING =====
    window.DigitalRosario = {
        addMessage,
        sendUserMessage,
        toggleChat,
        messageHistory: () => messageHistory,
        clearChat: () => {
            if (elements.chatMessages) {
                elements.chatMessages.innerHTML = '';
                messageHistory = [];
                isChatInitialized = false;
                initChat();
            }
        }
    };
    
    console.log('🎯 Digital Rosario listo para usar. Usa DigitalRosario en la consola para debugging.');
});
