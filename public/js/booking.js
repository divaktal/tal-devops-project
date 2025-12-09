// ============ BOOKING SYSTEM FUNCTIONALITY ============

let bookingController = null;

// Load available times for selected date
function loadAvailableTimes(date) {
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;
    
    if (!date) {
        timeSelect.innerHTML = '<option value="">Select a date first</option>';
        return;
    }
    
    // Clear previous options
    timeSelect.innerHTML = '<option value="">Loading available times...</option>';
    timeSelect.disabled = true;
    
    // Abort any previous request
    if (bookingController) {
        bookingController.abort();
    }
    
    bookingController = new AbortController();
    const timeoutId = setTimeout(() => {
        bookingController.abort();
        timeSelect.innerHTML = '<option value="">Request timeout</option>';
        showError('Failed to load available times: Request timed out');
    }, 5000);
    
    fetch(`/api/available-slots/${date}`, {
        signal: bookingController.signal
    })
        .then(response => {
            clearTimeout(timeoutId);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                updateTimeSelect(data.availableSlots, date);
            } else {
                timeSelect.innerHTML = '<option value="">Error loading times</option>';
                showError(`Error loading available slots: ${data.error || 'Unknown error'}`);
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                timeSelect.innerHTML = '<option value="">Request timeout</option>';
                showError('Request timed out loading available times');
            } else {
                timeSelect.innerHTML = '<option value="">Error loading times</option>';
                showError('Network error loading available times');
            }
        });
}

// Update time select with available slots
function updateTimeSelect(slots, selectedDate) {
    const timeSelect = document.getElementById('appointmentTime');
    if (!timeSelect) return;
    
    // Clear options
    timeSelect.innerHTML = '';
    
    if (!slots || slots.length === 0) {
        timeSelect.innerHTML = '<option value="">No available times</option>';
        return;
    }
    
    // Filter out past times if date is today
    const currentTime = getCurrentTime();
    const isToday = selectedDate === getTodayDate();
    
    const validSlots = slots.filter(slot => {
        if (!isToday) return true;
        return slot > currentTime;
    });
    
    if (validSlots.length === 0) {
        timeSelect.innerHTML = '<option value="">No more available times today</option>';
        return;
    }
    
    // Add options for valid slots
    validSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        timeSelect.appendChild(option);
    });
    
    timeSelect.disabled = false;
}

// Validate booking form
function validateBookingForm() {
    const firstName = document.getElementById('firstName').value.trim();
    const familyName = document.getElementById('familyName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    
    // Clear previous errors
    hideMessages();
    
    // Validation
    const errors = [];
    
    if (!firstName) errors.push('First name is required');
    if (!familyName) errors.push('Family name is required');
    if (!phone) errors.push('Phone number is required');
    if (!date) errors.push('Date is required');
    if (!time) errors.push('Time is required');
    
    // Validate phone number
    if (phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            errors.push('Please enter a valid phone number (at least 10 digits)');
        }
    }
    
    // Check if time is in the past
    if (date && time && isTimeInPast(date, time)) {
        errors.push('Cannot book appointments in the past. Please select a future time');
    }
    
    if (errors.length > 0) {
        showError(errors.join('. '));
        return false;
    }
    
    return true;
}

// Submit booking form
async function submitBookingForm(e) {
    e.preventDefault();
    
    if (!validateBookingForm()) {
        return;
    }
    
    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const familyName = document.getElementById('familyName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('appointmentDate').value;
    const time = document.getElementById('appointmentTime').value;
    
    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳ Booking...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
    }
    
    // Prepare data
    const appointmentData = {
        firstName: firstName,
        familyName: familyName,
        phone: phone.replace(/\D/g, ''), // Send only digits
        date: date,
        time: time
    };
    
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 10000); // 10 second timeout
    
    try {
        // Send booking request
        const response = await fetch('/api/book-appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = 'Schedule Appointment';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
        
        if (response.ok) {
            // SUCCESS - Show only the bottom confirmation message
            
            // Hide the top success message
            const successDiv = document.getElementById('successMessage');
            if (successDiv) {
                successDiv.style.display = 'none';
            }
            
            // Show the bottom confirmation message
            const confirmation = document.getElementById('confirmationMessage');
            if (confirmation) {
                confirmation.style.display = 'block';
            }
            
            // Reset form
            const bookingForm = document.getElementById('scheduleForm');
            if (bookingForm) {
                bookingForm.reset();
            }
            
            // Clear time select
            const timeSelect = document.getElementById('appointmentTime');
            if (timeSelect) {
                timeSelect.innerHTML = '<option value="">Select a date first</option>';
                timeSelect.disabled = true;
            }
            
            // Reset date to today
            const dateInput = document.getElementById('appointmentDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            
        } else {
            showError(data.error || 'Failed to book appointment. Please try again.');
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Reset button
        if (submitBtn) {
            submitBtn.innerHTML = 'Schedule Appointment';
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
        
        if (error.name === 'AbortError') {
            showError('Request timed out. Server may not be responding.');
        } else {
            showError('Network error. Please check your connection and try again.');
        }
    }
}

// Initialize booking system
function initBooking() {
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    const bookingForm = document.getElementById('scheduleForm');
    
    // Set minimum date to today
    if (dateInput) {
        dateInput.min = getTodayDate();
        
        // Load available times when date changes
        dateInput.addEventListener('change', function() {
            loadAvailableTimes(this.value);
        });
    }
    
    // Form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', submitBookingForm);
    }
    
    console.log('Booking system initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBooking);