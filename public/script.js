// script.js - Chat IA funcional
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema cargado correctamente');
    
    // ===== ELEMENTOS DOM =====
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatToggle = document.getElementById('chatToggle');
    const chatBody = document.getElementById('chatBody');
    
    // ===== CONFIGURACIÓN =====
    const CONFIG = window.CONFIG || {
        SERVERLESS_ENDPOINT: "/.netlify/functions/gemini",
        WHATSAPP_PHONE: "5493417558966"
    };
    
    // ===== INICIALIZAR CHAT =====
    function initChat() {
        if (!chatMessages || chatMessages.children.length > 0) return;
        
        const initialMessage = CONFIG.CHAT?.INITIAL_MESSAGE || 
                             "¡Hola! Soy tu asesor digital. ¿En qué puedo ayudarte?";
        
        addMessage(initialMessage, 'ai');
    }
    
    initChat();
    
    // ===== FUNCIONES BÁSICAS =====
    
    // Agregar mensaje al chat
    function addMessage(text, sender = 'ai') {
        if (!chatMessages) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Formatear texto para HTML seguro
        const safeText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        contentDiv.innerHTML = `<p>${safeText}</p>`;
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        
        // Scroll al final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }
    
    // Toggle chat
    if (chatToggle && chatBody) {
        chatToggle.addEventListener('click', function() {
            chatBody.classList.toggle('collapsed');
            const icon = this.querySelector('i');
            icon.className = chatBody.classList.contains('collapsed') 
                ? 'fas fa-chevron-up' 
                : 'fas fa-chevron-down';
        });
    }
    
    // Auto-resize textarea
    if (userInput) {
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Botón enviar
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    // ===== LÓGICA PRINCIPAL =====
    async function sendMessage() {
        if (!userInput || !chatMessages) return;
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Agregar mensaje del usuario
        addMessage(message, 'user');
        
        // Limpiar input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Mostrar "escribiendo..."
        showTypingIndicator();
        
        try {
            // Llamar a la IA
            const response = await callGeminiAPI(message);
            
            // Quitar indicador
            removeTypingIndicator();
            
            // Agregar respuesta
            addMessage(response, 'ai');
            
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator();
            
            // Respuesta de fallback
            addMessage(`¡Hola! Hubo un problema técnico temporal.

Te sugiero:

📱 **Contactar por WhatsApp directo:** 
<a href="https://wa.me/${CONFIG.WHATSAPP_PHONE}" target="_blank" style="color: #25D366; font-weight: bold; text-decoration: underline;">
    Hacé clic aquí para chatear ahora
</a>

💡 **O intentá de nuevo en un momento.**

Disculpá las molestias. 😊`, 'ai');
        }
    }
    
    // Indicador de "escribiendo"
    function showTypingIndicator() {
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
    
    function removeTypingIndicator() {
        const typing = document.getElementById('typingIndicator');
        if (typing && typing.parentNode === chatMessages) {
            chatMessages.removeChild(typing);
        }
    }
    
    // ===== CONEXIÓN CON GEMINI API =====
    async function callGeminiAPI(userMessage) {
        try {
            console.log('🔗 Conectando con Gemini...');
            
            // Endpoint de Netlify Functions
            const endpoint = CONFIG.SERVERLESS_ENDPOINT;
            console.log('🌐 Endpoint:', endpoint);
            
            // Datos simples para enviar
            const requestData = {
                message: userMessage
            };
            
            console.log('📤 Enviando:', requestData);
            
            // Hacer la petición
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('📥 Status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida');
            
            return data.text || '¡Hola! ¿En qué puedo ayudarte?';
            
        } catch (error) {
            console.error('🔥 Error en API:', error);
            
            // Respuesta local inteligente como backup
            return generateLocalResponse(userMessage);
        }
    }
    
    // Generar respuesta local si falla la IA
    function generateLocalResponse(userMessage) {
        const msg = userMessage.toLowerCase();
        
        if (msg.includes('hola') || msg.includes('buenas')) {
            return `¡Hola! 😊 Soy tu asesor digital para negocios locales. ¿Me contás qué tipo de negocio tenés?`;
        }
        
        if (msg.includes('precio') || msg.includes('cuesta') || msg.includes('cuánto')) {
            return `Te cuento nuestros precios:

🌐 **Web catálogo:** Desde $150.000
🤖 **Bot de WhatsApp:** Desde $80.000 + $15.000/mes
📱 **Marketing digital:** Desde $45.000/mes
🎯 **Publicidad:** Desde $30.000 + inversión
📊 **Presupuestos automáticos:** Desde $60.000
⚙️ **Automatizaciones:** Desde $120.000

¿Te interesa alguna en particular?`;
        }
        
        if (msg.includes('web') || msg.includes('página') || msg.includes('sitio')) {
            return `¡La web catálogo es perfecta para comercios!

**Incluye:**
• Diseño profesional
• Catálogo de productos
• Contacto directo
• Optimizada para celulares
• Integración con WhatsApp

**Precio:** Desde $150.000 (única vez)

¿Te gustaría ver ejemplos?`;
        }
        
        if (msg.includes('bot') || msg.includes('whatsapp') || msg.includes('automático')) {
            return `El **Bot de WhatsApp** atiende automáticamente:

✅ Responde consultas 24/7
✅ Envía presupuestos al instante
✅ Toma pedidos automáticamente
✅ Deriva a humano si es necesario

**Inversión:**
• Desarrollo: $80.000
• Mensualidad: $15.000/mes

¡Es nuestro servicio más solicitado!`;
        }
        
        // Respuesta por defecto
        return `Entiendo. Para ayudarte mejor:

1. **¿Qué tipo de negocio tenés?**
2. **¿Qué desafíos tenés?** (tiempo, ventas, visibilidad)
3. **¿Te interesa alguna solución específica?**

¡Así te puedo asesorar mejor! 😊`;
    }
    
    // ===== FUNCIONALIDADES EXTRA =====
    
    // Menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }
    
    // Tabs de servicios
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // Quitar active de todos
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => {
                el.classList.remove('active');
            });
            
            // Agregar active a seleccionados
            this.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
        });
    });
    
    // Click en tarjetas de servicio
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3')?.textContent || '';
            let message = '';
            
            if (title.includes('Bot')) message = 'Me interesa el Bot de WhatsApp';
            else if (title.includes('Web')) message = 'Quiero saber sobre la web catálogo';
            else if (title.includes('redes')) message = 'Me interesa el manejo de redes';
            else if (title.includes('Publicidad')) message = 'Quiero info sobre publicidad';
            else if (title.includes('Presupuestos')) message = 'Me interesan los presupuestos automáticos';
            else message = `Me interesa ${title}`;
            
            if (userInput) {
                userInput.value = message;
                userInput.focus();
                userInput.dispatchEvent(new Event('input'));
                
                // Abrir chat si está cerrado
                if (chatBody && chatBody.classList.contains('collapsed')) {
                    chatBody.classList.remove('collapsed');
                    chatToggle.querySelector('i').className = 'fas fa-chevron-down';
                }
            }
        });
    });
    
    console.log('✅ Sistema listo para usar');
});
