// Dashboard Module
class DashboardManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async loadDashboard() {
        try {
            const response = await this.admin.fetchData(`${this.admin.apiBase}/stats`);
            if (response.success) {
                this.updateStats(response.stats);
                this.updateRecentAppointments(response.stats.recentAppointments);
            }
            
            // Load blocked slots count
            const blockedResponse = await this.admin.fetchData(`${this.admin.apiBase}/blocked-slots`);
            if (blockedResponse.success) {
                document.getElementById('totalBlocked').textContent = 
                    blockedResponse.blockedSlots.length;
                document.getElementById('dbBlocked').textContent = 
                    blockedResponse.blockedSlots.length;
                this.updateRecentBlockedSlots(blockedResponse.blockedSlots);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to load dashboard data');
        }
    }
    
    updateStats(stats) {
        document.getElementById('todayAppointments').textContent = 
            stats.appointmentsToday;
        document.getElementById('totalAppointments').textContent = 
            stats.totalAppointments;
        document.getElementById('totalPhotos').textContent = 
            stats.totalPhotos;
    }
    
    updateRecentAppointments(appointments) {
        const tbody = document.querySelector('#recentAppointments tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent appointments</td></tr>';
            return;
        }
        
        appointments.forEach(apt => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${apt.firstname} ${apt.familyname}</td>
                <td>${apt.phone}</td>
                <td>${new Date(apt.date).toLocaleDateString()}</td>
                <td>${apt.time.substring(0, 5)}</td>
                <td>
                    <button class="btn-delete-sm" onclick="admin.modules.appointments.deleteAppointment(${apt.id})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateRecentBlockedSlots(blockedSlots) {
        const tbody = document.querySelector('#recentBlockedSlots tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const recentSlots = blockedSlots.slice(0, 5);
        
        if (recentSlots.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No blocked slots</td></tr>';
            return;
        }
        
        recentSlots.forEach(slot => {
            const row = document.createElement('tr');
            let timeInfo = '';
            if (slot.all_day) {
                timeInfo = 'All Day';
            } else if (slot.start_time && slot.end_time) {
                timeInfo = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
            } else if (slot.start_time) {
                timeInfo = `From ${slot.start_time.substring(0, 5)}`;
            } else if (slot.end_time) {
                timeInfo = `Until ${slot.end_time.substring(0, 5)}`;
            }
            
            row.innerHTML = `
                <td>${new Date(slot.start_date).toLocaleDateString()}</td>
                <td>${timeInfo}</td>
                <td>${slot.reason || 'No reason'}</td>
                <td>
                    <button class="btn-delete-sm" onclick="admin.modules.blockslots.deleteBlockedSlot(${slot.id})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
}