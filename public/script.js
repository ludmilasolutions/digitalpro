// script.js - Chat IA funcional
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Digital Rosario - Sistema cargado');
    
    // Elementos
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatToggle = document.getElementById('chatToggle');
    const chatBody = document.getElementById('chatBody');
    
    // Estado
    let isTyping = false;
    let messageHistory = [];
    
    // Configuración
    const ENDPOINT = '/.netlify/functions/gemini';
    const WHATSAPP_NUMBER = '5493417558966';
    
    // ===== INICIALIZAR =====
    function init() {
        addMessage('¡Hola! Soy Digital Rosario, tu asistente para soluciones digitales. ¿En qué puedo ayudarte con tu negocio hoy? 👇', 'ai');
        setupEventListeners();
        setupServiceCards();
        console.log('✅ Sistema inicializado');
    }
    
    // ===== MENSAJES =====
    function addMessage(text, sender = 'ai') {
        if (!chatMessages) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Sanitizar y formatear
        const safeText = text
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        contentDiv.innerHTML = `<p>${safeText}</p>`;
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        
        // Scroll
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
        
        // Guardar en historial
        if (sender === 'user' || sender === 'ai') {
            messageHistory.push({
                role: sender === 'user' ? 'user' : 'assistant',
                content: text,
                time: new Date().toISOString()
            });
            
            // Limitar historial
            if (messageHistory.length > 10) {
                messageHistory = messageHistory.slice(-10);
            }
        }
    }
    
    // ===== EVENTOS =====
    function setupEventListeners() {
        // Toggle chat
        if (chatToggle && chatBody) {
            chatToggle.addEventListener('click', () => {
                chatBody.classList.toggle('collapsed');
                const icon = chatToggle.querySelector('i');
                icon.className = chatBody.classList.contains('collapsed') 
                    ? 'fas fa-chevron-up' 
                    : 'fas fa-chevron-down';
            });
        }
        
        // Enviar mensaje
        if (sendButton) {
            sendButton.addEventListener('click', sendUserMessage);
        }
        
        // Enter en textarea
        if (userInput) {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendUserMessage();
                }
            });
            
            // Auto-resize
            userInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
        }
        
        // Menú móvil
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const mainNav = document.querySelector('.main-nav');
        if (menuBtn && mainNav) {
            menuBtn.addEventListener('click', () => {
                mainNav.classList.toggle('active');
            });
        }
        
        // Tabs de servicios
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Remover activos
                document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Activar seleccionado
                this.classList.add('active');
                const target = document.getElementById(tabId);
                if (target) target.classList.add('active');
            });
        });
    }
    
    // ===== ENVIAR MENSAJE =====
    async function sendUserMessage() {
        if (!userInput || isTyping) return;
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Agregar mensaje usuario
        addMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Mostrar typing
        showTyping();
        
        try {
            // Llamar a la IA
            const response = await callAI(message);
            
            // Quitar typing
            hideTyping();
            
            // Agregar respuesta
            addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error:', error);
            hideTyping();
            
            // Respuesta de fallback
            addMessage(`¡Hola! Hubo un problema técnico. 

Te sugiero:

📱 **Contactar por WhatsApp directo:** 
<a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" style="color: #25D366; font-weight: bold;">
    Hacé clic aquí para chatear ahora
</a>

💡 **O intentá de nuevo en un momento.**

Disculpá las molestias. 😊`, 'ai');
        }
    }
    
    // ===== LLAMAR A LA IA =====
    async function callAI(userMessage) {
        isTyping = true;
        
        try {
            console.log('🤖 Enviando a IA:', userMessage.substring(0, 50));
            
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    timestamp: new Date().toISOString()
                })
            });
            
            console.log('📥 Respuesta status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida');
            
            return data.text || '¡Hola! ¿En qué puedo ayudarte?';
            
        } catch (error) {
            console.error('❌ Error IA:', error);
            throw error;
        } finally {
            isTyping = false;
        }
    }
    
    // ===== TYPING INDICATOR =====
    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-ellipsis-h"></i> Escribiendo...</p>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing && typing.parentNode === chatMessages) {
            typing.remove();
        }
    }
    
    // ===== SERVICIOS =====
    function setupServiceCards() {
        document.querySelectorAll('.service-card').forEach(card => {
            card.addEventListener('click', function() {
                const service = this.dataset.service || 'servicio';
                let message = '';
                
                switch(service) {
                    case 'whatsapp':
                        message = 'Me interesa el Bot de WhatsApp. ¿Cómo funciona?';
                        break;
                    case 'web':
                        message = 'Quiero saber sobre la web catálogo.';
                        break;
                    case 'quotes':
                        message = 'Me interesan los presupuestos automáticos.';
                        break;
                    case 'marketing':
                        message = 'Quiero info sobre marketing digital.';
                        break;
                    case 'ads':
                        message = 'Me interesa la publicidad digital.';
                        break;
                    default:
                        message = `Me interesa este servicio.`;
                }
                
                if (userInput) {
                    userInput.value = message;
                    userInput.focus();
                    userInput.dispatchEvent(new Event('input'));
                    
                    // Abrir chat si está cerrado
                    if (chatBody && chatBody.classList.contains('collapsed')) {
                        chatBody.classList.remove('collapsed');
                        if (chatToggle) {
                            chatToggle.querySelector('i').className = 'fas fa-chevron-down';
                        }
                    }
                }
            });
        });
    }
    
    // ===== INICIAR =====
    init();
});
