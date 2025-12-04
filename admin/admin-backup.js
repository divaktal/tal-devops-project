// Backup and Export Module
class BackupManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async backupDatabase() {
        try {
            const response = await fetch(`${this.admin.apiBase}/backup`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                // Update last backup time
                const now = new Date();
                document.getElementById('lastBackup').textContent = 
                    now.toLocaleString();
                    
                this.admin.modules.ui.showMessage('success', 'Backup downloaded successfully!');
            }
        } catch (error) {
            console.error('Backup failed:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to create backup');
        }
    }
    
    async exportAppointments() {
        try {
            const data = await this.admin.fetchData(`${this.admin.apiBase}/appointments?limit=1000`);
            if (data.success) {
                const csv = this.convertToCSV(data.appointments);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `appointments-${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.admin.modules.ui.showMessage('success', 'Appointments exported successfully!');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to export appointments');
        }
    }
    
    async exportAppointmentsCSV() {
        try {
            const response = await fetch(`${this.admin.apiBase}/export/appointments`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `appointments-${Date.now()}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.admin.modules.ui.showMessage('success', 'Appointments exported successfully!');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to export appointments');
        }
    }
    
    async loadBackupInfo() {
        try {
            const data = await this.admin.fetchData(`${this.admin.apiBase}/stats`);
            if (data.success) {
                document.getElementById('dbAppointments').textContent = 
                    data.stats.totalAppointments;
                document.getElementById('dbPhotos').textContent = 
                    data.stats.totalPhotos;
            }
            
            // Load blocked slots count
            const blockedData = await this.admin.fetchData(`${this.admin.apiBase}/blocked-slots`);
            if (blockedData.success) {
                document.getElementById('dbBlocked').textContent = 
                    blockedData.blockedSlots.length;
            }
        } catch (error) {
            console.error('Failed to load backup info:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to load backup information');
        }
    }
    
    convertToCSV(appointments) {
        const headers = ['ID', 'First Name', 'Family Name', 'Phone', 'Date', 'Time', 'Created At'];
        const rows = appointments.map(apt => [
            apt.id,
            apt.firstname,
            apt.familyname,
            apt.phone,
            apt.date,
            apt.time,
            apt.created_at
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }
}