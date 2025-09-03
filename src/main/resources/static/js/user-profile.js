/**
 * User Profile Photo Upload JavaScript
 * Handles photo upload functionality for user profiles
 */

class UserProfileManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        // Add a small delay to avoid conflicts with server-side rendering
        setTimeout(() => {
            this.loadCurrentPhoto();
        }, 100);
    }

    setupEventListeners() {
        // Photo upload input
        const photoInput = document.getElementById('photoInput');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
        }

        // Photo upload overlay click
        const uploadOverlay = document.querySelector('.photo-upload-overlay');
        if (uploadOverlay) {
            uploadOverlay.addEventListener('click', () => {
                document.getElementById('photoInput').click();
            });
        }
    }

    async loadCurrentPhoto() {
        try {
            // Check if photo is already loaded by server-side rendering
            const existingAvatar = document.getElementById('profileAvatar');
            if (existingAvatar && existingAvatar.src && !existingAvatar.src.includes('data:')) {
                // Photo is already loaded by server-side rendering, don't override it
                console.log('Photo already loaded by server-side rendering');
                return;
            }

            // Check if there's already a photo being displayed
            if (existingAvatar && existingAvatar.style.display !== 'none' && existingAvatar.src) {
                console.log('Photo already displayed, skipping API call');
                return;
            }

            console.log('Loading photo from API...');
            const response = await fetch('/api/photo/current/base64');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.data) {
                console.log('Photo loaded successfully from API');
                this.updateProfilePhoto(data.data);
            } else {
                console.log('No photo found in API response');
                this.showPlaceholder();
            }
        } catch (error) {
            console.log('Error loading photo:', error);
            this.showPlaceholder();
        }
    }

    showPlaceholder() {
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const profileAvatar = document.getElementById('profileAvatar');
        
        // Only show placeholder if no photo is currently displayed
        if (!profileAvatar || profileAvatar.style.display === 'none' || !profileAvatar.src || profileAvatar.src === window.location.href) {
            // Hide profile avatar if it exists
            if (profileAvatar) {
                profileAvatar.style.display = 'none';
                profileAvatar.style.visibility = 'hidden';
                profileAvatar.style.opacity = '0';
            }
            
            // Show placeholder
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = 'flex';
                avatarPlaceholder.style.visibility = 'visible';
                avatarPlaceholder.style.opacity = '1';
                console.log('Showing avatar placeholder');
            }
        }
    }

    async handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showMessage('Please select an image file.', 'error');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showMessage('File size must be less than 5MB.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        // Show progress
        this.showProgress();
        this.showMessage('Uploading photo...', '');

        try {
            const response = await fetch('/api/photo/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.hideProgress();

            if (data.success) {
                this.showMessage('Photo uploaded successfully!', 'success');
                // Reload the photo from the server
                await this.loadCurrentPhoto();
            } else {
                this.showMessage('Upload failed: ' + (data.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            this.hideProgress();
            console.error('Upload error:', error);
            this.showMessage('Upload failed: ' + error.message, 'error');
        }
    }

    updateProfilePhoto(photoDataUrl) {
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const profileAvatar = document.getElementById('profileAvatar');
        
        // Hide placeholder first
        if (avatarPlaceholder) {
            avatarPlaceholder.style.display = 'none';
        }
        
        if (profileAvatar) {
            // Update existing avatar
            profileAvatar.src = photoDataUrl;
            profileAvatar.style.display = 'block';
            profileAvatar.style.visibility = 'visible';
            profileAvatar.style.opacity = '1';
            console.log('Updated existing profile avatar');
        } else {
            // Create new avatar
            const newAvatar = document.createElement('img');
            newAvatar.src = photoDataUrl;
            newAvatar.alt = 'Profile Photo';
            newAvatar.className = 'profile-avatar';
            newAvatar.id = 'profileAvatar';
            newAvatar.style.display = 'block';
            newAvatar.style.visibility = 'visible';
            newAvatar.style.opacity = '1';
            
            const container = document.querySelector('.profile-avatar-container');
            if (container) {
                container.insertBefore(newAvatar, container.firstChild);
                console.log('Created new profile avatar');
            }
        }
    }

    async deletePhoto() {
        if (!confirm('Are you sure you want to delete your profile photo?')) {
            return;
        }

        try {
            const response = await fetch('/api/photo/current', {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage('Photo deleted successfully!', 'success');
                this.removeProfilePhoto();
            } else {
                this.showMessage('Delete failed: ' + data.message, 'error');
            }
        } catch (error) {
            this.showMessage('Delete failed: ' + error.message, 'error');
        }
    }

    removeProfilePhoto() {
        const profileAvatar = document.getElementById('profileAvatar');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        
        if (profileAvatar) {
            profileAvatar.remove();
        }
        
        if (avatarPlaceholder) {
            avatarPlaceholder.style.display = 'flex';
        }
    }

    showProgress() {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.style.display = 'block';
        }
    }

    hideProgress() {
        const progressElement = document.getElementById('uploadProgress');
        if (progressElement) {
            progressElement.style.display = 'none';
        }
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('uploadMessage');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = 'upload-message ' + type;
            
            // Auto-hide success messages after 3 seconds
            if (type === 'success') {
                setTimeout(() => {
                    messageElement.textContent = '';
                    messageElement.className = 'upload-message';
                }, 3000);
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserProfileManager();
});
