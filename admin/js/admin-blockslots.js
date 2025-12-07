// Blocked Slots Management Module
class BlockSlotManager {
    constructor(admin) {
        this.admin = admin;
        this.isSubmitting = false;
    }
    
    // This method is called from admin-ui.js
    async loadBlockedSlots() {
        await this.loadBlockedSlotsPage();
    }
    
    async loadBlockedSlotsPage() {
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('blockDate');
        if (dateInput) dateInput.value = today;
        
        const endDateInput = document.getElementById('endDate');
        if (endDateInput) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
            endDateInput.value = endDate.toISOString().split('T')[0];
        }
        
        // Load blocked slots
        await this.loadBlockedSlotsTable();
        
        // Bind all events
        this.bindAllEvents();
    }
    
    bindAllEvents() {
        // Bind Add Block button
        this.bindAddBlockButton();
        
        // Bind block type buttons
        this.bindBlockTypeButtons();
        
        // Bind form submission
        this.bindFormSubmission();
    }
    
    bindAddBlockButton() {
        // Find the Add Block button - handle both onclick and regular buttons
        const addBlockBtn = document.querySelector('.btn-primary[onclick*="showBlockForm"], #showBlockFormBtn, .page-actions .btn-primary');
        
        if (addBlockBtn) {
            // Remove any existing onclick handler
            addBlockBtn.removeAttribute('onclick');
            
            // Add new event listener
            addBlockBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showBlockForm();
            });
            
            console.log('Add Block button bound successfully');
        } else {
            console.warn('Add Block button not found');
        }
    }
    
    bindBlockTypeButtons() {
        document.querySelectorAll('.block-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.block-type-btn').forEach(b => 
                    b.classList.remove('active')
                );
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                this.showBlockTypeFields(type);
            });
        });
    }
    
    bindFormSubmission() {
        const blockForm = document.getElementById('addBlockForm');
        if (blockForm) {
            blockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBlockSlot();
            });
        }
    }
    
    showBlockTypeFields(type) {
        const rangeFields = document.getElementById('rangeFields');
        const weeklyFields = document.getElementById('weeklyFields');
        
        if (rangeFields) rangeFields.classList.add('hidden');
        if (weeklyFields) weeklyFields.classList.add('hidden');
        
        if (type === 'range' && rangeFields) {
            rangeFields.classList.remove('hidden');
        } else if (type === 'weekly' && weeklyFields) {
            weeklyFields.classList.remove('hidden');
        }
    }
    
    showBlockForm() {
        console.log('showBlockForm called');
        const formContainer = document.getElementById('blockFormContainer');
        if (formContainer) {
            formContainer.classList.remove('hidden');
        } else {
            console.error('Block form container not found');
        }
    }
    
    hideBlockForm() {
        const formContainer = document.getElementById('blockFormContainer');
        if (formContainer) {
            formContainer.classList.add('hidden');
        }
        
        // Reset form
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('blockDate');
        if (dateInput) dateInput.value = today;
        
        const startTimeInput = document.getElementById('blockStartTime');
        if (startTimeInput) startTimeInput.value = '09:00';
        
        const endTimeInput = document.getElementById('blockEndTime');
        if (endTimeInput) endTimeInput.value = '17:00';
        
        const reasonInput = document.getElementById('blockReason');
        if (reasonInput) reasonInput.value = '';
        
        // Reset to single day type
        document.querySelectorAll('.block-type-btn').forEach(b => b.classList.remove('active'));
        const singleBtn = document.querySelector('[data-type="single"]');
        if (singleBtn) singleBtn.classList.add('active');
        this.showBlockTypeFields('single');
        
        this.isSubmitting = false;
    }
    
    async loadBlockedSlotsTable() {
        try {
            const data = await this.admin.fetchData(`${this.admin.apiBase}/blocked-slots`);
            
            const tbody = document.querySelector('#blockedSlotsTable tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!data.success || data.blockedSlots.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center;">
                            No blocked slots found
                        </td>
                    </tr>
                `;
                return;
            }
            
            data.blockedSlots.forEach(slot => {
                const row = document.createElement('tr');
                
                let timeInfo = '';
                if (slot.start_time && slot.end_time) {
                    timeInfo = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
                } else if (slot.all_day) {
                    timeInfo = 'All Day';
                }
                
                row.innerHTML = `
                    <td>${new Date(slot.start_date).toLocaleDateString()}</td>
                    <td>${slot.end_date ? new Date(slot.end_date).toLocaleDateString() : 'Single Day'}</td>
                    <td>${timeInfo}</td>
                    <td>${slot.reason || 'No reason'}</td>
                    <td>${slot.block_type || 'single'}</td>
                    <td>
                        <button class="btn-delete-sm" onclick="admin.modules.blockslots.confirmDeleteBlockedSlot(${slot.id})">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading blocked slots:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to load blocked slots');
        }
    }
    
    async createBlockSlot() {
        if (this.isSubmitting) {
            console.log('Preventing duplicate submission');
            return;
        }
        
        this.isSubmitting = true;
        
        const activeBtn = document.querySelector('.block-type-btn.active');
        if (!activeBtn) {
            this.admin.modules.ui.showMessage('error', 'Please select a block type');
            this.isSubmitting = false;
            return;
        }
        
        const blockType = activeBtn.dataset.type;
        const date = document.getElementById('blockDate').value;
        const startTime = document.getElementById('blockStartTime').value;
        const endTime = document.getElementById('blockEndTime').value;
        const reason = document.getElementById('blockReason').value;
        
        if (!date) {
            this.admin.modules.ui.showMessage('error', 'Please select a date');
            this.isSubmitting = false;
            return;
        }
        
        if (!startTime || !endTime) {
            this.admin.modules.ui.showMessage('error', 'Please select both start and end times');
            this.isSubmitting = false;
            return;
        }
        
        if (startTime >= endTime) {
            this.admin.modules.ui.showMessage('error', 'End time must be after start time');
            this.isSubmitting = false;
            return;
        }
        
        const blockData = {
            date: date,
            start_time: startTime + ':00',
            end_time: endTime + ':00',
            reason: reason,
            block_type: blockType
        };
        
        if (blockType === 'range') {
            const endDate = document.getElementById('endDate').value;
            if (endDate) {
                if (endDate < date) {
                    this.admin.modules.ui.showMessage('error', 'End date must be after start date');
                    this.isSubmitting = false;
                    return;
                }
                blockData.end_date = endDate;
            }
        }
        
        if (blockType === 'weekly') {
            const days = [];
            document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
                days.push(parseInt(cb.value));
            });
            
            if (days.length === 0) {
                this.admin.modules.ui.showMessage('error', 'Please select at least one day for weekly recurring block');
                this.isSubmitting = false;
                return;
            }
            
            const weeks = parseInt(document.getElementById('weeksCount').value) || 4;
            blockData.recurring_pattern = {
                type: 'weekly',
                days: days,
                weeks: weeks
            };
        }
        
        try {
            const submitBtn = document.querySelector('#addBlockForm button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
                submitBtn.disabled = true;
            }
            
            const response = await fetch(`${this.admin.apiBase}/blocked-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockData)
            });
            
            const result = await response.json();
            
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            
            if (response.ok && result.success) {
                this.admin.modules.ui.showMessage('success', result.message || 'Block created successfully');
                this.hideBlockForm();
                await this.loadBlockedSlotsTable();
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                this.admin.modules.ui.showMessage('error', result.error || 'Failed to create block');
            }
        } catch (error) {
            console.error('Error creating block:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to create block: ' + error.message);
        } finally {
            this.isSubmitting = false;
        }
    }
    
    // Confirm and delete blocked slot
    async confirmDeleteBlockedSlot(id) {
        const confirmed = await this.admin.modules.ui.confirm(
            'Are you sure you want to delete this blocked slot?',
            () => this.deleteBlockedSlotFromTable(id),
            'danger',
            {
                details: 'This will free up the time slot for appointments.'
            }
        );
        
        return confirmed;
    }
    
    async deleteBlockedSlotFromTable(id) {
        try {
            const response = await fetch(`${this.admin.apiBase}/blocked-slots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.admin.modules.ui.showMessage('success', 'Blocked slot deleted successfully!');
                await this.loadBlockedSlotsTable();
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                this.admin.modules.ui.showMessage('error', data.error || 'Failed to delete blocked slot');
            }
        } catch (error) {
            console.error('Failed to delete blocked slot:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to delete blocked slot');
        }
    }
}