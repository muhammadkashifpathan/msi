document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addMedicineForm = document.getElementById('add-medicine-form');
    const inventoryBody = document.getElementById('inventory-body');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const exportPDFBtn = document.getElementById('export-pdf');
    const exportExcelBtn = document.getElementById('export-excel');
    const exportWordBtn = document.getElementById('export-word');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const totalMedicinesEl = document.getElementById('total-medicines');
    const totalValueEl = document.getElementById('total-value');
    const emptyState = document.getElementById('empty-state');

    // Trash elements
    const trashBody = document.getElementById('trash-body');
    const emptyTrashState = document.getElementById('empty-trash-state');
    const inventoryTab = document.getElementById('inventory-tab');
    const trashTabMain = document.getElementById('trash-tab-main');
    const trashTab = document.getElementById('trash-tab');
    const inventoryPanel = document.getElementById('inventory-panel');
    const trashPanel = document.getElementById('trash-panel');
    const trashCounter = document.getElementById('trash-counter');
    const autoDeleteSelect = document.getElementById('auto-delete-select');
    const emptyTrashBtn = document.getElementById('empty-trash-btn');
    const restoreAllBtn = document.getElementById('restore-all-btn');

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

    // Variables for deletion and restoration
    let currentDeleteId = null;
    let currentRestoreId = null;
    let currentOperation = 'delete'; // 'delete', 'permanent-delete', 'restore-all', or 'empty-trash'

    // Initialize medicines array from localStorage
    let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    let trashItems = JSON.parse(localStorage.getItem('trashItems')) || [];

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);

    // Predefined list of medicines
    const medicineList = [
        "Paracetamol",
        "Ibuprofen",
        "Aspirin",
        "Diclofenac",
        "Naproxen",
        "Cetirizine",
        "Loratadine",
        "Chlorpheniramine",
        "Montelukast",
        "Levocetirizine",
        "Amoxicillin",
        "Azithromycin",
        "Ciprofloxacin",
        "Cefixime",
        "Metronidazole",
        "Omeprazole",
        "Ranitidine",
        "Esomeprazole",
        "Domperidone",
        "Loperamide",
        "Metformin",
        "Glimepiride",
        "Amlodipine",
        "Atenolol",
        "Losartan",
        "Diazepam",
        "Alprazolam",
        "Sertraline",
        "Fluoxetine",
        "Fluconazole",
        "Clotrimazole",
        "Acyclovir",
        "Multivitamins",
        "Calcium Tablets",
        "Iron Supplements",
        "ORS Sachets",
        "Vitamin D3",
        "Panadol"
    ];

    // Populate the datalist with medicine suggestions
    const datalist = document.getElementById('medicine-suggestions');
    medicineList.forEach(medicine => {
        const option = document.createElement('option');
        option.value = medicine;
        datalist.appendChild(option);
    });


    // Render initial inventory and trash
    renderInventory();
    renderTrash();
    updateInventorySummary();
    updateTrashCounter();

    // Initialize tabs
    showPanel('inventory');

    // Event Listeners

    // Tab switching
    inventoryTab.addEventListener('click', () => {
        showPanel('inventory');
    });

    trashTabMain.addEventListener('click', () => {
        showPanel('trash');
    });

    if (trashTab) {
        trashTab.addEventListener('click', () => {
            showPanel('trash');
        });
    }

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

    // Export buttons
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportWordBtn.addEventListener('click', exportToWord);
    document.getElementById('print-inventory').addEventListener('click', printInventory);
    document.getElementById('download-pdf').addEventListener('click', downloadPDF);

    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Modal close buttons
    closeModalBtn.addEventListener('click', () => closeModal(editModal));
    cancelEditBtn.addEventListener('click', () => closeModal(editModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));

    // Add event listeners for trash functionality
    if (emptyTrashBtn) {
        emptyTrashBtn.addEventListener('click', () => {
            if (trashItems.length > 0) {
                document.getElementById('confirm-message').textContent =
                    `Are you sure you want to permanently delete all ${trashItems.length} items in trash?`;

                currentOperation = 'empty-trash';
                openModal(confirmModal);
            } else {
                showToast('Trash is already empty', 'error');
            }
        });
    }

    if (restoreAllBtn) {
        restoreAllBtn.addEventListener('click', () => {
            if (trashItems.length > 0) {
                document.getElementById('confirm-message').textContent =
                    `Are you sure you want to restore all ${trashItems.length} items from trash?`;

                currentOperation = 'restore-all';
                // Update the confirm button text to "Restore All"
                confirmDeleteBtn.textContent = 'Restore All';
                openModal(confirmModal);
            } else {
                showToast('No items to restore', 'error');
            }
        });
    }

    if (autoDeleteSelect) {
        autoDeleteSelect.addEventListener('change', function () {
            localStorage.setItem('autoDeleteDays', this.value);
            renderTrash(); // Re-render the trash table to update "Days in Trash" and auto-delete duration
            showToast(`Auto-delete set to: ${this.value === 'never' ? 'Never' : `${this.value} days`}`);
        });
    }

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId !== null || currentOperation === 'empty-trash' || currentOperation === 'restore-all') {
            if (currentOperation === 'permanent-delete') {
                permanentlyDeleteMedicine(currentDeleteId);
            } else if (currentOperation === 'delete') {
                deleteMedicine(currentDeleteId);
            } else if (currentOperation === 'restore') {
                restoreMedicine(currentDeleteId); // Restore individual item
            } else if (currentOperation === 'empty-trash') {
                emptyTrash();
            } else if (currentOperation === 'restore-all') {
                // Restore all items
                trashItems.forEach(item => {
                    const { deletedAt, ...medicineData } = item;
                    medicines.push(medicineData);
                });

                // Clear trash
                trashItems = [];
                saveMedicines();
                saveTrashItems();
                renderInventory();
                renderTrash();
                updateInventorySummary();
                updateTrashCounter();
                showToast('All items restored successfully');
            }

            closeModal(confirmModal);
            currentDeleteId = null;
            currentOperation = 'delete'; // Reset to default operation

            // Reset the confirm button text to "Delete"
            confirmDeleteBtn.textContent = 'Delete';
        }
    });


    // Functions
    /**
     * Adds a new medicine to the inventory
     */
    function addMedicine() {
        const nameInput = document.getElementById('medicine-name');
        const priceInput = document.getElementById('medicine-price');
        const discountInput = document.getElementById('medicine-discount');
        const quantityInput = document.getElementById('medicine-quantity');

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const discount = parseFloat(discountInput.value) || 0;
        const quantity = parseInt(quantityInput.value);

        if (!name || isNaN(price) || isNaN(quantity)) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }

        // Calculate final price after discount
        const finalPrice = price - (price * discount / 100);

        const newMedicine = {
            id: Date.now().toString(),
            name,
            price,
            discount,
            finalPrice,
            quantity,
            dateTime: new Date().toISOString()
        };

        medicines.push(newMedicine);
        saveMedicines();
        renderInventory();
        updateInventorySummary();

        nameInput.value = '';
        priceInput.value = '';
        discountInput.value = '0';
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

                // Get discount from medicine or default to 0
                const discount = medicine.discount || 0;
                
                // Calculate final price after discount
                const finalPrice = medicine.finalPrice || (medicine.price - (medicine.price * discount / 100));
                
                // Calculate total price based on final price and quantity
                const totalPrice = finalPrice * medicine.quantity;

                tr.innerHTML = `
                    <td data-label="Medicine Name">${medicine.name}</td>
                    <td data-label="Price">${medicine.price.toFixed(2)}</td>
                    <td data-label="Discount">${discount.toFixed(1)} %</td>
                    <td data-label="Quantity">${medicine.quantity}</td>
                    <td data-label="Final Price">${totalPrice.toFixed(2)}</td>
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
     * Renders the trash table
     */
    function renderTrash() {
        // Clear current table contents
        trashBody.innerHTML = '';

        // Show empty state if no trash items
        if (trashItems.length === 0) {
            emptyTrashState.style.display = 'flex';
        } else {
            emptyTrashState.style.display = 'none';

            // Add trash items to table
            trashItems.forEach(item => {
                const tr = document.createElement('tr');

                // Calculate days in trash
                const deletedDate = new Date(item.deletedAt);
                const currentDate = new Date();
                const daysInTrash = Math.floor((currentDate - deletedDate) / (1000 * 60 * 60 * 24));

                // Get the auto-delete duration
                const autoDeleteSetting = localStorage.getItem('autoDeleteDays') || 'never';
                const autoDeleteText = autoDeleteSetting === 'never' ? 'Never' : `${autoDeleteSetting} days`;

                // Get discount from item or default to 0
                const discount = item.discount || 0;
                
                // Calculate final price after discount
                const finalPrice = item.finalPrice || (item.price - (item.price * discount / 100));
                
                // Calculate total price based on final price and quantity
                const totalPrice = finalPrice * item.quantity;

                tr.innerHTML = `
                    <td data-label="Medicine Name">${item.name}</td>
                    <td data-label="Price">${item.price.toFixed(2)}</td>
                    <td data-label="Discount">${discount.toFixed(1)} %</td>
                    <td data-label="Quantity">${item.quantity}</td>
                    <td data-label="Final Price">${totalPrice.toFixed(2)}</td>
                    <td data-label="Days in Trash">${autoDeleteText}</td>
                    <td data-label="Actions">
                        <button class="restore-btn" data-id="${item.id}" title="Restore">
                            <i class="fas fa-undo-alt"></i>
                        </button>
                        <button class="permanent-delete-btn" data-id="${item.id}" title="Permanently Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;

                trashBody.appendChild(tr);
            });

            // Add event listeners to restore and permanent delete buttons
            addTrashButtonListeners();
        }
    }

    /**
     * Sorts medicines based on the selected option
     */
    function sortMedicines(medList, sortOption) {
        switch (sortOption) {
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
        
        // Calculate totals including actual price, discount savings, and final price
        let totalActualValue = 0;
        let totalDiscountValue = 0;
        let totalFinalValue = 0;
        
        medicines.forEach(medicine => {
            // Get discount from medicine or default to 0
            const discount = medicine.discount || 0;
            
            // Calculate actual price (before discount)
            const actualItemTotal = medicine.price * medicine.quantity;
            totalActualValue += actualItemTotal;
            
            // Calculate final price after discount
            const finalPrice = medicine.finalPrice || (medicine.price - (medicine.price * discount / 100));
            const finalItemTotal = finalPrice * medicine.quantity;
            totalFinalValue += finalItemTotal;
            
            // Calculate discount amount
            totalDiscountValue += (actualItemTotal - finalItemTotal);
        });

        // Update the elements
        totalMedicinesEl.textContent = totalMedicines;
        
        // Create a summary with actual, discount, and final prices
        const summaryHTML = `
            <div class="price-breakdown">
                <div class="total-price">Total Price: PKR ${totalActualValue.toFixed(2)}</div>
                <div class="discount">Discount: PKR ${totalDiscountValue.toFixed(2)}</div>
                <div class="final-value">Final Price: PKR ${totalFinalValue.toFixed(2)}</div>
            </div>
        `;
        
        totalValueEl.innerHTML = summaryHTML;
    }

    /**
     * Updates the trash counter
     */
    function updateTrashCounter() {
        trashCounter.textContent = trashItems.length > 0 ? trashItems.length : '';
        trashCounter.style.display = trashItems.length > 0 ? 'flex' : 'none';
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
     * Adds event listeners to buttons in the trash table
     */
    function addTrashButtonListeners() {
        // Restore buttons
        document.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openRestoreConfirmModal(id); // Open restore confirmation modal
            });
        });

        // Permanent delete buttons
        document.querySelectorAll('.permanent-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openPermanentDeleteConfirmModal(id);
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
        document.getElementById('edit-discount').value = medicine.discount || 0;
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
        currentOperation = 'delete';
        openModal(confirmModal);
    }

    /**
     * Opens confirmation modal for permanent deletion
     */
    function openPermanentDeleteConfirmModal(id) {
        const item = trashItems.find(item => item.id === id);
        if (!item) return;

        document.getElementById('confirm-message').textContent =
            `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`;

        currentDeleteId = id;
        currentOperation = 'permanent-delete';
        openModal(confirmModal);
    }

    /**
     * Opens confirmation modal for restoring medicine
     */
    function openRestoreConfirmModal(id) {
        const item = trashItems.find(item => item.id === id);
        if (!item) return;

        document.getElementById('confirm-message').textContent =
            `Are you sure you want to restore "${item.name}" to inventory?`;

        currentDeleteId = id;
        currentOperation = 'restore';

        // Update the confirm button text to "Restore"
        confirmDeleteBtn.textContent = 'Restore';
        openModal(confirmModal);
    }

    /**
     * Saves edited medicine data
     */
    function saveMedicineEdit() {
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value.trim();
        const price = parseFloat(document.getElementById('edit-price').value);
        const discount = parseFloat(document.getElementById('edit-discount').value) || 0;
        const quantity = parseInt(document.getElementById('edit-quantity').value);

        if (!name || isNaN(price) || isNaN(quantity)) {
            showToast('Please fill all fields correctly', 'error');
            return;
        }

        // Calculate final price after discount
        const finalPrice = price - (price * discount / 100);

        // Find and update the medicine
        const index = medicines.findIndex(med => med.id === id);
        if (index !== -1) {
            medicines[index] = {
                ...medicines[index],
                name,
                price,
                discount,
                finalPrice,
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
     * Moves a medicine from inventory to trash
     */
    function deleteMedicine(id) {
        const medicineToDelete = medicines.find(med => med.id === id);
        if (!medicineToDelete) return;

        // Add delete timestamp for auto-delete feature
        const itemForTrash = {
            ...medicineToDelete,
            deletedAt: new Date().toISOString()
        };

        // Move to trash
        trashItems.push(itemForTrash);

        // Remove from inventory
        medicines = medicines.filter(medicine => medicine.id !== id);

        // Save changes
        saveMedicines();
        saveTrashItems();

        // Update UI
        renderInventory();
        renderTrash();
        updateInventorySummary();
        updateTrashCounter();

        showToast('Medicine moved to trash');
    }

    /**
     * Permanently deletes an item from trash
     */
    function permanentlyDeleteMedicine(id) {
        // Remove from trash
        trashItems = trashItems.filter(item => item.id !== id);

        // Save changes
        saveTrashItems();

        // Update UI
        renderTrash();
        updateTrashCounter();

        showToast('Medicine permanently deleted');
    }

    /**
     * Restores a medicine from trash to inventory
     */
    function restoreMedicine(id) {
        const itemToRestore = trashItems.find(item => item.id === id);
        if (!itemToRestore) return;

        // Remove the deletedAt property before restoring
        const { deletedAt, ...medicineData } = itemToRestore;

        // Add back to inventory
        medicines.push(medicineData);

        // Remove from trash
        trashItems = trashItems.filter(item => item.id !== id);

        // Save changes
        saveMedicines();
        saveTrashItems();

        // Update UI
        renderInventory();
        renderTrash();
        updateInventorySummary();
        updateTrashCounter();

        showToast('Medicine restored successfully');
    }

    /**
     * Empties the trash (removes all items permanently)
     */
    function emptyTrash() {
        if (trashItems.length === 0) {
            showToast('Trash is already empty', 'error');
            return;
        }

        // Clear trash
        trashItems = [];
        saveTrashItems();

        // Update UI
        renderTrash();
        updateTrashCounter();

        showToast('Trash emptied successfully');
    }

    /**
     * Shows the selected panel (inventory or trash)
     */
    function showPanel(panelName) {
        // Get all panels
        const panels = document.querySelectorAll('.inventory-section, .trash-section');

        // Get all tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');

        // Hide all panels and remove active class from tabs
        panels.forEach(panel => panel.style.display = 'none');
        tabButtons.forEach(tab => tab.classList.remove('active'));

        // Show selected panel and add active class to corresponding tab
        if (panelName === 'inventory') {
            document.getElementById('inventory-panel').style.display = 'block';
            document.getElementById('inventory-tab').classList.add('active');
        } else if (panelName === 'trash') {
            document.getElementById('trash-panel').style.display = 'block';
            document.getElementById('trash-tab-main').classList.add('active');
            if (document.getElementById('trash-tab')) {
                document.getElementById('trash-tab').classList.add('active');
            }
        }
    }

    /**
     * Checks for items to auto-delete based on user preferences
     */
    function checkAutoDelete() {
        const autoDeleteSetting = localStorage.getItem('autoDeleteDays');

        if (!autoDeleteSetting || autoDeleteSetting === 'never') {
            return;
        }

        const daysToKeep = parseInt(autoDeleteSetting);
        const currentDate = new Date();

        // Filter out items that are older than the auto-delete setting
        const itemsToKeep = trashItems.filter(item => {
            const deletedDate = new Date(item.deletedAt);
            const daysDifference = Math.floor((currentDate - deletedDate) / (1000 * 60 * 60 * 24));
            return daysDifference < daysToKeep;
        });

        // If items were removed, update trash
        if (itemsToKeep.length < trashItems.length) {
            trashItems = itemsToKeep;
            saveTrashItems();
            renderTrash();
            updateTrashCounter();

            const itemsDeleted = trashItems.length - itemsToKeep.length;
            showToast(`${itemsDeleted} item(s) auto-deleted from trash`);
        }
    }

    /**
     * Returns human-readable text for auto-delete setting
     */
    function getAutoDeleteText(value) {
        switch (value) {
            case 'never':
                return 'Never auto-delete';
            case '7':
                return 'Auto-delete after 7 days';
            case '30':
                return 'Auto-delete after 30 days';
            default:
                return 'Auto-delete setting';
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

        // Reset the confirm button text to "Delete"
        if (modal === confirmModal) {
            confirmDeleteBtn.textContent = 'Delete';
        }
    }

    /**
     * Saves medicines to localStorage
     */
    function saveMedicines() {
        localStorage.setItem('medicines', JSON.stringify(medicines));
    }

    /**
     * Saves trash items to localStorage
     */
    function saveTrashItems() {
        localStorage.setItem('trashItems', JSON.stringify(trashItems));
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
     * Toggles between light and dark theme
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        updateThemeToggleIcon(newTheme);
    }

    /**
     * Updates the theme toggle icon based on current theme
     */
    function updateThemeToggleIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }    

    /**
     * Exports inventory data to PDF file
     */
    function printInventory() {
        if (medicines.length === 0) {
            showToast('No data to print', 'error');
            return;
        }
    
        const printDiv = document.createElement('div');
        printDiv.style.display = 'none';
    
        let tableHTML = `
            <html>
            <head>
                <title>MediRecord - Medicine Record Sheet</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        min-height: 100vh;
                    }
                    h2 {
                        color: #4a8cca;
                        text-align: center;
                        margin-bottom: 10px;
                    }
                    .date {
                        text-align: center;
                        color: #555;
                        margin-bottom: 20px;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 10px;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f1f1f1;
                        font-weight: bold;
                    }
                    .summary {
                        margin-bottom: 20px;
                        text-align: left;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: auto;
                        font-size: 12px;
                        text-align: center;
                        color: #888;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <h2>MediRecord: Medicine Record Sheet</h2>
                <div class="date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine Name</th>
                            <th>Price (PKR)</th>
                            <th>Discount (%)</th>
                            <th>Final Price (PKR)</th>
                            <th>Quantity</th>
                            <th>Total Price (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
    
        let totalActual = 0;
        let totalFinal = 0;
    
        medicines.forEach(medicine => {
            const discount = medicine.discount || 0;
            const finalPrice = medicine.finalPrice || (medicine.price - (medicine.price * discount / 100));
            const totalPrice = finalPrice * medicine.quantity;
    
            const actualPrice = medicine.price * medicine.quantity;
            totalActual += actualPrice;
            totalFinal += totalPrice;
    
            tableHTML += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.price.toFixed(2)}</td>
                    <td>${discount.toFixed(1)}%</td>
                    <td>${finalPrice.toFixed(2)}</td>
                    <td>${medicine.quantity}</td>
                    <td>${totalPrice.toFixed(2)}</td>
                </tr>
            `;
        });
    
        const totalDiscount = totalActual - totalFinal;
    
        tableHTML += `
                    </tbody>
                </table>
                <div class="summary">
                    <p>Total Medicines: ${medicines.length}</p>
                    <p>Total Price (Before Discount): PKR ${totalActual.toFixed(2)}</p>
                    <p>Total Discount: PKR ${totalDiscount.toFixed(2)}</p>
                    <p>Total Price (After Discount): PKR ${totalFinal.toFixed(2)}</p>
                </div>
                <div class="footer">
                    Developed by Muhammad Kashif Pathan<br>
                    Email: mkpathan.dev@gmail.com
                </div>
            </body>
            </html>
        `;
    
        printDiv.innerHTML = tableHTML;
        document.body.appendChild(printDiv);
    
        const win = window.open('', '', 'height=700,width=700');
        win.document.write(tableHTML);
        win.document.close();
    
        win.onload = function () {
            win.focus();
            win.print();
            win.close();
            document.body.removeChild(printDiv);
        };
    
        showToast('MediRecord printed successfully');
    }
    


    function downloadPDF() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
    
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
    
        // Add title
        doc.setFontSize(18);
        doc.text('Medicine Record Sheet', 105, 20, { align: 'center' });
    
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 30, { align: 'center' });
    
        // Table headers
        const headers = ['Medicine Name', 'Price (PKR)', 'Discount (%)', 'Final Price (PKR)', 'Quantity', 'Total (PKR)'];
        
        // Table data
        const data = medicines.map(med => {
            const discount = med.discount || 0;
            const finalPrice = med.finalPrice || (med.price - (med.price * discount / 100));
            const totalPrice = finalPrice * med.quantity;
    
            return [
                med.name,
                med.price.toFixed(2),
                discount.toFixed(1),
                finalPrice.toFixed(2),
                med.quantity,
                totalPrice.toFixed(2)
            ];
        });
    
        // Add table to PDF
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [74, 140, 202] }
        });
    
        // Summary calculations
        const totalMedicines = medicines.length;
        let totalActual = 0;
        let totalFinal = 0;
    
        medicines.forEach(med => {
            const discount = med.discount || 0;
            const actual = med.price * med.quantity;
            const final = (med.finalPrice || (med.price - (med.price * discount / 100))) * med.quantity;
    
            totalActual += actual;
            totalFinal += final;
        });
    
        const totalDiscount = totalActual - totalFinal;
    
        // Summary
        const summaryY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.text(`Total Medicines: ${totalMedicines}`, 14, summaryY);
        doc.text(`Total Price (Before Discount): PKR ${totalActual.toFixed(2)}`, 14, summaryY + 10);
        doc.text(`Total Discount: PKR ${totalDiscount.toFixed(2)}`, 14, summaryY + 20);
        doc.text(`Total Price (After Discount): PKR ${totalFinal.toFixed(2)}`, 14, summaryY + 30);
    
        // Developer footer
        doc.setFontSize(8);
        doc.text('Developed by Muhammad Kashif Pathan', 105, 285, { align: 'center' });
        doc.text('Email: mkpathan.dev@gmail.com', 105, 290, { align: 'center' });
    
        // Save file
        doc.save(`medi-record-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('MediRecord exported to PDF successfully');
    }
    


    /**
     * Exports inventory data to Excel file
     */
    function exportToExcel() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
    
        let table = `
            <table>
                <tr>
                    <th>Medicine Name</th>
                    <th>Price (PKR)</th>
                    <th>Discount (%)</th>
                    <th>Final Price (PKR)</th>
                    <th>Quantity</th>
                    <th>Total Price (PKR)</th>
                </tr>
        `;
    
        let totalActual = 0;
        let totalFinal = 0;
    
        medicines.forEach(medicine => {
            const discount = medicine.discount || 0;
            const finalPrice = medicine.finalPrice || (medicine.price - (medicine.price * discount / 100));
            const totalPrice = finalPrice * medicine.quantity;
            const actualPrice = medicine.price * medicine.quantity;
    
            totalActual += actualPrice;
            totalFinal += totalPrice;
    
            table += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.price.toFixed(2)}</td>
                    <td>${discount.toFixed(1)}</td>
                    <td>${finalPrice.toFixed(2)}</td>
                    <td>${medicine.quantity}</td>
                    <td>${totalPrice.toFixed(2)}</td>
                </tr>
            `;
        });
    
        const totalDiscount = totalActual - totalFinal;
    
        table += `
            </table>
            <br>
            <table>
                <tr><td><strong>Total Medicines:</strong></td><td>${medicines.length}</td></tr>
                <tr><td><strong>Total Price (Before Discount):</strong></td><td>PKR ${totalActual.toFixed(2)}</td></tr>
                <tr><td><strong>Total Discount:</strong></td><td>PKR ${totalDiscount.toFixed(2)}</td></tr>
                <tr><td><strong>Total Price (After Discount):</strong></td><td>PKR ${totalFinal.toFixed(2)}</td></tr>
            </table>
            <br><br>
        `;
    
        const blob = new Blob([table], {
            type: 'application/vnd.ms-excel;charset=utf-8;'
        });
    
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medi-record-${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    
        showToast('MediRecord exported to Excel successfully');
    }
    

    /**
     * Exports inventory data to Word file
     */
    function exportToWord() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
    
        let wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>MediRecord</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        min-height: 100vh;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #ccc;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f1f1f1;
                    }
                </style>
            </head>
            <body>
            <h2 style="text-align:center;">MediRecord: Medicine Record Sheet</h2>
            <p style="text-align:center;">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>Medicine Name</th>
                        <th>Price (PKR)</th>
                        <th>Discount (%)</th>
                        <th>Final Price (PKR)</th>
                        <th>Quantity</th>
                        <th>Total Price (PKR)</th>
                    </tr>
                </thead>
                <tbody>
        `;
    
        let totalActual = 0;
        let totalFinal = 0;
    
        medicines.forEach(medicine => {
            const discount = medicine.discount || 0;
            const finalPrice = medicine.finalPrice || (medicine.price - (medicine.price * discount / 100));
            const totalPrice = finalPrice * medicine.quantity;
            const actualPrice = medicine.price * medicine.quantity;
    
            totalActual += actualPrice;
            totalFinal += totalPrice;
    
            wordContent += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.price.toFixed(2)}</td>
                    <td>${discount.toFixed(1)}</td>
                    <td>${finalPrice.toFixed(2)}</td>
                    <td>${medicine.quantity}</td>
                    <td>${totalPrice.toFixed(2)}</td>
                </tr>
            `;
        });
    
        const totalDiscount = totalActual - totalFinal;
    
        wordContent += `
                </tbody>
            </table>
            <br>
            <p><strong>Total Medicines:</strong> ${medicines.length}</p>
            <p><strong>Total Price (Before Discount):</strong> PKR ${totalActual.toFixed(2)}</p>
            <p><strong>Total Discount:</strong> PKR ${totalDiscount.toFixed(2)}</p>
            <p><strong>Total Price (After Discount):</strong> PKR ${totalFinal.toFixed(2)}</p>
    
            </body></html>
        `;
    
        const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `medi-record-${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        showToast('MediRecord exported to Word successfully');
    }
    
    
    

    // Initial check for auto-delete
    checkAutoDelete();
});
