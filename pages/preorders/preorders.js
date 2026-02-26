// Preorders Page JavaScript
class PreordersManager {
    constructor() {
        this.preorders = [];
        this.filters = {
            seller: '',
            status: '',
            eta: '',
            etaMode: 'before'
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadPreorders();
        this.loadStatistics();
    }

    bindEvents() {
        // Add preorder button
        document.getElementById('add-preorder-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadPreorders();
            this.loadStatistics();
        });
        
        // Sidebar toggle button (mobile)
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (sidebarToggle && sidebar && sidebarOverlay) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('-translate-x-full');
                sidebarOverlay.classList.toggle('hidden');
            });
        }

        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('preorder-form').addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Search/Filter events
        document.getElementById('filter-seller').addEventListener('change', (e) => {
            this.filters.seller = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-eta').addEventListener('change', (e) => {
            this.filters.eta = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filter-eta-mode').addEventListener('change', (e) => {
            this.filters.etaMode = e.target.value;
            this.applyFilters();
        });

        document.getElementById('clear-filters-btn').addEventListener('click', () => {
            this.clearFilters();
        });

        // Sidebar collapse button (desktop)
        this.initSidebarCollapse();

        // Close modal on outside click
        document.getElementById('preorder-modal').addEventListener('click', (e) => {
            if (e.target.id === 'preorder-modal') {
                this.closeModal();
            }
        });
        
        // Sidebar collapse button (desktop)
        this.initSidebarCollapse();
    }
    
    initSidebarCollapse() {
        const sidebar = document.getElementById('sidebar');
        const collapseBtn = document.getElementById('sidebar-collapse-btn');
        const mainContent = document.getElementById('main-content');
        
        if (!sidebar || !collapseBtn || !mainContent) return;
        
        // Load saved state from localStorage
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.remove('md:ml-64');
            mainContent.classList.add('md:ml-20');
        }
        
        // Toggle collapse on button click
        collapseBtn.addEventListener('click', () => {
            const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
            
            if (isCurrentlyCollapsed) {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('md:ml-20');
                mainContent.classList.add('md:ml-64');
                localStorage.setItem('sidebarCollapsed', 'false');
            } else {
                sidebar.classList.add('collapsed');
                mainContent.classList.remove('md:ml-64');
                mainContent.classList.add('md:ml-20');
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        });
    }

    async loadPreorders() {
        try {
            const response = await fetch('/api/preorders');
            const result = await response.json();

            if (result.success) {
                this.preorders = result.data;
                this.populateSellerFilter();
                this.applyFilters();
            } else {
                throw new Error(result.error || 'Failed to load preorders');
            }
        } catch (error) {
            console.error('Error loading preorders:', error);
            this.showError(`Failed to load preorders: ${error.message}`);
        }
    }

    async loadStatistics() {
        // We'll calculate stats locally based on preorders
        this.calculateDynamicStats();
    }

    populateSellerFilter() {
        const sellerFilter = document.getElementById('filter-seller');
        const sellers = [...new Set(this.preorders.map(p => p.Seller).filter(s => s))].sort();
        
        // Keep "All Sellers" option
        sellerFilter.innerHTML = '<option value="" class="bg-indigo-900">All Sellers</option>';
        
        sellers.forEach(seller => {
            const option = document.createElement('option');
            option.value = seller;
            option.textContent = seller;
            option.className = 'bg-indigo-900';
            sellerFilter.appendChild(option);
        });
        
        // Restore filter value if it was set
        sellerFilter.value = this.filters.seller;
    }

    applyFilters() {
        const filtered = this.preorders.filter(preorder => {
            const matchesSeller = !this.filters.seller || preorder.Seller === this.filters.seller;
            const matchesStatus = !this.filters.status || (preorder['Delivery Status'] || 'Pending') === this.filters.status;
            
            let matchesETA = true;
            if (this.filters.eta && preorder.ETA) {
                const preorderMonth = preorder.ETA.substring(0, 7);
                if (this.filters.etaMode === 'before') {
                    matchesETA = preorderMonth <= this.filters.eta;
                } else {
                    matchesETA = preorderMonth === this.filters.eta;
                }
            } else if (this.filters.eta) {
                matchesETA = false;
            }
            
            return matchesSeller && matchesStatus && matchesETA;
        });

        this.renderPreorders(filtered);
        this.calculateDynamicStats(filtered);
    }

    clearFilters() {
        this.filters.seller = '';
        this.filters.status = '';
        this.filters.eta = '';
        this.filters.etaMode = 'before';
        
        document.getElementById('filter-seller').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-eta').value = '';
        document.getElementById('filter-eta-mode').value = 'before';
        
        this.applyFilters();
    }

    calculateDynamicStats(data = this.preorders) {
        let totalValue = 0;
        let poAmount = 0;
        let onArrival = 0;
        let paymentDone = 0;
        let paymentRemaining = 0;

        const safeParse = (val) => {
            if (!val || val === '') return 0;
            const num = parseFloat(String(val).replace(/[₹,$\s]/g, ''));
            return isNaN(num) ? 0 : num;
        };

        data.forEach(p => {
            const total = safeParse(p['Total Price']);
            const po = safeParse(p['PO Amount']);
            const arrival = safeParse(p['On Arrival Amount']);
            const status = (p['Delivery Status'] || 'Pending').toLowerCase();

            totalValue += total;
            poAmount += po;
            onArrival += arrival;
            
            // Payment Done = All PO Amount + On Arrival Amount for Paid/Shipped/Delivered items
            paymentDone += po;
            if (['paid', 'shipped', 'delivered'].includes(status)) {
                paymentDone += arrival;
            } else if (status === 'pending') {
                paymentRemaining += arrival;
            }
        });

        this.renderStatistics({
            total_preorders: data.length,
            total_value: totalValue,
            total_po_amount: poAmount,
            total_on_arrival: onArrival,
            payment_done: paymentDone,
            payment_remaining: paymentRemaining
        });
    }

    formatAmount(value) {
        if (!value && value !== 0) return '0';
        const num = parseFloat(value);
        if (isNaN(num)) return '0';
        // Format with locale, but remove .00 if it's a whole number
        const formatted = num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return formatted;
    }

    renderStatistics(stats) {
        const section = document.getElementById('statistics-section');
        if (!section) {
            console.error('Statistics section not found in DOM');
            return;
        }
        
        if (!stats) {
            stats = {
                total_preorders: 0,
                total_value: 0,
                total_po_amount: 0,
                total_on_arrival: 0,
                payment_done: 0,
                payment_remaining: 0
            };
        }
        
        section.innerHTML = `
            <div class="stat-card">
                <h3>Total Preorders</h3>
                <div class="value">${stats.total_preorders || 0}</div>
            </div>
            <div class="stat-card">
                <h3>Total Value</h3>
                <div class="value">₹${this.formatAmount(stats.total_value || 0)}</div>
            </div>
            <div class="stat-card">
                <h3>PO Amount</h3>
                <div class="value">₹${this.formatAmount(stats.total_po_amount || 0)}</div>
            </div>
            <div class="stat-card">
                <h3>On Arrival</h3>
                <div class="value">₹${this.formatAmount(stats.total_on_arrival || 0)}</div>
            </div>
            <div class="stat-card">
                <h3>Payment Done</h3>
                <div class="value">₹${this.formatAmount(stats.payment_done || 0)}</div>
            </div>
            <div class="stat-card">
                <h3>Payment Remaining</h3>
                <div class="value">₹${this.formatAmount(stats.payment_remaining || 0)}</div>
            </div>
        `;
    }

    renderPreorders(data = this.preorders) {
        const tbody = document.getElementById('preorders-tbody');
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-8 text-white/60">
                        No matching preorders found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.map(preorder => {
            const statusClass = this.getStatusClass(preorder['Delivery Status'] || 'Pending');
            return `
                <tr>
                    <td class="py-3 px-4">${preorder['S.No'] || 'N/A'}</td>
                    <td class="py-3 px-4">${preorder.Seller || 'N/A'}</td>
                    <td class="py-3 px-4">${preorder.Models || 'N/A'}</td>
                    <td class="py-3 px-4">${preorder.ETA ? (() => {
                        const etaMonth = preorder.ETA.length >= 7 ? preorder.ETA.substring(0, 7) : preorder.ETA;
                        if (etaMonth.match(/^\d{4}-\d{2}$/)) {
                            const [year, month] = etaMonth.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${monthNames[parseInt(month) - 1]} ${year}`;
                        }
                        return etaMonth;
                    })() : 'N/A'}</td>
                    <td class="py-3 px-4">${preorder['Total Price'] ? '₹' + this.formatAmount(preorder['Total Price']) : 'N/A'}</td>
                    <td class="py-3 px-4">${preorder['PO Amount'] ? '₹' + this.formatAmount(preorder['PO Amount']) : 'N/A'}</td>
                    <td class="py-3 px-4">${preorder['On Arrival Amount'] ? '₹' + this.formatAmount(preorder['On Arrival Amount']) : 'N/A'}</td>
                    <td class="py-3 px-4">
                        <div class="relative inline-block">
                            <select class="status-dropdown ${statusClass}" data-serial="${preorder['S.No']}" onchange="preordersManager.updateStatus(this.dataset.serial, this.value)" title="Change delivery status">
                                <option value="Pending" ${(preorder['Delivery Status'] || 'Pending') === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Paid" ${(preorder['Delivery Status'] || 'Pending') === 'Paid' ? 'selected' : ''}>Paid</option>
                                <option value="Shipped" ${(preorder['Delivery Status'] || 'Pending') === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${(preorder['Delivery Status'] || 'Pending') === 'Delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none status-dropdown-arrow"></i>
                        </div>
                    </td>
                    <td class="py-3 px-4">
                        <div class="flex items-center gap-2">
                            <button class="btn-action btn-edit inline-flex items-center justify-center" data-serial="${preorder['S.No']}" onclick="preordersManager.editPreorder(this.dataset.serial)" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action btn-delete inline-flex items-center justify-center" data-serial="${preorder['S.No']}" onclick="preordersManager.deletePreorder(this.dataset.serial)" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusClass(status) {
        const statusLower = status.toLowerCase();
        if (statusLower === 'delivered') {
            return 'status-delivered';
        } else if (statusLower === 'shipped') {
            return 'status-shipped';
        } else if (statusLower === 'paid') {
            return 'status-paid';
        } else {
            return 'status-pending';
        }
    }

    openModal(serialNumber = null) {
        const modal = document.getElementById('preorder-modal');
        const form = document.getElementById('preorder-form');
        const title = document.getElementById('modal-title');
        const serialInput = document.getElementById('edit-serial');

        if (serialNumber !== null && serialNumber !== undefined && serialNumber !== '') {
            // Edit mode - convert to number for comparison
            const serialNum = typeof serialNumber === 'string' ? parseInt(serialNumber, 10) : serialNumber;
            const preorder = this.preorders.find(p => {
                const pSerial = typeof p['S.No'] === 'string' ? parseInt(p['S.No'], 10) : p['S.No'];
                return pSerial === serialNum;
            });
            
            if (preorder) {
                title.textContent = 'Edit Preorder';
                if (serialInput) serialInput.value = serialNum;
                
                const sellerEl = document.getElementById('seller');
                const modelsEl = document.getElementById('models');
                const etaEl = document.getElementById('eta');
                const totalPriceEl = document.getElementById('total-price');
                const poAmountEl = document.getElementById('po-amount');
                const onArrivalEl = document.getElementById('on-arrival-amount');
                const deliveryStatusEl = document.getElementById('delivery-status');
                
                if (sellerEl) sellerEl.value = preorder.Seller || '';
                if (modelsEl) modelsEl.value = preorder.Models || '';
                if (etaEl) etaEl.value = preorder.ETA || '';
                if (totalPriceEl) totalPriceEl.value = preorder['Total Price'] || '';
                if (poAmountEl) poAmountEl.value = preorder['PO Amount'] || '';
                if (onArrivalEl) onArrivalEl.value = preorder['On Arrival Amount'] || '';
                if (deliveryStatusEl) deliveryStatusEl.value = preorder['Delivery Status'] || 'Pending';
            } else {
                console.error('Preorder not found for serial number:', serialNumber);
                this.showError('Preorder not found!');
                return;
            }
        } else {
            // Add mode
            title.textContent = 'Add Preorder';
            serialInput.value = '';
            form.reset();
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('preorder-modal');
        modal.classList.add('hidden');
        document.getElementById('preorder-form').reset();
        document.getElementById('edit-serial').value = '';
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const serialNumber = document.getElementById('edit-serial').value;
        
        const data = {
            seller: formData.get('seller').trim(),
            models: formData.get('models').trim(),
            eta: formData.get('eta') || null,
            total_price: formData.get('total-price') || null,
            po_amount: formData.get('po-amount') || null,
            on_arrival_amount: formData.get('on-arrival-amount') || null,
            delivery_status: formData.get('delivery-status') || 'Pending'
        };

        // Validate required fields
        if (!data.seller || !data.models) {
            this.showError('Please fill in all required fields (Seller and Models).');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            let response;
            if (serialNumber) {
                // Update existing preorder
                response = await fetch(`/api/preorders/${serialNumber}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Add new preorder
                response = await fetch('/api/preorders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                this.closeModal();
                this.loadPreorders();
                this.loadStatistics();
            } else {
                throw new Error(result.error || 'Failed to save preorder');
            }
        } catch (error) {
            console.error('Error saving preorder:', error);
            this.showError(`Failed to save preorder: ${error.message}`);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    editPreorder(serialNumber) {
        // Convert to number if needed
        const serial = typeof serialNumber === 'string' ? parseInt(serialNumber) : serialNumber;
        this.openModal(serial);
    }

    async updateStatus(serialNumber, newStatus) {
        // Convert to number if needed
        const serial = typeof serialNumber === 'string' ? parseInt(serialNumber) : serialNumber;
        const preorder = this.preorders.find(p => {
            const pSerial = typeof p['S.No'] === 'string' ? parseInt(p['S.No'], 10) : p['S.No'];
            return pSerial === serial;
        });
        
        if (!preorder) {
            this.showError('Preorder not found!');
            return;
        }

        // Show loading state on the dropdown
        const dropdown = document.querySelector(`select[data-serial="${serial}"]`);
        const originalValue = dropdown.value;
        dropdown.disabled = true;

        try {
            // Update only the delivery status
            const response = await fetch(`/api/preorders/${serial}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    seller: preorder.Seller || '',
                    models: preorder.Models || '',
                    eta: preorder.ETA || null,
                    total_price: preorder['Total Price'] || null,
                    po_amount: preorder['PO Amount'] || null,
                    on_arrival_amount: preorder['On Arrival Amount'] || null,
                    delivery_status: newStatus
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update the dropdown class to match new status
                dropdown.className = `status-dropdown ${this.getStatusClass(newStatus)}`;
                this.loadPreorders();
                this.loadStatistics();
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showError(`Failed to update status: ${error.message}`);
            // Revert dropdown value on error
            dropdown.value = originalValue;
        } finally {
            dropdown.disabled = false;
        }
    }

    async deletePreorder(serialNumber) {
        // Convert to number if needed
        const serial = typeof serialNumber === 'string' ? parseInt(serialNumber) : serialNumber;
        const preorder = this.preorders.find(p => String(p['S.No']) === String(serial));
        if (!preorder) return;

        if (!confirm(`Are you sure you want to delete preorder #${serial}?\n\nSeller: ${preorder.Seller}\nModels: ${preorder.Models}\n\nThis action cannot be undone.`)) {
            return;
        }

        // Double confirmation
        if (!confirm('Final confirmation: Type "DELETE" to confirm deletion.')) {
            return;
        }

        try {
            const response = await fetch(`/api/preorders/${serial}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                this.loadPreorders();
                this.loadStatistics();
            } else {
                throw new Error(result.error || 'Failed to delete preorder');
            }
        } catch (error) {
            console.error('Error deleting preorder:', error);
            this.showError(`Failed to delete preorder: ${error.message}`);
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
        this.hideError();
        
        setTimeout(() => {
            this.hideSuccess();
        }, 5000);
    }

    hideSuccess() {
        const successDiv = document.getElementById('success-message');
        successDiv.classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        this.hideSuccess();
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.add('hidden');
    }
}

// Initialize the preorders manager when DOM is loaded
let preordersManager;
document.addEventListener('DOMContentLoaded', () => {
    preordersManager = new PreordersManager();
});

