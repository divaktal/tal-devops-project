// Blocked Slots Management Module
class BlockSlotManager {
    constructor(admin) {
        this.admin = admin;
        this.isSubmitting = false;
        this.conflictModal = null;
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
        
        // Initialize conflict modal if not exists
        this.initConflictModal();
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
    
    // ============ NEW METHOD: Check for appointment conflicts ============
    async checkForAppointmentConflicts(blockData) {
        try {
            console.log('Checking for appointment conflicts...', blockData);
            
            const response = await fetch(`${this.admin.apiBase}/blocked-slots/check-appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                if (result.hasConflicts) {
                    console.log('Found appointment conflicts:', result.conflicts);
                    return {
                        hasConflicts: true,
                        conflicts: result.conflicts,
                        conflictCount: result.conflictCount
                    };
                } else {
                    return {
                        hasConflicts: false,
                        conflicts: []
                    };
                }
            } else {
                console.error('Failed to check appointments:', result.error);
                return {
                    hasConflicts: false,
                    conflicts: [],
                    error: result.error
                };
            }
        } catch (error) {
            console.error('Error checking appointments:', error);
            return {
                hasConflicts: false,
                conflicts: [],
                error: error.message
            };
        }
    }
    
    // ============ NEW METHOD: Show conflict modal ============
    initConflictModal() {
        // Create conflict modal if it doesn't exist
        if (!document.getElementById('conflictModal')) {
            const modalHTML = `
                <div id="conflictModal" class="modal hidden">
                    <div class="modal-content" style="max-width: 600px;">
                        <div class="modal-header">
                            <h3><i class="fas fa-exclamation-triangle icon-warning"></i> Appointment Conflicts Found</h3>
                            <button class="modal-close" onclick="admin.modules.ui.closeModal('conflictModal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="conflict-alert">
                                <p id="conflictMessage">The following dates have existing appointments that would be blocked:</p>
                            </div>
                            
                            <div id="conflictsList" class="conflicts-list" style="max-height: 300px; overflow-y: auto; margin: 20px 0;"></div>
                            
                            <div class="conflict-actions" style="margin-top: 20px;">
                                <p><strong>Options:</strong></p>
                                <ol style="margin-left: 20px;">
                                    <li>Cancel or reschedule the conflicting appointments first</li>
                                    <li>Choose a different date/time range</li>
                                    <li>Block only the remaining available slots</li>
                                </ol>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="admin.modules.ui.closeModal('conflictModal')">
                                <i class="fas fa-times"></i> Cancel Block
                            </button>
                            <button class="btn btn-warning" id="viewAppointmentsBtn">
                                <i class="fas fa-calendar-alt"></i> View Appointments
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        this.conflictModal = document.getElementById('conflictModal');
    }
    
    showConflictModal(conflicts, blockData) {
        // Store block data for later use
        this.pendingBlockData = blockData;
        this.conflictData = conflicts;
        
        const conflictList = document.getElementById('conflictsList');
        if (conflictList) {
            conflictList.innerHTML = '';
            
            conflicts.forEach(conflict => {
                const conflictItem = document.createElement('div');
                conflictItem.className = 'conflict-item';
                conflictItem.style.padding = '10px';
                conflictItem.style.borderBottom = '1px solid #eee';
                conflictItem.style.marginBottom = '10px';
                
                let appointmentsHTML = '<div style="margin-left: 15px; margin-top: 5px;">';
                conflict.appointments.forEach(app => {
                    const time = app.time.substring(0, 5);
                    appointmentsHTML += `
                        <div class="appointment-info" style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 5px;">
                            <strong>${time}</strong> - ${app.firstname} ${app.familyname}<br>
                            <small>Phone: ${app.phone}</small>
                        </div>
                    `;
                });
                appointmentsHTML += '</div>';
                
                conflictItem.innerHTML = `
                    <div style="font-weight: bold; color: #dc3545;">
                        <i class="fas fa-calendar-times"></i> ${conflict.date}
                        <span style="font-size: 0.9em; color: #666; margin-left: 10px;">(${conflict.reason})</span>
                    </div>
                    <div style="font-size: 0.9em; color: #6c757d; margin-top: 5px;">
                        ${conflict.appointments.length} appointment(s) found
                    </div>
                    ${appointmentsHTML}
                `;
                
                conflictList.appendChild(conflictItem);
            });
        }
        
        const conflictMessage = document.getElementById('conflictMessage');
        if (conflictMessage) {
            const totalConflicts = conflicts.length;
            const totalAppointments = conflicts.reduce((sum, conflict) => sum + conflict.appointments.length, 0);
            conflictMessage.textContent = `Found ${totalConflicts} date(s) with ${totalAppointments} existing appointment(s) that would be blocked:`;
        }
        
        // Update view appointments button
        const viewBtn = document.getElementById('viewAppointmentsBtn');
        if (viewBtn) {
            const newViewBtn = viewBtn.cloneNode(true);
            viewBtn.parentNode.replaceChild(newViewBtn, viewBtn);
            newViewBtn.addEventListener('click', () => {
                this.admin.modules.ui.closeModal('conflictModal');
                this.showAppointmentsPageForConflicts(conflicts);
            });
        }
        
        // Show the modal
        this.admin.modules.ui.showModal('conflictModal');
    }
    
    showAppointmentsPageForConflicts(conflicts) {
        // Show appointments page
        this.admin.modules.ui.showPage('appointments');
        
        // Set active nav
        const appointmentsNav = document.querySelector('.nav-item[data-page="appointments"]');
        if (appointmentsNav) {
            this.admin.modules.ui.setActiveNav(appointmentsNav);
        }
        
        // Show a message about the conflicts
        const conflictDates = conflicts.map(c => c.date).join(', ');
        this.admin.modules.ui.showMessage('warning', 
            `Please review appointments on: ${conflictDates} before creating block.`, 
            8000
        );
        
        // Optionally, you could add filtering to show only conflicting dates
        // This would require modifications to appointments.js module
    }
    
    // ============ UPDATED METHOD: Create block slot with conflict checking ============
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
        
        // First check for appointment conflicts
        try {
            const submitBtn = document.querySelector('#addBlockForm button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking appointments...';
                submitBtn.disabled = true;
            }
            
            const conflictCheck = await this.checkForAppointmentConflicts(blockData);
            
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            }
            
            if (conflictCheck.hasConflicts) {
                // Show conflict modal instead of creating block
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                this.isSubmitting = false;
                
                this.showConflictModal(conflictCheck.conflicts, blockData);
                return;
            }
            
            // If no conflicts, proceed with creating the block
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
            
            const submitBtn = document.querySelector('#addBlockForm button[type="submit"]');
            if (submitBtn) {
                const originalText = submitBtn.getAttribute('data-original-text');
                if (originalText) {
                    submitBtn.innerHTML = originalText;
                }
                submitBtn.disabled = false;
            }
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