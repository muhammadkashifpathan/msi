document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const addMedicineForm = document.getElementById('add-medicine-form');
    const inventoryBody = document.getElementById('inventory-body');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const exportCSVBtn = document.getElementById('export-csv');
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
    let currentOperation = 'delete'; // 'delete', 'permanent-delete', or 'restore'
    
    // Initialize medicines array from localStorage
    let medicines = JSON.parse(localStorage.getItem('medicines')) || [];
    let trashItems = JSON.parse(localStorage.getItem('trashItems')) || [];
    
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
    
    // Render initial inventory and trash
    renderInventory();
    renderTrash();
    updateInventorySummary();
    updateTrashCounter();
    
    // Initialize tabs
    showPanel('inventory');
    
    // Event Listeners
    
    // Tab switching
    document.getElementById('inventory-tab').addEventListener('click', () => {
        showPanel('inventory');
    });
    
    document.getElementById('trash-tab-main').addEventListener('click', () => {
        showPanel('trash');
    });
    
    if (document.getElementById('trash-tab')) {
        document.getElementById('trash-tab').addEventListener('click', () => {
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
    exportCSVBtn.addEventListener('click', exportToCSV);
    exportPDFBtn.addEventListener('click', exportToPDF);
    exportExcelBtn.addEventListener('click', exportToExcel);
    exportWordBtn.addEventListener('click', exportToWord);
    
    // Theme toggle
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Modal close buttons
    closeModalBtn.addEventListener('click', () => closeModal(editModal));
    cancelEditBtn.addEventListener('click', () => closeModal(editModal));
    cancelDeleteBtn.addEventListener('click', () => closeModal(confirmModal));
    
    // Confirm delete/permanently delete button
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId !== null) {
            if (currentOperation === 'permanent-delete') {
                permanentlyDeleteMedicine(currentDeleteId);
            } else {
                deleteMedicine(currentDeleteId);
            }
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
     * Renders the trash table
     */
    function renderTrash() {
        const trashBody = document.getElementById('trash-body');
        const emptyTrashState = document.getElementById('empty-trash-state');
        
        // Clear current table contents
        trashBody.innerHTML = '';
        
        // Show empty state if no items in trash
        if (trashItems.length === 0) {
            emptyTrashState.style.display = 'flex';
        } else {
            emptyTrashState.style.display = 'none';
            
            // Add trash items to table
            trashItems.forEach(item => {
                const tr = document.createElement('tr');
                
                const addedDate = new Date(item.dateTime);
                const deletedDate = new Date(item.deletedAt);
                const formattedDeletedDate = `${deletedDate.toLocaleDateString()} ${deletedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                // Calculate days in trash
                const currentDate = new Date();
                const daysInTrash = Math.floor((currentDate - deletedDate) / (1000 * 60 * 60 * 24));
                
                // Calculate total price
                const totalPrice = item.price * item.quantity;
                
                tr.innerHTML = `
                    <td data-label="Medicine Name">${item.name}</td>
                    <td data-label="Price (PKR)">${item.price.toFixed(2)}</td>
                    <td data-label="Quantity">${item.quantity}</td>
                    <td data-label="Total Price (PKR)">${totalPrice.toFixed(2)}</td>
                    <td data-label="Deleted On">${formattedDeletedDate}</td>
                    <td data-label="Days in Trash">${daysInTrash}</td>
                    <td data-label="Actions">
                        <div class="action-icons">
                            <button class="restore-btn" data-id="${item.id}" title="Restore to Inventory"><i class="fas fa-undo-alt"></i></button>
                            <button class="permanent-delete-btn" data-id="${item.id}" title="Delete Permanently"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                `;
                
                trashBody.appendChild(tr);
            });
            
            // Add event listeners to restore and permanent delete buttons
            addTrashButtonListeners();
        }
    }

    /**
     * Updates the trash counter
     */
    function updateTrashCounter() {
        const trashCounter = document.getElementById('trash-counter');
        trashCounter.textContent = trashItems.length;
        
        // Hide counter if trash is empty
        if (trashItems.length === 0) {
            trashCounter.style.display = 'none';
        } else {
            trashCounter.style.display = 'flex';
        }
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
     * Exports inventory data to PDF file
     */
    function exportToPDF() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Create a hidden div to hold the table for PDF generation
        const printDiv = document.createElement('div');
        printDiv.style.display = 'none';
        
        // Create the HTML table structure for PDF
        let tableHTML = `
            <html>
            <head>
                <title>Medical Inventory Report</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h2 { color: #4a8cca; text-align: center; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .summary { margin-top: 20px; text-align: right; font-weight: bold; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .date { text-align: right; margin-bottom: 20px; color: #6c757d; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Medical Store Inventory Report</h2>
                </div>
                <div class="date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine Name</th>
                            <th>Price (PKR)</th>
                            <th>Quantity</th>
                            <th>Total Price (PKR)</th>
                            <th>Date/Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add data rows
        medicines.forEach(medicine => {
            const dateObj = new Date(medicine.dateTime);
            const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const totalPrice = medicine.price * medicine.quantity;
            
            tableHTML += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.price.toFixed(2)}</td>
                    <td>${medicine.quantity}</td>
                    <td>${totalPrice.toFixed(2)}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });
        
        // Calculate total inventory value
        const totalInventoryValue = medicines.reduce((sum, medicine) => {
            return sum + (medicine.price * medicine.quantity);
        }, 0);
        
        // Add summary
        tableHTML += `
                    </tbody>
                </table>
                <div class="summary">
                    <p>Total Medicines: ${medicines.length}</p>
                    <p>Total Inventory Value: PKR ${totalInventoryValue.toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;
        
        printDiv.innerHTML = tableHTML;
        document.body.appendChild(printDiv);
        
        // Create a temporary window to print from
        const win = window.open('', '', 'height=700,width=700');
        win.document.write(tableHTML);
        win.document.close();
        
        // Wait for window to load before printing
        win.onload = function() {
            win.focus();
            win.print();
            win.close();
            document.body.removeChild(printDiv);
        };
        
        showToast('Inventory exported to PDF successfully');
    }
    
    /**
     * Exports inventory data to Excel file
     */
    function exportToExcel() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Create a worksheet with a formatted header
        let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Medical Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
        excelContent += '<body>';
        excelContent += '<table border="1">';
        excelContent += '<tr style="background-color: #4a8cca; color: white; font-weight: bold;"><th>Medicine Name</th><th>Price (PKR)</th><th>Quantity</th><th>Total Price (PKR)</th><th>Date/Time</th></tr>';
        
        // Add data rows
        medicines.forEach(medicine => {
            const dateObj = new Date(medicine.dateTime);
            const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
            const totalPrice = medicine.price * medicine.quantity;
            
            excelContent += `<tr>
                <td>${medicine.name}</td>
                <td>${medicine.price.toFixed(2)}</td>
                <td>${medicine.quantity}</td>
                <td>${totalPrice.toFixed(2)}</td>
                <td>${formattedDate}</td>
            </tr>`;
        });
        
        // Calculate total inventory value
        const totalInventoryValue = medicines.reduce((sum, medicine) => {
            return sum + (medicine.price * medicine.quantity);
        }, 0);
        
        // Add summary rows
        excelContent += `<tr><td colspan="5"></td></tr>`;
        excelContent += `<tr><td colspan="3" style="font-weight: bold; text-align: right;">Total Medicines:</td><td>${medicines.length}</td><td></td></tr>`;
        excelContent += `<tr><td colspan="3" style="font-weight: bold; text-align: right;">Total Inventory Value:</td><td>PKR ${totalInventoryValue.toFixed(2)}</td><td></td></tr>`;
        
        excelContent += '</table></body></html>';
        
        // Create Excel data blob
        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `medical-inventory-${new Date().toISOString().split('T')[0]}.xls`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Inventory exported to Excel successfully');
    }
    
    /**
     * Exports inventory data to Word file
     */
    function exportToWord() {
        if (medicines.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Create a Word document structure
        let wordContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>Medical Inventory Report</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { color: #4a8cca; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
                    th { background-color: #4a8cca; color: white; }
                    .info { margin: 20px 0; }
                    .summary { margin-top: 20px; font-weight: bold; }
                </style>
            </head>
            <body>
                <h1>Medical Store Inventory Report</h1>
                <div class="info">
                    <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine Name</th>
                            <th>Price (PKR)</th>
                            <th>Quantity</th>
                            <th>Total Price (PKR)</th>
                            <th>Date/Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add data rows
        medicines.forEach(medicine => {
            const dateObj = new Date(medicine.dateTime);
            const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            const totalPrice = medicine.price * medicine.quantity;
            
            wordContent += `
                <tr>
                    <td>${medicine.name}</td>
                    <td>${medicine.price.toFixed(2)}</td>
                    <td>${medicine.quantity}</td>
                    <td>${totalPrice.toFixed(2)}</td>
                    <td>${formattedDate}</td>
                </tr>
            `;
        });
        
        // Calculate total inventory value
        const totalInventoryValue = medicines.reduce((sum, medicine) => {
            return sum + (medicine.price * medicine.quantity);
        }, 0);
        
        // Add summary
        wordContent += `
                    </tbody>
                </table>
                <div class="summary">
                    <p>Total Medicines: ${medicines.length}</p>
                    <p>Total Inventory Value: PKR ${totalInventoryValue.toFixed(2)}</p>
                </div>
            </body>
            </html>
        `;
        
        // Create Word data blob
        const blob = new Blob([wordContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and trigger download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `medical-inventory-${new Date().toISOString().split('T')[0]}.doc`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Inventory exported to Word successfully');
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
    
    /**
     * Saves trash items to localStorage
     */
    function saveTrashItems() {
        localStorage.setItem('trashItems', JSON.stringify(trashItems));
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
            
            // Sort trash items by deletion date (newest first)
            const sortedTrash = [...trashItems].sort((a, b) => 
                new Date(b.deletedAt) - new Date(a.deletedAt)
            );
            
            // Add trash items to table
            sortedTrash.forEach(item => {
                const tr = document.createElement('tr');
                
                const dateObj = new Date(item.dateTime);
                const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                const deletedDateObj = new Date(item.deletedAt);
                const formattedDeletedDate = `${deletedDateObj.toLocaleDateString()} ${deletedDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                
                // Calculate days in trash
                const daysInTrash = Math.floor((new Date() - deletedDateObj) / (1000 * 60 * 60 * 24));
                
                // Calculate total price for this medicine
                const totalPrice = item.price * item.quantity;
                
                tr.innerHTML = `
                    <td data-label="Medicine Name">${item.name}</td>
                    <td data-label="Price (PKR)">${item.price.toFixed(2)}</td>
                    <td data-label="Quantity">${item.quantity}</td>
                    <td data-label="Total Price (PKR)">${totalPrice.toFixed(2)}</td>
                    <td data-label="Deleted On">${formattedDeletedDate}</td>
                    <td data-label="Days in Trash">${daysInTrash}</td>
                    <td data-label="Actions">
                        <div class="action-icons">
                            <button class="restore-btn" data-id="${item.id}" title="Restore"><i class="fas fa-undo"></i></button>
                            <button class="permanent-delete-btn" data-id="${item.id}" title="Delete Permanently"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </td>
                `;
                
                trashBody.appendChild(tr);
            });
            
            // Add event listeners to restore and permanent delete buttons
            addTrashButtonListeners();
        }
    }
    
    /**
     * Updates the trash counter
     */
    function updateTrashCounter() {
        if (trashCounter) {
            trashCounter.textContent = trashItems.length > 0 ? trashItems.length : '';
            trashCounter.style.display = trashItems.length > 0 ? 'flex' : 'none';
        }
    }
    
    /**
     * Adds event listeners to buttons in the trash table
     */
    function addTrashButtonListeners() {
        // Restore buttons
        document.querySelectorAll('.restore-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                restoreMedicine(id);
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
     * Permanently deletes an item from trash
     */
    function permanentlyDeleteMedicine(id) {
        trashItems = trashItems.filter(item => item.id !== id);
        saveTrashItems();
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
            showToast('Trash is already empty', 'info');
            return;
        }
        
        // Clear trash
        trashItems = [];
        saveTrashItems();
        renderTrash();
        updateTrashCounter();
        
        showToast('Trash emptied successfully');
    }
    
    /**
     * Shows the selected panel (inventory or trash)
     */
    function showPanel(panelName) {
        if (panelName === 'inventory') {
            inventoryPanel.style.display = 'block';
            trashPanel.style.display = 'none';
            inventoryTab.classList.add('active');
            trashTab.classList.remove('active');
        } else {
            inventoryPanel.style.display = 'none';
            trashPanel.style.display = 'block';
            inventoryTab.classList.remove('active');
            trashTab.classList.add('active');
            renderTrash(); // Refresh trash view when switching to it
        }
    }
    
    /**
     * Checks for items to auto-delete based on user preferences
     */
    function checkAutoDelete() {
        const autoDeleteDays = localStorage.getItem('autoDeleteDays') || 'never';
        
        if (autoDeleteDays === 'never') return;
        
        const daysToKeep = parseInt(autoDeleteDays);
        const now = new Date();
        
        // Filter out items that should be auto-deleted
        const updatedTrashItems = trashItems.filter(item => {
            const deletedDate = new Date(item.deletedAt);
            const daysDifference = Math.floor((now - deletedDate) / (1000 * 60 * 60 * 24));
            
            return daysDifference < daysToKeep;
        });
        
        const deletedCount = trashItems.length - updatedTrashItems.length;
        
        if (deletedCount > 0) {
            trashItems = updatedTrashItems;
            saveTrashItems();
            renderTrash();
            updateTrashCounter();
            showToast(`${deletedCount} item(s) auto-deleted from trash`);
        }
    }
    
    /**
     * Returns human-readable text for auto-delete setting
     */
    function getAutoDeleteText(value) {
        switch (value) {
            case '7': return 'After 7 days';
            case '30': return 'After 30 days';
            default: return 'Never';
        }
    }
    
    // Initialize trash UI and auto-delete
    renderTrash();
    updateTrashCounter();
    
    // Set up event listeners for trash functionality
    if (trashTab) {
        trashTab.addEventListener('click', () => showPanel('trash'));
    }
    
    if (inventoryTab) {
        inventoryTab.addEventListener('click', () => showPanel('inventory'));
    }
    
    if (emptyTrashBtn) {
        emptyTrashBtn.addEventListener('click', () => {
            if (trashItems.length > 0) {
                if (confirm(`Are you sure you want to permanently delete all ${trashItems.length} items in trash?`)) {
                    emptyTrash();
                }
            } else {
                showToast('Trash is already empty', 'info');
            }
        });
    }
    
    if (restoreAllBtn) {
        restoreAllBtn.addEventListener('click', () => {
            if (trashItems.length > 0) {
                if (confirm(`Are you sure you want to restore all ${trashItems.length} items from trash?`)) {
                    // Restore all items
                    trashItems.forEach(item => {
                        const { deletedAt, ...medicineData } = item;
                        medicines.push(medicineData);
                    });
                    
                    // Clear trash
                    trashItems = [];
                    
                    // Save changes
                    saveMedicines();
                    saveTrashItems();
                    
                    // Update UI
                    renderInventory();
                    renderTrash();
                    updateInventorySummary();
                    updateTrashCounter();
                    
                    showToast('All items restored successfully');
                }
            } else {
                showToast('No items to restore', 'info');
            }
        });
    }
    
    // Update confirm delete button to handle both operations
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentDeleteId !== null) {
            if (currentOperation === 'permanent-delete') {
                permanentlyDeleteMedicine(currentDeleteId);
            } else {
                deleteMedicine(currentDeleteId);
            }
            closeModal(confirmModal);
            currentDeleteId = null;
        }
    });
    
    // Set up auto-delete select
    if (autoDeleteSelect) {
        const savedAutoDelete = localStorage.getItem('autoDeleteDays') || 'never';
        autoDeleteSelect.value = savedAutoDelete;
        
        autoDeleteSelect.addEventListener('change', function() {
            localStorage.setItem('autoDeleteDays', this.value);
            checkAutoDelete();
            showToast(`Auto-delete set to: ${getAutoDeleteText(this.value)}`);
        });
    }
    
    // Initial check for auto-delete
    checkAutoDelete();
});
