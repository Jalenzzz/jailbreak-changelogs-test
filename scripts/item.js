document.addEventListener('DOMContentLoaded', async () => {
    const rawItemName = window.location.pathname.split('/').pop();
    const itemName = decodeURIComponent(rawItemName)
        .trim()
        .replace(/\s+/g, ' ');// Get the item name from the URL

    async function loadItemDetails() {
        try {
            const response = await fetch (`https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(itemName)}`);
            const item = await response.json();
    
            if (item && !item.error) {
                displayItemDetails(item);
            } else {
                showErrorMessage('Item Not Found.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showErrorMessage('Error Loading item details');
        }
    }

    function formatValue(value) {
        console.log('Formatting value:', value);
        if (isNaN(value) || value === 0 || value === null || value === undefined) {
          return value; // Return the value as-is if it's not a number
        }
        
        // Convert the value to a number, then format it with commas
        return value.toLocaleString();
      }

      function displayItemDetails(item) {
        const container = document.getElementById('item-container');
        let color = '#124E66';
        if (item.type === 'Vehicle') color = '#c82c2c';
        if (item.type === 'Spoiler') color = '#C18800';
    
        const image_type = item.type.toLowerCase();
        const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp`;
        console.log('Attempting to load image:', image_url)
        const value = formatValue(item.cash_value);
        const duped_value = formatValue(item.duped_value);
    
        container.innerHTML = `

            <!-- Breadcrumb Navigation -->
            <div class="container-fluid mt-3">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="/values">Values</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${item.name}</li>
                    </ol>
                </nav>
            </div>

            <div class="container-fluid mt-5">
                <!-- Main Item Info Section -->
                <div class="row mb-4">
                    <!-- Left Side - Image -->
                    <div class="col-md-6 p-4">
                        <img onerror="handleimage(this)" 
                             id="${item.name}" 
                             src="${image_url}" 
                             class="img-fluid rounded shadow" 
                             alt="${item.name}"
                             style="width: 100%; height: 400px; object-fit: cover;">
                    </div>
                    <!-- Right Side - Item Details -->
                    <div class="col-md-6 p-4">
                        <div class="d-flex align-items-center mb-3">
                            <h1 class="mb-0 me-3">${item.name}</h1>
                            <span style="background-color: ${color};
                                         font-weight: 600;
                                         padding: 8px 16px;
                                         font-size: 1.2rem;
                                         letter-spacing: 0.5px;" class="badge">${item.type}</span>
                        </div>
                        <div class="border-top border-bottom py-4 my-4">
                            <div class="row">
                                <div class="col-6">
                                    <h4>Cash Value</h4>
                                    <p class="h3" style="color: #00ff00">${value}</p>
                                </div>
                                <div class="col-6">
                                    <h4>Duped Value</h4>
                                    <p class="h3" style="color: #FF0000">${duped_value}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    
               <!-- Combined Graph Section -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Value History & Trade Activity</h3>
                            </div>
                            <div class="card-body">
                                <div id="combinedChart" style="height: 400px;">
                                    <!-- Combined graph will be inserted here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

    
                <!-- Comments Section -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Comments for ${item.name}</h3>
                            </div>
                            <div class="card-body">
                                <!-- Add Comment Form -->
                                <form id="commentForm" class="mb-4">
                                    <div class="mb-3">
                                        <textarea class="form-control" id="commentText" rows="3" 
                                                  placeholder="Add your comment..."></textarea>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Post Comment</button>
                                </form>
    
                                <!-- Comments List -->
                                <div id="commentsList">
                                    <!-- Comments will be dynamically loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function showErrorMessage(message) {
        const container = document.getElementById('item-container');
        container.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger text-center role="alert">
                   ${message}
                   <br>
                   <a href="/values" class="btn btn-primary mt-3">Back to All Items</a>
                </div>
            </div>
        `;
    }

    window.handleimage = function(element) {
        element.src = 'https://cdn.jailbreakchangelogs.xyz/backgrounds/background1.webp'
    }
    
    loadItemDetails();
})