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
    
    // Fetch available slots (now includes blocked slots check)
    fetch(`/api/admin/available-slots/${selectedDate}`)
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
                const isBooked = data.bookedSlots.includes(slot);
                const displayTime = formatTimeDisplay(slot);
                
                if (isAvailable) {
                    options += `<option value="${slot}">${displayTime} - Available</option>`;
                } else if (isBooked) {
                    options += `<option value="${slot}" disabled>${displayTime} - Booked</option>`;
                } else {
                    // Blocked slot
                    const blockReason = data.blockedInfo.find(b => 
                        b.time.includes(slot) || b.time === 'All day'
                    );
                    const reason = blockReason ? ` - ${blockReason.reason}` : '';
                    options += `<option value="${slot}" disabled style="color: #dc3545;">${displayTime} - Blocked${reason}</option>`;
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

// Enhanced form submission with duplicate prevention
document.getElementById("scheduleForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Disable form to prevent multiple submissions
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Booking...</span>';
    
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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
    }

    try {
        console.log('📨 Sending appointment data:', { firstName, familyName, phone, date, time });
        
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

        console.log('📩 Response status:', response.status);
        
        const result = await response.json();
        console.log('📦 API Response data:', result);

        if (response.ok && result.success) {
            // SUCCESS - Show confirmation message
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
            
            // Reset form after delay
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
                
                // Re-enable button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }, 5000);
            
        } else {
            // Handle specific error cases
            if (result.code === 'SQLITE_CONSTRAINT' || result.error?.includes('already booked')) {
                alert('This time slot was just booked. Please choose a different time.');
            } else if (result.details) {
                alert(`Validation errors:\n• ${result.details.join('\n• ')}`);
            } else {
                alert(`Booking failed: ${result.error || 'Unknown error'}`);
            }
            
            // Re-enable form on error
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    } catch (error) {
        console.error('💥 Network error:', error);
        alert('Sorry, there was an error saving your appointment. Please try again.');
        
        // Re-enable form on network error
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
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

async function loadPortfolioPhotos() {
    try {
        const gallery = document.getElementById('portfolioGallery');
        if (!gallery) return;
        
        // Show loading state
        gallery.innerHTML = `
            <div class="loading-placeholder">
                <div class="loading-spinner"></div>
                <p>Loading portfolio...</p>
            </div>
        `;
        
        // Fetch photos from database via public API
        const response = await fetch('/api/admin/public/photos?category=portfolio&active=true');
        
        if (!response.ok) {
            throw new Error('Failed to load photos');
        }
        
        const data = await response.json();
        
        if (data.success && data.photos && data.photos.length > 0) {
            gallery.innerHTML = '';
            
            data.photos.forEach(photo => {
                const galleryItem = document.createElement('div');
                galleryItem.className = 'gallery-item';
                galleryItem.onclick = () => openModal(photo.filepath, photo.caption || 'Design');
                
                galleryItem.innerHTML = `
                    <img src="${photo.filepath}" alt="${photo.caption || 'Design'}" loading="lazy">
                    <div class="caption">${photo.caption || 'Beautiful Design'}</div>
                `;
                
                gallery.appendChild(galleryItem);
            });
        } else {
            // Fallback to hardcoded photos if no database photos
            loadFallbackPhotos();
        }
    } catch (error) {
        console.error('Failed to load portfolio photos:', error);
        // Load fallback photos on error
        loadFallbackPhotos();
    }
}

// Fallback to hardcoded photos
function loadFallbackPhotos() {
    const gallery = document.getElementById('portfolioGallery');
    gallery.innerHTML = `
        <div class="gallery-item" onclick="openModal('photos/image1.jpg', 'Elegant Evening Gown')">
            <img src="photos/image1.jpg" alt="Elegant Evening Gown">
            <div class="caption">Elegant Evening Gown - Perfect for formal events.</div>
        </div>
        <div class="gallery-item" onclick="openModal('photos/image2.jpg', 'Summer Dress')">
            <img src="photos/image2.jpg" alt="Summer Dress">
            <div class="caption">Summer Dress - Light and breezy for sunny days.</div>
        </div>
        <div class="gallery-item" onclick="openModal('photos/image3.jpg', 'Bridal Gown')">
            <img src="photos/image3.jpg" alt="Bridal Gown">
            <div class="caption">Bridal Gown - A dream dress for your special day.</div>
        </div>
        <div class="gallery-item" onclick="openModal('photos/image4.jpg', 'Casual Wear')">
            <img src="photos/image4.jpg" alt="Casual Wear">
            <div class="caption">Casual Wear - Comfortable yet stylish for everyday wear.</div>
        </div>
    `;
}

// Load photos when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadPortfolioPhotos();
});