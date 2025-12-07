// ============ PHOTO GALLERY FUNCTIONALITY ============

// Load photos from API
function loadPhotos() {
    const gallery = document.getElementById('portfolioGallery');
    if (!gallery) return;
    
    gallery.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div><p>Loading portfolio...</p></div>';
    
    const url = '/api/admin/public/photos';
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                displayPhotos(data.photos);
            } else {
                throw new Error(data.error || 'Failed to load photos');
            }
        })
        .catch(error => {
            console.error('Error loading photos:', error);
            gallery.innerHTML = '<div class="error">Failed to load photos. Please try again later.<br>Error: ' + error.message + '</div>';
        });
}

// Display photos in gallery
function displayPhotos(photos) {
    const gallery = document.getElementById('portfolioGallery');
    if (!gallery) return;
    
    if (!photos || photos.length === 0) {
        gallery.innerHTML = '<div class="no-photos">No photos found. Check back soon!</div>';
        return;
    }
    
    gallery.innerHTML = '';
    
    // Set current photos for modal
    if (typeof window.setCurrentPhotos === 'function') {
        window.setCurrentPhotos(photos);
    }
    
    // Get filtered photos for display
    const filteredPhotos = photos.filter(photo => photo.is_active !== false);
    
    filteredPhotos.forEach((photo, index) => {
        const galleryItem = createGalleryItem(photo, index);
        gallery.appendChild(galleryItem);
    });
}

// Create a gallery item with uniform sizing
function createGalleryItem(photo, index) {
    const galleryItem = createElement('div', {
        className: 'gallery-item',
        'data-index': index
    });
    
    const imgContainer = createElement('div', { 
        className: 'image-container'
    });
    
    const img = createElement('img', {
        src: photo.filepath || '',
        alt: photo.caption || photo.filename || 'Designer Dress',
        loading: 'lazy',
        className: 'optimized'
    });
    
    // Set uniform styling - NO OPACITY ON IMAGE
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Low opacity background
    img.style.opacity = '1'; // FULL OPACITY
    img.style.borderRadius = '8px';
    img.style.transition = 'all 0.3s ease';
    
    // Add click handler
    galleryItem.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Gallery item clicked, index:', index);
        
        // Check if openModal function exists
        if (typeof window.openModal === 'function') {
            window.openModal(index);
        } else if (typeof openModal === 'function') {
            openModal(index);
        } else {
            console.error('openModal function not found!');
            // Fallback: open image in new tab
            window.open(photo.filepath, '_blank');
        }
    };
    
    imgContainer.appendChild(img);
    galleryItem.appendChild(imgContainer);
    
    // Add caption if exists
    if (photo.caption) {
        const caption = createElement('div', {
            className: 'caption',
            textContent: photo.caption
        });
        galleryItem.appendChild(caption);
    }
    
    return galleryItem;
}

// Initialize gallery
function initGallery() {
    // Load photos on page load
    loadPhotos();
    
    console.log('Gallery initialized - photos should load');
}

// Make function global for debugging
window.loadPhotos = loadPhotos;
window.initGallery = initGallery;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGallery);