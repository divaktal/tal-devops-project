// ============ MAIN INITIALIZATION ============

document.addEventListener('DOMContentLoaded', function() {
    console.log('Main script loaded');
    
    // Initialize phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }
    
    // Set minimum date for all date inputs
    const today = getTodayDate();
    const allDateInputs = document.querySelectorAll('input[type="date"]');
    allDateInputs.forEach(input => {
        input.min = today;
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Initialize components
    initializeGallery();
    initializeChat();
    initializeBooking();
    
    console.log('All components initialized');
});

// Global error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showError('An unexpected error occurred. Please refresh the page.');
});

// Export initialization function
function initializeGallery() {
    // Gallery will be initialized in gallery.js
    console.log('Gallery initialization triggered');
}

function initializeChat() {
    // Chat will be initialized in chat.js
    console.log('Chat initialization triggered');
}

function initializeBooking() {
    // Booking will be initialized in booking.js
    console.log('Booking initialization triggered');
}