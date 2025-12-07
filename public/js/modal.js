// ============ MODAL FUNCTIONALITY ============

// Define global functions immediately
window.openModal = openModal;
window.closeModal = closeModal;
window.prevImage = prevImage;
window.nextImage = nextImage;
window.goToImage = goToImage;
window.setCurrentPhotos = setCurrentPhotos;

let currentPhotos = [];
let currentIndex = 0;

// Set current photos (called from gallery.js)
function setCurrentPhotos(photos) {
    currentPhotos = photos.filter(photo => photo.is_active !== false);
    console.log('Current photos set:', currentPhotos.length);
}

// Open modal with specific image
function openModal(index) {
    console.log('openModal called with index:', index);
    
    if (!currentPhotos || currentPhotos.length === 0) {
        console.error('No photos loaded');
        return;
    }
    
    if (index < 0 || index >= currentPhotos.length) {
        console.error('Invalid index:', index);
        return;
    }
    
    currentIndex = index;
    const photo = currentPhotos[currentIndex];
    
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    const modalDots = document.getElementById('modalDots');
    
    if (!modal || !modalImage || !modalCaption) {
        console.error('Modal elements not found');
        return;
    }
    
    // Reset and prepare modal
    modal.style.display = 'flex';
    modal.classList.remove('open');
    
    // Clear any previous styles
    modalImage.style.cssText = '';
    
    // Set image
    modalImage.style.opacity = '0'; // Start at 0 for fade in
    modalImage.src = photo.filepath || '';
    modalImage.alt = photo.caption || 'Designer Dress';
    
    // Set fixed 1080x1350 dimensions - NO OPACITY ON IMAGE
    setTimeout(() => {
        modalImage.style.width = '1080px';
        modalImage.style.height = '1350px';
        modalImage.style.maxWidth = '80vw';
        modalImage.style.maxHeight = '80vh';
        modalImage.style.objectFit = 'contain';
        modalImage.style.background = 'rgba(255, 255, 255, 0.95)'; // Solid white background
        modalImage.style.display = 'block';
        modalImage.style.margin = '0 auto';
        modalImage.style.border = '20px solid rgba(255, 255, 255, 0.3)'; // Low opacity border
        modalImage.style.borderRadius = '15px';
        modalImage.style.boxShadow = '0 30px 80px rgba(0, 0, 0, 0.4)';
    }, 10);
    
    // Set caption
    if (photo.caption && photo.caption.trim() !== '') {
        modalCaption.textContent = photo.caption;
        modalCaption.style.display = 'block';
    } else {
        modalCaption.style.display = 'none';
    }
    
    // Create navigation dots
    if (modalDots) {
        modalDots.innerHTML = '';
        for (let i = 0; i < currentPhotos.length; i++) {
            const dot = createElement('button', {
                className: `modal-dot ${i === currentIndex ? 'active' : ''}`,
                onclick: (e) => {
                    e.stopPropagation();
                    goToImage(i);
                }
            });
            modalDots.appendChild(dot);
        }
    }
    
    // Force reflow and show modal
    void modal.offsetWidth;
    modal.classList.add('open');
    
    // Fade in image to FULL OPACITY
    setTimeout(() => {
        modalImage.style.opacity = '1';
    }, 50);
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyboardNav);
    document.body.style.overflow = 'hidden';
    
    // Handle image load
    modalImage.onload = function() {
        // Maintain 1080x1350 dimensions
        this.style.width = '1080px';
        this.style.height = '1350px';
        this.style.background = 'rgba(255, 255, 255, 0.95)'; // Solid white
    };
    
    // Handle image load error
    modalImage.onerror = function() {
        // Create a placeholder with solid white background
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="rgba(255,255,255,0.95)"/><text x="540" y="675" text-anchor="middle" font-family="Arial" font-size="48" fill="rgba(0,0,0,0.5)">Image not available</text></svg>';
        this.style.opacity = '1';
    };
}

// Go to specific image
function goToImage(index) {
    if (index < 0 || index >= currentPhotos.length) return;
    
    currentIndex = index;
    const photo = currentPhotos[currentIndex];
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.getElementById('modalCaption');
    
    if (!modalImage || !modalCaption) return;
    
    // Fade out current image
    modalImage.style.opacity = '0';
    
    setTimeout(() => {
        modalImage.src = photo.filepath || '';
        modalImage.alt = photo.caption || 'Designer Dress';
        
        // Set caption
        if (photo.caption && photo.caption.trim() !== '') {
            modalCaption.textContent = photo.caption;
            modalCaption.style.display = 'block';
        } else {
            modalCaption.style.display = 'none';
        }
        
        // Fade in new image to FULL OPACITY
        setTimeout(() => {
            modalImage.style.opacity = '1';
        }, 50);
        
        updateActiveDot();
    }, 200);
}

// Update active dot
function updateActiveDot() {
    const dots = document.querySelectorAll('.modal-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    
    modal.classList.remove('open');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.removeEventListener('keydown', handleKeyboardNav);
        document.body.style.overflow = 'auto';
    }, 400);
}

// Keyboard navigation
function handleKeyboardNav(e) {
    switch(e.key) {
        case 'Escape':
            closeModal();
            break;
        case 'ArrowLeft':
            prevImage();
            break;
        case 'ArrowRight':
            nextImage();
            break;
        case ' ':
            e.preventDefault();
            nextImage();
            break;
    }
}

// Navigation functions
function prevImage() {
    if (currentPhotos.length <= 1) return;
    const newIndex = (currentIndex - 1 + currentPhotos.length) % currentPhotos.length;
    goToImage(newIndex);
}

function nextImage() {
    if (currentPhotos.length <= 1) return;
    const newIndex = (currentIndex + 1) % currentPhotos.length;
    goToImage(newIndex);
}

// Initialize modal
function initModal() {
    console.log('Modal initialized');
    
    // Setup modal backdrop click
    const modal = document.getElementById('modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this || e.target.classList.contains('modal-image-container')) {
                closeModal();
            }
        });
    }
    
    // Setup close button
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    
    // Setup navigation buttons
    const prevBtn = document.querySelector('.modal-prev');
    const nextBtn = document.querySelector('.modal-next');
    
    if (prevBtn) prevBtn.onclick = prevImage;
    if (nextBtn) nextBtn.onclick = nextImage;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initModal);