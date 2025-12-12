const AdminUI = {
    // Initialize the UI
    init: function() {
        console.log('Admin UI Initializing...');
        
        // Initialize page visibility
        this.initializePages();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup modal close buttons
        this.setupModals();
        
        // Setup notifications
        this.setupNotifications();
        
        console.log('Admin UI Initialized');
    },
    
    // Initialize page visibility
    initializePages: function() {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            if (page.id !== 'dashboardPage') {
                page.classList.add('hidden');
            } else {
                page.classList.remove('hidden');
            }
        });
    },
    
    // Setup navigation click handlers
    setupNavigation: function() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Get page to show
                const pageName = item.getAttribute('data-page');
                this.showPage(pageName);
                
                // Update active navigation
                this.setActiveNav(item);
                
                // Update page title
                this.updatePageTitle(item.textContent.trim());
            });
        });
    },
    
    // Show a specific page
    showPage: function(pageName) {
        console.log('Showing page:', pageName);
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        // Show the requested page
        const pageId = pageName + 'Page';
        const targetPage = document.getElementById(pageId);
        
        if (targetPage) {
            targetPage.classList.remove('hidden');
            
            // Load page-specific data if needed
            this.loadPageData(pageName);
        } else {
            console.error('Page not found:', pageId);
            // Fallback to dashboard
            document.getElementById('dashboardPage').classList.remove('hidden');
        }
    },
    
    // Set active navigation item
    setActiveNav: function(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    },
    
    // Update page title in topbar
    updatePageTitle: function(title) {
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    },
    
    // Load page-specific data
    loadPageData: function(pageName) {
        switch(pageName) {
            case 'dashboard':
                if (typeof admin !== 'undefined' && admin.modules.dashboard) {
                    admin.modules.dashboard.loadDashboard();
                }
                break;
            case 'photos':
                if (typeof admin !== 'undefined' && admin.modules.photos) {
                    admin.modules.photos.loadPhotos();
                }
                break;
            case 'appointments':
                if (typeof admin !== 'undefined' && admin.modules.appointments) {
                    admin.modules.appointments.loadAppointments();
                }
                break;
            case 'blockedSlots':
                if (typeof admin !== 'undefined' && admin.modules.blockslots) {
                    admin.modules.blockslots.loadBlockedSlots();
                }
                break;
            case 'schedule':
                if (typeof admin !== 'undefined' && admin.modules.schedule) {
                    // Set today's date by default
                    const today = new Date().toISOString().split('T')[0];
                    document.getElementById('scheduleDate').value = today;
                    admin.modules.schedule.loadSchedule(today);
                }
                break;
            case 'backup':
                if (typeof admin !== 'undefined' && admin.modules.backup) {
                    admin.modules.backup.loadDatabaseInfo();
                }
                break;
            // upload page doesn't need data loading
        }
    },
    
    // Modal management
    setupModals: function() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });
    },
    
    // Show modal
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            // Ensure proper positioning
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '10000';
            modal.style.background = 'rgba(0, 0, 0, 0.5)';
            
            // Ensure modal content is centered
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.margin = 'auto';
                modalContent.style.maxHeight = '90vh';
                modalContent.style.overflowY = 'auto';
            }
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Close modal
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            // Restore body scroll
            document.body.style.overflow = '';
            
            // Clean up event listeners if they exist
            if (modal._cleanup && typeof modal._cleanup === 'function') {
                modal._cleanup();
                delete modal._cleanup;
            }
        }
    },
    
    // Notification system
    setupNotifications: function() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            // ADD TO TOP OF BODY, NOT MODALS
            document.body.insertBefore(container, document.body.firstChild);
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer') || document.body;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
        
        return notification;
    },
    
    // Show success notification
    showSuccess: function(message, duration = 5000) {
        return this.showNotification(message, 'success', duration);
    },
    
    // Show error notification
    showError: function(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    },
    
    // Show warning notification
    showWarning: function(message, duration = 5000) {
        return this.showNotification(message, 'warning', duration);
    },
    
    // Show info notification
    showInfo: function(message, duration = 5000) {
        return this.showNotification(message, 'info', duration);
    },
    
    // ADDED: showMessage for backward compatibility
    showMessage: function(type, message, duration = 5000) {
        switch(type) {
            case 'success':
                return this.showSuccess(message, duration);
            case 'error':
                return this.showError(message, duration);
            case 'warning':
                return this.showWarning(message, duration);
            case 'info':
                return this.showInfo(message, duration);
            default:
                return this.showNotification(message, type, duration);
        }
    },
    
    // Toggle element visibility
    toggleElement: function(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    },
    
    // Show element
    showElement: function(elementId) {
        this.toggleElement(elementId, true);
    },
    
    // Hide element
    hideElement: function(elementId) {
        this.toggleElement(elementId, false);
    },
    
    // Set loading state for button
    setButtonLoading: function(button, isLoading, loadingText = 'Loading...') {
        if (isLoading) {
            button.setAttribute('data-original-text', button.innerHTML);
            button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
            button.disabled = true;
        } else {
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.innerHTML = originalText;
            }
            button.disabled = false;
        }
    },
    
    // Beautiful confirmation dialog with UI
    confirm: function(message, callback, type = 'warning', options = {}) {
        return new Promise((resolve) => {
            // Set message and icon
            const messageEl = document.getElementById('confirmationMessage');
            const detailsEl = document.getElementById('confirmationDetails');
            const iconEl = document.querySelector('#confirmationModal .confirmation-icon i');
            const deletePreview = document.getElementById('deletePreview');
            const photoPreview = document.getElementById('photoPreview');
            const previewImage = document.getElementById('previewImage');
            const deleteItemName = document.getElementById('deleteItemName');
            const deleteItemDetails = document.getElementById('deleteItemDetails');
            
            if (messageEl) messageEl.innerHTML = message;
            if (detailsEl) detailsEl.innerHTML = options.details || '';
            
            // Show/hide preview sections
            if (deletePreview) deletePreview.classList.add('hidden');
            if (photoPreview) photoPreview.classList.add('hidden');
            
            // Show item preview if provided
            if (options.itemName && deleteItemName && deleteItemDetails) {
                deleteItemName.textContent = options.itemName;
                deleteItemDetails.textContent = options.itemDetails || '';
                if (deletePreview) deletePreview.classList.remove('hidden');
            }
            
            // Show photo preview if provided
            if (options.imageUrl && previewImage) {
                previewImage.src = options.imageUrl;
                if (photoPreview) photoPreview.classList.remove('hidden');
            }
            
            // Set icon based on type
            if (iconEl) {
                iconEl.className = {
                    'warning': 'fas fa-exclamation-triangle icon-warning',
                    'danger': 'fas fa-trash-alt icon-danger',
                    'info': 'fas fa-info-circle icon-info',
                    'success': 'fas fa-check-circle icon-success'
                }[type] || 'fas fa-exclamation-triangle icon-warning';
                
                // Update header title based on type
                const headerTitle = document.querySelector('#confirmationModal .modal-header h3');
                if (headerTitle) {
                    const titles = {
                        'warning': 'Confirm Action',
                        'danger': 'Delete Confirmation',
                        'info': 'Information Required',
                        'success': 'Success'
                    };
                    headerTitle.innerHTML = `<i class="${iconEl.className.split(' ')[0]} ${iconEl.className.split(' ')[1]}"></i> ${titles[type] || 'Confirm Action'}`;
                }
            }
            
            // Update confirm button text based on type
            const confirmBtn = document.getElementById('confirmActionBtn');
            if (confirmBtn) {
                const buttonTexts = {
                    'warning': '<i class="fas fa-check"></i> Confirm',
                    'danger': '<i class="fas fa-trash"></i> Delete',
                    'info': '<i class="fas fa-check"></i> OK',
                    'success': '<i class="fas fa-check"></i> OK'
                };
                confirmBtn.innerHTML = buttonTexts[type] || '<i class="fas fa-check"></i> Confirm';
            }
            
            // Clear previous listeners
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // Set up confirmation handler
            const confirmHandler = () => {
                this.closeModal('confirmationModal');
                if (typeof callback === 'function') {
                    callback();
                }
                resolve(true);
            };
            
            newConfirmBtn.addEventListener('click', confirmHandler);
            
            // Cancel button handler
            const cancelHandler = () => {
                this.closeModal('confirmationModal');
                resolve(false);
            };
            
            // Show modal
            this.showModal('confirmationModal');
            
            // Set up cancel handlers
            const cancelBtn = document.querySelector('#confirmationModal .btn-secondary');
            if (cancelBtn) {
                const newCancelBtn = cancelBtn.cloneNode(true);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
                newCancelBtn.addEventListener('click', cancelHandler);
            }
            
            // Close on outside click
            const modal = document.getElementById('confirmationModal');
            const outsideClickHandler = (e) => {
                if (e.target === modal) {
                    cancelHandler();
                }
            };
            modal.addEventListener('click', outsideClickHandler);
            
            // Close on Escape key
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    cancelHandler();
                }
            };
            document.addEventListener('keydown', escapeHandler);
            
            // Cleanup function
            const cleanup = () => {
                modal.removeEventListener('click', outsideClickHandler);
                document.removeEventListener('keydown', escapeHandler);
            };
            
            // Store cleanup references
            modal._cleanup = cleanup;
        });
    }
};

// Initialize when DOM is loaded AND admin object exists
function initializeAdminUI() {
    // Wait for admin object to be available
    if (typeof admin !== 'undefined' && admin.modules.ui) {
        // Initialize AdminUI
        AdminUI.init();
        
        // Set initial active state for Dashboard
        const dashboardNav = document.querySelector('.nav-item[data-page="dashboard"]');
        if (dashboardNav) {
            AdminUI.setActiveNav(dashboardNav);
        }
    } else {
        // Try again in 100ms if admin not ready
        setTimeout(initializeAdminUI, 100);
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminUI);
} else {
    initializeAdminUI();
}

// Make it globally accessible
window.adminUI = AdminUI;

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminUI;
}