// DieCast Tracker - JavaScript functionality
class DieCastTracker {
    constructor() {
        this.currentData = [];
        this.filteredData = [];
        this.columns = [];
        this.currentEditingRow = null;
        this.currentDeletingRow = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
        this.setupModals();
    }

    setupModals() {
        // Edit modal
        document.getElementById('close-edit-modal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancel-edit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('edit-form').addEventListener('submit', (e) => this.handleEditSubmit(e));
        
        // Delete modal
        document.getElementById('cancel-delete').addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('confirm-delete').addEventListener('click', () => this.confirmDelete());
        
        // Close modals on backdrop click
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') this.closeEditModal();
        });
        document.getElementById('delete-modal').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal') this.closeDeleteModal();
        });
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        clearSearchBtn.addEventListener('click', () => this.clearSearch());

        // Control buttons
        document.getElementById('refresh-btn').addEventListener('click', () => this.loadData());
        document.getElementById('export-btn').addEventListener('click', () => this.exportCSV());

        // Enter key for search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });
    }

    async loadData() {
        this.showLoading();
        this.hideError();
        
        try {
            const response = await fetch('/api/data');
            const result = await response.json();
            
            if (result.success) {
                this.currentData = result.data;
                this.filteredData = [...this.currentData];
                this.columns = result.columns || [];
                this.updateStats(result);
                this.renderTable(this.filteredData, result.columns);
                this.hideLoading();
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError(`Failed to load data: ${error.message}`);
            this.hideLoading();
        }
    }

    handleSearch(query) {
        const searchBtn = document.getElementById('clear-search');
        
        if (query.trim() === '') {
            this.filteredData = [...this.currentData];
            searchBtn.style.display = 'none';
        } else {
            searchBtn.style.display = 'block';
            this.filteredData = this.currentData.filter(item => 
                Object.values(item).some(value => 
                    value.toString().toLowerCase().includes(query.toLowerCase())
                )
            );
        }
        
        this.updateFilteredCount();
        this.renderTable(this.filteredData);
    }

    clearSearch() {
        const searchInput = document.getElementById('search-input');
        const clearSearchBtn = document.getElementById('clear-search');
        
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        this.filteredData = [...this.currentData];
        this.updateFilteredCount();
        this.renderTable(this.filteredData);
    }

    updateStats(result) {
        document.getElementById('total-models').textContent = result.total_records || 0;
        this.updateFilteredCount();
    }

    updateFilteredCount() {
        document.getElementById('filtered-count').textContent = this.filteredData.length;
    }

    renderTable(data, columns = null) {
        const table = document.getElementById('data-table');
        const tableHeader = document.getElementById('table-header');
        const tableBody = document.getElementById('table-body');
        const noDataDiv = document.getElementById('no-data');

        if (data.length === 0) {
            table.style.display = 'none';
            noDataDiv.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        noDataDiv.style.display = 'none';

        // Get columns from data if not provided
        if (!columns && data.length > 0) {
            columns = Object.keys(data[0]);
        }

        // Render header
        tableHeader.innerHTML = '';
        const headerRow = document.createElement('tr');
        columns.forEach(column => {
            const th = document.createElement('th');
            th.className = 'px-3 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap';
            th.textContent = this.formatColumnName(column);
            headerRow.appendChild(th);
        });
        // Add Actions column header
        const actionsTh = document.createElement('th');
        actionsTh.className = 'px-3 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap';
        actionsTh.textContent = 'Actions';
        headerRow.appendChild(actionsTh);
        tableHeader.appendChild(headerRow);

        // Render body
        tableBody.innerHTML = '';
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.className = index % 2 === 0 ? 'bg-white hover:bg-gray-50 transition-colors' : 'bg-gray-50 hover:bg-gray-100 transition-colors';
            columns.forEach(column => {
                const td = document.createElement('td');
                td.className = 'px-3 py-3 text-sm text-gray-700';
                const value = row[column];
                td.textContent = this.formatCellValue(value);
                tr.appendChild(td);
            });
            
            // Add Actions column
            const actionsTd = document.createElement('td');
            actionsTd.className = 'px-3 py-3 text-center whitespace-nowrap';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'inline-flex items-center justify-center px-3 py-1.5 mr-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-lg text-xs font-medium hover:from-orange-500 hover:to-orange-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit Model';
            editBtn.onclick = () => this.editModel(row);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Delete Model';
            deleteBtn.onclick = () => this.deleteModel(row);
            
            actionsTd.appendChild(editBtn);
            actionsTd.appendChild(deleteBtn);
            tr.appendChild(actionsTd);
            
            tableBody.appendChild(tr);
        });
    }

    formatColumnName(column) {
        return column
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    formatCellValue(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value.toString();
    }

    exportCSV() {
        if (this.filteredData.length === 0) {
            alert('No data to export');
            return;
        }

        const columns = Object.keys(this.filteredData[0]);
        const csvContent = [];
        
        // Header
        csvContent.push(columns.map(col => `"${col}"`).join(','));
        
        // Data rows
        this.filteredData.forEach(row => {
            const values = columns.map(col => {
                const value = row[col];
                return `"${value?.toString().replace(/"/g, '""') || ''}"`;
            });
            csvContent.push(values.join(','));
        });

        const csv = csvContent.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `diecast_collection_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('data-table').style.display = 'none';
        document.getElementById('no-data').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        document.getElementById('data-table').style.display = 'none';
        document.getElementById('no-data').style.display = 'none';
    }

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }

    async editModel(row) {
        this.currentEditingRow = row;
        this.showEditModal(row);
    }

    showEditModal(row) {
        const modal = document.getElementById('edit-modal');
        const formFields = document.getElementById('edit-form-fields');
        
        // Clear previous fields
        formFields.innerHTML = '';
        
        // Get all columns - combine columns array with row keys to ensure we get ALL fields
        const allColumns = new Set([...this.columns, ...Object.keys(row)]);
        const columnsToShow = Array.from(allColumns).filter(col => col && col.trim() !== '');
        
        console.log('Available columns:', columnsToShow);
        console.log('Row data keys:', Object.keys(row));
        console.log('Columns array:', this.columns);
        
        // Generate form fields for all columns except S.No
        columnsToShow.forEach(column => {
            // Skip serial number and any empty column names
            if (column === 'S.No' || !column || column.trim() === '') return;
            
            // Get value from row, handling different possible key formats
            let value = row[column];
            if (value === null || value === undefined || value === '') {
                value = '';
            } else {
                value = String(value);
            }
            
            // Create safe ID from column name (no spaces, only letters/numbers/_/-)
            const safeId = 'edit-' + column.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
            
            console.log(`Creating field for "${column}": value = "${value}" (safeId: "${safeId}")`);
            
            // Create container div
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'mb-4';
            
            // Create label element
            const label = document.createElement('label');
            label.setAttribute('for', safeId);
            label.className = 'block text-sm font-medium text-gray-700 mb-2';
            label.textContent = column;
            
            // Create input element
            const input = document.createElement('input');
            input.type = 'text';
            input.id = safeId;
            input.name = column; // Keep original column name for FormData
            
            // Set value explicitly and ensure it's displayed
            input.value = value;
            input.defaultValue = value;
            
            // Set all attributes to ensure input is visible and editable
            input.className = 'edit-modal-input w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all bg-white text-gray-900 placeholder-gray-400';
            // Force visible styles with !important equivalent inline styles
            input.style.setProperty('background-color', '#ffffff', 'important');
            input.style.setProperty('color', '#111827', 'important');
            input.style.setProperty('border', '2px solid #d1d5db', 'important');
            input.style.setProperty('padding', '0.625rem 1rem', 'important');
            input.style.setProperty('min-height', '2.5rem', 'important');
            input.style.setProperty('width', '100%', 'important');
            input.style.setProperty('display', 'block', 'important');
            input.style.setProperty('opacity', '1', 'important');
            input.style.setProperty('visibility', 'visible', 'important');
            input.style.setProperty('pointer-events', 'auto', 'important');
            input.style.setProperty('cursor', 'text', 'important');
            input.placeholder = `Enter ${column}`;
            input.readOnly = false;
            input.disabled = false;
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('tabindex', '0');
            
            // Ensure input is editable and visible
            input.addEventListener('focus', function() {
                this.style.borderColor = '#f97316'; // orange-500
                this.style.outline = 'none';
            });
            
            input.addEventListener('blur', function() {
                this.style.borderColor = '#d1d5db'; // gray-300
            });
            
            input.addEventListener('input', function() {
                console.log(`Input "${column}" changed to:`, this.value);
            });
            
            // Append label and input to fieldDiv
            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            
            // Verify the input was created correctly
            console.log(`Input created for "${column}":`, {
                id: input.id,
                name: input.name,
                value: input.value,
                defaultValue: input.defaultValue,
                readOnly: input.readOnly,
                disabled: input.disabled,
                computedDisplay: window.getComputedStyle(input).display,
                computedHeight: window.getComputedStyle(input).height
            });
            
            // Append fieldDiv to formFields
            formFields.appendChild(fieldDiv);
        });
        
        console.log('Form fields created:', formFields.children.length);
        
        // Verify inputs are created and editable
        const allInputs = formFields.querySelectorAll('input[type="text"]');
        console.log('Total input fields found:', allInputs.length);
        allInputs.forEach((input, index) => {
            console.log(`Input ${index + 1}:`, {
                id: input.id,
                name: input.name,
                value: input.value,
                readOnly: input.readOnly,
                disabled: input.disabled,
                className: input.className
            });
        });
        
        // Focus on first input when modal opens
        if (allInputs.length > 0) {
            setTimeout(() => {
                allInputs[0].focus();
            }, 100);
        }
        
        modal.classList.remove('hidden');
    }

    closeEditModal() {
        const modal = document.getElementById('edit-modal');
        modal.classList.add('hidden');
        this.currentEditingRow = null;
    }

    async handleEditSubmit(event) {
        event.preventDefault();
        
        if (!this.currentEditingRow) return;
        
        const formData = new FormData(event.target);
        const updates = {};
        
        // Use FormData to collect all inputs - this avoids fragile getElementById lookups
        for (const [name, value] of formData.entries()) {
            if (name === 'S.No' || !name || name.trim() === '') continue;
            
            const newValue = String(value || '').trim();
            const oldValue = String(this.currentEditingRow[name] ?? '').trim();
            
            if (newValue !== oldValue) {
                updates[name] = newValue;
            }
        }
        
        if (Object.keys(updates).length === 0) {
            alert('No changes to save');
            return;
        }
        
        try {
            const response = await fetch('/api/update-model', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serial_number: this.currentEditingRow['S.No'],
                    updates: updates
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Success: ' + result.message);
                this.closeEditModal();
                this.loadData(); // Refresh the data
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating model:', error);
            alert('Failed to update model: ' + error.message);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async deleteModel(row) {
        this.currentDeletingRow = row;
        this.showDeleteModal(row);
    }

    showDeleteModal(row) {
        const modal = document.getElementById('delete-modal');
        const modelInfo = document.getElementById('delete-model-info');
        const confirmInput = document.getElementById('delete-confirm-input');
        
        // Display model information
        const modelName = row['Model Name'] || 'Unknown';
        const serialNumber = row['S.No'];
        
        modelInfo.innerHTML = `
            <div class="space-y-1">
                <div><strong>Serial Number:</strong> ${serialNumber}</div>
                <div><strong>Model Name:</strong> ${this.escapeHtml(String(modelName))}</div>
                ${this.columns.filter(c => c !== 'S.No' && c !== 'Model Name' && row[c]).map(c => 
                    `<div><strong>${c}:</strong> ${this.escapeHtml(String(row[c]))}</div>`
                ).join('')}
            </div>
        `;
        
        // Clear confirmation input
        confirmInput.value = '';
        
        modal.classList.remove('hidden');
        confirmInput.focus();
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.classList.add('hidden');
        this.currentDeletingRow = null;
        document.getElementById('delete-confirm-input').value = '';
    }

    async confirmDelete() {
        if (!this.currentDeletingRow) return;
        
        const confirmInput = document.getElementById('delete-confirm-input');
        if (confirmInput.value !== 'DELETE') {
            alert('Please type DELETE to confirm');
            return;
        }
        
        const serialNumber = this.currentDeletingRow['S.No'];
        
        try {
            const response = await fetch('/api/delete-model', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serial_number: serialNumber
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Success: ' + result.message);
                this.closeDeleteModal();
                this.loadData(); // Refresh the data
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting model:', error);
            alert('Failed to delete model: ' + error.message);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DieCastTracker();
    
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        });
    }
    
    // Add loading animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

