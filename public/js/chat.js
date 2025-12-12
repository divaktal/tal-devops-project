// ============ CHAT FUNCTIONALITY ============ 

// Toggle chat window
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.querySelector('.chat-toggle');
    
    if (!chatWindow || !chatToggle) return;
    
    if (chatWindow.classList.contains('open')) {
        // Close chat - show button
        chatWindow.classList.remove('open');
        chatToggle.classList.remove('hidden'); // Show button
        chatToggle.style.transform = 'scale(1)';
    } else {
        // Open chat - hide button
        chatWindow.classList.add('open');
        chatToggle.classList.add('hidden'); // Hide button
        chatToggle.style.transform = 'scale(1.1)';
    }
}
// Close chat when clicking outside
function setupClickOutsideToClose() {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.querySelector('.chat-toggle');
    
    if (!chatWindow) return;
    
    // Click outside handler
    function handleClickOutside(event) {
        // If chat is not open, do nothing
        if (!chatWindow.classList.contains('open')) return;
        
        // Check if click is on the chat toggle button
        if (chatToggle && chatToggle.contains(event.target)) return;
        
        // Check if click is inside the chat window
        if (chatWindow.contains(event.target)) return;
        
        // If click is outside chat window and not on toggle button, close chat
        toggleChat();
    }
    
    // Add click event listener to document
    document.addEventListener('click', handleClickOutside);
    
    // Prevent clicks inside chat from closing it (event propagation)
    chatWindow.addEventListener('click', function(event) {
        event.stopPropagation();
    });
}

// Send message from chat buttons
function sendMessage(message) {
    const chatBody = document.getElementById('chatBody');
    if (!chatBody) return;
    
    // Add user message
    const userMessage = createElement('div', {
        className: 'message user-message',
        textContent: message
    });
    chatBody.appendChild(userMessage);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Show typing indicator
    const typingIndicator = createElement('div', {
        className: 'message bot-message',
        innerHTML: '<div class="typing-indicator"><span></span><span></span><span></span></div>'
    });
    chatBody.appendChild(typingIndicator);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Simulate bot response after delay
    setTimeout(() => {
        // Remove typing indicator
        if (typingIndicator.parentNode === chatBody) {
            chatBody.removeChild(typingIndicator);
        }
        
        // Add bot response
        const botResponse = getBotResponse(message);
        const botMessage = createElement('div', {
            className: 'message bot-message',
            textContent: botResponse
        });
        chatBody.appendChild(botMessage);
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1500);
}

// Get bot response based on user message
function getBotResponse(message) {
    const responses = {
        'How can I make a custom dress?': 'We start with a consultation to understand your vision, take measurements, and discuss fabrics. Then we create a unique design just for you!',
        'What is your pricing?': 'Pricing varies based on design complexity, materials, and time required. Basic dresses start at $300, while more elaborate designs can range from $500 to $2000+.',
        'Do you offer online consultations?': 'Yes! We offer virtual consultations via video call. You can book one through our scheduling system above.',
        'What types of dresses do you make?': 'We specialize in wedding dresses, evening gowns, cocktail dresses, and custom everyday wear. We can create almost any style you imagine!',
        'How long does it take to make a custom dress?': 'Typically 4-8 weeks depending on complexity. Rush orders may be available for an additional fee.',
        'Can I see your previous work?': 'Absolutely! Check out our portfolio section above to see examples of our creations.',
        'Do you do alterations?': 'Yes, we offer alteration services for dresses and other garments. Pricing depends on the type of alteration needed.',
        'What fabrics do you work with?': 'We work with silk, satin, lace, chiffon, velvet, and many other high-quality fabrics. We\'ll help you choose the perfect material for your design.'
    };
    
    // Check for exact matches first
    if (responses[message]) {
        return responses[message];
    }
    
    // Check for partial matches
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        return responses['What is your pricing?'];
    } else if (lowerMessage.includes('custom') || lowerMessage.includes('make')) {
        return responses['How can I make a custom dress?'];
    } else if (lowerMessage.includes('online') || lowerMessage.includes('virtual')) {
        return responses['Do you offer online consultations?'];
    } else if (lowerMessage.includes('type') || lowerMessage.includes('kind')) {
        return responses['What types of dresses do you make?'];
    } else if (lowerMessage.includes('time') || lowerMessage.includes('long')) {
        return responses['How long does it take to make a custom dress?'];
    } else if (lowerMessage.includes('see') || lowerMessage.includes('work') || lowerMessage.includes('portfolio')) {
        return responses['Can I see your previous work?'];
    } else if (lowerMessage.includes('alter') || lowerMessage.includes('fix')) {
        return responses['Do you do alterations?'];
    } else if (lowerMessage.includes('fabric') || lowerMessage.includes('material')) {
        return responses['What fabrics do you work with?'];
    }
    
    // Default response
    return 'Thank you for your message! I\'m Lily_Bot, here to help with questions about custom dresses, pricing, consultations, and more. Feel free to click the buttons below or type your question.';
}

// Initialize chat
function initChat() {
    // Add initial welcome message
    const chatBody = document.getElementById('chatBody');
    if (chatBody) {
        const welcomeMessage = createElement('div', {
            className: 'message bot-message',
            textContent: 'Hello! I\'m Lily_Bot. How can I help you today?'
        });
        chatBody.appendChild(welcomeMessage);
    }
    
    // Attach event listener to chat toggle button
    const chatToggle = document.querySelector('.chat-toggle');
    if (chatToggle) {
        chatToggle.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from triggering outside click
            toggleChat();
        });
        console.log('Chat toggle button event listener attached');
    }
    
    // Attach event listeners to chat close button
    const chatCloseBtn = document.querySelector('.chat-header button');
    if (chatCloseBtn) {
        chatCloseBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from triggering outside click
            toggleChat();
        });
    }
    
    // Attach event listeners to chat footer buttons
    const chatButtons = document.querySelectorAll('.chat-footer button');
    chatButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent click from triggering outside click
            sendMessage(this.textContent);
        });
    });
    
    // Setup click outside to close functionality
    setupClickOutsideToClose();
    
    console.log('Chat initialized with click-outside functionality');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);