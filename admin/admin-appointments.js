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
            this.admin.modules.ui.showMessage('error', 'Failed to load appointments');
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
                    <button class="btn-delete-sm" onclick="admin.modules.appointments.deleteAppointment(${apt.id})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async deleteAppointment(id) {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.admin.apiBase}/appointments/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.admin.modules.ui.showMessage('success', 'Appointment deleted successfully!');
                this.loadAppointments();
                this.admin.modules.dashboard.loadDashboard();
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to delete appointment');
            }
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to delete appointment');
        }
    }
    
    async deleteAppointmentFromTimeline(id) {
        if (!confirm('Are you sure you want to delete this appointment?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.admin.apiBase}/appointments/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.admin.modules.ui.showMessage('success', 'Appointment deleted successfully!');
                this.admin.modules.schedule.loadScheduleData();
                this.admin.modules.dashboard.loadDashboard();
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to delete appointment: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting appointment:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to delete appointment');
        }
    }
}