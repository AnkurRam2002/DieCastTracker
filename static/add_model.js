// Add Model Form JavaScript
class AddModelForm {
    constructor() {
        this.dropdownOptions = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDropdownOptions();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('add-model-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Cancel button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            window.location.href = '/';
        });

        // Series dropdown change event
        document.getElementById('series').addEventListener('change', (e) => {
            this.handleSeriesChange(e.target.value);
        });
    }

    async loadDropdownOptions() {
        try {
            const response = await fetch('/api/dropdown-options');
            const result = await response.json();

            if (result.success) {
                this.dropdownOptions = result;
                this.populateSeriesDropdown(result.series);
            } else {
                throw new Error(result.error || 'Failed to load dropdown options');
            }
        } catch (error) {
            console.error('Error loading dropdown options:', error);
            this.showError(`Failed to load dropdown options: ${error.message}`);
        }
    }

    populateSeriesDropdown(seriesData) {
        const seriesSelect = document.getElementById('series');
        seriesSelect.innerHTML = '<option value="">Select Series...</option>';
        
        Object.keys(seriesData).forEach(series => {
            const option = document.createElement('option');
            option.value = series;
            option.textContent = series;
            seriesSelect.appendChild(option);
        });
    }

    handleSeriesChange(selectedSeries) {
        const subseriesSelect = document.getElementById('subseries');
        
        if (!selectedSeries) {
            subseriesSelect.innerHTML = '<option value="">Select Series first...</option>';
            subseriesSelect.disabled = true;
            return;
        }

        const subseries = this.dropdownOptions.series[selectedSeries];
        subseriesSelect.innerHTML = '<option value="">Select Subseries...</option>';
        
        subseries.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subseriesSelect.appendChild(option);
        });
        
        subseriesSelect.disabled = false;
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
            model_name: formData.get('model_name').trim(),
            series: formData.get('series'),
            subseries: formData.get('subseries')
        };

        // Validate required fields
        if (!data.model_name || !data.series || !data.subseries) {
            this.showError('Please fill in all required fields.');
            return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submit-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/add-model', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                this.resetForm();
            } else {
                throw new Error(result.error || 'Failed to add model');
            }
        } catch (error) {
            console.error('Error adding model:', error);
            this.showError(`Failed to add model: ${error.message}`);
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    resetForm() {
        document.getElementById('add-model-form').reset();
        
        // Reset subseries dropdown
        const subseriesSelect = document.getElementById('subseries');
        subseriesSelect.innerHTML = '<option value="">Select Series first...</option>';
        subseriesSelect.disabled = true;
        
        // Clear any error messages
        this.hideError();
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        this.hideError();
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideSuccess();
        }, 5000);
    }

    hideSuccess() {
        document.getElementById('success-message').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        this.hideSuccess();
    }

    hideError() {
        document.getElementById('error-message').style.display = 'none';
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AddModelForm();
});

// Add some visual feedback for form interactions
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