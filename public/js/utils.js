// ============ UTILITY FUNCTIONS ============

// Debug function
function showDebug(message) {
    const debugDiv = document.getElementById('debugMessages');
    const debugContent = document.getElementById('debugContent');
    if (debugDiv && debugContent) {
        debugDiv.style.display = 'block';
        debugContent.innerHTML += `<div style="margin: 5px 0;">${new Date().toLocaleTimeString()}: ${message}</div>`;
        console.log('DEBUG:', message);
    }
}

// Show error message
function showError(message) {
    showDebug(`ERROR: ${message}`);
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    if (errorDiv && errorText) {
        errorDiv.style.display = 'block';
        errorText.textContent = message;
    } else {
        alert('Error: ' + message);
    }
}

// Show success message
function showSuccess(message, details = '') {
    showDebug(`SUCCESS: ${message}`);
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    if (successDiv && successText) {
        successDiv.style.display = 'block';
        successText.innerHTML = `<strong>${message}</strong>${details ? '<br>' + details : ''}`;
    }
    
    // Also show the original confirmation
    const confirmation = document.getElementById('confirmationMessage');
    if (confirmation) {
        confirmation.style.display = 'block';
    }
}

// Hide messages
function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const confirmation = document.getElementById('confirmationMessage');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    if (confirmation) confirmation.style.display = 'none';
}

// Utility function to format date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    return formatDate(new Date());
}

// Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Check if a time slot is in the past
function isTimeInPast(selectedDate, selectedTime) {
    const today = getTodayDate();
    
    // If selected date is in the past
    if (selectedDate < today) {
        return true;
    }
    
    // If selected date is today, check time
    if (selectedDate === today) {
        const currentTime = getCurrentTime();
        return selectedTime <= currentTime;
    }
    
    return false;
}

// Phone number formatting
function formatPhoneNumber(value) {
    let digits = value.replace(/\D/g, '');
    
    if (digits.length > 3 && digits.length <= 6) {
        digits = digits.replace(/(\d{3})(\d+)/, '$1-$2');
    } else if (digits.length > 6) {
        digits = digits.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
    }
    
    return digits;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
}

// Create element with attributes
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // Append children
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
}

// Debounce function
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

// Make functions available globally
window.showDebug = showDebug;
window.showError = showError;
window.showSuccess = showSuccess;
window.hideMessages = hideMessages;
window.formatDate = formatDate;
window.getTodayDate = getTodayDate;
window.getCurrentTime = getCurrentTime;
window.isTimeInPast = isTimeInPast;
window.formatPhoneNumber = formatPhoneNumber;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.createElement = createElement;
window.debounce = debounce;