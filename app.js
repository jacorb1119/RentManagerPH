// Tenant Database Class
class TenantDatabase {
    constructor() {
        this.dbName = 'RentTrackDB';
        this.dbVersion = 2;
        this.tenantStore = 'tenants';
        this.propertyStore = 'properties';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject('Error opening database');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create tenants store
                if (!db.objectStoreNames.contains(this.tenantStore)) {
                    const tenantStore = db.createObjectStore(this.tenantStore, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    tenantStore.createIndex('email', 'email', { unique: true });
                    tenantStore.createIndex('status', 'status', { unique: false });
                    tenantStore.createIndex('propertyId', 'propertyId', { unique: false });
                }
                
                // Create properties store if not exists
                if (!db.objectStoreNames.contains(this.propertyStore)) {
                    const propertyStore = db.createObjectStore(this.propertyStore, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    propertyStore.createIndex('status', 'status', { unique: false });
                }
            };
        });
    }

    // Tenant Methods
    async addTenant(tenant) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tenantStore], 'readwrite');
            const store = transaction.objectStore(this.tenantStore);
            
            tenant.dateAdded = new Date().toISOString();
            tenant.lastUpdated = new Date().toISOString();
            
            const request = store.add(tenant);

            request.onsuccess = () => {
                resolve({ ...tenant, id: request.result });
            };

            request.onerror = (event) => {
                reject('Error adding tenant: ' + event.target.error);
            };
        });
    }

    async getAllTenants() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tenantStore], 'readonly');
            const store = transaction.objectStore(this.tenantStore);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject('Error getting tenants: ' + event.target.error);
            };
        });
    }

    async deleteTenant(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.tenantStore], 'readwrite');
            const store = transaction.objectStore(this.tenantStore);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(id);
            };

            request.onerror = (event) => {
                reject('Error deleting tenant: ' + event.target.error);
            };
        });
    }

    async searchTenants(searchTerm) {
        return new Promise(async (resolve, reject) => {
            try {
                const allTenants = await this.getAllTenants();
                
                if (!searchTerm) {
                    resolve(allTenants);
                    return;
                }

                const term = searchTerm.toLowerCase();
                const filtered = allTenants.filter(tenant => 
                    tenant.firstName.toLowerCase().includes(term) ||
                    tenant.lastName.toLowerCase().includes(term) ||
                    tenant.email.toLowerCase().includes(term) ||
                    tenant.unit.toLowerCase().includes(term)
                );
                
                resolve(filtered);
            } catch (error) {
                reject('Error searching tenants: ' + error);
            }
        });
    }

    // Property Methods
    async getAllProperties() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.propertyStore], 'readonly');
            const store = transaction.objectStore(this.propertyStore);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject('Error getting properties: ' + event.target.error);
            };
        });
    }

    async addProperty(property) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.propertyStore], 'readwrite');
            const store = transaction.objectStore(this.propertyStore);
            
            property.dateAdded = new Date().toISOString();
            
            const request = store.add(property);

            request.onsuccess = () => {
                resolve({ ...property, id: request.result });
            };

            request.onerror = (event) => {
                reject('Error adding property: ' + event.target.error);
            };
        });
    }

    async deleteProperty(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.propertyStore], 'readwrite');
            const store = transaction.objectStore(this.propertyStore);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(id);
            };

            request.onerror = (event) => {
                reject('Error deleting property: ' + event.target.error);
            };
        });
    }

    async searchProperties(searchTerm) {
        return new Promise(async (resolve, reject) => {
            try {
                const allProperties = await this.getAllProperties();
                
                if (!searchTerm) {
                    resolve(allProperties);
                    return;
                }

                const term = searchTerm.toLowerCase();
                const filtered = allProperties.filter(property => 
                    property.title.toLowerCase().includes(term) ||
                    property.address.toLowerCase().includes(term) ||
                    property.city.toLowerCase().includes(term)
                );
                
                resolve(filtered);
            } catch (error) {
                reject('Error searching properties: ' + error);
            }
        });
    }

    async initializeSampleData() {
        // Add sample properties
        const properties = await this.getAllProperties();
        if (properties.length === 0) {
            const sampleProperties = [
                {
                    title: "Maple Avenue Apartments",
                    address: "123 Maple Ave",
                    city: "Springfield",
                    price: 1450,
                    units: 12,
                    status: "Occupied",
                    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=300&q=80"
                },
                {
                    title: "Oak Street Residence",
                    address: "456 Oak St",
                    city: "Riverside",
                    price: 2200,
                    units: 1,
                    status: "Occupied",
                    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400&h=300&q=80"
                }
            ];
            
            for (const prop of sampleProperties) {
                await this.addProperty(prop);
            }
        }

        // Add sample tenants
        const tenants = await this.getAllTenants();
        if (tenants.length === 0) {
            const properties = await this.getAllProperties();
            
            const sampleTenants = [
                {
                    firstName: "Alice",
                    lastName: "Johnson",
                    email: "alice.j@example.com",
                    phone: "(555) 123-4567",
                    propertyId: properties[0]?.id || 1,
                    unit: "A1",
                    leaseStart: "2023-01-15",
                    leaseEnd: "2024-01-14",
                    rent: 1450,
                    balance: 0,
                    status: "Active"
                },
                {
                    firstName: "Bob",
                    lastName: "Smith",
                    email: "bob.smith@example.com",
                    phone: "(555) 234-5678",
                    propertyId: properties[1]?.id || 2,
                    unit: "N/A",
                    leaseStart: "2023-06-01",
                    leaseEnd: "2024-05-31",
                    rent: 2200,
                    balance: 2200,
                    status: "Active"
                },
                {
                    firstName: "Charlie",
                    lastName: "Davis",
                    email: "charlie.d@example.com",
                    phone: "(555) 345-6789",
                    propertyId: properties[0]?.id || 1,
                    unit: "B4",
                    leaseStart: "2022-11-10",
                    leaseEnd: "2023-11-09",
                    rent: 1450,
                    balance: 0,
                    status: "Notice"
                }
            ];
            
            for (const tenant of sampleTenants) {
                await this.addTenant(tenant);
            }
        }
    }
}

// UI Manager Class
class UIManager {
    constructor(db) {
        this.db = db;
        this.tenantsTableBody = document.getElementById('tenantsTableBody');
        this.propertiesGrid = document.getElementById('propertiesGrid');
        this.searchInput = document.getElementById('searchInput');
        this.tenantCount = document.getElementById('tenantCount');
        this.propertyCount = document.getElementById('propertyCount');
        this.tenantForm = document.getElementById('tenantForm');
        this.propertyForm = document.getElementById('propertyForm');
        
        // Modal elements
        this.tenantModalOverlay = document.getElementById('modalOverlay');
        this.propertyModalOverlay = document.getElementById('propertyModalOverlay');
        this.openModalBtn = document.getElementById('openModalBtn');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.closePropertyModalBtn = document.getElementById('closePropertyModalBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.cancelPropertyBtn = document.getElementById('cancelPropertyBtn');
        
        // Page elements
        this.tenantsPage = document.getElementById('tenantsPage');
        this.propertiesPage = document.getElementById('propertiesPage');
        this.navItems = document.querySelectorAll('.nav-item');
        
        this.init();
    }

    init() {
        // Load initial data - properties first
        this.loadProperties();
        this.loadTenants();
        this.loadPropertyOptions();
        
        // Ensure correct page is visible
        this.propertiesPage.style.display = 'block';
        this.tenantsPage.style.display = 'none';
        
        // Set correct search placeholder and button text for properties page
        this.searchInput.placeholder = 'Search properties...';
        this.updateAddButtonText('properties');
        
        // Navigation event listeners
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });
        
        // Modal event listeners for Tenants
        this.openModalBtn.addEventListener('click', () => {
            const currentPage = document.querySelector('.nav-item.active').dataset.page;
            this.openModal(currentPage === 'tenants' ? 'tenant' : 'property');
        });
        
        this.closeModalBtn.addEventListener('click', () => this.closeModal('tenant'));
        this.cancelBtn.addEventListener('click', () => this.closeModal('tenant'));
        
        // Modal event listeners for Properties
        this.closePropertyModalBtn.addEventListener('click', () => this.closeModal('property'));
        this.cancelPropertyBtn.addEventListener('click', () => this.closeModal('property'));
        
        // Click outside to close modals
        this.tenantModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.tenantModalOverlay) {
                this.closeModal('tenant');
            }
        });
        
        this.propertyModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.propertyModalOverlay) {
                this.closeModal('property');
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.tenantModalOverlay.classList.contains('active')) {
                    this.closeModal('tenant');
                }
                if (this.propertyModalOverlay.classList.contains('active')) {
                    this.closeModal('property');
                }
            }
        });
        
        // Form submit handlers
        this.tenantForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTenant();
        });
        
        this.propertyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProperty();
        });

        // Search handler
        let searchTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const currentPage = document.querySelector('.nav-item.active').dataset.page;
                if (currentPage === 'tenants') {
                    this.loadTenants(this.searchInput.value);
                } else if (currentPage === 'properties') {
                    this.filterProperties(this.searchInput.value);
                }
            }, 300);
        });
    }

    updateAddButtonText(page) {
        if (page === 'tenants') {
            this.openModalBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="plus-icon"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> Add Tenant';
        } else {
            this.openModalBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="plus-icon"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> Add Property';
        }
    }

    switchPage(page) {
        // Update active nav item
        this.navItems.forEach(item => {
            item.classList.remove('active');
            const indicator = item.querySelector('.active-indicator');
            if (indicator) indicator.remove();
        });
        
        const activeItem = document.querySelector(`[data-page="${page}"]`);
        activeItem.classList.add('active');
        
        // Add indicator if it doesn't exist
        if (!activeItem.querySelector('.active-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'active-indicator';
            activeItem.appendChild(indicator);
        }
        
        // Show/hide pages
        this.tenantsPage.style.display = page === 'tenants' ? 'block' : 'none';
        this.propertiesPage.style.display = page === 'properties' ? 'block' : 'none';
        
        // Update search placeholder and button text
        this.searchInput.placeholder = page === 'tenants' ? 'Search tenants...' : 'Search properties...';
        this.updateAddButtonText(page);
        
        // Load data for the page
        if (page === 'tenants') {
            this.loadTenants();
        } else if (page === 'properties') {
            this.loadProperties();
        }
    }

    openModal(type) {
        if (type === 'tenant') {
            this.tenantModalOverlay.classList.add('active');
            this.loadPropertyOptions(); // Refresh property options
        } else {
            this.propertyModalOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    closeModal(type) {
        if (type === 'tenant') {
            this.tenantModalOverlay.classList.remove('active');
            this.tenantForm.reset();
        } else {
            this.propertyModalOverlay.classList.remove('active');
            this.propertyForm.reset();
        }
        document.body.style.overflow = '';
    }

    async loadPropertyOptions() {
        try {
            const properties = await this.db.getAllProperties();
            const select = document.getElementById('property');
            
            select.innerHTML = '<option value="">Select Property</option>';
            properties.forEach(property => {
                const option = document.createElement('option');
                option.value = property.id;
                option.textContent = `${property.title} - ${property.address}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading properties:', error);
        }
    }

    async loadTenants(searchTerm = '') {
        try {
            this.tenantsTableBody.innerHTML = '<tr><td colspan="6" class="loading-spinner">Loading tenants...</td></tr>';
            
            let tenants;
            if (searchTerm) {
                tenants = await this.db.searchTenants(searchTerm);
            } else {
                tenants = await this.db.getAllTenants();
            }
            
            const properties = await this.db.getAllProperties();
            this.displayTenants(tenants, properties);
        } catch (error) {
            this.showToast('Error loading tenants: ' + error, 'error');
        }
    }

    async loadProperties() {
        try {
            this.propertiesGrid.innerHTML = '<div class="loading-spinner">Loading properties...</div>';
            
            const properties = await this.db.getAllProperties();
            this.displayProperties(properties);
        } catch (error) {
            this.showToast('Error loading properties: ' + error, 'error');
        }
    }

    async filterProperties(searchTerm) {
        try {
            this.propertiesGrid.innerHTML = '<div class="loading-spinner">Loading properties...</div>';
            
            const properties = await this.db.searchProperties(searchTerm);
            this.displayProperties(properties);
        } catch (error) {
            this.showToast('Error searching properties: ' + error, 'error');
        }
    }

    displayTenants(tenants, properties) {
        if (this.tenantCount) {
            this.tenantCount.textContent = `${tenants.length} tenants found`;
        }
        
        if (tenants.length === 0) {
            this.tenantsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No tenants found. Click "Add Tenant" to get started!</td></tr>';
            return;
        }

        let html = '';
        tenants.forEach(tenant => {
            const property = properties.find(p => p.id === tenant.propertyId) || { title: 'Unknown', address: '' };
            const initials = tenant.firstName.charAt(0) + tenant.lastName.charAt(0);
            const statusClass = tenant.status.toLowerCase();
            const balanceClass = tenant.balance > 0 ? 'balance-negative' : 'balance-positive';
            
            html += `
                <tr>
                    <td>
                        <div class="tenant-info">
                            <div class="tenant-avatar">${initials}</div>
                            <div class="tenant-details">
                                <div class="tenant-name">${tenant.firstName} ${tenant.lastName}</div>
                                <div class="tenant-email">${tenant.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="property-name">${property.title}</div>
                        <div class="property-unit">Unit ${tenant.unit}</div>
                    </td>
                    <td>
                        <div class="lease-dates">
                            <span class="lease-date">${this.formatDate(tenant.leaseStart)} to</span>
                            <span class="lease-date">${this.formatDate(tenant.leaseEnd)}</span>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${statusClass}">${tenant.status}</span>
                    </td>
                    <td>
                        <span class="${balanceClass}">$${tenant.balance.toLocaleString()}</span>
                    </td>
                    <td class="text-right">
                        <button class="action-btn" onclick="uiManager.deleteTenant(${tenant.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ellipsis-icon">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="12" cy="5" r="1"></circle>
                                <circle cx="12" cy="19" r="1"></circle>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        this.tenantsTableBody.innerHTML = html;
    }

    displayProperties(properties) {
        if (this.propertyCount) {
            this.propertyCount.textContent = `${properties.length} properties found`;
        }
        
        if (properties.length === 0) {
            this.propertiesGrid.innerHTML = '<div class="empty-state">No properties found. Click "Add Property" to get started!</div>';
            return;
        }

        let html = '';
        properties.forEach(property => {
            const statusClass = property.status.toLowerCase();
            
            html += `
                <div class="property-card">
                    <div class="property-image">
                        <img src="${property.image || this.getDefaultImage()}" 
                             alt="${property.title}" 
                             class="property-img">
                        <span class="property-status status-${statusClass}">${property.status}</span>
                    </div>
                    <div class="property-details">
                        <div class="property-header">
                            <div>
                                <h4 class="property-title">${property.title}</h4>
                                <div class="property-location">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="location-icon">
                                        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                                        <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span>${property.address}, ${property.city}</span>
                                </div>
                            </div>
                        </div>
                        <div class="property-stats">
                            <div class="stat">
                                <p class="stat-label">Rent</p>
                                <p class="stat-value stat-rent">$${property.price}/mo</p>
                            </div>
                            <div class="stat">
                                <p class="stat-label">Units</p>
                                <p class="stat-value">${property.units} Units</p>
                            </div>
                        </div>
                        <div class="property-footer">
                            <span class="property-date">Added: ${this.formatDate(property.dateAdded)}</span>
                            <button class="delete-btn" onclick="uiManager.deleteProperty(${property.id})">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.propertiesGrid.innerHTML = html;
    }

    async addTenant() {
        const tenant = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            propertyId: parseInt(document.getElementById('property').value),
            unit: document.getElementById('unit').value,
            leaseStart: document.getElementById('leaseStart').value,
            leaseEnd: document.getElementById('leaseEnd').value,
            rent: parseInt(document.getElementById('rent').value),
            balance: parseInt(document.getElementById('balance').value) || 0,
            status: document.getElementById('tenantStatus').value
        };

        // Validate required fields
        if (!tenant.firstName || !tenant.lastName || !tenant.email || !tenant.propertyId || !tenant.unit || !tenant.leaseStart || !tenant.leaseEnd || !tenant.rent) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            await this.db.addTenant(tenant);
            this.closeModal('tenant');
            await this.loadTenants();
            this.showToast('Tenant added successfully!', 'success');
        } catch (error) {
            this.showToast('Error adding tenant: ' + error, 'error');
        }
    }

    async addProperty() {
        const property = {
            title: document.getElementById('propertyTitle').value,
            address: document.getElementById('propertyAddress').value,
            city: document.getElementById('propertyCity').value,
            price: parseInt(document.getElementById('propertyPrice').value),
            units: parseInt(document.getElementById('propertyUnits').value),
            status: document.getElementById('propertyStatus').value,
            image: document.getElementById('propertyImage').value || null
        };

        // Validate required fields
        if (!property.title || !property.address || !property.city || !property.price || !property.units) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            await this.db.addProperty(property);
            this.closeModal('property');
            await this.loadProperties();
            await this.loadPropertyOptions(); // Refresh property options for tenant form
            this.showToast('Property added successfully!', 'success');
        } catch (error) {
            this.showToast('Error adding property: ' + error, 'error');
        }
    }

    async deleteTenant(id) {
        if (!confirm('Are you sure you want to delete this tenant?')) return;

        try {
            await this.db.deleteTenant(id);
            await this.loadTenants();
            this.showToast('Tenant deleted successfully!', 'success');
        } catch (error) {
            this.showToast('Error deleting tenant: ' + error, 'error');
        }
    }

    async deleteProperty(id) {
        if (!confirm('Are you sure you want to delete this property?')) return;

        try {
            await this.db.deleteProperty(id);
            await this.loadProperties();
            this.showToast('Property deleted successfully!', 'success');
        } catch (error) {
            this.showToast('Error deleting property: ' + error, 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getDefaultImage() {
        const images = [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&h=300&q=80',
            'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400&h=300&q=80',
            'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=400&h=300&q=80'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }

    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Global reference for onclick handlers
let uiManager;

// Initialize the application
async function initApp() {
    try {
        const db = new TenantDatabase();
        await db.init();
        await db.initializeSampleData();
        
        uiManager = new UIManager(db);
        window.uiManager = uiManager; // Make available globally for onclick handlers
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp(); // DOM already loaded
}