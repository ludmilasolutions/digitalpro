// script.js - Lógica principal del sitio y chat IA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema cargado correctamente');
    
    // ===== ELEMENTOS DEL DOM =====
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatToggle = document.getElementById('chatToggle');
    const chatBody = document.getElementById('chatBody');
    
    // ===== VARIABLES DE ESTADO =====
    let conversationHistory = [];
    let isProcessing = false;
    
    // ===== CONFIGURACIÓN =====
    const CONFIG = window.CONFIG || {
        SERVERLESS_ENDPOINT: "/.netlify/functions/gemini",
        WHATSAPP_PHONE: "5493417558966",
        CHAT: {
            INITIAL_MESSAGE: "¡Hola! Soy tu asesor digital. Contame sobre tu negocio y te ayudo 👇"
        }
    };
    
    // ===== INICIALIZAR CHAT =====
    function initializeChat() {
        if (!chatMessages || chatMessages.children.length > 0) return;
        
        const initialMessage = CONFIG.CHAT?.INITIAL_MESSAGE || 
                              "¡Hola! Soy tu asesor digital. Contame sobre tu negocio 👇";
        
        addMessage(initialMessage, 'ai');
        
        conversationHistory = [{
            role: 'assistant',
            content: initialMessage
        }];
    }
    
    // Llamar inicialización
    initializeChat();
    
    // ===== FUNCIONES DEL CHAT =====
    
    // 1. Agregar mensaje al chat
    function addMessage(text, sender = 'ai') {
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Formatear texto (seguro para HTML)
        const formattedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        contentDiv.innerHTML = `<p>${formattedText}</p>`;
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll al final
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
        
        // Agregar al historial
        conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text
        });
        
        // Limitar historial
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    }
    
    // 2. Toggle del chat
    if (chatToggle && chatBody) {
        chatToggle.addEventListener('click', function() {
            chatBody.classList.toggle('collapsed');
            const icon = this.querySelector('i');
            icon.className = chatBody.classList.contains('collapsed') 
                ? 'fas fa-chevron-up' 
                : 'fas fa-chevron-down';
        });
    }
    
    // 3. Auto-resize del textarea
    if (userInput) {
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    
    // 4. Botón de enviar
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    // 5. Función principal para enviar mensaje
    async function handleSendMessage() {
        if (!userInput || !chatMessages || isProcessing) return;
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Bloquear mientras procesamos
        isProcessing = true;
        
        // Agregar mensaje del usuario
        addMessage(message, 'user');
        
        // Limpiar input
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Mostrar "escribiendo"
        const typingIndicator = showTypingIndicator();
        
        try {
            // Llamar a la IA
            const aiResponse = await callGeminiAPI(message);
            
            // Remover indicador
            removeTypingIndicator(typingIndicator);
            
            // Agregar respuesta
            addMessage(aiResponse, 'ai');
            
        } catch (error) {
            console.error('Error en handleSendMessage:', error);
            removeTypingIndicator(typingIndicator);
            
            // Respuesta de fallback
            addMessage(`¡Hola! Parece que hay un problema técnico temporal. 

Mientras tanto, te puedo ayudar con:

📱 **WhatsApp directo:** <a href="https://wa.me/${CONFIG.WHATSAPP_PHONE}" target="_blank" style="color: #25D366; font-weight: bold;">Hacé clic aquí para WhatsApp</a>

💼 **Soluciones que ofrecemos:**
• Web catálogo desde $150.000
• Bot de WhatsApp desde $80.000
• Marketing digital desde $45.000/mes
• Publicidad desde $30.000
• Presupuestos automáticos desde $60.000

¿Te gustaría continuar por WhatsApp o prefieres que te cuente más sobre alguna solución?`, 'ai');
        } finally {
            isProcessing = false;
        }
    }
    
    // 6. Mostrar indicador de "escribiendo"
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-ellipsis-h"></i> Escribiendo...</p>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }
    
    // 7. Remover indicador
    function removeTypingIndicator(typingElement) {
        if (typingElement && typingElement.parentNode === chatMessages) {
            chatMessages.removeChild(typingElement);
        }
    }
    
    // ===== CONEXIÓN CON GEMINI API - VERSIÓN SIMPLIFICADA =====
    async function callGeminiAPI(userMessage) {
        try {
            console.log('🔗 Llamando a Gemini API...');
            
            // Determinar endpoint
            let endpoint = CONFIG.SERVERLESS_ENDPOINT;
            console.log(`🌐 Endpoint: ${endpoint}`);
            
            // Preparar prompt inteligente basado en el mensaje
            const prompt = `Eres un asistente digital especializado en soluciones para negocios locales en Argentina.
            
Servicios que ofrecemos:
1. Web catálogo: desde $150.000
2. Bot de WhatsApp: desde $80.000 + $15.000/mes
3. Marketing digital: desde $45.000/mes
4. Publicidad: desde $30.000 + inversión en anuncios
5. Presupuestos automáticos: desde $60.000
6. Automatizaciones: desde $120.000 (según necesidad)

Responde de manera amigable, profesional y enfocada en soluciones prácticas. 
Si preguntan por precios, sé claro y menciona los rangos. 
Si piden WhatsApp, ofréceles continuar por ahí.

Mensaje del usuario: "${userMessage}"

Responde en español argentino, de forma natural y útil.`;

            // Preparar datos para enviar
            const requestData = {
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            };
            
            console.log('📤 Enviando mensaje a Gemini...');
            
            // Hacer la petición
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            console.log(`📥 Respuesta status: ${response.status}`);
            
            if (!response.ok) {
                let errorDetail;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.error || errorData.detail || 'Error desconocido';
                    console.error('❌ Error detallado:', errorData);
                } catch (e) {
                    errorDetail = await response.text();
                }
                
                throw new Error(`Error ${response.status}: ${errorDetail}`);
            }
            
            const data = await response.json();
            console.log('✅ Respuesta recibida de Gemini');
            
            if (!data.text) {
                throw new Error('La respuesta no contiene texto');
            }
            
            return data.text;
            
        } catch (error) {
            console.error('🔥 Error en callGeminiAPI:', error);
            
            // Si hay error, devolver respuesta local inteligente
            return generateFallbackResponse(userMessage);
        }
    }
    
    // 8. Generar respuesta de fallback local
    function generateFallbackResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        if (lowerMsg.includes('hola') || lowerMsg.includes('buenas')) {
            return `¡Hola! 😊 Soy tu asesor digital para negocios locales. ¿Me podés contar qué tipo de negocio tenés?`;
        }
        
        if (lowerMsg.includes('precio') || lowerMsg.includes('cuesta') || lowerMsg.includes('cuánto')) {
            return `Los precios varían según cada solución:

📱 **Bot de WhatsApp:** Desde $80.000 + $15.000/mes
🌐 **Web catálogo:** Desde $150.000
📣 **Marketing digital:** Desde $45.000/mes
🎯 **Publicidad:** Desde $30.000 + inversión en anuncios
📊 **Presupuestos automáticos:** Desde $60.000

¿Te interesa alguna solución en particular para darte más detalles?`;
        }
        
        if (lowerMsg.includes('whatsapp') || lowerMsg.includes('contacto')) {
            return `¡Perfecto! Para una atención más personalizada y confirmar precios exactos, te recomiendo continuar por WhatsApp.

Allí podés:
• Consultar precios específicos para tu negocio
• Ver ejemplos reales de trabajos
• Coordinar una reunión virtual
• Resolver todas tus dudas

¿Te preparo un resumen con todo lo que hablamos para continuar por WhatsApp?`;
        }
        
        if (lowerMsg.includes('web') || lowerMsg.includes('catálogo') || lowerMsg.includes('online')) {
            return `¡La web catálogo es ideal para negocios locales!

**¿Qué incluye?**
• Diseño profesional adaptado a tu negocio
• Catálogo de productos/servicios
• Información de contacto visible
• Optimizada para celulares
• Integración con WhatsApp

**Inversión:** Desde $150.000 (única vez)

**No es una tienda online** - es tu vitrina digital para que los clientes te conozcan y te contacten.

¿Te gustaría ver ejemplos?`;
        }
        
        if (lowerMsg.includes('bot') || lowerMsg.includes('automático') || lowerMsg.includes('automatico')) {
            return `El **Bot de WhatsApp** es nuestro servicio más solicitado:

**Beneficios:**
• Atiende consultas **24/7 sin tu intervención**
• Envía presupuestos **automáticamente**
• Responde preguntas frecuentes
• Toma datos para seguimiento
• Deriva a humano cuando es necesario

**Inversión:** 
• Desarrollo: Desde $80.000
• Mensualidad: $15.000/mes (mantenimiento y actualizaciones)

¿Te sirve para tu negocio?`;
        }
        
        // Respuesta por defecto
        return `¡Entiendo! Para ayudarte mejor, contame:

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

¡Así te puedo dar recomendaciones específicas para tu caso! 😊`;
    }
    
    // ===== FUNCIONALIDADES ADICIONALES =====
    
    // Menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
        
        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
            });
        });
    }
    
    // Tabs de servicios
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
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
            if (title.includes('Bot de WhatsApp')) {
                message = 'Me interesa el Bot de WhatsApp. ¿Cómo funciona?';
            } else if (title.includes('Web catálogo')) {
                message = 'Quiero saber más sobre la Web catálogo.';
            } else if (title.includes('redes sociales')) {
                message = 'Me gustaría consultar sobre manejo de redes sociales.';
            } else if (title.includes('Publicidad')) {
                message = 'Quiero información sobre publicidad digital.';
            } else if (title.includes('Presupuestos')) {
                message = 'Me interesan los presupuestos automáticos con IA.';
            } else {
                message = `Me interesa ${title}. ¿Podrían darme más información?`;
            }
            
            if (userInput) {
                userInput.value = message;
                userInput.dispatchEvent(new Event('input'));
                userInput.focus();
                
                // Abrir chat si está cerrado
                if (chatBody && chatBody.classList.contains('collapsed')) {
                    chatBody.classList.remove('collapsed');
                    if (chatToggle) {
                        chatToggle.querySelector('i').className = 'fas fa-chevron-down';
                    }
                }
                
                // Desplazar al chat
                document.querySelector('.chat-widget').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });
    });
    
    // Actualizar botones de WhatsApp con número real
    const whatsappButtons = document.querySelectorAll('[id*="whatsapp"], .btn-whatsapp, .nav-cta');
    whatsappButtons.forEach(btn => {
        const href = btn.getAttribute('href');
        if (href && href.includes('wa.me')) {
            const newHref = href.replace(/wa\.me\/\d+/, `wa.me/${CONFIG.WHATSAPP_PHONE}`);
            btn.setAttribute('href', newHref);
        }
    });
    
    console.log('✅ Sistema completamente inicializado');
});
