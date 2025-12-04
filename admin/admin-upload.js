// File Upload Module
class UploadManager {
    constructor(admin) {
        this.admin = admin;
        this.selectedFiles = [];
    }
    
    setupFileUpload() {
        const dropArea = document.getElementById('dropArea');
        const fileInput = document.getElementById('fileInput');
        const preview = document.getElementById('uploadPreview');
        const uploadForm = document.getElementById('uploadForm');
        
        if (!dropArea || !fileInput || !preview || !uploadForm) return;
        
        // Reset form
        this.selectedFiles = [];
        preview.innerHTML = '';
        
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
        
        // Upload form submission
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadPhotos();
        });
    }
    
    handleFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.admin.modules.ui.showMessage('error', 'Please select only image files (JPEG, PNG, GIF, WebP)');
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
    
    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updatePreview();
    }
    
    async uploadPhotos() {
        if (this.selectedFiles.length === 0) {
            this.admin.modules.ui.showMessage('error', 'Please select at least one photo to upload');
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
            this.admin.modules.ui.showMessage('success', `Successfully uploaded ${uploadedCount} photo(s)!`);
            this.admin.modules.photos.loadPhotos();
            this.admin.modules.dashboard.loadDashboard();
        } else {
            this.admin.modules.ui.showMessage('error', 'No photos were uploaded. Please try again.');
        }
    }
}