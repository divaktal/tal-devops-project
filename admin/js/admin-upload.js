// File Upload Module
class UploadManager {
    constructor(admin) {
        this.admin = admin;
        this.selectedFiles = [];
        this.uploadFormListener = null; // Track the listener
    }
    
    setupFileUpload() {
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('uploadPreview');
        const uploadForm = document.getElementById('uploadForm');
        
        if (!dropArea || !fileInput || !preview || !uploadForm) return;
        
        // Reset form and files
        this.selectedFiles = [];
        preview.innerHTML = '';
        
        // remove old form listeners  
        dropArea.replaceWith(dropArea.cloneNode(true));
        fileInput.replaceWith(fileInput.cloneNode(true));
        
        const newDropArea = document.getElementById('dropArea');
        const newFileInput = document.getElementById('fileInput');
        const newUploadForm = document.getElementById('uploadForm');
        
        // Click to select files
        newDropArea.addEventListener('click', () => {
            newFileInput.click();
        });
        
        // Drag and drop
        newDropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newDropArea.style.borderColor = '#4299e1';
            newDropArea.style.background = '#f7fafc';
        });
        
        newDropArea.addEventListener('dragleave', () => {
            newDropArea.style.borderColor = '#cbd5e0';
            newDropArea.style.background = 'white';
        });
        
        newDropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newDropArea.style.borderColor = '#cbd5e0';
            newDropArea.style.background = 'white';
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
        
        // File input change
        newFileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
        
        // REMOVE OLD FORM LISTENER IF EXISTS
        if (this.uploadFormListener) {
            newUploadForm.removeEventListener('submit', this.uploadFormListener);
        }
        
        // Add new form listener
        this.uploadFormListener = (e) => {
            e.preventDefault();
            this.uploadPhotos();
        };
        newUploadForm.addEventListener('submit', this.uploadFormListener);
    }
    
    handleFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            // Use showError instead of showMessage
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Please select only image files (JPEG, PNG, GIF, WebP)');
            } else {
                alert('Please select only image files (JPEG, PNG, GIF, WebP)');
            }
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
                    <button style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;" onclick="admin.modules.upload.removeFile(${index})">&times;</button>
                `;
                preview.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
    }

    validateImageQuality(file) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() {
                const isHighQuality = this.naturalWidth >= 800 && this.naturalHeight >= 600;
                resolve({
                    file,
                    width: this.naturalWidth,
                    height: this.naturalHeight,
                    isHighQuality
                });
            };
            img.onerror = () => resolve({ file, isHighQuality: false });
            img.src = URL.createObjectURL(file);
        });
    }
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
    }
    
    async uploadPhotos() {
        if (this.selectedFiles.length === 0) {
            // Use showError instead of showMessage
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Please select at least one photo to upload');
            } else {
                alert('Please select at least one photo to upload');
            }
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
                const response = await fetch(`${this.admin.apiBase}/photos`, {
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
            // Use showSuccess instead of showMessage
            if (this.admin.modules.ui && this.admin.modules.ui.showSuccess) {
                this.admin.modules.ui.showSuccess(`Successfully uploaded ${uploadedCount} photo(s)!`);
            } else {
                alert(`Successfully uploaded ${uploadedCount} photo(s)!`);
            }
            
            // Load photos and refresh dashboard
            if (this.admin.modules.photos && this.admin.modules.photos.loadPhotos) {
                this.admin.modules.photos.loadPhotos();
            }
            
            if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                this.admin.modules.dashboard.loadDashboard();
            }
            
            // REDIRECT TO PHOTOS PAGE
            setTimeout(() => {
                if (this.admin.modules.ui && this.admin.modules.ui.showPage) {
                    this.admin.modules.ui.showPage('photos');
                }
            }, 1);
            
        } else {
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('No photos were uploaded. Please try again.');
            } else {
                alert('No photos were uploaded. Please try again.');
            }
        }
    }
}