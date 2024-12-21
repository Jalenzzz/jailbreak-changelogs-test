document.addEventListener("DOMContentLoaded", async () => {
  const rawItemName = window.location.pathname.split("/").pop();
  const itemName = decodeURIComponent(rawItemName).trim().replace(/\s+/g, " "); // Get the item name from the URL

  async function loadItemDetails() {
    try {
      const urlPath = window.location.pathname.split("/");
      const urlType = urlPath[2]; // Get type from URL
      const rawItemName = urlPath.pop();
      const itemName = decodeURIComponent(rawItemName)
        .trim()
        .replace(/\s+/g, " ");

      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
          itemName
        )}&type=${urlType}`
      );
      const item = await response.json();

      if (item && !item.error) {
        displayItemDetails(item);
      } else {
        showErrorMessage("Item Not Found.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showErrorMessage("Error Loading item details");
    }
  }

  function formatValue(value) {
    if (isNaN(value) || value === 0 || value === null || value === undefined) {
      return value; // Return the value as-is if it's not a number
    }

    // Convert the value to a number, then format it with commas
    return value.toLocaleString();
  }

  function displayItemDetails(item) {
    function showFirefoxAutoplayNotice() {
      // Remove existing notice if present
      const existingNotice = document.querySelector(".firefox-autoplay-notice");
      if (existingNotice) {
        existingNotice.remove();
      }

      const notice = document.createElement("div");
      notice.className = "firefox-autoplay-notice";
      notice.innerHTML = `
        <div style="
          position: fixed;
          top: 50px;
          right: 20px;
          background: #1E1E1E;
          border: 2px solid #FF4500;
          color: #FFFFFF;
          padding: 15px;
          border-radius: 8px;
          max-width: 350px;
          width: calc(100% - 40px);
          z-index: 1000;
          box-shadow: 0 0 20px rgba(255,69,0,0.2);
          font-family: system-ui, -apple-system, sans-serif;
          animation: pulse 2s infinite;
          margin: 0 auto;

    
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            gap: 8px;
          ">
            <span style="color: #FF4500; font-size: 24px;">⚠️</span>
            <h4 style="
              margin: 0;
              font-size: 16px;
              color: #FF4500;
              flex-grow: 1;
              font-weight: bold;
            ">Firefox Drift Preview Notice</h4>
            <button onclick="this.closest('.firefox-autoplay-notice').remove()" 
              style="
                background: #FF4500;
                border: 2px solid #FFFFFF;
                color: #FFFFFF;
                cursor: pointer;
                padding: 4px 8px;
                line-height: 1;
                border-radius: 4px;
                margin-left: 8px;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
              "
              onmouseover="this.style.backgroundColor='#FF6A33'"
              onmouseout="this.style.backgroundColor='#FF4500'"
              title="Dismiss">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <p style="
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #FFFFFF;
          ">
            Hover over the drift image to preview the effect! To enable auto-preview, you'll need to adjust Firefox's autoplay settings. 
            <a href="https://support.mozilla.org/en-US/kb/block-autoplay#w_always-allow-or-block-media-autoplay" 
               target="_blank" 
               style="
                 color: #FF4500;
                 text-decoration: underline;
                 font-weight: 500;
               ">
              Learn how to enable autoplay
            </a>
          </p>
        </div>
      `;

      // Add mobile-specific styles
      const mobileStyles = document.createElement("style");
      mobileStyles.textContent = `
      @media (max-width: 768px) {
        .firefox-autoplay-notice > div {
          right: 50% !important;
          transform: translateX(50%) !important;
          top: 40px !important;
          max-width: calc(100% - 40px) !important;
          font-size: 14px !important;
        }
      }
    `;
      document.head.appendChild(mobileStyles);

      // Add pulse animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,69,0,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(255,69,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,69,0,0); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(notice);
    }
    const container = document.getElementById("item-container");
    const image_type = item.type.toLowerCase();
    let color = "#124E66";
    if (item.type === "Vehicle") color = "#c82c2c";
    if (item.type === "Spoiler") color = "#C18800";
    if (item.type === "Rim") color = "#6335B1";
    if (item.type === "Tire Sticker") color = "#1CA1BD";
    if (item.type === "Drift") color = "#FF4500";
    if (item.type === "Color") color = "#8A2BE2";
    if (item.type === "Texture") color = "#708090";

    // Determine media element based on type - following values.js pattern
    let element = "";
    if (item.type === "Drift") {
      element = `
            <div class="media-container">
                <img 
                    src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/thumbnails/${item.name}.webp"
                    class="img-fluid rounded thumbnail"
                    alt="${item.name}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
                    onerror="handleimage(this)"
                >
                <video 
                  src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/${item.name}.webm"
                  class="img-fluid rounded video-player"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
                  playsinline 
                  muted 
                  loop
                  preload="metadata"
                  defaultMuted
              ></video>
            </div>
            `;

      setTimeout(() => {
        try {
          const mediaContainer = document.querySelector(".media-container");
          const video = mediaContainer?.querySelector("video");

          sessionStorage.removeItem("firefoxNoticeShown");
          console.log("User Agent:", navigator.userAgent.toLowerCase());

          if (mediaContainer && video) {
            // Add muted attribute and preload metadata
            video.muted = true;
            video.preload = "metadata";
            video.volume = 0; // Explicitly set volume to 0

            // Add click handler for Firefox
            video.addEventListener("click", () => {
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            });

            mediaContainer.addEventListener("mouseenter", async () => {
              console.log("Mouse enter detected");
              video.style.opacity = "1";

              try {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch((error) => {
                    console.warn("Video playback error:", error);

                    // Wait a short moment to check if video is actually playing
                    setTimeout(() => {
                      if (
                        error.name === "NotAllowedError" &&
                        navigator.userAgent.toLowerCase().indexOf("firefox") >
                          -1 &&
                        video.paused &&
                        !video.currentTime > 0 // Additional check if video hasn't started
                      ) {
                        showFirefoxAutoplayNotice();
                      }
                    }, 100);
                  });
                }
              } catch (error) {
                console.error("Video playback error:", error);
              }
            });

            mediaContainer.addEventListener("mouseleave", () => {
              video.style.opacity = "0";
              if (!video.paused) {
                video.pause();
                video.currentTime = 0;
              }
            });
          }
        } catch (error) {
          console.error("Error in video setup:", error);
        }
      }, 500);
    } else {
      element = `<div class="image-container">
          <img 
              onerror="handleimage(this)" 
              id="${item.name}" 
              src="https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp" 
              class="img-fluid rounded" 
              alt="${item.name}">
      </div>`;
    }

    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);
    const urlPath = window.location.pathname.split("/");
    const urlType = urlPath[2]; // Assuming URL structure is /item/type/name
    const formattedUrlType = item.type;

    container.innerHTML = `
            <!-- Breadcrumb Navigation -->
            <div class="container-fluid mt-3">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="/values">Values</a></li>
                        <li class="breadcrumb-item"><a href="/values">${formattedUrlType}s</a></li>
                        <li class="breadcrumb-item active" aria-current="page">${
                          item.name
                        }</li>
                    </ol>
                </nav>
             </div>
    
           <div class="container-fluid mt-5">
              <div class="media-container-wrapper">
                  <!-- Main Item Info Section -->
                  <div class="row mb-4">
                      <!-- Left Side - Image -->
                      <div class="col-md-5 p-3">
                        ${
                          item.type === "Drift"
                            ? element
                            : `
                          <div class="media-container">
                              <img 
                                  src="https://cdn.jailbreakchangelogs.xyz/images/items/${encodeURIComponent(
                                    image_type
                                  )}s/${item.name}.webp"
                                  class="img-fluid rounded thumbnail"
                                  alt="${item.name}"
                                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
                                  onerror="handleimage(this)"
                              >
                          </div>
                        `
                        }
                      </div>

                      <!-- Right Side - Item Details -->
                      <div class="col-md-7 p-3">
                          <!-- Item Title and Type Badge -->
                          <div class="d-flex align-items-center mb-4">
                              <h1 class="mb-0 me-3 h2" style="font-weight: 600;">${
                                item.name
                              }</h1>
                              <span class="badge" 
                                    style="background-color: ${color};
                                          font-weight: 600;
                                          padding: 8px 16px;
                                          font-size: 1rem;
                                          letter-spacing: 0.5px;
                                          border-radius: 6px;">
                                  ${item.type}
                              </span>
                          </div>
                          <!-- Values Section -->
                          <div class="border-top border-bottom py-4 my-4">
                              <div class="row g-4">
                                  <div class="col-6">
                                      <h4 class="text-muted mb-3">Cash Value</h4>
                                      <p class="h2 mb-0" style="color: #00ff00; font-weight: 600;">${value}</p>
                                  </div>
                                  <div class="col-6">
                                      <h4 class="text-muted mb-3">Duped Value</h4>
                                      <p class="h2 mb-0" style="color: #FF0000; font-weight: 600;">${duped_value}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
        
            <!-- Combined Graph Section -->
            <div class="row mb-4" style="padding-top: 40px;">
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
            </div>`;
  }

  function showErrorMessage(message) {
    const container = document.getElementById("item-container");
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

  window.handleimage = function (element) {
    element.src =
      "https://cdn.jailbreakchangelogs.xyz/backgrounds/background1.webp";
  };

  loadItemDetails();
});
