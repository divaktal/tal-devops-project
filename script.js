// Smooth scrolling for anchor links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Prevent default anchor behavior
        const targetId = this.getAttribute('href').substring(1); // Get the target section ID
        const targetSection = document.getElementById(targetId); // Find the target section
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth', // Smooth scroll
                block: 'start' // Align to the top of the section
            });
        }
    });
});

// Toggle Chat Window
function toggleChat() {
    var chatWindow = document.getElementById("chatWindow");
    var chatButton = document.querySelector(".chat-toggle");
    chatWindow.classList.toggle("open");
    chatButton.style.display = chatWindow.classList.contains("open") ? "none" : "block";
    chatWindow.setAttribute("aria-hidden", !chatWindow.classList.contains("open"));
}

// Close Chat Window when clicking outside
document.addEventListener('click', function (e) {
    var chatWindow = document.getElementById("chatWindow");
    var chatButton = document.querySelector(".chat-toggle");
    if (!chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
        chatWindow.classList.remove("open");
        chatButton.style.display = "block";
        chatWindow.setAttribute("aria-hidden", "true");
    }
});

// Send Message in Chat
function sendMessage(message) {
    var chatBody = document.getElementById("chatBody");
    var newMessage = document.createElement("div");
    newMessage.textContent = "You: " + message;
    chatBody.appendChild(newMessage);

    // Show typing animation for the bot
    var typingMessage = document.createElement("div");
    typingMessage.innerHTML = 'Lily_Bot: <span class="typing-animation"></span>';
    chatBody.appendChild(typingMessage);

    // Simulate a delay for the bot's response
    setTimeout(function() {
        // Remove typing animation
        typingMessage.innerHTML = 'Lily_Bot: Thank you for your message! How can I assist you further?';
        chatBody.scrollTop = chatBody.scrollHeight;
    }, 1500);
}

// Open Modal with Maximized Photo
function openModal(imageSrc, dressName) {
    var modal = document.getElementById("modal");
    var modalImage = document.getElementById("modalImage");
    var modalOverlay = document.getElementById("modalOverlay");
    modalImage.src = imageSrc;
    modalOverlay.textContent = dressName;
    modal.classList.add("open");
}

// Close Modal
function closeModal() {
    var modal = document.getElementById("modal");
    modal.classList.remove("open");
}

// Client-side validation functions
const clientValidation = {
    isValidName: (name) => /^[a-zA-Z\s\-']{2,50}$/.test(name.trim()),
    isValidPhone: (phone) => /^[\+]?[0-9\s\-\(\)\.]{10,20}$/.test(phone.trim()),
    
    validateField: (field, value) => {
        const errorElement = document.getElementById(`${field}Error`);
        
        switch (field) {
            case 'firstName':
            case 'familyName':
                if (!value.trim()) {
                    errorElement.textContent = 'This field is required';
                    return false;
                } else if (!clientValidation.isValidName(value)) {
                    errorElement.textContent = 'Must contain only letters (2-50 characters)';
                    return false;
                }
                break;
            case 'phone':
                if (!value.trim()) {
                    errorElement.textContent = 'Phone number is required';
                    return false;
                } else if (!clientValidation.isValidPhone(value)) {
                    errorElement.textContent = 'Please enter a valid phone number (10-20 digits)';
                    return false;
                }
                break;
            case 'date':
                if (!value) {
                    errorElement.textContent = 'Please select a date';
                    return false;
                }
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    errorElement.textContent = 'Please select a future date';
                    return false;
                }
                break;
        }
        
        errorElement.textContent = '';
        return true;
    }
};

// Add real-time validation
document.getElementById('firstName').addEventListener('blur', function() {
    clientValidation.validateField('firstName', this.value);
});

document.getElementById('familyName').addEventListener('blur', function() {
    clientValidation.validateField('familyName', this.value);
});

document.getElementById('phone').addEventListener('blur', function() {
    clientValidation.validateField('phone', this.value);
});

document.getElementById('date').addEventListener('change', function() {
    clientValidation.validateField('date', this.value);
    // Also update time slots when date changes
    updateTimeSlots(this.value);
});

// Update time options based on selected date
function updateTimeSlots(selectedDate) {
    const timeSelect = document.getElementById('time');
    
    if (!selectedDate) {
        // Reset to default if no date selected
        timeSelect.innerHTML = `
            <option value="">Select an hour</option>
            <option value="09:00">9:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">1:00 PM</option>
            <option value="14:00">2:00 PM</option>
            <option value="15:00">3:00 PM</option>
            <option value="16:00">4:00 PM</option>
            <option value="17:00">5:00 PM</option>
        `;
        // Clear availability summary
        const summaryDiv = document.getElementById('availabilitySummary');
        if (summaryDiv) {
            summaryDiv.innerHTML = '';
            summaryDiv.style.backgroundColor = '#f8f9fa';
        }
        return;
    }
    
    // Show loading
    timeSelect.innerHTML = '<option value="">Loading available times...</option>';
    
    // Fetch available slots for selected date
    fetch(`/api/available-slots/${selectedDate}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                timeSelect.innerHTML = `<option value="">${data.error}</option>`;
                return;
            }
            
            // Build time options
            let options = '<option value="">Select an hour</option>';
            
            data.allSlots.forEach(slot => {
                const isAvailable = data.availableSlots.includes(slot);
                const displayTime = formatTimeDisplay(slot);
                
                if (isAvailable) {
                    options += `<option value="${slot}">${displayTime} - Available</option>`;
                } else {
                    options += `<option value="${slot}" disabled>${displayTime} - Booked</option>`;
                }
            });
            
            timeSelect.innerHTML = options;
            
            // Show availability summary
            showAvailabilitySummary(data);
        })
        .catch(error => {
            console.error('Error fetching availability:', error);
            timeSelect.innerHTML = '<option value="">Error loading times</option>';
        });
}

// Format time for display (9:00 -> 9:00 AM)
function formatTimeDisplay(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Show availability summary
function showAvailabilitySummary(data) {
    let summaryDiv = document.getElementById('availabilitySummary');
    
    if (!summaryDiv) {
        summaryDiv = document.createElement('div');
        summaryDiv.id = 'availabilitySummary';
        summaryDiv.style.marginTop = '10px';
        summaryDiv.style.padding = '10px';
        summaryDiv.style.borderRadius = '5px';
        summaryDiv.style.backgroundColor = '#f8f9fa';
        
        const timeSelect = document.getElementById('time');
        timeSelect.parentNode.appendChild(summaryDiv);
    }
    
    if (data.error) {
        summaryDiv.innerHTML = `<span style="color: #dc3545;">⚠️ ${data.error}</span>`;
        summaryDiv.style.backgroundColor = '#f8d7da';
    } else {
        const availableCount = data.availableSlots.length;
        const totalCount = data.allSlots.length;
        
        summaryDiv.innerHTML = `
            <strong>Availability for ${data.date}:</strong><br>
            ✅ ${availableCount} time slots available<br>
            ❌ ${totalCount - availableCount} time slots booked
        `;
        summaryDiv.style.backgroundColor = availableCount > 0 ? '#d1edff' : '#fff3cd';
    }
}

// Enhanced form submission with better error handling
document.getElementById("scheduleForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById("firstName").value;
    const familyName = document.getElementById("familyName").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // Client-side validation
    let isValid = true;
    isValid = clientValidation.validateField('firstName', firstName) && isValid;
    isValid = clientValidation.validateField('familyName', familyName) && isValid;
    isValid = clientValidation.validateField('phone', phone) && isValid;
    isValid = clientValidation.validateField('date', date) && isValid;

    if (!time) {
        document.getElementById('timeError').textContent = 'Please select a time';
        isValid = false;
    }

    if (!isValid) {
        alert('Please fix the validation errors before submitting.');
        return;
    }

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName,
                familyName,
                phone,
                date,
                time
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Show success message
            const confirmationMessage = document.getElementById("confirmationMessage");
            confirmationMessage.style.display = 'block';
            confirmationMessage.innerHTML = `
                <div class="confirmation-icon">✅</div>
                <h3>Appointment Booked!</h3>
                <p>Your appointment on ${date} at ${formatTimeDisplay(time)} has been confirmed.</p>
                <p>We'll contact you at ${phone} to confirm.</p>
            `;
            
            // Hide form
            this.style.display = 'none';
            
            // Reset form and reload availability
            setTimeout(() => {
                this.reset();
                this.style.display = 'block';
                confirmationMessage.style.display = 'none';
                // Clear availability summary
                const summaryDiv = document.getElementById('availabilitySummary');
                if (summaryDiv) {
                    summaryDiv.innerHTML = '';
                    summaryDiv.style.backgroundColor = '#f8f9fa';
                }
                // Reset min date
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('date').min = today;
            }, 5000);
        } else {
            // Show server-side validation errors
            if (result.details) {
                alert(`Validation errors:\n• ${result.details.join('\n• ')}`);
            } else {
                alert(`Booking failed: ${result.error}`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Sorry, there was an error saving your appointment. Please try again.');
    }
});

// Set minimum date to today for the date picker and initialize
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // Initialize time dropdown
    const timeSelect = document.getElementById('time');
    timeSelect.innerHTML = `
        <option value="">Select an hour</option>
        <option value="09:00">9:00 AM</option>
        <option value="10:00">10:00 AM</option>
        <option value="11:00">11:00 AM</option>
        <option value="12:00">12:00 PM</option>
        <option value="13:00">1:00 PM</option>
        <option value="14:00">2:00 PM</option>
        <option value="15:00">3:00 PM</option>
        <option value="16:00">4:00 PM</option>
        <option value="17:00">5:00 PM</option>
    `;
    
    // Clear any existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
});

// Appointment Scheduling - Backup version (keeping for reference)
document.getElementById("scheduleForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById("firstName").value;
    const familyName = document.getElementById("familyName").value;
    const phone = document.getElementById("phone").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (firstName && familyName && phone && date && time) {
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    familyName,
                    phone,
                    date,
                    time
                })
            });

            if (response.ok) {
                const result = await response.json();
                
                // Show confirmation message
                const confirmationMessage = document.getElementById("confirmationMessage");
                confirmationMessage.style.display = 'block';
                
                // Hide form
                this.style.display = 'none';
                
                // Reset form for potential new entry
                setTimeout(() => {
                    this.reset();
                    this.style.display = 'block';
                    confirmationMessage.style.display = 'none';
                }, 5000);
            } else {
                throw new Error('Failed to save appointment');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Sorry, there was an error saving your appointment. Please try again.');
        }
    }
});