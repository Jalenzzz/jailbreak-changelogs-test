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
        if (item.type === 'Rim') color = '#6335B1';
        if (item.type === 'Tire Sticker') color = '#1CA1BD';
        if (item.type === 'Drift') color = '#FF4500';
        if (item.type === 'Color') color = '#8A2BE2';
        if (item.type === 'Texture') color = '#708090';
    
        // Determine media element based on type - following values.js pattern
        let element = '';
        if (item.type === 'Drift') {
            element = `
                <div class="media-container" style="position: relative;">
                    <img 
                        src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/thumbnails/${item.name}.webp"
                        class="img-fluid rounded thumbnail"
                        alt="${item.name}"
                        style="width: 100%; height: 300px; object-fit: contain;"
                        onerror="handleimage(this)"
                    >
                    <video 
                        src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/${item.name}.webm"
                        class="img-fluid rounded video-player"
                        style="width: 100%; height: 300px; object-fit: contain; position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 0.3s ease;"
                        playsinline 
                        muted 
                        loop
                    ></video>
                </div>`;

            // Add event listeners after the HTML is inserted
            setTimeout(() => {
                const mediaContainer = document.querySelector('.media-container');
                const video = mediaContainer.querySelector('video');
                
                mediaContainer.addEventListener('mouseenter', () => {
                    video.style.opacity = '1';
                    video.play();
                });

                mediaContainer.addEventListener('mouseleave', () => {
                    video.style.opacity = '0';
                    video.pause();
                    video.currentTime = 0;
                });
            }, 0);
        } else {
            const image_type = item.type.toLowerCase();
            element = `<img 
                        onerror="handleimage(this)" 
                        id="${item.name}" 
                        src="https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp" 
                        class="img-fluid rounded" 
                        alt="${item.name}"
                        style="width: 100%; height: 300px; object-fit: contain;">`;
        }

    
        const value = formatValue(item.cash_value);
        const duped_value = formatValue(item.duped_value);
    
        container.innerHTML = `
            <!-- Breadcrumb Navigation -->
            <div class="container-fluid mt-3">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="/values">Values</a></li>
                        <li class="breadcrumb-item"><a href="/values">${item.type}s</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${item.name}</li>
                    </ol>
                </nav>
            </div>
    
            <div class="container-fluid mt-5">
                <!-- Main Item Info Section -->
                <div class="row mb-4">
                   
                    <div class="col-md-5 p-3">
                        ${element}
                    </div>
                    <!-- Right Side - Item Details -->
                    <div class="col-md-7 p-3">
                        <div class="d-flex align-items-center mb-3">
                            <h1 class="mb-0 me-3 h2">${item.name}</h1>
                            <span style="background-color: ${color};
                                         font-weight: 600;
                                         padding: 6px 12px;
                                         font-size: 1rem;
                                         letter-spacing: 0.5px;" class="badge">${item.type}</span>
                        </div>
                        <div class="border-top border-bottom py-3 my-3">
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
        </div>`;
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