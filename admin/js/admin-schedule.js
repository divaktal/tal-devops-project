// Schedule/Timeline Module
class ScheduleManager {
    constructor(admin) {
        this.admin = admin;
        this.setupDateListener();
    }
    
    // Setup date change listener
    setupDateListener() {
        const scheduleDate = document.getElementById('scheduleDate');
        if (scheduleDate) {
            // Remove any existing listener first
            scheduleDate.removeEventListener('change', this.handleDateChange);
            
            // Add new listener
            this.handleDateChange = this.handleDateChange.bind(this);
            scheduleDate.addEventListener('change', this.handleDateChange);
        }
    }
    
    // Handle date change
    handleDateChange() {
        const date = document.getElementById('scheduleDate').value;
        if (date) {
            this.loadSchedule(date);
        }
    }
    
    // This is called from admin.js and admin-ui.js
    async loadSchedule(date = null) {
        try {
            // If date is provided, update the date input
            if (date) {
                const scheduleDate = document.getElementById('scheduleDate');
                if (scheduleDate) {
                    scheduleDate.value = date;
                }
            } else {
                // If no date provided, use the current value
                date = document.getElementById('scheduleDate').value;
                if (!date) {
                    // Default to today
                    date = new Date().toISOString().split('T')[0];
                    const scheduleDate = document.getElementById('scheduleDate');
                    if (scheduleDate) {
                        scheduleDate.value = date;
                    }
                }
            }
            
            console.log('Loading schedule for date:', date);
            
            // Show loading state
            const container = document.getElementById('timelineContainer');
            if (container) {
                container.innerHTML = '<div class="loading-spinner"></div>';
            }
            
            // Fetch data from API
            const data = await this.admin.fetchData(`${this.admin.apiBase}/appointments/timeline?date=${date}`);
            
            if (data.success) {
                this.displayTimeline(data);
                this.displayScheduleSummary(data.summary);
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to load schedule: ' + (data.error || 'Unknown error'));
                this.showEmptyState('Failed to load schedule');
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            this.admin.modules.ui.showMessage('error', 'Error loading schedule: ' + error.message);
            this.showEmptyState('Error loading schedule. Please try again.');
        }
    }
    
    // Show empty state
    showEmptyState(message) {
        const container = document.getElementById('timelineContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; color: #f44336;"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    displayTimeline(data) {
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        
        let html = `
            <div class="timeline-header">
                Schedule for ${data.date}
            </div>
        `;
        
        if (data.timeline && data.timeline.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 15px; color: #4caf50;"></i>
                    <p>No appointments or blocked slots for this date</p>
                    <p style="font-size: 14px; color: #999;">All time slots are available</p>
                </div>
            `;
        } else if (data.timeline) {
            data.timeline.forEach(slot => {
                let slotClass = 'available';
                let slotContent = '<span style="color: #4caf50;">Available</span>';
                
                if (slot.appointment) {
                    slotClass = 'booked';
                    slotContent = `
                        <div class="appointment-details">
                            <strong>${slot.appointment.firstName} ${slot.appointment.familyName}</strong><br>
                            📞 ${slot.appointment.phone}<br>
                            ⏰ ${slot.appointment.time}
                        </div>
                    `;
                } else if (slot.blocked) {
                    slotClass = 'blocked';
                    slotContent = `
                        <div class="blocked-reason">
                            ⛔ Blocked: ${slot.blocked.reason || 'No reason provided'}
                            ${slot.blocked.allDay ? '(All Day)' : ''}
                            ${slot.blocked.startTime && slot.blocked.endTime ? 
                              `(${slot.blocked.startTime.substring(0,5)} - ${slot.blocked.endTime.substring(0,5)})` : ''}
                        </div>
                    `;
                }
                
                html += `
                    <div class="timeline-item">
                        <div class="timeline-time">${slot.display}</div>
                        <div class="timeline-slot ${slotClass}">
                            ${slotContent}
                        </div>
                        <div class="timeline-actions">
                            ${slot.appointment ? 
                              `<button class="btn-delete-sm" onclick="admin.modules.appointments.deleteAppointmentFromTimeline(${slot.appointment.id})" style="padding: 4px 8px; font-size: 12px;">Delete</button>` : 
                              ''}
                        </div>
                    </div>
                `;
            });
        } else {
            html += `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; color: #ff9800;"></i>
                    <p>No schedule data available</p>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    displayScheduleSummary(summary) {
        const scheduleSummary = document.getElementById('scheduleSummary');
        if (scheduleSummary && summary) {
            scheduleSummary.classList.remove('hidden');
            document.getElementById('timelineTotalAppointments').textContent = summary.totalAppointments || 0;
            document.getElementById('timelineTotalBlocked').textContent = summary.totalBlocked || 0;
            document.getElementById('timelineAvailableSlots').textContent = summary.availableSlots || 0;
        }
    }
    
    loadTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        const scheduleDate = document.getElementById('scheduleDate');
        if (scheduleDate) {
            scheduleDate.value = today;
            this.loadSchedule(today);
        }
    }
}