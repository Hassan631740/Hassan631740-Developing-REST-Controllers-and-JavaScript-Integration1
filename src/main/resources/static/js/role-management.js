// Role Management JavaScript Module
class RoleManager {
    constructor() {
        this.roles = [];
        this.currentRole = null;
        this.init();
    }

    async init() {
        await this.loadRoles();
        this.setupEventListeners();
    }

    async loadRoles() {
        try {
            const response = await apiClient.getAllRoles();
            this.roles = response.data || [];
            this.renderRolesTable();
        } catch (error) {
            this.showNotification('Error loading roles: ' + error.message, 'error');
        }
    }

    async createRole(roleData) {
        try {
            const response = await apiClient.createRole(roleData);
            this.showNotification('Role created successfully!', 'success');
            await this.loadRoles();
            this.resetRoleForm();
            return response;
        } catch (error) {
            this.showNotification('Error creating role: ' + error.message, 'error');
            throw error;
        }
    }

    async updateRole(id, roleData) {
        try {
            const response = await apiClient.updateRole(id, roleData);
            this.showNotification('Role updated successfully!', 'success');
            await this.loadRoles();
            this.resetRoleForm();
            return response;
        } catch (error) {
            this.showNotification('Error updating role: ' + error.message, 'error');
            throw error;
        }
    }

    async deleteRole(id) {
        if (!confirm('Are you sure you want to delete this role?')) {
            return;
        }

        try {
            await apiClient.deleteRole(id);
            this.showNotification('Role deleted successfully!', 'success');
            await this.loadRoles();
        } catch (error) {
            this.showNotification('Error deleting role: ' + error.message, 'error');
        }
    }

    renderRolesTable() {
        const tableBody = document.getElementById('rolesTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '';
        
        this.roles.forEach(role => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${role.id}</td>
                <td>${role.name}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="roleManager.editRole(${role.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="roleManager.deleteRole(${role.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    editRole(id) {
        const role = this.roles.find(r => r.id === id);
        if (!role) return;

        this.currentRole = role;
        
        // Populate form fields
        document.getElementById('roleId').value = role.id;
        document.getElementById('roleName').value = role.name;

        // Change form button text
        const submitBtn = document.getElementById('roleSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Update Role';
        }
    }

    resetRoleForm() {
        document.getElementById('roleForm').reset();
        document.getElementById('roleId').value = '';
        this.currentRole = null;
        
        const submitBtn = document.getElementById('roleSubmitBtn');
        if (submitBtn) {
            submitBtn.textContent = 'Create Role';
        }
    }

    setupEventListeners() {
        const roleForm = document.getElementById('roleForm');
        if (roleForm) {
            roleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRoleSubmit();
            });
        }

        // Reset form button
        const resetBtn = document.getElementById('resetRoleBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetRoleForm();
            });
        }
    }

    async handleRoleSubmit() {
        const formData = new FormData(document.getElementById('roleForm'));
        const roleData = {
            name: formData.get('name')
        };

        try {
            if (this.currentRole) {
                await this.updateRole(this.currentRole.id, roleData);
            } else {
                await this.createRole(roleData);
            }
        } catch (error) {
            console.error('Error handling role submit:', error);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Add to page
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(notification, container.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize role manager when DOM is loaded
let roleManager;
document.addEventListener('DOMContentLoaded', () => {
    roleManager = new RoleManager();
}); 