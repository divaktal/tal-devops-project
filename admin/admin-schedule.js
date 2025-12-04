// Schedule/Timeline Module
class ScheduleManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async loadSchedulePage() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const scheduleDate = document.getElementById('scheduleDate');
        if (scheduleDate) {
            scheduleDate.value = today;
            
            // Add event listener for date change (auto-load)
            scheduleDate.addEventListener('change', () => {
                this.loadScheduleData();
            });
        }
        
        // Load today's schedule
        this.loadScheduleData();
    }
    
    async loadScheduleData() {
        const date = document.getElementById('scheduleDate').value;
        
        if (!date) {
            // Show placeholder if no date selected
            const container = document.getElementById('timelineContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-calendar-alt" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                        <p>Select a date to view the schedule</p>
                    </div>
                `;
            }
            return;
        }
        
        try {
            const container = document.getElementById('timelineContainer');
            if (container) {
                container.innerHTML = '<div class="loading-spinner"></div>';
            }
            
            const data = await this.admin.fetchData(`${this.admin.apiBase}/appointments/timeline?date=${date}`);
            
            if (data.success) {
                this.displayTimeline(data);
                this.displayScheduleSummary(data.summary);
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to load schedule: ' + data.error);
                const container = document.getElementById('timelineContainer');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; color: #ff9800;"></i>
                            <p>Failed to load schedule</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            const container = document.getElementById('timelineContainer');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; color: #f44336;"></i>
                        <p>Error loading schedule. Please try again.</p>
                    </div>
                `;
            }
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
        
        if (data.timeline.length === 0) {
            html += `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 15px; color: #4caf50;"></i>
                    <p>No appointments or blocked slots for this date</p>
                    <p style="font-size: 14px; color: #999;">All time slots are available</p>
                </div>
            `;
        } else {
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
        }
        
        container.innerHTML = html;
    }
    
    displayScheduleSummary(summary) {
        const scheduleSummary = document.getElementById('scheduleSummary');
        if (scheduleSummary) {
            scheduleSummary.style.display = 'flex';
            document.getElementById('timelineTotalAppointments').textContent = summary.totalAppointments;
            document.getElementById('timelineTotalBlocked').textContent = summary.totalBlocked;
            document.getElementById('timelineAvailableSlots').textContent = summary.availableSlots;
        }
    }
    
    loadTodaySchedule() {
        const today = new Date().toISOString().split('T')[0];
        const scheduleDate = document.getElementById('scheduleDate');
        if (scheduleDate) {
            scheduleDate.value = today;
            this.loadScheduleData();
        }
    }
}