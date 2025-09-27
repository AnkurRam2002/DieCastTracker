// DieCast Tracker - JavaScript functionality
class DieCastTracker {
    constructor() {
        this.currentData = [];
        this.filteredData = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadData();
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
            th.textContent = this.formatColumnName(column);
            headerRow.appendChild(th);
        });
        tableHeader.appendChild(headerRow);

        // Render body
        tableBody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(column => {
                const td = document.createElement('td');
                const value = row[column];
                td.textContent = this.formatCellValue(value);
                tr.appendChild(td);
            });
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DieCastTracker();
});

// Add some visual feedback for loading states
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    
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