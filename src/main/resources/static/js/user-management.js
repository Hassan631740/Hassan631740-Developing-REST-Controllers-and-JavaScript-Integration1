/**
 * User Management JavaScript
 * Handles all user-related operations with modern UI/UX
 */

class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.roles = [];
        this.init();
    }

    async init() {
        try {
            await this.loadRoles();
            await this.loadUsers();
            this.setupEventListeners();
            this.setupFormValidation();
        } catch (error) {
            UIHelper.showError('Failed to initialize user manager: ' + error.message);
        }
    }

    setupEventListeners() {
        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // Search functionality
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        }

        // Form submissions
        const addUserForm = document.getElementById('addUserForm');
        if (addUserForm) {
            addUserForm.addEventListener('submit', (e) => this.handleAddUser(e));
        }

        const editUserForm = document.getElementById('editUserForm');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.handleEditUser(e));
        }
    }

    setupFormValidation() {
        // Real-time validation
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'firstName':
            case 'lastName':
                if (value.length < 2) {
                    isValid = false;
                    errorMessage = 'Must be at least 2 characters';
                }
                break;
            case 'email':
                if (!UIHelper.validateEmail(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;
            case 'password':
                if (value && !UIHelper.validatePassword(value)) {
                    isValid = false;
                    errorMessage = 'Password must be at least 6 characters';
                }
                break;
            case 'age':
                const age = parseInt(value);
                if (isNaN(age) || age < 1 || age > 150) {
                    isValid = false;
                    errorMessage = 'Age must be between 1 and 150';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    async loadUsers() {
        try {
            UIHelper.showLoading('usersTable');
            const response = await apiClient.getAllUsers();
            
            if (response.success) {
                this.users = response.data;
                this.renderUsersTable();
            } else {
                UIHelper.showError(response.message);
            }
        } catch (error) {
            UIHelper.showError('Failed to load users: ' + error.message);
        } finally {
            UIHelper.hideLoading('usersTable');
        }
    }

    async loadRoles() {
        try {
            const response = await apiClient.getAllRoles();
            if (response.success) {
                this.roles = response.data;
                this.populateRoleSelects();
            }
        } catch (error) {
            console.error('Failed to load roles:', error);
        }
    }

    renderUsersTable() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.age}</td>
                <td>${this.formatRoles(user.roles)}</td>
                <td>${UIHelper.formatDate(user.createdAt)}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="userManager.editUser(${user.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="userManager.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    formatRoles(roles) {
        if (!roles || roles.length === 0) return 'No roles';
        return roles.map(role => role.replace('ROLE_', '')).join(', ');
    }

    populateRoleSelects() {
        const roleSelects = document.querySelectorAll('select[name="roles"]');
        roleSelects.forEach(select => {
            select.innerHTML = '<option value="">Select roles...</option>';
            this.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.name;
                option.textContent = role.name.replace('ROLE_', '');
                select.appendChild(option);
            });
        });
    }

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => 
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredUsers(filteredUsers);
    }

    renderFilteredUsers(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.age}</td>
                <td>${this.formatRoles(user.roles)}</td>
                <td>${UIHelper.formatDate(user.createdAt)}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="userManager.editUser(${user.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="userManager.deleteUser(${user.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    showAddUserModal() {
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        FormHelper.clearForm('addUserForm');
        modal.show();
    }

    async handleAddUser(event) {
        event.preventDefault();
        
        if (!FormHelper.validateForm('addUserForm')) {
            UIHelper.showError('Please fill in all required fields correctly');
            return;
        }

        const formData = FormHelper.getFormData('addUserForm');
        const userData = this.prepareUserData(formData);

        try {
            const response = await apiClient.createUser(userData);
            
            if (response.success) {
                UIHelper.showSuccess('User created successfully');
                bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
                await this.loadUsers();
            } else {
                UIHelper.showError(response.message);
            }
        } catch (error) {
            UIHelper.showError('Failed to create user: ' + error.message);
        }
    }

    async editUser(userId) {
        try {
            const response = await apiClient.getUserById(userId);
            
            if (response.success) {
                this.currentUser = response.data;
                this.populateEditForm(this.currentUser);
                const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
                modal.show();
            } else {
                UIHelper.showError(response.message);
            }
        } catch (error) {
            UIHelper.showError('Failed to load user details: ' + error.message);
        }
    }

    populateEditForm(user) {
        FormHelper.setFormData('editUserForm', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            age: user.age,
            roles: user.roles
        });
    }

    async handleEditUser(event) {
        event.preventDefault();
        
        if (!FormHelper.validateForm('editUserForm')) {
            UIHelper.showError('Please fill in all required fields correctly');
            return;
        }

        const formData = FormHelper.getFormData('editUserForm');
        const userData = this.prepareUserData(formData);

        try {
            const response = await apiClient.updateUser(this.currentUser.id, userData);
            
            if (response.success) {
                UIHelper.showSuccess('User updated successfully');
                bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
                await this.loadUsers();
            } else {
                UIHelper.showError(response.message);
            }
        } catch (error) {
            UIHelper.showError('Failed to update user: ' + error.message);
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const response = await apiClient.deleteUser(userId);
            
            if (response.success) {
                UIHelper.showSuccess('User deleted successfully');
                await this.loadUsers();
            } else {
                UIHelper.showError(response.message);
            }
        } catch (error) {
            UIHelper.showError('Failed to delete user: ' + error.message);
        }
    }

    prepareUserData(formData) {
        return {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            age: parseInt(formData.age),
            password: formData.password || '',
            roles: formData.roles ? [formData.roles] : []
        };
    }
}

// Initialize user manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userManager = new UserManager();
}); 