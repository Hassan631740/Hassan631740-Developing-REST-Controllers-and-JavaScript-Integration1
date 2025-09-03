/**
 * Modern API Client for REST endpoints
 * Provides a clean interface for communicating with the backend API
 */
class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make HTTP request with error handling and logging
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`Making ${config.method || 'GET'} request to: ${url}`);
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                const errorMessage = data.message || `HTTP error! status: ${response.status}`;
                console.error(`API request failed: ${errorMessage}`);
                throw new Error(errorMessage);
            }
            
            console.log(`Request successful: ${url}`);
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * User API methods
     */
    async getAllUsers() {
        return this.request('/api/admin/users');
    }

    async getUserById(id) {
        return this.request(`/api/users/${id}`);
    }

    async createUser(userData) {
        return this.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return this.request(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`/api/users/${id}`, {
            method: 'DELETE'
        });
    }

    async getAllRoles() {
        return this.request('/api/users/roles');
    }

    /**
     * Role API methods
     */
    async getRoleById(id) {
        return this.request(`/api/roles/${id}`);
    }

    async createRole(roleData) {
        return this.request('/api/roles', {
            method: 'POST',
            body: JSON.stringify(roleData)
        });
    }

    async updateRole(id, roleData) {
        return this.request(`/api/roles/${id}`, {
            method: 'PUT',
            body: JSON.stringify(roleData)
        });
    }

    async deleteRole(id) {
        return this.request(`/api/roles/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Utility methods
     */
    setAuthToken(token) {
        if (token) {
            this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.defaultHeaders['Authorization'];
        }
    }

    clearAuthToken() {
        delete this.defaultHeaders['Authorization'];
    }
}

/**
 * UI Helper class for common operations
 */
class UIHelper {
    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading">Loading...</div>';
        }
    }

    static hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element && element.querySelector('.loading')) {
            element.querySelector('.loading').remove();
        }
    }

    static showMessage(message, type = 'info', duration = 3000) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, duration);
    }

    static showError(message) {
        this.showMessage(message, 'danger');
    }

    static showSuccess(message) {
        this.showMessage(message, 'success');
    }

    static showWarning(message) {
        this.showMessage(message, 'warning');
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        return password && password.length >= 6;
    }
}

/**
 * Form Helper class for form operations
 */
class FormHelper {
    static getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;
        
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    static setFormData(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = data[key];
            }
        });
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    static validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        return form.checkValidity();
    }
}

// Global API client instance
const apiClient = new ApiClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, UIHelper, FormHelper };
} 