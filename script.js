// Prevent auto-popup immediately
document.addEventListener('DOMContentLoaded', function() {
    const clientDetailsModal = document.getElementById('clientDetailsModal');
    if (clientDetailsModal) {
        clientDetailsModal.style.display = 'none';
    }
});

// Sample data for the table
const users = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "active" },
    { id: 3, name: "Robert Johnson", email: "robert@example.com", status: "inactive" },
    { id: 4, name: "Emily Davis", email: "emily@example.com", status: "active" },
    { id: 5, name: "Michael Wilson", email: "michael@example.com", status: "active" },
    { id: 6, name: "Sarah Brown", email: "sarah@example.com", status: "inactive" },
    { id: 7, name: "David Miller", email: "david@example.com", status: "active" },
    { id: 8, name: "Lisa Taylor", email: "lisa@example.com", status: "active" },
    { id: 9, name: "James Anderson", email: "james@example.com", status: "inactive" },
    { id: 10, name: "Jennifer Thomas", email: "jennifer@example.com", status: "active" }
];

// Extended client data with more details
const extendedUsers = [
    { 
        id: 1, 
        name: "John Doe", 
        email: "john@example.com", 
        status: "active",
        phone: "+60185228763",
        joinDate: "2025-01-15",
        notes: "Premium client with regular purchases. Prefers email communication."
    },
    // ... keep your existing extendedUsers data
];

// DOM elements
const tableBody = document.getElementById('tableBody');
const periodButtons = document.querySelectorAll('.period-btn');
const currentDateElement = document.getElementById('currentDate');
const searchInput = document.querySelector('.search-input');
const exportBtn = document.getElementById('exportBtn');
const tableHeaders = document.querySelectorAll('th[data-sort]');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

// Client Details Modal Elements
const clientDetailsModal = document.getElementById('clientDetailsModal');
const closeClientDetails = document.getElementById('closeClientDetails');

// Pagination elements
const rowsPerPageSelect = document.getElementById('rowsPerPage');
const startItemElement = document.getElementById('startItem');
const endItemElement = document.getElementById('endItem');
const totalItemsElement = document.getElementById('totalItems');
const currentPageElement = document.getElementById('currentPage');
const totalPagesElement = document.getElementById('totalPages');
const firstPageBtn = document.getElementById('firstPage');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const lastPageBtn = document.getElementById('lastPage');

// Current state
let currentData = [...users];
let currentSort = { column: 'id', direction: 'asc' };
let currentPage = 1;
let rowsPerPage = 10;
let totalItems = users.length;

/**
 * Set current date in the header
 */
function setCurrentDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    currentDateElement.textContent = now.toLocaleDateString('en-US', options);
}

/**
 * Handle period button clicks
 */
function handlePeriodButtonClick(event) {
    const period = event.currentTarget.dataset.period;
    const today = new Date();
    let startDate, endDate;

    // Remove active class from all buttons
    periodButtons.forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button
    event.currentTarget.classList.add('active');

    switch (period) {
        case 'today':
            startDate = today;
            endDate = today;
            break;
        case 'week':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - today.getDay());
            endDate = new Date(today);
            endDate.setDate(today.getDate() + (6 - today.getDay()));
            break;
        case 'month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'quarter':
            const quarter = Math.floor(today.getMonth() / 3);
            startDate = new Date(today.getFullYear(), quarter * 3, 1);
            endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            break;
        case 'year':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
            break;
    }

    // Set date inputs
    startDateInput.value = formatDate(startDate);
    endDateInput.value = formatDate(endDate);
    
    // Apply the filter immediately
    applyDateFilter();
}

/**
 * Handle search input
 */
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        currentData = [...users];
    } else {
        currentData = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.id.toString().includes(searchTerm) ||
            user.status.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    totalItems = currentData.length;
    updateTable();
}

/**
 * Debounce search to improve performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Create debounced search function
const debouncedSearch = debounce(handleSearch, 300);

/**
 * Update sort indicators with new icons
 */
function updateSortIndicators(column, direction) {
    tableHeaders.forEach(header => {
        const indicator = header.querySelector('.sort-indicator');
        if (indicator) {
            indicator.classList.remove('asc', 'desc');
            
            if (header.dataset.sort === column) {
                indicator.classList.add(direction);
            }
        }
    });
}

/**
 * Initialize the table with user data
 */
function renderTable(data) {
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No clients found</td></tr>';
        return;
    }
    
    data.forEach(user => {
        const row = document.createElement('tr');
        row.classList.add('fade-in');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="status-${user.status}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
            <td><a class="details-link" onclick="openClientDetails(${user.id})">View Details</a></td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Filter and sort data based on current filters and sort options
 */
function updateTable() {
    let filteredData = [...currentData];
    
    // Apply sorting
    const sortValue = currentSort.column + '-' + currentSort.direction;
    const [column, direction] = sortValue.split('-');
    
    filteredData.sort((a, b) => {
        let aValue = a[column];
        let bValue = b[column];
        
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Apply pagination
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    
    renderTable(paginatedData);
    updateSortIndicators(column, direction);
    updatePaginationInfo();
    updatePaginationButtons();
}

/**
 * Export current table data as CSV
 */
function exportData() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Name,Email,Status\n" 
        + currentData.map(user => 
            `${user.id},${user.name},${user.email},${user.status}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clients_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Handle table header click for sorting
 */
function handleHeaderClick(event) {
    const header = event.currentTarget;
    const column = header.dataset.sort;
    const currentDirection = currentSort.column === column ? currentSort.direction : 'asc';
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    
    currentSort = { column, direction: newDirection };
    updateTable();
}

/**
 * Handle keyboard navigation for table headers
 */
function handleHeaderKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.click();
    }
}

/**
 * Set default dates (last 30 days)
 */
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const todayString = formatDate(today);
    const thirtyDaysAgoString = formatDate(thirtyDaysAgo);
    
    startDateInput.value = thirtyDaysAgoString;
    endDateInput.value = todayString;
    
    // Set max date to today for both inputs
    startDateInput.setAttribute('max', todayString);
    endDateInput.setAttribute('max', todayString);
}

/**
 * Apply date range filter
 */
function applyDateFilter() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (!startDate || !endDate) {
        return;
    }
    
    const today = new Date();
    const formatToday = formatDate(today);
    const selectedStart = new Date(startDate);
    const selectedEnd = new Date(endDate);
    const todayDate = new Date(formatToday);
    
    if (selectedStart > todayDate) {
        alert('Start date cannot be in the future.');
        startDateInput.value = formatToday;
        return;
    }
    
    if (selectedEnd > todayDate) {
        alert('End date cannot be in the future.');
        endDateInput.value = formatToday;
        return;
    }
    
    if (selectedStart > selectedEnd) {
        alert('Start date cannot be after end date.');
        startDateInput.value = '';
        endDateInput.value = '';
        return;
    }
    
    updateCardsWithDateFilter(startDate, endDate);
}

// Helper function to format dates as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Update cards with date filtered data (mock function)
 */
function updateCardsWithDateFilter(startDate, endDate) {
    const daysDiff = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    
    const baseUsers = 1248;
    const baseSales = 42580;
    const baseRevenue = 28450;
    
    const multiplier = Math.max(0.1, Math.min(1, daysDiff / 30));

    const mockUsers = Math.floor(baseUsers * multiplier);
    const mockSales = Math.floor(baseSales * multiplier);
    const mockRevenue = Math.floor(baseRevenue * multiplier);
    
    document.querySelector('#total-users + .card-value').textContent = Math.max(1, mockUsers).toLocaleString();
    document.querySelector('#total-sales + .card-value').textContent = `$${Math.max(1, mockSales).toLocaleString()}`;
    document.querySelector('#total-revenue + .card-value').textContent = `$${Math.max(1, mockRevenue).toLocaleString()}`;
    
    const cards = document.querySelectorAll('.card-value');
    cards.forEach(card => {
        card.style.opacity = '0.7';
        setTimeout(() => {
            card.style.opacity = '1';
        }, 300);
    });
}

/**
 * Open client details modal
 */
function openClientDetails(clientId) {
    const client = extendedUsers.find(user => user.id === clientId);
    if (client) {
        document.getElementById('detail-client-id').textContent = client.id;
        document.getElementById('detail-client-name').textContent = client.name;
        document.getElementById('detail-client-email').textContent = client.email;
        document.getElementById('detail-client-status').textContent = client.status.charAt(0).toUpperCase() + client.status.slice(1);
        document.getElementById('detail-client-phone').textContent = client.phone || 'Not provided';
        document.getElementById('detail-client-join-date').textContent = new Date(client.joinDate).toLocaleDateString();
        document.getElementById('detail-client-notes').textContent = client.notes || 'No additional information available.';
        
        clientDetailsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close client details modal
 */
function closeClientDetailsHandler() {
    clientDetailsModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

/**
 * Initialize pagination
 */
function initPagination() {
    totalItems = currentData.length;
    updatePaginationInfo();
    updatePaginationButtons();
}

/**
 * Update pagination information
 */
function updatePaginationInfo() {
    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, totalItems);
    
    startItemElement.textContent = start;
    endItemElement.textContent = end;
    totalItemsElement.textContent = totalItems;
    currentPageElement.textContent = currentPage;
    totalPagesElement.textContent = Math.ceil(totalItems / rowsPerPage);
}

/**
 * Update pagination buttons state
 */
function updatePaginationButtons() {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    lastPageBtn.disabled = currentPage === totalPages;
}

/**
 * Go to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    currentPage = Math.max(1, Math.min(page, totalPages));
    updateTable();
}

/**
 * Handle rows per page change
 */
function handleRowsPerPageChange() {
    rowsPerPage = parseInt(rowsPerPageSelect.value);
    currentPage = 1;
    updateTable();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Ensure modal is closed on page load
    if (clientDetailsModal) {
        clientDetailsModal.style.display = 'none';
    }
    
    // Initialize event listeners
    exportBtn.addEventListener('click', exportData);
    searchInput.addEventListener('input', debouncedSearch);
    
    startDateInput.addEventListener('input', function() {
        const today = formatDate(new Date());
        if (this.value > today) {
            this.value = today;
        }
    });

    endDateInput.addEventListener('input', function() {
        const today = formatDate(new Date());
        if (this.value > today) {
            this.value = today;
        }
    });

    periodButtons.forEach(btn => {
        btn.addEventListener('click', handlePeriodButtonClick);
    });

    tableHeaders.forEach(header => {
        header.addEventListener('click', handleHeaderClick);
        header.addEventListener('keydown', handleHeaderKeydown);
    });

    closeClientDetails.addEventListener('click', closeClientDetailsHandler);

    clientDetailsModal.addEventListener('click', (e) => {
        if (e.target === clientDetailsModal) {
            closeClientDetailsHandler();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && clientDetailsModal.style.display === 'flex') {
            closeClientDetailsHandler();
        }
    });

    rowsPerPageSelect.addEventListener('change', handleRowsPerPageChange);
    firstPageBtn.addEventListener('click', () => goToPage(1));
    prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    lastPageBtn.addEventListener('click', () => goToPage(Math.ceil(totalItems / rowsPerPage)));

    // Initialize app WITHOUT auto-clicking anything
    setCurrentDate();
    setDefaultDates();
    initPagination();
    updateTable();
    
    // Set today as active period without triggering click
    const todayBtn = document.querySelector('[data-period="today"]');
    if (todayBtn) {
        periodButtons.forEach(btn => btn.classList.remove('active'));
        todayBtn.classList.add('active');
    }
});
