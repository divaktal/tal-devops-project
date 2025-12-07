// Main Admin Panel - Initialization and Core Functions
class SimpleAdmin {
    constructor() {
        this.apiBase = '/api/admin';
        this.selectedFiles = [];
        console.log('Admin Panel Initialized');
        
        // Initialize modules - DON'T create UIManager instance
        this.modules = {
            dashboard: new DashboardManager(this),
            photos: new PhotoManager(this),
            appointments: new AppointmentManager(this),
            blockslots: new BlockSlotManager(this),
            schedule: new ScheduleManager(this),
            upload: new UploadManager(this),
            backup: new BackupManager(this),
            ui: AdminUI  // Use the existing AdminUI object, not UIManager
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.modules.dashboard.loadDashboard();
    }
    
    bindEvents() {
        // Navigation is handled by AdminUI, but we keep compatibility
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
        // Use AdminUI to navigate
        this.modules.ui.showPage(page);
        
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
                this.modules.blockslots.loadBlockedSlots();
                break;
            case 'schedule':
                // Set today's date by default
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('scheduleDate').value = today;
                this.modules.schedule.loadSchedule(today);
                break;
            case 'backup':
                this.modules.backup.loadDatabaseInfo();
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
            // Use AdminUI's notification system
            if (this.modules.ui && this.modules.ui.showError) {
                this.modules.ui.showError(`Error: ${error.message}`);
            }
            throw error;
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new SimpleAdmin();
});