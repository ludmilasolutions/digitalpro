// public/script.js - CORRECCIÓN DEL MANEJO DE ERRORES
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Digital Rosario - Sistema cargado con Calificador Comercial');
    
    // ===== VARIABLES GLOBALES =====
    let isTyping = false;
    let isChatInitialized = false;
    let messageHistory = [];
    let businessInfo = {
        rubro: null,
        actividad: null,
        canales: null,
        problema: null,
        objetivo: null
    };
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
        loadingScreen: document.getElementById('loadingScreen')
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
        
        // Cargar info del negocio
        loadBusinessInfo();
        
        // Inicializar chat
        initChat();
        
        // Configurar eventos
        setupEventListeners();
        
        console.log('✅ Sistema inicializado. Info:', businessInfo);
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
            addMessage('¡Hola! Soy Digital Rosario, tu calificador comercial digital. Ayudo a negocios como el tuyo a preparar información para soluciones digitales.\n\nPara empezar, ¿me contás a qué rubro pertenece tu negocio?', 'ai');
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
        
        // Detectar si es un resumen de WhatsApp
        if (sender === 'ai' && text.includes('Rubro:') && text.includes('Actividad:')) {
            extractBusinessInfoFromSummary(text);
        }
        
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
    
    function extractBusinessInfoFromSummary(text) {
        const lines = text.split('\n');
        lines.forEach(line => {
            if (line.includes('Rubro:')) {
                businessInfo.rubro = line.replace('Rubro:', '').trim();
            } else if (line.includes('Actividad:')) {
                businessInfo.actividad = line.replace('Actividad:', '').trim();
            } else if (line.includes('Canales actuales:')) {
                businessInfo.canales = line.replace('Canales actuales:', '').trim();
            } else if (line.includes('Problema principal:')) {
                businessInfo.problema = line.replace('Problema principal:', '').trim();
            } else if (line.includes('Objetivo:')) {
                businessInfo.objetivo = line.replace('Objetivo:', '').trim();
            }
        });
        
        saveBusinessInfo();
        
        // Verificar si tenemos toda la información
        if (businessInfo.rubro && businessInfo.actividad && businessInfo.canales && 
            businessInfo.problema && businessInfo.objetivo) {
            showWhatsAppCTA();
        }
    }
    
    function showWhatsAppCTA() {
        // Esperar un momento antes de mostrar el CTA
        setTimeout(() => {
            const summaryText = generateWhatsAppSummary();
            const encodedText = encodeURIComponent(summaryText);
            const whatsappLink = `${WHATSAPP_URL}?text=${encodedText}`;
            
            // Crear botón de WhatsApp
            const ctaDiv = document.createElement('div');
            ctaDiv.className = 'message ai whatsapp-cta';
            ctaDiv.style.marginTop = '10px';
            
            ctaDiv.innerHTML = `
                <div class="message-content">
                    <p><strong>✅ Información completa</strong></p>
                    <p>Ya tengo toda la información para preparar tu caso. Podés continuar directamente por WhatsApp:</p>
                    <a href="${whatsappLink}" target="_blank" class="whatsapp-link-btn" style="
                        display: inline-block;
                        background: #25D366;
                        color: white;
                        padding: 10px 20px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        margin-top: 10px;
                        text-align: center;
                        width: 100%;
                        box-sizing: border-box;
                    ">
                        <i class="fab fa-whatsapp"></i> Continuar por WhatsApp
                    </a>
                    <p style="margin-top: 10px; font-size: 12px; color: #666;">
                        <i class="fas fa-info-circle"></i> Se enviará automáticamente el resumen de tu consulta
                    </p>
                </div>
            `;
            
            elements.chatMessages.appendChild(ctaDiv);
            scrollToBottom();
        }, 1000);
    }
    
    function generateWhatsAppSummary() {
        return `Hola! Quiero consultar por soluciones digitales para mi negocio.

Rubro: ${businessInfo.rubro || 'No especificado'}
Actividad: ${businessInfo.actividad || 'No especificado'}
Canales actuales: ${businessInfo.canales || 'No especificado'}
Problema principal: ${businessInfo.problema || 'No especificado'}
Objetivo: ${businessInfo.objetivo || 'No especificado'}`;
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
        typingDiv.id = typingId;
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
    
    function saveBusinessInfo() {
        try {
            localStorage.setItem('digitalRosarioBusinessInfo', JSON.stringify(businessInfo));
        } catch (e) {
            console.warn('No se pudo guardar businessInfo');
        }
    }
    
    function loadBusinessInfo() {
        try {
            const saved = localStorage.getItem('digitalRosarioBusinessInfo');
            if (saved) {
                businessInfo = JSON.parse(saved) || {};
            }
        } catch (e) {
            console.warn('No se pudo cargar businessInfo');
            businessInfo = {
                rubro: null,
                actividad: null,
                canales: null,
                problema: null,
                objetivo: null
            };
        }
    }
    
    function clearMessageHistory() {
        messageHistory = [];
        businessInfo = {
            rubro: null,
            actividad: null,
            canales: null,
            problema: null,
            objetivo: null
        };
        localStorage.removeItem('digitalRosarioChatHistory');
        localStorage.removeItem('digitalRosarioBusinessInfo');
        
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
        
        // Mobile menu
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener('click', () => {
                elements.mainNav.classList.toggle('show');
            });
        }
        
        // Mobile chat open button
        const mobileChatOpen = document.querySelector('.mobile-chat-open');
        if (mobileChatOpen) {
            mobileChatOpen.addEventListener('click', openChatMobile);
        }
        
        // Cerrar chat al hacer clic fuera en mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const chatWidget = elements.chatWidget;
                const isClickInside = chatWidget.contains(e.target);
                
                if (!isClickInside && !chatWidget.classList.contains('minimized')) {
                    minimizeChatMobile();
                }
            }
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
            addMessage(`¡Hola! Para preparar tu información correctamente, necesito saber:\n\n1. ¿A qué rubro pertenece tu negocio?\n2. ¿Qué actividad realizás específicamente?\n\nContame en tus palabras.`, 'ai');
        } finally {
            isTyping = false;
        }
    }
    
    async function callAI(userMessage, history) {
        try {
            console.log('🤖 Enviando a Calificador Comercial:', userMessage.substring(0, 50));
            
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
            
            // Manejar respuesta de error de manera diferente
            if (data.error && data.error !== "API Key no configurada") {
                // Si hay error pero no es crítico, usar el texto de fallback
                if (data.text) {
                    return data.text;
                }
                throw new Error(data.error);
            }
            
            // Si no hay error, devolver el texto
            return data.text || 'Gracias por la información. ¿Podrías contarme un poco más sobre cómo llegan los clientes a tu negocio hoy?';
            
        } catch (error) {
            console.error('❌ Error en callAI:', error);
            // Lanzar error para que sendUserMessage lo maneje con el fallback
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
    
    function openChatMobile() {
        if (window.innerWidth <= 768) {
            elements.chatWidget.classList.remove('minimized');
            setTimeout(() => {
                elements.userInput?.focus();
                scrollToBottom();
            }, 300);
        }
    }
    
    function minimizeChatMobile() {
        if (window.innerWidth <= 768) {
            elements.chatWidget.classList.add('minimized');
        }
    }
    
    // ===== INITIALIZE =====
    init();
    
    // ===== RESPONSIVE CHAT =====
    function handleResponsiveChat() {
        if (window.innerWidth <= 768) {
            // En mobile, el chat inicia minimizado
            if (!elements.chatWidget.classList.contains('minimized')) {
                minimizeChatMobile();
            }
        } else {
            // En desktop, siempre visible
            elements.chatWidget.classList.remove('minimized');
        }
    }
    
    // Inicializar responsive chat
    handleResponsiveChat();
    window.addEventListener('resize', handleResponsiveChat);
    
    // ===== EXPORT FUNCTIONS FOR DEBUGGING =====
    window.DigitalRosario = {
        addMessage,
        sendUserMessage,
        toggleChat,
        clearChat: clearMessageHistory,
        messageHistory: () => messageHistory,
        businessInfo: () => businessInfo,
        testAPI: async () => {
            const response = await fetch(API_ENDPOINT, { method: 'GET' });
            return response.json();
        }
    };
    
    console.log('🎯 Sistema Calificador Comercial listo para usar.');
});
