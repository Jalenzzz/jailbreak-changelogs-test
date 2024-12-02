document.addEventListener("DOMContentLoaded", () => {
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
            localStorage.setItem(
                "redirectAfterLogin",
                "/api"
              ); // Store the redirect URL in local storage
              window.location.href = "/login"; // Redirect to login page
        }
    const userid = sessionStorage.getItem("userid");
    const url = `https://api.jailbreakchangelogs.xyz/owner/check?user=${userid}`;
        
    fetch(url)
        .then(response => {
            if (response.ok) {  // Checks if the status code is in the 200-299 range
              console.log('Success:', response.status);  // Log status code (e.g., 200)
            } else {
              window.location.href = "/";  // Log status code for errors (e.g., 404, 500)
            }
          })
            .catch(error => {
            console.error('Request failed', error);  // Handle network or other errors
          });

    // Function to fetch and populate the table with changelogs



    let changelogs = [];
    let rowsPerPage = 10; // Default rows per page
    let currentPage = 1;

    // Function to fetch and populate the table with changelogs
    function loadChangelogs() {
        const apiUrl = 'https://api.jailbreakchangelogs.xyz/changelogs/list';

        // Fetch the data from the API
        fetch(apiUrl)
            .then(response => response.json())  // Parse JSON from the response
            .then(data => {
                changelogs = data;  // Assuming the API returns an array of changelogs
                updatePagination();
                displayTable();
            })
            .catch(error => {
                console.error('Error fetching changelogs:', error);
            });
    }

    // Function to update pagination controls based on total rows and rows per page
    function updatePagination() {
        const totalRows = changelogs.length;
        const totalPages = Math.ceil(totalRows / rowsPerPage);

        // Disable or enable pagination buttons based on current page
        const firstPageBtn = document.getElementById('firstPageBtn');
        const prevPageBtn = document.getElementById('prevPageBtn');
        const nextPageBtn = document.getElementById('nextPageBtn');
        const lastPageBtn = document.getElementById('lastPageBtn');
        const currentPageInput = document.getElementById('currentPageInput');

        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        lastPageBtn.disabled = currentPage === totalPages;

        currentPageInput.value = currentPage;
    }

    // Function to display the table based on rowsPerPage and currentPage
    function displayTable() {
        const tableBody = document.getElementById('changelog-table-body');
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = changelogs.slice(startIndex, endIndex);

        // Clear the table body before adding new rows
        tableBody.innerHTML = '';

        // Populate the table with the paginated data
        paginatedData.forEach(changelog => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${changelog.id}</td>
                <td>${changelog.title}</td>
                <td>${changelog.sections}</td>
                <td>${changelog.image_url}</td>
                <td>
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${changelog.id}">Edit</button>
                    <button class="btn btn-sm btn-primary save-btn" data-id="${changelog.id}" style="display:none;">Save</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Reattach edit button event listeners after table update
        attachEditSaveHandlers();
    }

    // Event listener for rows per page dropdown
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(event) {
            rowsPerPage = parseInt(event.target.getAttribute('data-rows'));
            currentPage = 1; // Reset to first page when changing rows per page
            document.getElementById('dropdownMenuButton2').textContent = event.target.textContent;
            updatePagination();
            displayTable();
        });
    });

    // Event listeners for pagination buttons
    document.getElementById('firstPageBtn').addEventListener('click', function() {
        currentPage = 1;
        updatePagination();
        displayTable();
    });

    document.getElementById('prevPageBtn').addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updatePagination();
            displayTable();
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', function() {
        const totalPages = Math.ceil(changelogs.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updatePagination();
            displayTable();
        }
    });

    document.getElementById('lastPageBtn').addEventListener('click', function() {
        const totalPages = Math.ceil(changelogs.length / rowsPerPage);
        currentPage = totalPages;
        updatePagination();
        displayTable();
    });

    // Event listener for page input (directly entering page number)
    document.getElementById('currentPageInput').addEventListener('change', function(event) {
        const inputPage = parseInt(event.target.value);
        const totalPages = Math.ceil(changelogs.length / rowsPerPage);
        if (inputPage >= 1 && inputPage <= totalPages) {
            currentPage = inputPage;
            updatePagination();
            displayTable();
        } else {
            event.target.value = currentPage;
        }
    });

    // Function to handle editing and saving (same as before)
    function attachEditSaveHandlers() {
      const editButtons = document.querySelectorAll('.edit-btn');
      editButtons.forEach(button => {
          button.addEventListener('click', function() {
              const row = button.closest('tr');
              const cells = row.querySelectorAll('td');
              const saveButton = row.querySelector('.save-btn');
  
              cells.forEach((cell, index) => {
                  if (index !== 4) { // Don't modify the actions column
                      let input;
                      if (index === 0) {  // ID field - convert to input field
                          input = document.createElement('input');
                          input.type = 'text';
                          input.value = cell.textContent.trim();
                      } else {  // Other fields - convert to textarea
                          input = document.createElement('textarea');
                          input.rows = 4;
                          input.cols = 30;
                          input.value = cell.textContent.trim();
                      }
                      cell.innerHTML = '';  // Clear the existing content
                      cell.appendChild(input);
                  }
              });
  
              button.style.display = 'none';
              saveButton.style.display = 'inline-block';
          });
      });
  
      const saveButtons = document.querySelectorAll('.save-btn');
      saveButtons.forEach(button => {
          button.addEventListener('click', function() {
              const row = button.closest('tr');
              const cells = row.querySelectorAll('td');
  
              const updatedChangelog = {
                  id: row.querySelector('input').value, // ID field is an input
                  title: cells[1].querySelector('textarea').value,
                  sections: cells[2].querySelector('textarea').value,
                  imageUrl: cells[3].querySelector('textarea').value
              };
  
              // Call API or handle save action (e.g., update data in changelogs array)
              console.log(updatedChangelog);
  
              // Now, update the table and revert the inputs back to text
              cells[0].textContent = updatedChangelog.id; // ID is updated as text
              cells[1].textContent = updatedChangelog.title;
              cells[2].textContent = updatedChangelog.sections;
              cells[3].textContent = updatedChangelog.imageUrl;
  
              button.style.display = 'none';
              row.querySelector('.edit-btn').style.display = 'inline-block';
          });
      });
  }
  loadChangelogs();
});

