// Blocked Slots Management Module
class BlockSlotManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async loadBlockedSlotsPage() {
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('blockDate').value = today;
        
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        
        // Bind events
        this.bindBlockFormEvents();
        
        // Load blocked slots
        this.loadBlockedSlotsTable();
    }
    
    bindBlockFormEvents() {
        // Block type selection
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
        
        // All day checkbox
        const allDayCheck = document.getElementById('allDayBlock');
        if (allDayCheck) {
            allDayCheck.addEventListener('change', (e) => {
                document.getElementById('timeBlockFields').style.display = 
                    e.target.checked ? 'none' : 'block';
            });
        }
        
        // Block form submission
        const blockForm = document.getElementById('addBlockForm');
        if (blockForm) {
            blockForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createBlockSlot();
            });
        }
    }
    
    showBlockTypeFields(type) {
        // Hide all fields
        document.getElementById('rangeFields').style.display = 'none';
        document.getElementById('weeklyFields').style.display = 'none';
        
        // Show relevant fields
        if (type === 'range') {
            document.getElementById('rangeFields').style.display = 'block';
        } else if (type === 'weekly') {
            document.getElementById('weeklyFields').style.display = 'block';
        }
    }
    
    showBlockForm() {
        document.getElementById('blockFormContainer').style.display = 'block';
    }
    
    hideBlockForm() {
        document.getElementById('blockFormContainer').style.display = 'none';
        document.getElementById('addBlockForm').reset();
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
                    <td>${slot.end_date ? new Date(slot.end_date).toLocaleDateString() : 'Single Day'}</td>
                    <td>${timeInfo}</td>
                    <td>${slot.reason || 'No reason'}</td>
                    <td>${slot.block_type || 'single'}</td>
                    <td>
                        <button class="btn-delete-sm" onclick="admin.modules.blockslots.deleteBlockedSlotFromTable(${slot.id})">
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
        const blockType = document.querySelector('.block-type-btn.active').dataset.type;
        const date = document.getElementById('blockDate').value;
        const allDay = document.getElementById('allDayBlock').checked;
        const startTime = document.getElementById('blockStartTime').value;
        const endTime = document.getElementById('blockEndTime').value;
        const reason = document.getElementById('blockReason').value;
        const endDate = document.getElementById('endDate').value;
        
        // Validate
        if (!date) {
            this.admin.modules.ui.showMessage('error', 'Please select a date');
            return;
        }
        
        // Prepare data
        const blockData = {
            date: date,
            all_day: allDay,
            reason: reason,
            block_type: blockType
        };
        
        if (!allDay) {
            blockData.start_time = startTime + ':00';
            blockData.end_time = endTime + ':00';
        }
        
        if (blockType === 'range' && endDate) {
            blockData.end_date = endDate;
        }
        
        if (blockType === 'weekly') {
            const days = [];
            document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
                days.push(parseInt(cb.value));
            });
            
            if (days.length === 0) {
                this.admin.modules.ui.showMessage('error', 'Please select at least one day for weekly recurring block');
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
            const response = await fetch(`${this.admin.apiBase}/blocked-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.admin.modules.ui.showMessage('success', result.message);
                this.hideBlockForm();
                this.loadBlockedSlotsTable();
                this.admin.modules.dashboard.loadDashboard();
            } else {
                this.admin.modules.ui.showMessage('error', 'Error: ' + (result.error || 'Failed to create block'));
            }
        } catch (error) {
            console.error('Error creating block:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to create block');
        }
    }
    
    async deleteBlockedSlot(id) {
        if (!confirm('Are you sure you want to delete this blocked slot?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.admin.apiBase}/blocked-slots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.admin.modules.ui.showMessage('success', 'Blocked slot deleted successfully!');
                this.admin.modules.dashboard.loadDashboard();
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to delete blocked slot: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to delete blocked slot:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to delete blocked slot');
        }
    }
    
    async deleteBlockedSlotFromTable(id) {
        if (!confirm('Are you sure you want to delete this blocked slot?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.admin.apiBase}/blocked-slots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.admin.modules.ui.showMessage('success', 'Blocked slot deleted successfully!');
                this.loadBlockedSlotsTable();
                this.admin.modules.dashboard.loadDashboard();
            } else {
                this.admin.modules.ui.showMessage('error', 'Failed to delete blocked slot');
            }
        } catch (error) {
            console.error('Failed to delete blocked slot:', error);
            this.admin.modules.ui.showMessage('error', 'Failed to delete blocked slot');
        }
    }
}