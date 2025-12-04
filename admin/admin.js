// Main Admin Panel - Initialization and Core Functions
class SimpleAdmin {
    constructor() {
        this.apiBase = '/api/admin';
        this.selectedFiles = [];
        console.log('Admin Panel Initialized');
        
        // Initialize modules
        this.modules = {
            dashboard: new DashboardManager(this),
            photos: new PhotoManager(this),
            appointments: new AppointmentManager(this),
            blockslots: new BlockSlotManager(this),
            schedule: new ScheduleManager(this),
            upload: new UploadManager(this),
            backup: new BackupManager(this),
            ui: new UIManager(this)
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.modules.dashboard.loadDashboard();
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Filter changes
        const photoFilter = document.getElementById('photoCategoryFilter');
        if (photoFilter) {
            photoFilter.addEventListener('change', () => this.modules.photos.loadPhotos());
        }
        
        // Edit photo form
        const editForm = document.getElementById('editPhotoForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.modules.photos.savePhotoChanges();
            });
        }
    }
    
    navigateTo(page) {
        this.modules.ui.updateNavigation(page);
        
        // Load page data
        switch(page) {
            case 'dashboard':
                this.modules.dashboard.loadDashboard();
                break;
            case 'photos':
                this.modules.photos.loadPhotos();
                break;
            case 'appointments':
                this.modules.appointments.loadAppointments();
                break;
            case 'upload':
                this.modules.upload.setupFileUpload();
                break;
            case 'blockedSlots':
                this.modules.blockslots.loadBlockedSlotsPage();
                break;
            case 'schedule':
                this.modules.schedule.loadSchedulePage();
                break;
            case 'backup':
                this.modules.backup.loadBackupInfo();
                break;
        }
    }
    
    async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            this.modules.ui.showMessage('error', `Error: ${error.message}`);
            throw error;
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new SimpleAdmin();
});