// Add Field Form Handler
class AddFieldForm {
    constructor() {
        this.init();
    }

    init() {
        this.loadCurrentFields();
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('add-field-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const suggestion = btn.getAttribute('data-suggestion');
                document.getElementById('field-name').value = suggestion;
                document.getElementById('field-name').focus();
            });
        });
    }

    async loadCurrentFields() {
        try {
            const response = await fetch('/api/data');
            const result = await response.json();
            
            if (result.success && result.columns) {
                this.displayCurrentFields(result.columns);
            }
        } catch (error) {
            console.error('Error loading current fields:', error);
        }
    }

    displayCurrentFields(columns) {
        const container = document.getElementById('current-fields');
        if (columns.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-4 text-gray-500">No fields found</div>';
            return;
        }

        container.innerHTML = columns.map(field => `
            <div class="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
                <i class="fas fa-columns text-purple-500 mb-1"></i>
                <div class="text-sm font-medium text-gray-700">${field}</div>
            </div>
        `).join('');
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const fieldName = document.getElementById('field-name').value.trim();
        const successMessage = document.getElementById('success-message');
        const errorMessage = document.getElementById('error-message');

        // Hide previous messages
        successMessage.classList.add('hidden');
        errorMessage.classList.add('hidden');

        if (!fieldName) {
            this.showError('Field name cannot be empty!');
            return;
        }

        if (fieldName.length > 50) {
            this.showError('Field name is too long (maximum 50 characters)');
            return;
        }

        // Check for invalid characters
        const invalidChars = ['/', '\\', '?', '*', '[', ']', ':', ';'];
        if (invalidChars.some(char => fieldName.includes(char))) {
            this.showError(`Field name contains invalid characters: ${invalidChars.join(', ')}`);
            return;
        }

        try {
            const response = await fetch('/api/add-field', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    field_name: fieldName
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.message);
                document.getElementById('add-field-form').reset();
                // Reload current fields
                setTimeout(() => this.loadCurrentFields(), 1000);
            } else {
                this.showError(result.error || 'Failed to add field');
            }
        } catch (error) {
            console.error('Error adding field:', error);
            this.showError('Failed to add field: ' + error.message);
        }
    }

    showSuccess(message) {
        const successMessage = document.getElementById('success-message');
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
        successMessage.classList.add('flex', 'items-center');
        
        // Scroll to message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        // Scroll to message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AddFieldForm();
});

