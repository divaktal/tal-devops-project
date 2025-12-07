// Photo Management Module
class PhotoManager {
    constructor(admin) {
        this.admin = admin;
    }
    
    async loadPhotos() {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        grid.innerHTML = '<div class="loading-spinner"></div>';
        
        try {
            const category = document.getElementById('photoCategoryFilter').value;
            let url = `${this.admin.apiBase}/photos`;
            if (category) {
                url += `?category=${category}`;
            }
            
            const data = await this.admin.fetchData(url);
            if (data.success) {
                this.displayPhotos(data.photos);
            }
        } catch (error) {
            console.error('Failed to load photos:', error);
            grid.innerHTML = '<p>Error loading photos</p>';
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to load photos');
            } else {
                alert('Failed to load photos');
            }
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
            console.log('Photo data:', photo); // DEBUG LINE
            
            const card = document.createElement('div');
            card.className = 'photo-card';
            
            // TEST if image loads
            const img = new Image();
            img.onload = function() {
                console.log('Image loaded successfully:', photo.filepath);
            };
            img.onerror = function() {
                console.error('Failed to load image:', photo.filepath);
            };
            img.src = photo.filepath;
            
            card.innerHTML = `
                <img src="${photo.filepath}" alt="${photo.caption || 'Photo'}" loading="lazy"
                     onerror="console.error('Image failed to load:', this.src)">
                <div class="photo-info">
                    <h4>${photo.caption || photo.original_name || photo.filename}</h4>
                    <p>Category: ${photo.category}</p>
                    <p>Path: ${photo.filepath}</p> <!-- DEBUG LINE -->
                    <div class="photo-actions">
                        <button class="btn-primary" onclick="admin.modules.photos.editPhoto(${photo.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete-sm" onclick="admin.modules.photos.confirmDeletePhoto(${photo.id})">
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
            const data = await this.admin.fetchData(`${this.admin.apiBase}/photos`);
            if (data.success) {
                const photo = data.photos.find(p => p.id === id);
                if (photo) {
                    document.getElementById('editPhotoId').value = photo.id;
                    document.getElementById('editCaption').value = photo.caption || '';
                    document.getElementById('editCategory').value = photo.category;
                    document.getElementById('editDisplayOrder').value = photo.display_order || 0;
                    document.getElementById('editIsActive').checked = photo.is_active;
                    
                    this.admin.modules.ui.showModal('photoModal');
                }
            }
        } catch (error) {
            console.error('Failed to load photo:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to load photo details');
            } else {
                alert('Failed to load photo details');
            }
        }
    }
    
    async savePhotoChanges() {
        const id = document.getElementById('editPhotoId').value;
        const caption = document.getElementById('editCaption').value;
        const category = document.getElementById('editCategory').value;
        const displayOrder = document.getElementById('editDisplayOrder').value;
        const isActive = document.getElementById('editIsActive').checked;
        
        try {
            const response = await fetch(`${this.admin.apiBase}/photos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caption,
                    category,
                    display_order: parseInt(displayOrder),
                    is_active: isActive
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (this.admin.modules.ui && this.admin.modules.ui.showSuccess) {
                    this.admin.modules.ui.showSuccess('Photo updated successfully!');
                } else {
                    alert('Photo updated successfully!');
                }
                this.admin.modules.ui.closeModal('photoModal');
                this.loadPhotos();
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                    this.admin.modules.ui.showError(data.error || 'Failed to update photo');
                } else {
                    alert(data.error || 'Failed to update photo');
                }
            }
        } catch (error) {
            console.error('Failed to update photo:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to update photo');
            } else {
                alert('Failed to update photo');
            }
        }
    }
    
    async confirmDeletePhoto(id) {
        const confirmed = await this.admin.modules.ui.confirm(
            'Are you sure you want to delete this photo?',
            () => this.deletePhoto(id),
            'danger',
            {
                details: 'This action cannot be undone.'
            }
        );
        
        return confirmed;
    }
    
    async deletePhoto(id) {
        try {
            const response = await fetch(`${this.admin.apiBase}/photos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                if (this.admin.modules.ui && this.admin.modules.ui.showSuccess) {
                    this.admin.modules.ui.showSuccess('Photo deleted successfully!');
                } else {
                    alert('Photo deleted successfully!');
                }
                this.loadPhotos();
                if (this.admin.modules.dashboard && this.admin.modules.dashboard.loadDashboard) {
                    this.admin.modules.dashboard.loadDashboard();
                }
            } else {
                if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                    this.admin.modules.ui.showError('Failed to delete photo');
                } else {
                    alert('Failed to delete photo');
                }
            }
        } catch (error) {
            console.error('Failed to delete photo:', error);
            if (this.admin.modules.ui && this.admin.modules.ui.showError) {
                this.admin.modules.ui.showError('Failed to delete photo');
            } else {
                alert('Failed to delete photo');
            }
        }
    }
    
    showUploadPage() {
        this.admin.navigateTo('upload');
    }
}