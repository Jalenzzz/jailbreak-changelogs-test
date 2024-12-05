document.addEventListener("DOMContentLoaded", () => {
    // Function to get the token cookie
    function getCookie(name) {
        let cookieArr = document.cookie.split(";");
        for (let i = 0; i < cookieArr.length; i++) {
            let cookiePair = cookieArr[i].split("=");
            if (name === cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }
    
    const token = getCookie("token");
    
    if (!token) {
        localStorage.setItem("redirectAfterLogin", "/dashboard"); // Store the redirect URL in local storage
        window.location.href = "/login"; // Redirect to login page
    }
    
    const userid = sessionStorage.getItem("userid");
    const url = `https://api.jailbreakchangelogs.xyz/owner/check?user=${userid}`;
 
    const tabs = document.querySelectorAll('#adminTabs .nav-link');
    const adminTabsContent = document.getElementById('adminTabsContent');
    
    // Pagination state variables
    let currentPage = 1;
    let rowsPerPage = 10;  // Default rows per page
    let currentData = [];
    let cachedChangelogs = [];
    let cachedSeasonData = [];

    // Function to update content based on selected tab
    let currentTabId = tabs[0].getAttribute('id');
    async function updateTabContent(tabId) {
        currentTabId = tabId;

        // Clear existing content
        adminTabsContent.innerHTML = '';

        // Create the header (h3 or h1) with the title of the selected tab
        const header = document.createElement('div');
        header.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-3');

        const h3 = document.createElement('h3');
        h3.textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1); // Capitalize the first letter

        // Create the "Add New" button
        // Append h3 and button to the header
        header.appendChild(h3);

        // Append the header to the content area
        adminTabsContent.appendChild(header);
        
        // If changelog tab is selected, fetch and display the changelogs with pagination
        if (tabId === 'changelogs') {
            const table = await parseChangelogData();
            adminTabsContent.appendChild(table);
        }
        if (tabId ==='seasons') {
            const table = await parseSeasonData();
            adminTabsContent.appendChild(table);
        }
    }

    // Fetch changelog data
    async function parseChangelogData() {
        try {
            let data = null;
            if (cachedChangelogs.length > 0) {
                data = cachedChangelogs;
            }
            else {
                const response = await fetch("https://api.jailbreakchangelogs.xyz/changelogs/list");
                data = await response.json();
                cachedChangelogs = data;
            }
            currentData = data; // Store the data globally for pagination
            updatePagination();
            return generateChangelogTable(currentData);
        } catch (error) {
            console.error("Error fetching changelogs:", error);
        }
    }
    async function parseSeasonData() {
        try {
            let data = null;
            if (cachedSeasonData.length > 0) {
                data = cachedSeasonData;
            }
            else {
                const response = await fetch("https://api.jailbreakchangelogs.xyz/seasons/list");
                data = await response.json();
                cachedSeasonData = data;
            }
            currentData = data; // Store the data globally for pagination
            updatePagination();
            return generateSeasonTable(currentData);
        } catch (error) {
            console.error("Error fetching seasons:", error);
        }
    }

    // Function to generate the table
    function generateChangelogTable(changelogs) {
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped');

        // Create the thead
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['ID', 'Title', 'Sections', 'Image URL', 'Actions'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create the tbody
        const tbody = document.createElement('tbody');
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = changelogs.slice(startIndex, endIndex);

        paginatedData.forEach(changelog => {
            const row = document.createElement('tr');
            const idCell = document.createElement('td');
            idCell.textContent = changelog.id;
            row.appendChild(idCell);

            const titleCell = document.createElement('td');
            titleCell.textContent = changelog.title;
            row.appendChild(titleCell);

            const sectionsCell = document.createElement('td');
            sectionsCell.textContent = changelog.sections; // Assuming sections is an array
            row.appendChild(sectionsCell);

            const imageUrlCell = document.createElement('td');
            imageUrlCell.textContent = changelog.image_url || 'No Image';
            row.appendChild(imageUrlCell);

            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-primary', 'btn-sm');
            editButton.textContent = 'Edit';
            editButton.onclick = () => { editChangelog(changelog.id); };
            actionsCell.appendChild(editButton);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        return table;
    }
    function generateSeasonTable(seasons) {
        const table = document.createElement('table');
        table.classList.add('table', 'table-striped');
    
        // Create the thead (header)
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Season', 'Title', 'Description', 'Actions'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
    
        // Create the tbody (body of the table)
        const tbody = document.createElement('tbody');
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = seasons.slice(startIndex, endIndex);  // Slice data for pagination
    
        paginatedData.forEach(season => {
            const row = document.createElement('tr');
            
            // ID Cell
            const seasonnumber = document.createElement('td');
            seasonnumber.textContent = season.season;
            row.appendChild(seasonnumber);
    
            // Season Name Cell
            const title = document.createElement('td');
            title.textContent = season.title;
            row.appendChild(title);
    
            // Start Date Cell
            const description = document.createElement('td');
            description.textContent = season.description;  // Assuming start_date is a string or date
            row.appendChild(description);
    
    
            // Actions Cell (Edit button)
            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-primary', 'btn-sm');
            editButton.textContent = 'Edit';
            editButton.onclick = () => { editSeason(season.season); };  // Placeholder edit function
            actionsCell.appendChild(editButton);
            row.appendChild(actionsCell);
    
            tbody.appendChild(row);
        });
    
        table.appendChild(tbody);
        return table;  // Return the newly generated table
    }

    // Update pagination controls (next, prev, current page, rows per page)
    function updatePagination() {
        const totalPages = Math.ceil(currentData.length / rowsPerPage);
        document.getElementById('currentPageInput').value = currentPage;
        document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
        document.getElementById('prevPageBtn').disabled = currentPage === 1;
        document.getElementById('firstPageBtn').disabled = currentPage === 1;
        document.getElementById('lastPageBtn').disabled = currentPage === totalPages;
    }

    // Handle pagination button clicks
    document.getElementById('firstPageBtn').addEventListener('click', () => {
        currentPage = 1;
        updatePagination();
        displayTable();
    });
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            displayTable();
        }
    });
    document.getElementById('nextPageBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(currentData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            displayTable();
        }
    });
    document.getElementById('lastPageBtn').addEventListener('click', () => {
        const totalPages = Math.ceil(currentData.length / rowsPerPage);
        currentPage = totalPages;
        updatePagination();
        displayTable();
    });

    // Handle rows per page selection
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(event) {
            rowsPerPage = parseInt(event.target.textContent);
            currentPage = 1; // Reset to the first page
            const dropdownButton = document.getElementById('dropdownMenuButton');
            dropdownButton.textContent = this.textContent; // Update the button text to the selected value
            updatePagination();
            displayTable();
        });
    });

    // Handle current page input change
    document.getElementById('currentPageInput').addEventListener('change', function(event) {
        const inputPage = parseInt(event.target.value);
        const totalPages = Math.ceil(currentData.length / rowsPerPage);
        if (inputPage >= 1 && inputPage <= totalPages) {
            currentPage = inputPage;
            updatePagination();
            displayTable();
        }
    });

    function createHeader(tabTitle) {
        const header = document.createElement('div');
        header.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-3');
    
        const h3 = document.createElement('h3');
        h3.textContent = tabTitle.charAt(0).toUpperCase() + tabTitle.slice(1); // Capitalize the first letter of the tab title
    
        // Create the "Add New" button
        // Append the h3 and the "Add New" button to the header
        header.appendChild(h3);
    
        return header;
    }
    document.getElementById('add-new').addEventListener('click', () => {
        addNewEntry(currentTabId);
    });


    function addNewEntry(tabId) {
        const modalElement = document.getElementById('addEntry'); // Get the modal element
        const modal = new bootstrap.Modal(modalElement); // Initialize Bootstrap modal
    
        // Get the modal's body and header
        const modalBody = modalElement.querySelector('.modal-body');
        const modalTitle = modalElement.querySelector('.modal-title');
    
        // Clear the modal body (to reset it each time)
        modalBody.innerHTML = ''; 
    
        if (tabId === 'changelogs') {
            // Create new input elements dynamically
            const titleInput = document.createElement('input');
            titleInput.setAttribute('type', 'text');
            titleInput.classList.add('form-control');
            titleInput.setAttribute('id', 'changelogTitle');
            titleInput.placeholder = 'Enter title';
    
            const sectionsInput = document.createElement('textarea');
            sectionsInput.classList.add('form-control');
            sectionsInput.setAttribute('id', 'changelogSection');
            sectionsInput.placeholder = 'Enter sections';
    
            const imageUrlInput = document.createElement('textarea');
            imageUrlInput.classList.add('form-control');
            imageUrlInput.setAttribute('id', 'changelogImageUrl');
            imageUrlInput.placeholder = 'Enter Image URL';
    
            // Set the title for the modal
            modalTitle.textContent = 'Add New Changelog';
            const spacerDiv = document.createElement('div');
            spacerDiv.classList.add('my-2');    
            // Append the new inputs to the modal body
            modalBody.appendChild(titleInput);
            modalBody.appendChild(spacerDiv);
            modalBody.appendChild(sectionsInput);
            modalBody.appendChild(spacerDiv);
            modalBody.appendChild(imageUrlInput);
        }
        if (tabId ==='seasons') {
            // Create new input elements dynamically
            const seasonInput = document.createElement('input');
            seasonInput.setAttribute('type', 'number');
            seasonInput.classList.add('form-control');
            seasonInput.setAttribute('id','seasonNumber');
            seasonInput.placeholder = 'Enter season number';
            const titleInput = document.createElement('input');
            titleInput.setAttribute('type', 'text');
            titleInput.classList.add('form-control');
            titleInput.setAttribute('id','seasonTitle');
            titleInput.placeholder = 'Enter season title';
            const descriptionInput = document.createElement('textarea');
            descriptionInput.classList.add('form-control');
            descriptionInput.setAttribute('id','seasonDescription');
            descriptionInput.placeholder = 'Enter season description';

            modalTitle.textContent = 'Add New Season';
            const spacerDiv = document.createElement('div');
            spacerDiv.classList.add('my-2');

            modalBody.appendChild(seasonInput);
            modalBody.appendChild(spacerDiv);
            modalBody.appendChild(titleInput);
            modalBody.appendChild(spacerDiv);
            modalBody.appendChild(descriptionInput);
        }
    
        // Show the modal
        modal.show();
    }



    function editChangelog(changelogID) {
        console.log('Editing Changelog:', changelogID);
        
        // Find the changelog from the cachedChangelogs array
        const changelog = cachedChangelogs.find(c => c.id === changelogID);
        
        if (!changelog) {
            console.error('Changelog not found:', changelogID);
            return;
        }
    
        // Get the modal element and initialize Bootstrap modal
        const modalElement = document.getElementById('addEntry');
        const modal = new bootstrap.Modal(modalElement);
    
        // Clear any existing content in the modal body
        const modalBody = modalElement.querySelector('.modal-body');
        modalBody.innerHTML = ''; 
    
        // Set the modal title
        const modalTitle = modalElement.querySelector('.modal-title');
        modalTitle.textContent = 'Edit Changelog';
    
        // Create input fields for the modal
        const titleInput = document.createElement('input');
        titleInput.id = 'changelogTitle';
        titleInput.setAttribute('type', 'text');
        titleInput.classList.add('form-control');
        titleInput.value = changelog.title;
    
        const sectionsInput = document.createElement('textarea');
        sectionsInput.id = 'changelogSections'; // Ensure this ID matches the query selector later
        sectionsInput.classList.add('form-control');
        sectionsInput.value = changelog.sections;
    
        const imageUrlInput = document.createElement('textarea');
        imageUrlInput.id = 'changelogImageUrl'; // Ensure this ID matches the query selector later
        imageUrlInput.classList.add('form-control');
        imageUrlInput.value = changelog.image_url;


        // Append inputs to modal body
        modalBody.appendChild(titleInput);
        modalBody.appendChild(document.createElement('br')); // Spacer
        modalBody.appendChild(sectionsInput);
        modalBody.appendChild(document.createElement('br')); // Spacer
        modalBody.appendChild(imageUrlInput);

    
        // Show the modal
        modal.show();
        const submitModalButton = document.getElementById('submit-modal');
        submitModalButton.addEventListener('click', function() {
            // Ensure the required inputs are available
            const modalElement = document.getElementById('addEntry');
            const titleInput = modalElement.querySelector('#changelogTitle');
            const sectionsInput = modalElement.querySelector('#changelogSections');
            const imageUrlInput = modalElement.querySelector('#changelogImageUrl');
            
            // Log the updated values (you can replace this with an API call or form submission)
            console.log('Updated Title:', titleInput.value);
            console.log('Updated Sections:', sectionsInput.value);
            console.log('Updated Image URL:', imageUrlInput.value);
            
            // Get the token from cookies (ensure getCookie() is defined somewhere)
            const token = getCookie("token");
        
            // Send the PUT request to update the changelog
            fetch(`https://api.jailbreakchangelogs.xyz/changelogs/update?id=${changelogID}&token=${token}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    header: titleInput.value,
                    sections: sectionsInput.value,
                    image_url: imageUrlInput.value
                }),
            })
            .then(response => response.json())  // Ensure the response is parsed as JSON
            .then(data => {
                // Handle the response (e.g., show success message, update UI)
                console.log('Changelog updated successfully:', data);
                modal.hide();
                window.location.reload(); // Refresh the page to update the table
               
            })
            .catch(error => {
                // Handle any errors (e.g., network or server errors)
                console.error('Error updating changelog:', error);
            });
        });

    }
    function editSeason(seasonID) {

    }
    function displayTable() {
        adminTabsContent.innerHTML = ''; // Clear existing content
        const header = createHeader(currentTabId);
        adminTabsContent.appendChild(header);
        if (currentTabId === 'changelogs') {
            const table = generateChangelogTable(currentData);
            adminTabsContent.appendChild(table);
        }
        if (currentTabId ==='seasons') {
            const table = generateSeasonTable(currentData);
            adminTabsContent.appendChild(table);
        }
    }


    // Loop through all tab buttons and add event listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', function(event) {
            const tabId = event.target.id.split('-')[0];
            updateTabContent(tabId);  // Update content for the selected tab
        });
    });

    // Optionally, set initial content for the active tab
    const initialTab = document.querySelector('.nav-link.active');
    if (initialTab) {
        updateTabContent(initialTab.id.split('-')[0]);
    }
});
