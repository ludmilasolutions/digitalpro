// public/script.js - SISTEMA COMPLETO DE CHAT CON HISTORIAL
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Digital Rosario - Sistema cargado con Gemini 2.5 Pro');
    
    // ===== VARIABLES GLOBALES =====
    let isTyping = false;
    let isChatInitialized = false;
    let messageHistory = [];
    const API_ENDPOINT = '/.netlify/functions/gemini';
    const WHATSAPP_NUMBER = '5493417558966';
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
    
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
        loadingScreen: document.getElementById('loadingScreen'),
        clearChatBtn: document.getElementById('clearChatBtn')
    };
    
    // ===== INICIALIZACIÓN =====
    function init() {
        // Ocultar loading screen
        setTimeout(() => {
            if (elements.loadingScreen) {
                elements.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1500);
        
        // Cargar historial desde localStorage
        loadMessageHistory();
        
        // Inicializar chat
        initChat();
        
        // Configurar eventos
        setupEventListeners();
        
        // Configurar tarjetas de servicio
        setupServiceCards();
        
        // Configurar menú móvil
        setupMobileMenu();
        
        // Configurar animaciones
        setupAnimations();
        
        console.log('✅ Sistema inicializado. Historial:', messageHistory.length, 'mensajes');
    }
    
    // ===== CHAT FUNCTIONS =====
    function initChat() {
        if (!elements.chatMessages || isChatInitialized) return;
        
        // Si hay historial previo, mostrarlo
        if (messageHistory.length > 0) {
            renderMessageHistory();
            isChatInitialized = true;
            return;
        }
        
        // Agregar mensaje inicial
        setTimeout(() => {
            addMessage('¡Hola! Soy Digital Rosario, tu asesor digital. Ayudo a negocios como el tuyo a vender más y trabajar menos. ¿Me contás qué tipo de negocio tenés? 👋', 'ai');
            isChatInitialized = true;
        }, 1000);
    }
    
    function renderMessageHistory() {
        if (!elements.chatMessages) return;
        
        elements.chatMessages.innerHTML = '';
        
        messageHistory.forEach(msg => {
            if (msg.role === 'system') return;
            
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${msg.role === 'user' ? 'user' : 'ai'}`;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = `<p>${formatMessageText(msg.content)}</p>`;
            
            msgDiv.appendChild(contentDiv);
            elements.chatMessages.appendChild(msgDiv);
        });
        
        scrollToBottom();
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
        contentDiv.innerHTML = `<p>${formatMessageText(text)}</p>`;
        
        msgDiv.appendChild(contentDiv);
        elements.chatMessages.appendChild(msgDiv);
        
        // Animar entrada
        setTimeout(() => {
            msgDiv.style.opacity = '1';
            msgDiv.style.transform = 'translateX(0)';
            msgDiv.style.transition = 'all 0.3s ease';
        }, 50);
        
        // Scroll al final
        scrollToBottom();
        
        // Agregar al historial
        const messageData = {
            id: messageId,
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        };
        
        messageHistory.push(messageData);
        saveMessageHistory();
        
        // Limitar historial a 50 mensajes
        if (messageHistory.length > 50) {
            messageHistory = messageHistory.slice(-50);
            saveMessageHistory();
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
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    
    function showTypingIndicator() {
        const typingId = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingId.id = typingId;
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        elements.chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingId;
    }
    
    function removeTypingIndicator(typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            typingElement.style.opacity = '0';
            typingElement.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (typingElement.parentNode) {
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
    
    // ===== STORAGE FUNCTIONS =====
    function saveMessageHistory() {
        try {
            localStorage.setItem('digitalRosarioChatHistory', JSON.stringify(messageHistory));
        } catch (e) {
            console.warn('No se pudo guardar el historial en localStorage');
        }
    }
    
    function loadMessageHistory() {
        try {
            const saved = localStorage.getItem('digitalRosarioChatHistory');
            if (saved) {
                messageHistory = JSON.parse(saved) || [];
            }
        } catch (e) {
            console.warn('No se pudo cargar el historial desde localStorage');
            messageHistory = [];
        }
    }
    
    function clearMessageHistory() {
        messageHistory = [];
        localStorage.removeItem('digitalRosarioChatHistory');
        
        if (elements.chatMessages) {
            elements.chatMessages.innerHTML = '';
        }
        
        isChatInitialized = false;
        initChat();
    }
    
    // ===== EVENT HANDLERS =====
    function setupEventListeners() {
        // Toggle del chat
        if (elements.chatToggle) {
            elements.chatToggle.addEventListener('click', toggleChat);
        }
        
        // Enviar mensaje
        if (elements.sendButton) {
            elements.sendButton.addEventListener('click', sendUserMessage);
        }
        
        // Limpiar chat
        if (elements.clearChatBtn) {
            elements.clearChatBtn.addEventListener('click', clearMessageHistory);
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
            
            // Focus en el chat
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
    
    function setupAnimations() {
        // Intersection Observer para animaciones
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.problem-card, .service-card, .step, .stat').forEach(el => {
            observer.observe(el);
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
            // Preparar historial para enviar (últimos 20 mensajes)
            const historyToSend = messageHistory
                .filter(msg => msg.role !== 'system')
                .slice(-20)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));
            
            // Llamar a la IA
            const response = await callAI(message, historyToSend);
            
            // Quitar indicador de typing
            removeTypingIndicator(typingId);
            
            // Agregar respuesta de la IA
            addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error en sendUserMessage:', error);
            removeTypingIndicator(typingId);
            
            // Respuesta de fallback
            addMessage(`¡Hola! Veo que hay un problema técnico momentáneo. 😅

Te sugiero:

📱 **Contactar por WhatsApp directo:** 
<a href="${WHATSAPP_URL}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: underline;">
    Hacé clic aquí para chatear ahora mismo
</a>

O intentá de nuevo en un momento.

Mientras tanto, contame: ¿qué tipo de negocio tenés?`, 'ai');
        } finally {
            isTyping = false;
        }
    }
    
    async function callAI(userMessage, history) {
        try {
            console.log('🤖 Enviando a Gemini 2.5 Pro:', userMessage.substring(0, 50));
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    messages: history
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.text || 'Perfecto, contame más sobre tu negocio para ayudarte mejor.';
            
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
        } else {
            icon.className = 'fas fa-chevron-down';
            setTimeout(scrollToBottom, 300);
        }
    }
    
    // ===== INITIALIZE =====
    init();
    
    // ===== EXPORT FUNCTIONS FOR DEBUGGING =====
    window.DigitalRosario = {
        addMessage,
        sendUserMessage,
        toggleChat,
        clearChat: clearMessageHistory,
        messageHistory: () => messageHistory,
        testAPI: async () => {
            const response = await fetch(API_ENDPOINT, { method: 'GET' });
            return response.json();
        }
    };
    
    console.log('🎯 Digital Rosario con Gemini 2.5 Pro listo para usar.');
});
