// script.js - BOT WEB SIMPLE SIN IA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Digital Rosario - Bot comercial cargado');
    
    // ===== VARIABLES GLOBALES =====
    let currentQuestionIndex = 0;
    let isTyping = false;
    let userAnswers = {};
    const WHATSAPP_URL = `https://wa.me/${BOT_CONFIG.whatsappNumber}`;
    
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
        mobileChatOpen: document.querySelector('.mobile-chat-open')
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
        
        // Cargar respuestas guardadas
        loadUserAnswers();
        
        // Inicializar chat
        initChat();
        
        // Configurar eventos
        setupEventListeners();
        
        // Responsive
        handleResponsiveChat();
        window.addEventListener('resize', handleResponsiveChat);
        
        console.log('✅ Bot comercial inicializado');
    }
    
    // ===== CHAT FUNCTIONS =====
    function initChat() {
        if (!elements.chatMessages) return;
        
        // Limpiar chat
        elements.chatMessages.innerHTML = '';
        
        // Verificar si ya hay respuestas guardadas
        const savedAnswers = Object.keys(userAnswers);
        
        if (savedAnswers.length > 0) {
            // Mostrar historial guardado
            renderSavedHistory();
            
            // Continuar desde la última pregunta no respondida
            currentQuestionIndex = Math.min(savedAnswers.length, BOT_CONFIG.questions.length);
            
            // Si ya completó todas las preguntas, mostrar resumen
            if (savedAnswers.length === BOT_CONFIG.questions.length) {
                showWhatsAppSummary();
                return;
            }
            
            // Mostrar siguiente pregunta
            showNextQuestion();
        } else {
            // Mostrar mensaje de bienvenida
            addMessage(BOT_CONFIG.texts.welcome, 'ai');
            
            // Mostrar primera pregunta después de un breve delay
            setTimeout(() => {
                showNextQuestion();
            }, 1000);
        }
    }
    
    function renderSavedHistory() {
        // Mostrar preguntas y respuestas guardadas
        BOT_CONFIG.questions.forEach((question, index) => {
            if (userAnswers[question.id]) {
                // Mostrar pregunta
                addMessage(question.text, 'ai');
                
                // Mostrar respuesta
                addMessage(userAnswers[question.id], 'user');
            }
        });
    }
    
    function showNextQuestion() {
        if (currentQuestionIndex >= BOT_CONFIG.questions.length) {
            // Todas las preguntas respondidas
            showWhatsAppSummary();
            return;
        }
        
        const question = BOT_CONFIG.questions[currentQuestionIndex];
        
        // Mostrar pregunta con animación
        setTimeout(() => {
            addMessage(question.text, 'ai');
            
            // Actualizar placeholder
            if (elements.userInput) {
                elements.userInput.placeholder = question.placeholder || 'Escribí tu respuesta aquí...';
                elements.userInput.focus();
            }
        }, 300);
    }
    
    function processUserAnswer(answer) {
        if (!answer.trim()) return false;
        
        const currentQuestion = BOT_CONFIG.questions[currentQuestionIndex];
        
        // Guardar respuesta
        userAnswers[currentQuestion.id] = answer.trim();
        saveUserAnswers();
        
        // Mostrar respuesta del usuario
        addMessage(answer, 'user');
        
        // Avanzar a la siguiente pregunta
        currentQuestionIndex++;
        
        // Mostrar siguiente pregunta o resumen
        if (currentQuestionIndex < BOT_CONFIG.questions.length) {
            setTimeout(() => {
                showNextQuestion();
            }, 500);
        } else {
            setTimeout(() => {
                addMessage(BOT_CONFIG.texts.thanks, 'ai');
                setTimeout(() => {
                    showWhatsAppSummary();
                }, 1000);
            }, 500);
        }
        
        return true;
    }
    
    function showWhatsAppSummary() {
        const summaryText = generateWhatsAppSummary();
        
        // Crear mensaje con resumen
        const summaryMessage = `${BOT_CONFIG.texts.summaryTitle}\n\n${summaryText}\n\n${BOT_CONFIG.texts.summaryMessage}`;
        
        addMessage(summaryMessage, 'ai');
        
        // Mostrar botón de WhatsApp
        setTimeout(() => {
            showWhatsAppCTA();
        }, 500);
    }
    
    function generateWhatsAppSummary() {
        return `Hola! Quiero consultar por soluciones digitales para mi negocio.

Rubro: ${userAnswers.rubro || 'No especificado'}
Actividad: ${userAnswers.actividad || 'No especificado'}
Canales actuales: ${userAnswers.canales || 'No especificado'}
Problema principal: ${userAnswers.problema || 'No especificado'}
Objetivo: ${userAnswers.objetivo || 'No especificado'}`;
    }
    
    function showWhatsAppCTA() {
        // Verificar si ya hay un CTA visible
        if (document.querySelector('.whatsapp-cta')) return;
        
        const summaryText = generateWhatsAppSummary();
        const encodedText = encodeURIComponent(summaryText);
        const whatsappLink = `${WHATSAPP_URL}?text=${encodedText}`;
        
        // Crear botón de WhatsApp
        const ctaDiv = document.createElement('div');
        ctaDiv.className = 'message ai whatsapp-cta';
        ctaDiv.style.marginTop = '10px';
        
        ctaDiv.innerHTML = `
            <div class="message-content">
                <a href="${whatsappLink}" target="_blank" class="whatsapp-link-btn">
                    <i class="fab fa-whatsapp"></i> ${BOT_CONFIG.texts.whatsappCTA}
                </a>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    <i class="fas fa-info-circle"></i> ${BOT_CONFIG.texts.disclaimer}
                </p>
            </div>
        `;
        
        elements.chatMessages.appendChild(ctaDiv);
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
        
        // Reemplazar saltos de línea por <br>
        const formattedText = text.replace(/\n/g, '<br>');
        contentDiv.innerHTML = `<p>${formattedText}</p>`;
        
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
        
        return messageId;
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
    function saveUserAnswers() {
        try {
            localStorage.setItem('digitalRosarioBotAnswers', JSON.stringify(userAnswers));
            localStorage.setItem('digitalRosarioBotQuestionIndex', currentQuestionIndex.toString());
        } catch (e) {
            console.warn('No se pudo guardar en localStorage');
        }
    }
    
    function loadUserAnswers() {
        try {
            const savedAnswers = localStorage.getItem('digitalRosarioBotAnswers');
            const savedIndex = localStorage.getItem('digitalRosarioBotQuestionIndex');
            
            if (savedAnswers) {
                userAnswers = JSON.parse(savedAnswers);
            }
            
            if (savedIndex) {
                currentQuestionIndex = parseInt(savedIndex);
            }
        } catch (e) {
            console.warn('No se pudo cargar desde localStorage');
            userAnswers = {};
            currentQuestionIndex = 0;
        }
    }
    
    function clearUserAnswers() {
        userAnswers = {};
        currentQuestionIndex = 0;
        localStorage.removeItem('digitalRosarioBotAnswers');
        localStorage.removeItem('digitalRosarioBotQuestionIndex');
        
        if (elements.chatMessages) {
            elements.chatMessages.innerHTML = '';
        }
        
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
        if (elements.mobileChatOpen) {
            elements.mobileChatOpen.addEventListener('click', openChatMobile);
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
    
    function sendUserMessage() {
        if (!elements.userInput || isTyping) return;
        
        const message = elements.userInput.value.trim();
        if (!message) return;
        
        // Procesar respuesta
        const processed = processUserAnswer(message);
        
        if (processed) {
            // Limpiar input
            elements.userInput.value = '';
            elements.userInput.style.height = 'auto';
            elements.userInput.focus();
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
            setTimeout(() => {
                elements.userInput?.focus();
                scrollToBottom();
            }, 300);
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
    
    // ===== INITIALIZE =====
    init();
    
    // ===== EXPORT FUNCTIONS FOR DEBUGGING =====
    window.DigitalRosarioBot = {
        showNextQuestion,
        processUserAnswer,
        clearAnswers: clearUserAnswers,
        getAnswers: () => userAnswers,
        getCurrentQuestion: () => BOT_CONFIG.questions[currentQuestionIndex],
        testWhatsApp: () => {
            const summary = generateWhatsAppSummary();
            const encoded = encodeURIComponent(summary);
            return `${WHATSAPP_URL}?text=${encoded}`;
        }
    };
    
    console.log('🎯 Bot comercial listo para usar');
});
