/**
 * Admin Dashboard JavaScript
 * Handles all admin operations with REST API calls
 */

class AdminDashboard {
    constructor() {
        this.users = [];
        this.roles = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            await this.loadCurrentUser();
            await this.loadUsers();
            await this.loadRoles();
            this.setupEventListeners();
            this.setupModals();
        } catch (error) {
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    setupEventListeners() {
        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.openAddUserModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
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

    setupModals() {
        // Initialize Bootstrap modals
        this.addUserModal = new bootstrap.Modal(document.getElementById('addUserModal'));
        this.editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        
        // Clear forms when modals are hidden
        document.getElementById('addUserModal').addEventListener('hidden.bs.modal', () => {
            this.clearForm('addUserForm');
        });
        
        document.getElementById('editUserModal').addEventListener('hidden.bs.modal', () => {
            this.clearForm('editUserForm');
        });
    }

    async loadCurrentUser() {
        try {
            const response = await fetch('/api/admin/current-user');
            const result = await response.json();
            
            if (result.success) {
                this.currentUser = result.data;
                this.updateUserInfo();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to load current user: ' + error.message);
        }
    }

    async loadUsers() {
        try {
            this.showLoading('usersTable');
            const response = await fetch('/api/admin/users');
            const result = await response.json();
            
            if (result.success) {
                this.users = result.data;
                this.renderUsersTable();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to load users: ' + error.message);
        } finally {
            this.hideLoading('usersTable');
        }
    }

    async loadRoles() {
        try {
            const response = await fetch('/api/admin/roles');
            const result = await response.json();
            
            if (result.success) {
                this.roles = result.data;
                this.populateRoleSelects();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to load roles: ' + error.message);
        }
    }

    renderUsersTable() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            const statusBadge = user.isActive ? 
                '<span class="status-badge status-active">Active</span>' : 
                '<span class="status-badge status-disabled">Disabled</span>';
            
            const enableDisableButton = user.isActive ? 
                `<button class="btn btn-action btn-disable" 
                         onclick="adminDashboard.disableUser(${user.id})"
                         title="Disable User">
                    <i class="bi bi-person-x"></i>
                </button>` :
                `<button class="btn btn-action btn-enable" 
                         onclick="adminDashboard.enableUser(${user.id})"
                         title="Enable User">
                    <i class="bi bi-person-check"></i>
                </button>`;

            row.innerHTML = `
                <td class="text-center">${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td class="text-center">${user.age}</td>
                <td class="text-center">
                    ${this.renderRoleBadge(user.roles)}
                </td>
                <td class="text-center">
                    ${statusBadge}
                </td>
                <td>
                    <div class="action-buttons-cell">
                        <button class="btn btn-action btn-view" 
                                onclick="adminDashboard.viewUser(${user.id})"
                                title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-action btn-edit" 
                                onclick="adminDashboard.editUser(${user.id})"
                                title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${enableDisableButton}
                        <button class="btn btn-action btn-delete" 
                                onclick="adminDashboard.deleteUser(${user.id})"
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    renderRoleBadge(roles) {
        if (!roles || roles.length === 0) return '<span class="badge bg-secondary">No Role</span>';
        
        const hasAdmin = roles.some(role => role === 'ADMIN');
        if (hasAdmin) {
            return '<span class="badge bg-purple text-white px-3 py-2 rounded-pill">Admin</span>';
        } else {
            return '<span class="badge bg-secondary text-white px-3 py-2 rounded-pill">User</span>';
        }
    }

    populateRoleSelects() {
        const roleSelects = document.querySelectorAll('select[name="roleIds"]');
        roleSelects.forEach(select => {
            select.innerHTML = '<option value="">Select roles...</option>';
            this.roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name.replace('ROLE_', '');
                select.appendChild(option);
            });
        });
    }

    openAddUserModal() {
        this.clearForm('addUserForm');
        this.addUserModal.show();
    }

    async handleAddUser(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        // Client-side validation
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const age = formData.get('age');
        const password = formData.get('password');
        const roleId = formData.get('roleIds');
        
        if (!firstName || firstName.trim() === '') {
            this.showError('First name is required');
            return;
        }
        if (!lastName || lastName.trim() === '') {
            this.showError('Last name is required');
            return;
        }
        if (!email || email.trim() === '') {
            this.showError('Email is required');
            return;
        }
        if (!age || age.trim() === '') {
            this.showError('Age is required');
            return;
        }
        if (!password || password.trim() === '') {
            this.showError('Password is required');
            return;
        }
        if (!roleId || roleId.trim() === '') {
            this.showError('Please select a role');
            return;
        }
        // Support both single and multi-select for roleIds
        // Handle roleIds - it's a single select, so we need to convert it to an array
        let roleIds = [];
        if (roleId && roleId.trim() !== '') {
            const singleRole = parseInt(roleId);
            if (!isNaN(singleRole)) {
                roleIds = [singleRole];
            }
        }
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            age: parseInt(formData.get('age')),
            password: formData.get('password'),
            roleIds: roleIds
        };
        console.log('Add user payload:', userData);
        console.log('Role IDs array:', roleIds);
        console.log('Role IDs type:', typeof roleIds);

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('User created successfully');
                this.addUserModal.hide();
                await this.loadUsers();
            } else {
                console.error('Server error response:', result);
                this.showError(result.message || 'Failed to create user');
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Failed to create user: ' + error.message);
        }
    }

    async editUser(userId) {
        try {
            console.log('Edit user called with ID:', userId, 'Type:', typeof userId);
            console.log('Available users:', this.users);
            
            // Convert userId to number for comparison
            const numericUserId = parseInt(userId);
            const user = this.users.find(u => u.id === numericUserId);
            
            if (!user) {
                console.error('User not found. Looking for ID:', numericUserId);
                console.error('Available user IDs:', this.users.map(u => ({ id: u.id, type: typeof u.id })));
                this.showError('User not found');
                return;
            }

            console.log('Found user for editing:', user);
            this.populateEditForm(user);
            this.editUserModal.show();
        } catch (error) {
            console.error('Error in editUser:', error);
            this.showError('Failed to load user details: ' + error.message);
        }
    }

    populateEditForm(user) {
        const form = document.getElementById('editUserForm');
        if (!form) {
            console.error('Edit form not found');
            return;
        }

        console.log('Populating edit form with user:', user);

        // Set form fields with error checking
        const userIdField = form.querySelector('[name="userId"]');
        const firstNameField = form.querySelector('[name="firstName"]');
        const lastNameField = form.querySelector('[name="lastName"]');
        const emailField = form.querySelector('[name="email"]');
        const ageField = form.querySelector('[name="age"]');
        const roleSelect = form.querySelector('[name="roleIds"]');

        if (userIdField) userIdField.value = user.id;
        if (firstNameField) firstNameField.value = user.firstName || '';
        if (lastNameField) lastNameField.value = user.lastName || '';
        if (emailField) emailField.value = user.email || '';
        if (ageField) ageField.value = user.age || '';
        
        // Set role with better error handling
        if (roleSelect && user.roles && user.roles.length > 0) {
            console.log('User roles:', user.roles);
            console.log('Available roles:', this.roles);
            
            // Try to find matching role
            const role = this.roles.find(r => r.name === user.roles[0] || r.name === 'ROLE_' + user.roles[0]);
            if (role) {
                roleSelect.value = role.id;
                console.log('Set role to:', role.id, role.name);
            } else {
                console.warn('No matching role found for:', user.roles[0]);
                roleSelect.value = '';
            }
        } else {
            console.warn('No roles found for user or role select not found');
            if (roleSelect) roleSelect.value = '';
        }
    }

    async handleEditUser(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userId = parseInt(formData.get('userId'));
        // Handle roleIds - it's a single select, so we need to convert it to an array
        let roleIds = [];
        const roleId = formData.get('roleIds');
        if (roleId && roleId.trim() !== '') {
            const singleRole = parseInt(roleId);
            if (!isNaN(singleRole)) {
                roleIds = [singleRole];
            }
        }
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            age: parseInt(formData.get('age')),
            password: formData.get('password') || '',
            roleIds: roleIds
        };
        console.log('Edit user payload:', userData);

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('User updated successfully');
                this.editUserModal.hide();
                await this.loadUsers();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Failed to update user: ' + error.message);
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('User deleted successfully');
                await this.loadUsers();
            } else {
                this.showError(result.message || 'Failed to delete user');
            }
        } catch (error) {
            this.showError('Failed to delete user: ' + error.message);
        }
    }

    async enableUser(userId) {
        if (!confirm('Are you sure you want to enable this user?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/enable`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('User enabled successfully');
                await this.loadUsers();
            } else {
                this.showError(result.message || 'Failed to enable user');
            }
        } catch (error) {
            this.showError('Failed to enable user: ' + error.message);
        }
    }

    async disableUser(userId) {
        if (!confirm('Are you sure you want to disable this user? They will not be able to login until re-enabled.')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}/disable`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('User disabled successfully');
                await this.loadUsers();
            } else {
                this.showError(result.message || 'Failed to disable user');
            }
        } catch (error) {
            this.showError('Failed to disable user: ' + error.message);
        }
    }

    async viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showError('User not found');
            return;
        }

        const statusBadge = user.isActive ? 
            '<span class="status-badge status-active">Active</span>' : 
            '<span class="status-badge status-disabled">Disabled</span>';

        // Create and show user details modal
        const modalHtml = `
            <div class="modal fade" id="viewUserModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Age:</strong> ${user.age}</p>
                                    <p><strong>Role:</strong> ${this.renderRoleBadge(user.roles)}</p>
                                    <p><strong>Status:</strong> ${statusBadge}</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('viewUserModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewUserModal'));
        modal.show();
        
        // Clean up modal after it's hidden
        document.getElementById('viewUserModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
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
            const statusBadge = user.isActive ? 
                '<span class="status-badge status-active">Active</span>' : 
                '<span class="status-badge status-disabled">Disabled</span>';
            
            const enableDisableButton = user.isActive ? 
                `<button class="btn btn-action btn-disable" 
                         onclick="adminDashboard.disableUser(${user.id})"
                         title="Disable User">
                    <i class="bi bi-person-x"></i>
                </button>` :
                `<button class="btn btn-action btn-enable" 
                         onclick="adminDashboard.enableUser(${user.id})"
                         title="Enable User">
                    <i class="bi bi-person-check"></i>
                </button>`;

            row.innerHTML = `
                <td class="text-center">${user.id}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td class="text-center">${user.age}</td>
                <td class="text-center">
                    ${this.renderRoleBadge(user.roles)}
                </td>
                <td class="text-center">
                    ${statusBadge}
                </td>
                <td>
                    <div class="action-buttons-cell">
                        <button class="btn btn-action btn-view" 
                                onclick="adminDashboard.viewUser(${user.id})"
                                title="View">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-action btn-edit" 
                                onclick="adminDashboard.editUser(${user.id})"
                                title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${enableDisableButton}
                        <button class="btn btn-action btn-delete" 
                                onclick="adminDashboard.deleteUser(${user.id})"
                                title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    async refreshData() {
        await this.loadUsers();
        await this.loadRoles();
        this.showSuccess('Data refreshed successfully');
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userInfoElement = document.getElementById('currentUserInfo');
            if (userInfoElement) {
                userInfoElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
            }
        }
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p class="mt-2">Loading...</p></div>';
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            // Loading will be replaced by actual content
        }
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

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
