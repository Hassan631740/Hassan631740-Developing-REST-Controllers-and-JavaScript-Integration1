/**
 * User Settings JavaScript
 * Handles user account settings and profile updates
 */

class UserSettings {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUser();
            this.setupEventListeners();
        } catch (error) {
            this.showError('Failed to initialize settings: ' + error.message);
        }
    }

    setupEventListeners() {
        // Settings form submission
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Password confirmation validation
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (newPasswordInput && confirmPasswordInput) {
            newPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
            confirmPasswordInput.addEventListener('input', () => {
                this.validatePasswordMatch();
            });
        }
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/users/current');
            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.data;
                this.populateForm();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to load user data: ' + error.message);
        }
    }

    populateForm() {
        if (this.currentUser) {
            // Populate form fields with current user data
            const firstNameInput = document.getElementById('firstName');
            const lastNameInput = document.getElementById('lastName');
            const ageInput = document.getElementById('age');
            const emailInput = document.getElementById('email');

            if (firstNameInput) firstNameInput.value = this.currentUser.firstName || '';
            if (lastNameInput) lastNameInput.value = this.currentUser.lastName || '';
            if (ageInput) ageInput.value = this.currentUser.age || '';
            if (emailInput) emailInput.value = this.currentUser.email || '';
        }
    }

    validatePasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
            confirmPasswordInput.classList.add('is-invalid');
        } else if (newPassword && newPassword.length < 6) {
            confirmPasswordInput.setCustomValidity('Password must be at least 6 characters');
            confirmPasswordInput.classList.add('is-invalid');
        } else {
            confirmPasswordInput.setCustomValidity('');
            confirmPasswordInput.classList.remove('is-invalid');
        }
    }

    async handleFormSubmit(event) {
        event.preventDefault();

        // Validate password match
        this.validatePasswordMatch();

        // Additional validation
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const age = parseInt(document.getElementById('age').value);

        // Validate required fields
        if (!firstName || !lastName || !email || !age) {
            this.showError('Please fill in all required fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Validate age
        if (age < 1 || age > 150) {
            this.showError('Age must be between 1 and 150');
            return;
        }

        // Check if passwords match when both are provided
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Check password length if provided
        if (newPassword && newPassword.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (!event.target.checkValidity()) {
            event.target.reportValidity();
            return;
        }

        try {
            const userData = {
                firstName: firstName,
                lastName: lastName,
                age: age,
                email: email,
                password: newPassword || null
            };

            // Remove password if not provided
            if (!userData.password) {
                delete userData.password;
            }

            await this.updateUser(userData);
        } catch (error) {
            this.showError('Failed to update settings: ' + error.message);
        }
    }

    async updateUser(userData) {
        try {
            // Show loading state
            const saveButton = document.querySelector('.btn-save');
            const originalText = saveButton.innerHTML;
            saveButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
            saveButton.disabled = true;

            const response = await fetch(`/api/users/${this.currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            // Restore button state
            saveButton.innerHTML = originalText;
            saveButton.disabled = false;

            if (result.success) {
                this.showSuccess('Settings updated successfully!');
                this.currentUser = result.data;
                
                // Clear password fields
                const newPasswordInput = document.getElementById('newPassword');
                const confirmPasswordInput = document.getElementById('confirmPassword');
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                
                // Update form with new data
                this.populateForm();
            } else {
                // Handle specific error cases
                if (result.message && result.message.includes('Email already exists')) {
                    this.showError('This email address is already in use. Please choose a different email.');
                } else {
                    this.showError(result.message || 'Failed to update settings');
                }
            }
        } catch (error) {
            // Restore button state on error
            const saveButton = document.querySelector('.btn-save');
            saveButton.innerHTML = '<i class="bi bi-check-circle"></i> Save Changes';
            saveButton.disabled = false;
            
            this.showError('Failed to update settings: ' + error.message);
        }
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            // Remove existing alerts
            alertContainer.innerHTML = '';

            const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;

            alertContainer.innerHTML = alertHtml;

            // Auto-remove alert after 5 seconds
            setTimeout(() => {
                const alert = alertContainer.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }
}

// Initialize user settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userSettings = new UserSettings();
});
