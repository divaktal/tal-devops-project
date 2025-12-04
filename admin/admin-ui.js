// UI Utility Module
class UIManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    updateNavigation(page) {
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.querySelector(`[data-page="${page}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.style.display = 'none';
        });
        
        // Show target page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }
        
        // Update title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            const titles = {
                'dashboard': 'Dashboard',
                'photos': 'Photo Manager',
                'appointments': 'Appointments',
                'upload': 'Upload Photos',
                'blockedSlots': 'Blocked Slots',
                'schedule': 'Schedule View',
                'backup': 'Backup'
            };
            pageTitle.textContent = titles[page] || page;
        }
    }
    
    showMessage(type, text) {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${text}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        // Add CSS for notifications if not present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    max-width: 400px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification-content {
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-success {
                    background: #4CAF50;
                    color: white;
                    border-left: 4px solid #388E3C;
                }
                .notification-error {
                    background: #F44336;
                    color: white;
                    border-left: 4px solid #D32F2F;
                }
                .notification-warning {
                    background: #FF9800;
                    color: white;
                    border-left: 4px solid #F57C00;
                }
                .notification-info {
                    background: #2196F3;
                    color: white;
                    border-left: 4px solid #1976D2;
                }
                .notification button {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 10px;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                .notification button:hover {
                    background: rgba(255,255,255,0.2);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading-spinner"></div>';
        }
    }
    
    hideLoading(elementId, defaultContent = '') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = defaultContent;
        }
    }
}