/**
 * User Dashboard JavaScript
 * Handles user dashboard operations with REST API calls
 */

class UserDashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUser();
            this.setupEventListeners();
        } catch (error) {
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    setupEventListeners() {
        // Profile button
        const profileBtn = document.querySelector('.btn-profile');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.goToProfile());
        }

        // Settings button
        const settingsBtn = document.querySelector('.btn-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.goToSettings());
        }

        // Logout form
        const logoutForm = document.querySelector('form[action="/logout"]');
        if (logoutForm) {
            logoutForm.addEventListener('submit', (e) => this.handleLogout(e));
        }
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/users/current');
            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.data;
                this.updateUserInfo();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to load user data: ' + error.message);
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            // Update welcome message
            const welcomeText = document.querySelector('.welcome-text');
            if (welcomeText) {
                welcomeText.innerHTML = `Welcome to your user dashboard, <strong>${this.currentUser.firstName} ${this.currentUser.lastName}</strong>! Here you can manage your profile and view your information.`;
            }

            // Update dashboard title
            const dashboardTitle = document.querySelector('.dashboard-title');
            if (dashboardTitle) {
                dashboardTitle.innerHTML = `<i class="bi bi-person-circle"></i> ${this.currentUser.firstName}'s Dashboard`;
            }

            // Update role information
            this.updateRoleInfo();
        }
    }

    updateRoleInfo() {
        if (this.currentUser && this.currentUser.roles) {
            const roleElement = document.querySelector('.info-item .role-badge');
            if (roleElement) {
                const hasAdmin = this.currentUser.roles.some(role => role === 'ADMIN');
                if (hasAdmin) {
                    roleElement.textContent = 'ADMIN';
                    roleElement.className = 'role-badge bg-purple text-white px-2 py-1 rounded-pill';
                } else {
                    roleElement.textContent = 'USER';
                    roleElement.className = 'role-badge bg-secondary text-white px-2 py-1 rounded-pill';
                }
            }
        }
    }

    goToProfile() {
        window.location.href = '/user/profile';
    }

    goToSettings() {
        window.location.href = '/user/settings';
    }

    handleLogout(event) {
        // Logout is handled by the form submission
        // No additional JavaScript needed
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showAlert(message, type) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Add new alert at the top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertAdjacentHTML('afterbegin', alertHtml);
        }

        // Auto-remove alert after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }
}

// Initialize user dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userDashboard = new UserDashboard();
});
