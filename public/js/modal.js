// ============ MODAL FUNCTIONALITY WITH TINDER SWIPE ============

let currentPhotos = [];
let currentIndex = 0;
let startX = 0;
let startY = 0;
let isDragging = false;
let dragOffset = 0;
let rotation = 0;

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
    
    const modal = document.getElementById('photoModal');
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
    
    // Clear any previous styles and animations
    modalImage.style.cssText = '';
    modalImage.classList.remove('swipe-left', 'swipe-right', 'swipe-up');
    modalImage.style.transform = 'translateX(0) rotate(0deg)';
    
    // Set image
    modalImage.style.opacity = '0';
    modalImage.src = photo.filepath || '';
    modalImage.alt = photo.caption || 'Designer Dress';
    
    // Reset drag state
    resetDrag();
    
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
            const dot = document.createElement('button');
            dot.className = `modal-dot ${i === currentIndex ? 'active' : ''}`;
            dot.onclick = (e) => {
                e.stopPropagation();
                goToImage(i);
            };
            modalDots.appendChild(dot);
        }
    }
    
    // Force reflow and show modal
    void modal.offsetWidth;
    modal.classList.add('open');
    
    // Fade in image
    setTimeout(() => {
        modalImage.style.opacity = '1';
    }, 50);
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyboardNav);
    document.body.style.overflow = 'hidden';
    
    // Handle image load
    modalImage.onload = function() {
        this.style.opacity = '1';
    };
    
    // Handle image load error
    modalImage.onerror = function() {
        this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect width="400" height="500" fill="#1a1a1a"/><text x="200" y="250" text-anchor="middle" font-family="Arial" font-size="24" fill="#666">Image not available</text></svg>';
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
    
    // Reset image position before transition
    modalImage.style.transform = 'translateX(0) rotate(0deg)';
    modalImage.classList.remove('swipe-left', 'swipe-right', 'swipe-up');
    
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
        
        // Fade in new image
        setTimeout(() => {
            modalImage.style.opacity = '1';
            resetDrag();
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
    const modal = document.getElementById('photoModal');
    if (!modal) return;
    
    modal.classList.remove('open');
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.removeEventListener('keydown', handleKeyboardNav);
        document.body.style.overflow = 'auto';
        resetDrag();
    }, 400);
}

// Keyboard navigation
function handleKeyboardNav(e) {
    switch(e.key) {
        case 'Escape':
            closeModal();
            break;
        case 'ArrowLeft':
            swipeImage('left');
            break;
        case 'ArrowRight':
            swipeImage('right');
            break;
        case 'ArrowUp':
            swipeImage('up');
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

// Swipe image with animation
function swipeImage(direction) {
    const modalImage = document.getElementById('modalImage');
    if (!modalImage) return;
    
    // Remove any existing swipe classes
    modalImage.classList.remove('swipe-left', 'swipe-right', 'swipe-up');
    
    // Trigger reflow
    void modalImage.offsetWidth;
    
    // Add swipe class based on direction
    if (direction === 'left') {
        modalImage.classList.add('swipe-left');
        setTimeout(() => nextImage(), 300);
    } else if (direction === 'right') {
        modalImage.classList.add('swipe-right');
        setTimeout(() => prevImage(), 300);
    } else if (direction === 'up') {
        modalImage.classList.add('swipe-up');
        setTimeout(() => closeModal(), 300);
    }
}

// ============ DRAG AND SWIPE FUNCTIONALITY ============

function startDrag(e) {
    const modalImage = document.getElementById('modalImage');
    if (!modalImage) return;
    
    isDragging = true;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    dragOffset = 0;
    rotation = 0;
    
    // Add active class to overlay
    const overlay = document.querySelector('.drag-overlay');
    if (overlay) overlay.classList.add('active');
    
    // Show swipe indicators
    updateSwipeIndicators(0);
    
    // Prevent default behavior for touch events
    if (e.type.includes('touch')) {
        e.preventDefault();
    }
}

function dragImage(e) {
    if (!isDragging) return;
    
    const modalImage = document.getElementById('modalImage');
    if (!modalImage) return;
    
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    dragOffset = currentX - startX;
    const verticalOffset = currentY - startY;
    
    // Calculate rotation based on drag offset (max 30 degrees)
    rotation = (dragOffset / 15);
    if (rotation > 30) rotation = 30;
    if (rotation < -30) rotation = -30;
    
    // Apply transform
    modalImage.style.transform = `translateX(${dragOffset}px) rotate(${rotation}deg)`;
    
    // Update swipe indicators
    updateSwipeIndicators(dragOffset);
    
    // Add resistance effect for vertical drag (to close)
    if (Math.abs(verticalOffset) > 50) {
        const scale = Math.max(0.8, 1 - Math.abs(verticalOffset) / 500);
        modalImage.style.transform += ` scale(${scale})`;
        
        // Show up indicator for close
        const upIndicator = document.querySelector('.swipe-indicator-up');
        if (upIndicator) {
            upIndicator.style.opacity = Math.min(0.7, Math.abs(verticalOffset) / 100);
        }
    }
}

function endDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    const modalImage = document.getElementById('modalImage');
    if (!modalImage) return;
    
    // Remove active class from overlay
    const overlay = document.querySelector('.drag-overlay');
    if (overlay) overlay.classList.remove('active');
    
    // Hide all swipe indicators
    hideSwipeIndicators();
    
    // Check if drag is significant enough to trigger action
    if (Math.abs(dragOffset) > 100) {
        // Swipe right (previous) or left (next)
        if (dragOffset > 0) {
            swipeImage('right'); // Swipe right = previous
        } else {
            swipeImage('left'); // Swipe left = next
        }
    } else {
        // Return to center with smooth animation
        modalImage.style.transition = 'transform 0.3s ease';
        modalImage.style.transform = 'translateX(0) rotate(0deg)';
        
        setTimeout(() => {
            modalImage.style.transition = '';
        }, 300);
    }
    
    // Reset drag variables
    dragOffset = 0;
    rotation = 0;
}

function resetDrag() {
    isDragging = false;
    startX = 0;
    startY = 0;
    dragOffset = 0;
    rotation = 0;
    
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.style.transform = 'translateX(0) rotate(0deg)';
        modalImage.style.transition = '';
    }
    
    // Hide swipe indicators
    hideSwipeIndicators();
    
    // Remove active class from overlay
    const overlay = document.querySelector('.drag-overlay');
    if (overlay) overlay.classList.remove('active');
}

function updateSwipeIndicators(offset) {
    const leftIndicator = document.querySelector('.swipe-indicator-left');
    const rightIndicator = document.querySelector('.swipe-indicator-right');
    
    if (offset > 50) {
        // Swiping right - show left indicator (for previous)
        if (leftIndicator) {
            leftIndicator.classList.add('show');
            leftIndicator.style.opacity = Math.min(0.7, offset / 200);
        }
        if (rightIndicator) rightIndicator.classList.remove('show');
    } else if (offset < -50) {
        // Swiping left - show right indicator (for next)
        if (rightIndicator) {
            rightIndicator.classList.add('show');
            rightIndicator.style.opacity = Math.min(0.7, Math.abs(offset) / 200);
        }
        if (leftIndicator) leftIndicator.classList.remove('show');
    } else {
        // Not swiping enough - hide indicators
        hideSwipeIndicators();
    }
}

function hideSwipeIndicators() {
    const indicators = document.querySelectorAll('.swipe-indicator');
    indicators.forEach(indicator => {
        indicator.classList.remove('show');
        indicator.style.opacity = '0';
    });
}

// Initialize modal
function initModal() {
    console.log('Modal initialized with swipe functionality');
    
    // Setup modal backdrop click
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
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
    
    if (prevBtn) prevBtn.onclick = () => swipeImage('right');
    if (nextBtn) nextBtn.onclick = () => swipeImage('left');
    
    // Setup drag events for the image
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        // Mouse events
        modalImage.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', dragImage);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events for mobile
        modalImage.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', dragImage, { passive: false });
        document.addEventListener('touchend', endDrag);
        
        // Prevent image drag default behavior
        modalImage.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    // Add swipe indicators to modal
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'swipe-indicator swipe-indicator-left';
        leftIndicator.innerHTML = '←';
        leftIndicator.title = 'Swipe right for previous';
        
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'swipe-indicator swipe-indicator-right';
        rightIndicator.innerHTML = '→';
        rightIndicator.title = 'Swipe left for next';
        
        modalBody.appendChild(leftIndicator);
        modalBody.appendChild(rightIndicator);
        
        // Add drag overlay
        const dragOverlay = document.createElement('div');
        dragOverlay.className = 'drag-overlay';
        modalBody.appendChild(dragOverlay);
    }
    
    // Make functions available globally
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.prevImage = prevImage;
    window.nextImage = nextImage;
    window.goToImage = goToImage;
    window.setCurrentPhotos = setCurrentPhotos;
    window.swipeImage = swipeImage;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initModal);