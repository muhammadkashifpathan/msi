document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addMedicineForm = document.getElementById('add-medicine-form');
    const inventoryBody = document.getElementById('inventory-body');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const exportCSVBtn = document.getElementById('export-csv');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const totalMedicinesEl = document.getElementById('total-medicines');
    const totalValueEl = document.getElementById('total-value');
    const emptyState = document.getElementById('empty-state');
    
    // Modal elements
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const editMedicineForm = document.getElementById('edit-medicine-form');
    const cancelEditBtn = document.getElementById('cancel-edit');
    
    // Confirmation modal elements
    const confirmModal = document.getElementById('confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // Toast notification
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Current medicine ID to delete
    let currentDeleteId = null;
    
    // Initialize medicines array from localStorage
    let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
    
    // Render initial inventory
    renderInventory();
    updateInventorySummary();
    
    // Event Listeners
    
    // Add medicine form submission
    addMedicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addMedicine();
    });
    
    // Search functionality
    searchInput.addEventListener('input', () => {
        renderInventory();
    });
    
    // Sort functionality
    sortSelect.addEventListener('change', () => {
        renderInventory();
    });
    
    // Edit medicine form submission
    editMedicineForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveMedicineEdit();
    });
    
    // Export to CSV
    exportCSVBtn.addEventListener('click', exportToCSV);
    
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Modal close buttons
    closeModalBtn.addEventListener('click', () => closeModal(editModal));
    cancelEditBtn.addEventListener('click', () => closeModal(editModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
    
    // Confirm delete button
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId !== null) {
            deleteMedicine(currentDeleteId);
            closeModal(confirmModal);
            currentDeleteId = null;
        }
    });
    
    // Functions
    
    /**
     * Adds a new medicine to the inventory
     */
    function addMedicine() {
        const nameInput = document.getElementById('medicine-name');
        const priceInput = document.getElementById('medicine-price');
        const quantityInput = document.getElementById('medicine-quantity');
        
        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const quantity = parseInt(quantityInput.value);
        
        if (!name || isNaN(price) || isNaN(quantity)) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }
        
        const newMedicine = {
            id: Date.now().toString(),
            name,
            price,
            quantity,
            dateTime: new Date().toISOString()
        };
        
        medicines.push(newMedicine);
        saveMedicines();
        renderInventory();
        updateInventorySummary();
        
        nameInput.value = '';
        priceInput.value = '';
        quantityInput.value = '';
        
        showToast('Medicine added successfully');
    }
    
    /**
     * Renders the inventory table based on search and sort criteria
     */
    function renderInventory() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const sortOption = sortSelect.value;
        
        // Filter medicines based on search term
        let filteredMedicines = medicines.filter(medicine => 
            medicine.name.toLowerCase().includes(searchTerm)
        );
        
        // Sort medicines based on selected option
        filteredMedicines = sortMedicines(filteredMedicines, sortOption);
        
        // Clear current table contents
        inventoryBody.innerHTML = '';
        
        // Show empty state if no medicines
        if (filteredMedicines.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            
            // Add medicines to table
            filteredMedicines.forEach(medicine => {
                const tr = document.createElement('tr');
                
                const dateObj = new Date(medicine.dateTime);
                const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                // Calculate total price for this medicine
                const totalPrice = medicine.price * medicine.quantity;
                
                tr.innerHTML = `
                    <td data-label="Medicine Name">${medicine.name}</td>
                    <td data-label="Price (PKR)">${medicine.price.toFixed(2)}</td>
                    <td data-label="Quantity">${medicine.quantity}</td>
                    <td data-label="Total Price (PKR)">${totalPrice.toFixed(2)}</td>
                    <td data-label="Date/Time">${formattedDate}</td>
                    <td data-label="Actions">
                        <div class="action-icons">
                            <button class="edit-btn" data-id="${medicine.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-btn" data-id="${medicine.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                `;
                
                inventoryBody.appendChild(tr);
            });
            
            // Add event listeners to edit and delete buttons
            addTableButtonListeners();
        }
    }
    
    /**
     * Sorts medicines based on the selected option
     */
    function sortMedicines(medList, sortOption) {
        switch(sortOption) {
            case 'name-asc':
                return [...medList].sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return [...medList].sort((a, b) => b.name.localeCompare(a.name));
            case 'price-asc':
                return [...medList].sort((a, b) => a.price - b.price);
            case 'price-desc':
                return [...medList].sort((a, b) => b.price - a.price);
            case 'date-asc':
                return [...medList].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            case 'date-desc':
                return [...medList].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
            default:
                return medList;
        }
    }
    
    /**
     * Updates the inventory summary (total medicines and total value)
     */
    function updateInventorySummary() {
        const totalMedicines = medicines.length;
        const totalValue = medicines.reduce((sum, medicine) => {
            return sum + (medicine.price * medicine.quantity);
        }, 0);
        
        totalMedicinesEl.textContent = totalMedicines;
        totalValueEl.textContent = `PKR ${totalValue.toFixed(2)}`;
    }
    
    /**
     * Adds event listeners to edit and delete buttons in the table
     */
    function addTableButtonListeners() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditModal(id);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openDeleteConfirmModal(id);
            });
        });
    }
    
    /**
     * Opens the edit modal and populates it with medicine data
     */
    function openEditModal(id) {
        const medicine = medicines.find(med => med.id === id);
        if (!medicine) return;
        
        document.getElementById('edit-id').value = medicine.id;
        document.getElementById('edit-name').value = medicine.name;
        document.getElementById('edit-price').value = medicine.price;
        document.getElementById('edit-quantity').value = medicine.quantity;
        
        openModal(editModal);
    }
    
    /**
     * Opens the delete confirmation modal
     */
    function openDeleteConfirmModal(id) {
        const medicine = medicines.find(med => med.id === id);
        if (!medicine) return;
        
        document.getElementById('confirm-message').textContent = 
            `Are you sure you want to delete "${medicine.name}" from inventory?`;
        
        currentDeleteId = id;
        openModal(confirmModal);
    }
    
    /**
     * Saves edited medicine data
     */
    function saveMedicineEdit() {
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value.trim();
        const price = parseFloat(document.getElementById('edit-price').value);
        const quantity = parseInt(document.getElementById('edit-quantity').value);
        
        if (!name || isNaN(price) || isNaN(quantity)) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }
        
        // Find and update the medicine
        const index = medicines.findIndex(med => med.id === id);
        if (index !== -1) {
            medicines[index] = {
                ...medicines[index],
                name,
                price,
                quantity
            };
            
            saveMedicines();
            renderInventory();
            updateInventorySummary();
            closeModal(editModal);
            showToast('Medicine updated successfully');
        }
    }
    
    /**
     * Deletes a medicine from inventory
     */
    function deleteMedicine(id) {
        medicines = medicines.filter(medicine => medicine.id !== id);
        saveMedicines();
        renderInventory();
        updateInventorySummary();
        showToast('Medicine deleted successfully');
    }
    
    /**
     * Exports inventory data to CSV file
     */
    function exportToCSV() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Create CSV header row
        let csvContent = 'Medicine Name,Price (PKR),Quantity,Total Price (PKR),Date/Time\n';
        
        // Add medicine data rows
        medicines.forEach(medicine => {
            const dateObj = new Date(medicine.dateTime);
            const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
            const totalPrice = medicine.price * medicine.quantity;
            
            // Escape commas in name if present
            const escapedName = medicine.name.includes(',') ? `"${medicine.name}"` : medicine.name;
            
            csvContent += `${escapedName},${medicine.price.toFixed(2)},${medicine.quantity},${totalPrice.toFixed(2)},"${formattedDate}"\n`;
        });
        
        // Create CSV data blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `medical-inventory-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Inventory exported to CSV successfully');
    }
    
    /**
     * Toggles between light and dark theme
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeToggleIcon(newTheme);
        showToast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme applied`);
    }
    
    /**
     * Updates the theme toggle icon based on current theme
     */
    function updateThemeToggleIcon(theme) {
        const iconElement = themeToggleBtn.querySelector('i');
        if (theme === 'dark') {
            iconElement.className = 'fas fa-sun';
        } else {
            iconElement.className = 'fas fa-moon';
        }
    }
    
    /**
     * Opens a modal
     */
    function openModal(modal) {
        modal.classList.add('show');
    }
    
    /**
     * Closes a modal
     */
    function closeModal(modal) {
        modal.classList.remove('show');
    }
    
    /**
     * Shows a toast notification
     */
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = 'toast';
        
        if (type === 'error') {
            toast.classList.add('error');
        }
        
        toast.classList.add('show');
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    /**
     * Saves medicines to localStorage
     */
    function saveMedicines() {
        localStorage.setItem('medicines', JSON.stringify(medicines));
    }
});
