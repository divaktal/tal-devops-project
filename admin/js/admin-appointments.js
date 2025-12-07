// Appointment Management Module
class AppointmentManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async loadAppointments() {
        try {
            const date = document.getElementById('appointmentDateFilter').value;
            let url = `${this.admin.apiBase}/appointments`;
            if (date) {
                url += `?date=${date}`;
            }
            
            const data = await this.admin.fetchData(url);
            if (data.success) {
                this.displayAppointments(data.appointments);
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to load appointments');
            } else {
                alert('Failed to load appointments');
            }
        }
    }
    
    displayAppointments(appointments) {
        const tbody = document.querySelector('#appointmentsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No appointments found</td></tr>';
            return;
        }
        
        appointments.forEach(apt => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${apt.id}</td>
                <td>${apt.firstname} ${apt.familyname}</td>
                <td>${apt.phone}</td>
                <td>${new Date(apt.date).toLocaleDateString()}</td>
                <td>${apt.time.substring(0, 5)}</td>
                <td>${new Date(apt.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-delete-sm" onclick="admin.modules.appointments.confirmDeleteAppointment(${apt.id})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async confirmDeleteAppointment(id) {
        const confirmed = await this.admin.modules.ui.confirm(
            'Are you sure you want to delete this appointment?',
            () => this.deleteAppointment(id),
            'danger',
            {
                details: 'This will remove the appointment permanently.'
            }
        );
        
        return confirmed;
    }
    
    async deleteAppointment(id) {
        try {
            const response = await fetch(`${this.admin.apiBase}/appointments/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                if (this.admin.modules.ui && this.admin.modules.ui.showSuccess) {
                    this.admin.modules.ui.showSuccess('Appointment deleted successfully!');
                } else {
                    alert('Appointment deleted successfully!');
                }
                this.loadAppointments();
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                const errorData = await response.json();
                if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                    this.admin.modules.ui.showError(`Failed to delete appointment: ${errorData.error || 'Unknown error'}`);
                } else {
                    alert(`Failed to delete appointment: ${errorData.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError(`Failed to delete appointment: ${error.message}`);
            } else {
                alert(`Failed to delete appointment: ${error.message}`);
            }
        }
    }
    
    async deleteAppointmentFromTimeline(id) {
        const confirmed = await this.admin.modules.ui.confirm(
            'Are you sure you want to delete this appointment?',
            () => this._deleteAppointment(id),
            'danger',
            {
                details: 'This will remove the appointment permanently.'
            }
        );
        
        return confirmed;
    }
    
    async _deleteAppointment(id) {
        try {
            const response = await fetch(`${this.admin.apiBase}/appointments/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                if (this.admin.modules.ui && this.admin.modules.ui.showSuccess) {
                    this.admin.modules.ui.showSuccess('Appointment deleted successfully!');
                } else {
                    alert('Appointment deleted successfully!');
                }
                
                // Refresh schedule if available
                if (this.admin.modules.schedule && this.admin.modules.schedule.loadScheduleData) {
                    this.admin.modules.schedule.loadScheduleData();
                }
                
                // Refresh dashboard if available
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                    this.admin.modules.ui.showError('Failed to delete appointment: ' + (data.error || 'Unknown error'));
                } else {
                    alert('Failed to delete appointment: ' + (data.error || 'Unknown error'));
                }
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to delete appointment');
            } else {
                alert('Failed to delete appointment');
            }
        }
    }
}