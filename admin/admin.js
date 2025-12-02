// Simple Admin Panel - No Login Required
class SimpleAdmin {
    constructor() {
        this.apiBase = '/api/admin';
        this.selectedFiles = [];
        console.log('Admin Panel Initialized');
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadDashboard();
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
        
        // Upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadPhotos();
            });
        }
        
        // File upload
        this.setupFileUpload();
        
        // Edit photo form
        const editForm = document.getElementById('editPhotoForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePhotoChanges();
            });
        }
        
        // Filter changes
        const photoFilter = document.getElementById('photoCategoryFilter');
        if (photoFilter) {
            photoFilter.addEventListener('change', () => this.loadPhotos());
        }
    }
    
    navigateTo(page) {
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
                'backup': 'Backup'
            };
            pageTitle.textContent = titles[page] || page;
        }
        
        // Load page data
        switch(page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'photos':
                this.loadPhotos();
                break;
            case 'appointments':
                this.loadAppointments();
                break;
            case 'blockedSlots':
                this.loadBlockedSlotsPage();
                break;
            case 'backup':
                this.loadBackupInfo();
                break;
        }
    }
    
    showUploadPage() {
        this.navigateTo('upload');
    }
    
    // ============ DASHBOARD ============
    async loadDashboard() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Update stats
                    document.getElementById('todayAppointments').textContent = 
                        data.stats.appointmentsToday;
                    document.getElementById('totalAppointments').textContent = 
                        data.stats.totalAppointments;
                    document.getElementById('totalPhotos').textContent = 
                        data.stats.totalPhotos;
                    
                    // Update recent appointments
                    this.updateRecentAppointments(data.stats.recentAppointments);
                }
            }
            
            // Load blocked slots count
            const blockedResponse = await fetch(`${this.apiBase}/blocked-slots`);
            if (blockedResponse.ok) {
                const blockedData = await blockedResponse.json();
                if (blockedData.success) {
                    document.getElementById('totalBlocked').textContent = 
                        blockedData.blockedSlots.length;
                    document.getElementById('dbBlocked').textContent = 
                        blockedData.blockedSlots.length;
                    
                    // Update recent blocked slots table
                    this.updateRecentBlockedSlots(blockedData.blockedSlots);
                }
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
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
                    <button class="btn-delete-sm" onclick="admin.deleteAppointment(${apt.id})">
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
        
        // Show only recent 5 blocked slots
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
                <td>${new Date(slot.date).toLocaleDateString()}</td>
                <td>${timeInfo}</td>
                <td>${slot.reason || 'No reason'}</td>
                <td>
                    <button class="btn-delete-sm" onclick="admin.deleteBlockedSlot(${slot.id})">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    async deleteBlockedSlot(id) {
        if (!confirm('Are you sure you want to delete this blocked slot?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/blocked-slots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert('Blocked slot deleted successfully!');
                this.loadDashboard(); // Refresh stats
            } else {
                alert('Failed to delete blocked slot: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Failed to delete blocked slot:', error);
            alert('Failed to delete blocked slot');
        }
    }
    
    // ============ PHOTOS ============
    async loadPhotos() {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        grid.innerHTML = '<div class="loading-spinner"></div>';
        
        try {
            const category = document.getElementById('photoCategoryFilter').value;
            let url = `${this.apiBase}/photos`;
            if (category) {
                url += `?category=${category}`;
            }
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayPhotos(data.photos);
                }
            }
        } catch (error) {
            console.error('Failed to load photos:', error);
            grid.innerHTML = '<p>Error loading photos</p>';
        }
    }
    
    displayPhotos(photos) {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        if (photos.length === 0) {
            grid.innerHTML = '<p>No photos found. Upload some photos!</p>';
            return;
        }
        
        grid.innerHTML = '';
        
        photos.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${photo.filepath}" alt="${photo.caption || 'Photo'}" loading="lazy">
                <div class="photo-info">
                    <h4>${photo.caption || photo.original_name || photo.filename}</h4>
                    <p>Category: ${photo.category}</p>
                    <div class="photo-actions">
                        <button class="btn-primary" onclick="admin.editPhoto(${photo.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-sm" onclick="admin.deletePhoto(${photo.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
    
    async editPhoto(id) {
        try {
            const response = await fetch(`${this.apiBase}/photos`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const photo = data.photos.find(p => p.id === id);
                    if (photo) {
                        document.getElementById('editPhotoId').value = photo.id;
                        document.getElementById('editCaption').value = photo.caption || '';
                        document.getElementById('editCategory').value = photo.category;
                        document.getElementById('editDisplayOrder').value = photo.display_order || 0;
                        document.getElementById('editIsActive').checked = photo.is_active;
                        
                        document.getElementById('photoModal').style.display = 'flex';
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            alert('Failed to load photo details');
        }
    }
    
    async savePhotoChanges() {
        const id = document.getElementById('editPhotoId').value;
        const caption = document.getElementById('editCaption').value;
        const category = document.getElementById('editCategory').value;
        const displayOrder = document.getElementById('editDisplayOrder').value;
        const isActive = document.getElementById('editIsActive').checked;
        
        try {
            const response = await fetch(`${this.apiBase}/photos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caption,
                    category,
                    display_order: parseInt(displayOrder),
                    is_active: isActive
                })
            });
            
            if (response.ok) {
                alert('Photo updated successfully!');
                this.closeModal();
                this.loadPhotos();
            } else {
                alert('Failed to update photo');
            }
        } catch (error) {
            console.error('Failed to update photo:', error);
            alert('Failed to update photo');
        }
    }
    
    async deletePhoto(id) {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/photos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Photo deleted successfully!');
                this.loadPhotos();
                this.loadDashboard(); // Refresh stats
            } else {
                alert('Failed to delete photo');
            }
        } catch (error) {
            console.error('Failed to delete photo:', error);
            alert('Failed to delete photo');
        }
    }
    
    // ============ APPOINTMENTS ============
    async loadAppointments() {
        try {
            const date = document.getElementById('appointmentDateFilter').value;
            let url = `${this.apiBase}/appointments`;
            if (date) {
                url += `?date=${date}`;
            }
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayAppointments(data.appointments);
                }
            }
        } catch (error) {
            console.error('Failed to load appointments:', error);
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
                    <button class="btn-delete-sm" onclick="admin.deleteAppointment(${apt.id})">
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
            const response = await fetch(`${this.apiBase}/appointments/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('Appointment deleted successfully!');
                this.loadAppointments();
                this.loadDashboard(); // Refresh stats
            } else {
                alert('Failed to delete appointment');
            }
        } catch (error) {
            console.error('Failed to delete appointment:', error);
            alert('Failed to delete appointment');
        }
    }
    
    // ============ BLOCKED SLOTS ============
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
            const response = await fetch(`${this.apiBase}/blocked-slots`);
            const data = await response.json();
            
            const tbody = document.querySelector('#blockedSlotsTable tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!data.success || data.blockedSlots.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center;">
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
                    <td>${new Date(slot.date).toLocaleDateString()}</td>
                    <td>${timeInfo}</td>
                    <td>${slot.reason || 'No reason'}</td>
                    <td>${slot.block_type || 'single'}</td>
                    <td>
                        <button class="btn-delete-sm" onclick="admin.deleteBlockedSlotFromTable(${slot.id})">
                            Delete
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading blocked slots:', error);
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
            alert('Please select a date');
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
                alert('Please select at least one day for weekly recurring block');
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
            const response = await fetch(`${this.apiBase}/blocked-slots`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blockData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                alert(result.message);
                this.hideBlockForm();
                this.loadBlockedSlotsTable();
                this.loadDashboard(); // Refresh stats
            } else {
                alert('Error: ' + (result.error || 'Failed to create block'));
            }
        } catch (error) {
            console.error('Error creating block:', error);
            alert('Failed to create block');
        }
    }
    
    async deleteBlockedSlotFromTable(id) {
        if (!confirm('Are you sure you want to delete this blocked slot?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/blocked-slots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert('Blocked slot deleted successfully!');
                this.loadBlockedSlotsTable();
                this.loadDashboard(); // Refresh stats
            } else {
                alert('Failed to delete blocked slot');
            }
        } catch (error) {
            console.error('Failed to delete blocked slot:', error);
            alert('Failed to delete blocked slot');
        }
    }
    
    // ============ FILE UPLOAD ============
    setupFileUpload() {
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('uploadPreview');
        
        if (!dropArea || !fileInput || !preview) return;
        
        // Click to select files
        dropArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#4299e1';
            dropArea.style.background = '#f7fafc';
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.borderColor = '#cbd5e0';
            dropArea.style.background = 'white';
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#cbd5e0';
            dropArea.style.background = 'white';
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
    }
    
    handleFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select only image files (JPEG, PNG, GIF, WebP)');
            return;
        }
        
        this.selectedFiles = [...this.selectedFiles, ...imageFiles];
        this.updatePreview();
    }
    
    updatePreview() {
        const preview = document.getElementById('uploadPreview');
        if (!preview) return;
        
        preview.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.style.position = 'relative';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;" onclick="admin.removeFile(${index})">&times;</button>
                `;
                preview.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
    }
    
    async uploadPhotos() {
        if (this.selectedFiles.length === 0) {
            alert('Please select at least one photo to upload');
            return;
        }
        
        const caption = document.getElementById('photoCaption').value;
        const category = document.getElementById('photoCategory').value;
        const uploadBtn = document.getElementById('uploadBtn');
        
        // Show loading
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        uploadBtn.disabled = true;
        
        let uploadedCount = 0;
        const totalCount = this.selectedFiles.length;
        
        for (const file of this.selectedFiles) {
            const formData = new FormData();
            formData.append('photo', file);
            formData.append('caption', caption);
            formData.append('category', category);
            
            try {
                const response = await fetch(`${this.apiBase}/photos`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    uploadedCount++;
                } else {
                    console.error('Upload failed for:', file.name);
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }
        
        // Reset
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
        this.selectedFiles = [];
        document.getElementById('uploadPreview').innerHTML = '';
        document.getElementById('uploadForm').reset();
        
        if (uploadedCount > 0) {
            alert(`Successfully uploaded ${uploadedCount} photo(s)!`);
            this.loadPhotos();
            this.loadDashboard();
        } else {
            alert('No photos were uploaded. Please try again.');
        }
    }
    
    // ============ BACKUP ============
    async backupDatabase() {
        try {
            const response = await fetch(`${this.apiBase}/backup`);
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
            }
        } catch (error) {
            console.error('Backup failed:', error);
            alert('Failed to create backup');
        }
    }
    
    async exportAppointments() {
        try {
            const response = await fetch(`${this.apiBase}/appointments?limit=1000`);
            if (response.ok) {
                const data = await response.json();
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
                }
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export appointments');
        }
    }
    
    async exportAppointmentsCSV() {
        try {
            const response = await fetch(`${this.apiBase}/export/appointments`);
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
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export appointments');
        }
    }
    
    async loadBackupInfo() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    document.getElementById('dbAppointments').textContent = 
                        data.stats.totalAppointments;
                    document.getElementById('dbPhotos').textContent = 
                        data.stats.totalPhotos;
                }
            }
            
            // Load blocked slots count
            const blockedResponse = await fetch(`${this.apiBase}/blocked-slots`);
            if (blockedResponse.ok) {
                const blockedData = await blockedResponse.json();
                if (blockedData.success) {
                    document.getElementById('dbBlocked').textContent = 
                        blockedData.blockedSlots.length;
                }
            }
        } catch (error) {
            console.error('Failed to load backup info:', error);
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
    
    closeModal() {
        document.getElementById('photoModal').style.display = 'none';
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new SimpleAdmin();
});