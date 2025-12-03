// ============ APPOINTMENT BOOKING SYSTEM ============

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
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
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

// Initialize booking system
document.addEventListener('DOMContentLoaded', function() {
    showDebug('Page loaded, initializing booking system...');
    
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    const bookingForm = document.getElementById('scheduleForm');
    const submitBtn = document.getElementById('submitBtn');
    
    showDebug(`Elements found: dateInput=${!!dateInput}, timeSelect=${!!timeSelect}, bookingForm=${!!bookingForm}, submitBtn=${!!submitBtn}`);
    
    // Set minimum date to today
    if (dateInput) {
        const today = getTodayDate();
        dateInput.min = today;
        showDebug(`Set minimum date to: ${today}`);
        
        // Set all date inputs minimum
        const allDateInputs = document.querySelectorAll('input[type="date"]');
        allDateInputs.forEach(input => {
            input.min = today;
        });
    }
    
    // Load available times when date changes
    if (dateInput && timeSelect) {
        dateInput.addEventListener('change', function() {
            const selectedDate = this.value;
            showDebug(`Date changed to: ${selectedDate}`);
            
            if (!selectedDate) {
                timeSelect.innerHTML = '<option value="">Select a date first</option>';
                return;
            }
            
            // Clear previous options
            timeSelect.innerHTML = '<option value="">Loading available times...</option>';
            timeSelect.disabled = true;
            
            // Fetch available times for selected date
            showDebug(`Fetching available slots for: ${selectedDate}`);
            
            // Add timeout to this fetch too
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                timeSelect.innerHTML = '<option value="">Request timeout</option>';
                showError('Failed to load available times: Request timed out');
            }, 5000);
            
            fetch(`/api/available-slots/${selectedDate}`, {
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    showDebug(`API Response status: ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    showDebug(`Available slots data received: ${JSON.stringify(data)}`);
                    
                    if (data.success) {
                        // Clear options
                        timeSelect.innerHTML = '';
                        
                        if (data.availableSlots.length === 0) {
                            timeSelect.innerHTML = '<option value="">No available times</option>';
                            showDebug('No available time slots for selected date');
                        } else {
                            // Filter out past times if date is today
                            const currentTime = getCurrentTime();
                            const isToday = selectedDate === getTodayDate();
                            
                            const validSlots = data.availableSlots.filter(slot => {
                                if (!isToday) return true;
                                return slot > currentTime;
                            });
                            
                            if (validSlots.length === 0) {
                                timeSelect.innerHTML = '<option value="">No more available times today</option>';
                                showDebug('No more available time slots for today');
                            } else {
                                // Add options for valid slots
                                validSlots.forEach(slot => {
                                    const option = document.createElement('option');
                                    option.value = slot;
                                    option.textContent = slot;
                                    timeSelect.appendChild(option);
                                });
                                
                                timeSelect.disabled = false;
                                showDebug(`Added ${validSlots.length} time slots: ${validSlots.join(', ')}`);
                            }
                        }
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
                    console.error('Error fetching available times:', error);
                });
        });
    }
    
    // Form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            showDebug('Form submission started');
            
            // Get form values
            const firstName = document.getElementById('firstName').value.trim();
            const familyName = document.getElementById('familyName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const date = document.getElementById('appointmentDate').value;
            const time = document.getElementById('appointmentTime').value;
            
            showDebug(`Form values: firstName=${firstName}, familyName=${familyName}, phone=${phone}, date=${date}, time=${time}`);
            
            // Validation
            if (!firstName || !familyName || !phone || !date || !time) {
                showError('Please fill in all required fields.');
                return;
            }
            
            // Check if time is in the past
            if (isTimeInPast(date, time)) {
                showError('Cannot book appointments in the past. Please select a future time.');
                return;
            }
            
            // Validate phone number (basic validation)
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) {
                showError('Please enter a valid phone number (at least 10 digits).');
                return;
            }
            
            // Show loading
            if (submitBtn) {
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.innerHTML = '⏳ Booking...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';
            }
            
            hideMessages();
            
            // Prepare data
            const appointmentData = {
                firstName: firstName,
                familyName: familyName,
                phone: phoneDigits, // Send only digits
                date: date,
                time: time
            };
            
            showDebug(`Sending appointment data: ${JSON.stringify(appointmentData)}`);
            
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
                showDebug(`API Response status: ${response.status}`);
                
                const data = await response.json();
                showDebug(`API Response data: ${JSON.stringify(data)}`);
                
                // Reset button
                if (submitBtn) {
                    submitBtn.innerHTML = 'Schedule Appointment';
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                }
                
                if (data.success) {
                    // Show success message
                    const details = `
                        <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px;">
                            <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            <p><strong>Name:</strong> ${firstName} ${familyName}</p>
                            <p><strong>Phone:</strong> ${phone}</p>
                        </div>
                    `;
                    
                    showSuccess('Appointment Booked Successfully!', details);
                    
                    // Reset form
                    bookingForm.reset();
                    
                    // Clear time select
                    if (timeSelect) {
                        timeSelect.innerHTML = '<option value="">Select a date first</option>';
                        timeSelect.disabled = true;
                    }
                    
                    // Reset date input min
                    if (dateInput) {
                        dateInput.min = getTodayDate();
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
                console.error('Error booking appointment:', error);
            }
        });
    }
    
    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 3 && value.length <= 6) {
                value = value.replace(/(\d{3})(\d+)/, '$1-$2');
            } else if (value.length > 6) {
                value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
            }
            
            e.target.value = value;
        });
    }
});

// Manual test function (run in browser console)
window.testBooking = function() {
    const testData = {
        firstName: "Test",
        familyName: "User",
        phone: "1234567890",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: "10:00"
    };
    
    console.log('Testing booking with:', testData);
    
    fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => console.log('Response:', data))
    .catch(error => console.error('Error:', error));
};

// Test server connection
window.testServer = function() {
    console.log('Testing server connection...');
    
    fetch('/api/available-slots/2024-12-04')
        .then(response => {
            console.log('Status:', response.status);
            return response.json();
        })
        .then(data => console.log('Data:', data))
        .catch(err => console.error('Error:', err));
};

// ============ PHOTO GALLERY ============
document.addEventListener('DOMContentLoaded', function() {
    const gallery = document.getElementById('photoGallery');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (gallery) {
        loadPhotos();
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadPhotos);
    }
    
    function loadPhotos() {
        const category = categoryFilter ? categoryFilter.value : '';
        let url = '/api/admin/public/photos';
        if (category) {
            url += `?category=${category}`;
        }
        
        if (gallery) {
            gallery.innerHTML = '<div class="loading">Loading photos...</div>';
        }
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && gallery) {
                    displayPhotos(data.photos);
                } else {
                    throw new Error(data.error || 'Failed to load photos');
                }
            })
            .catch(error => {
                console.error('Error loading photos:', error);
                if (gallery) {
                    gallery.innerHTML = '<div class="error">Failed to load photos. Please try again later.</div>';
                }
            });
    }
    
    function displayPhotos(photos) {
        if (!gallery) return;
        
        if (photos.length === 0) {
            gallery.innerHTML = '<div class="no-photos">No photos found in this category</div>';
            return;
        }
        
        gallery.innerHTML = '';
        
        photos.forEach(photo => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            
            // Log the filepath for debugging
            console.log('Photo filepath:', photo.filepath);
            
            photoItem.innerHTML = `
                <img src="${photo.filepath}" alt="${photo.caption || 'Photo'}" loading="lazy" 
                     onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'; this.onerror=null;">
                ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
            `;
            gallery.appendChild(photoItem);
        });
    }
});

// Manual test function (run in browser console)
window.testBooking = function() {
    const testData = {
        firstName: "Test",
        familyName: "User",
        phone: "1234567890",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: "10:00"
    };
    
    console.log('Testing booking with:', testData);
    
    fetch('/api/book-appointment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => console.log('Response:', data))
    .catch(error => console.error('Error:', error));
};