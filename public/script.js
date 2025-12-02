// ============ APPOINTMENT BOOKING SYSTEM ============

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
    const dateInput = document.getElementById('appointmentDate');
    const timeSelect = document.getElementById('appointmentTime');
    const bookingForm = document.getElementById('bookingForm');
    const availableTimesDiv = document.getElementById('availableTimes');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    
    // Set minimum date to today
    if (dateInput) {
        dateInput.min = getTodayDate();
        
        // Disable past dates
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const maxPastDate = formatDate(yesterday);
        
        const allDateInputs = document.querySelectorAll('input[type="date"]');
        allDateInputs.forEach(input => {
            input.min = getTodayDate();
        });
    }
    
    // Load available times when date changes
    if (dateInput && timeSelect) {
        dateInput.addEventListener('change', function() {
            const selectedDate = this.value;
            
            if (!selectedDate) {
                timeSelect.innerHTML = '<option value="">Select a date first</option>';
                return;
            }
            
            // Clear previous options
            timeSelect.innerHTML = '<option value="">Loading available times...</option>';
            timeSelect.disabled = true;
            
            // Show loading
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (errorDiv) errorDiv.style.display = 'none';
            
            // Fetch available times for selected date
            fetch(`/api/available-slots/${selectedDate}`)
                .then(response => response.json())
                .then(data => {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    
                    if (data.success) {
                        // Clear options
                        timeSelect.innerHTML = '';
                        
                        if (data.availableSlots.length === 0) {
                            timeSelect.innerHTML = '<option value="">No available times</option>';
                            if (availableTimesDiv) {
                                availableTimesDiv.innerHTML = `
                                    <div class="error-message">
                                        <i class="fas fa-calendar-times"></i>
                                        <p>No available time slots for ${selectedDate}. Please select another date.</p>
                                    </div>
                                `;
                            }
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
                                if (availableTimesDiv) {
                                    availableTimesDiv.innerHTML = `
                                        <div class="error-message">
                                            <i class="fas fa-clock"></i>
                                            <p>No more available time slots for today. Please select another date.</p>
                                        </div>
                                    `;
                                }
                            } else {
                                // Add options for valid slots
                                validSlots.forEach(slot => {
                                    const option = document.createElement('option');
                                    option.value = slot;
                                    option.textContent = slot;
                                    timeSelect.appendChild(option);
                                });
                                
                                timeSelect.disabled = false;
                                
                                // Display blocked slots info
                                if (availableTimesDiv && data.blockedInfo && data.blockedInfo.length > 0) {
                                    let blockedInfoHTML = '<div class="blocked-info"><h4>Note:</h4><ul>';
                                    data.blockedInfo.forEach(info => {
                                        blockedInfoHTML += `<li>${info.time}: ${info.reason}</li>`;
                                    });
                                    blockedInfoHTML += '</ul></div>';
                                    availableTimesDiv.innerHTML = blockedInfoHTML;
                                } else if (availableTimesDiv) {
                                    availableTimesDiv.innerHTML = '';
                                }
                            }
                        }
                    } else {
                        timeSelect.innerHTML = '<option value="">Error loading times</option>';
                        if (errorDiv) {
                            errorDiv.style.display = 'block';
                            errorDiv.innerHTML = `<p>Error: ${data.error || 'Failed to load available times'}</p>`;
                        }
                    }
                })
                .catch(error => {
                    if (loadingDiv) loadingDiv.style.display = 'none';
                    timeSelect.innerHTML = '<option value="">Error loading times</option>';
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                        errorDiv.innerHTML = '<p>Network error. Please try again.</p>';
                    }
                    console.error('Error fetching available times:', error);
                });
        });
    }
    
    // Form submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value.trim();
            const familyName = document.getElementById('familyName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const date = document.getElementById('appointmentDate').value;
            const time = document.getElementById('appointmentTime').value;
            
            // Validation
            if (!firstName || !familyName || !phone || !date || !time) {
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = '<p>Please fill in all required fields.</p>';
                }
                return;
            }
            
            // Check if time is in the past
            if (isTimeInPast(date, time)) {
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = '<p>Cannot book appointments in the past. Please select a future time.</p>';
                }
                return;
            }
            
            // Validate phone number (basic validation)
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = '<p>Please enter a valid phone number.</p>';
                }
                return;
            }
            
            // Show loading
            const submitBtn = bookingForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
            submitBtn.disabled = true;
            
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
            
            // Prepare data
            const appointmentData = {
                firstName: firstName,
                familyName: familyName,
                phone: phone,
                date: date,
                time: time
            };
            
            // Send booking request
            fetch('/api/book-appointment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            })
            .then(response => response.json())
            .then(data => {
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                if (data.success) {
                    // Show success message
                    if (successDiv) {
                        successDiv.style.display = 'block';
                        successDiv.innerHTML = `
                            <div class="success-content">
                                <i class="fas fa-check-circle"></i>
                                <h3>Appointment Booked Successfully!</h3>
                                <p>Your appointment has been confirmed for:</p>
                                <div class="appointment-details">
                                    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p><strong>Time:</strong> ${time}</p>
                                    <p><strong>Name:</strong> ${firstName} ${familyName}</p>
                                    <p><strong>Phone:</strong> ${phone}</p>
                                </div>
                                <p class="confirmation-note">You will receive a confirmation call shortly.</p>
                            </div>
                        `;
                    }
                    
                    // Reset form
                    bookingForm.reset();
                    
                    // Clear time select
                    if (timeSelect) {
                        timeSelect.innerHTML = '<option value="">Select a date first</option>';
                        timeSelect.disabled = true;
                    }
                    
                    // Clear available times display
                    if (availableTimesDiv) {
                        availableTimesDiv.innerHTML = '';
                    }
                    
                    // Scroll to success message
                    successDiv.scrollIntoView({ behavior: 'smooth' });
                    
                } else {
                    // Show error
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                        errorDiv.innerHTML = `<p>${data.error || 'Failed to book appointment'}</p>`;
                    }
                }
            })
            .catch(error => {
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                // Show error
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                    errorDiv.innerHTML = '<p>Network error. Please try again.</p>';
                }
                console.error('Error booking appointment:', error);
            });
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