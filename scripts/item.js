document.addEventListener("DOMContentLoaded", async () => {
  // Add this near the top of the file
  const commentsWrapper = document.querySelector(".comments-wrapper");
  if (commentsWrapper) {
    commentsWrapper.style.display = "none"; // Hide initially
    commentsWrapper.innerHTML = `
      <div class="text-center py-5">
        <div class="custom-spinner mx-auto"></div>
        <p class="text-muted mt-3">Loading comments...</p>
      </div>
    `;
    commentsWrapper.style.display = "block"; // Show loading spinner
  }

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
        `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
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
    // Return "-" if value is null, undefined, or empty string
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    // Convert string values like "7.5m" or "75k" to numbers
    let numericValue = value;
    if (typeof value === "string") {
      value = value.toLowerCase();
      if (value.endsWith("m")) {
        numericValue = parseFloat(value) * 1000000;
      } else if (value.endsWith("k")) {
        numericValue = parseFloat(value) * 1000;
      } else {
        numericValue = parseFloat(value);
      }
    }

    // Return "-" if conversion resulted in NaN
    if (isNaN(numericValue)) {
      return "-";
    }

    // Return the number with commas
    return numericValue.toLocaleString("en-US");
  }

  function displayItemDetails(item) {
    const image_type = item.type.toLowerCase();
    let color = "#124E66";

    // Define color before using it in badge templates
    if (item.type === "Vehicle") color = "#c82c2c";
    if (item.type === "Spoiler") color = "#C18800";
    if (item.type === "Rim") color = "#6335B1";
    if (item.type === "Tire Sticker") color = "#1CA1BD";
    if (item.type === "Tire Style") color = "#4CAF50";
    if (item.type === "Drift") color = "#FF4500";
    if (item.type === "Color") color = "#8A2BE2";
    if (item.type === "Texture") color = "#708090";
    if (item.type === "HyperChrome") color = "#E91E63";
    if (item.type === "Furniture") color = "#9C6644";
    loadComments(item.id, item.type);

    // Modify the badge HTML generation
    let specialBadgeHtml = "";
    let typeBadgeHtml = "";

    // Change how badges are generated for different types
    if (item.type === "HyperChrome") {
      typeBadgeHtml = `
        <span class="hyperchrome-badge" style="position: static; color: black; margin-left: 12px;">
          <i class="bi bi-stars"></i>HyperChrome
        </span>
      `;
    } else {
      // Only show type badge for non-HyperChrome items
      typeBadgeHtml = `
        <span class="badge" 
              style="background-color: ${color};
                    font-weight: 600;
                    padding: 8px 16px;
                    font-size: 1rem;
                    letter-spacing: 0.5px;
                    border-radius: 6px;">
            ${item.type}
        </span>
      `;

      // Show limited badge if item is limited
      if (item.is_limited) {
        specialBadgeHtml = `
          <span class="badge limited-badge">
            <i class="bi bi-star-fill me-1"></i>Limited
          </span>
        `;
      }
    }
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

    // Determine media element based on type
    let element;
    if (item.type === "Drift") {
      element = `
            <div class="media-container ${
              item.is_limited ? "limited-item" : ""
            }">
                <img 
                    src="/assets/items/drifts/thumbnails/${item.name}.webp"
                    class="img-fluid rounded thumbnail"
                    alt="${item.name}"
                    onerror="handleimage(this)"
                >
                <video 
                  src="/assets/items/drifts/${item.name}.webm"
                  class="img-fluid rounded video-player"
                  playsinline 
                  muted 
                  loop
                  preload="metadata"
                  defaultMuted
                ></video>
                ${item.is_limited ? specialBadgeHtml : ""}
            </div>
            `;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      element = `
      <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <div class="skeleton-loader"></div>
          <video 
              src="/assets/items/hyperchromes/HyperShift.webm"
              class="video-player card-img-top"
              playsinline 
              muted 
              loop
              autoplay
              id="hypershift-video"
              onloadeddata="this.parentElement.querySelector('.skeleton-loader').style.display='none'; this.style.opacity='1'"
              onerror="handleimage(this)"
              style="width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s ease;"
          ></video>
      </div>
  `;
    } else {
      element = `
        <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <img 
            src="/assets/items/${encodeURIComponent(image_type)}/${
        item.name
      }s.webp"
            class="img-fluid rounded thumbnail"
            alt="${item.name}"
            onerror="handleimage(this)"
          >
          ${item.is_limited ? specialBadgeHtml : ""}
        </div>
      `;
    }

    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);
    const urlPath = window.location.pathname.split("/");
    const urlType = urlPath[2];
    const formattedUrlType = item.type;

    // Show graph if either value exists
    const hasValues = value !== "-" || duped_value !== "-";

    // Add this function to format duped owners
    function formatDupedOwners(ownerString) {
      if (!ownerString) return null;
      const owners = ownerString.split(",").filter((owner) => owner.trim());
      return {
        count: owners.length,
        list: owners,
      };
    }

    const dupedOwners = formatDupedOwners(item.duped_owners);
    const dupedOwnersSection = dupedOwners
      ? `
      <div class="duped-owners-section mt-4">
        <div class="info-card p-4 rounded-3" style="background-color: rgba(46, 57, 68, 0.3); border: 1px solid rgba(46, 57, 68, 0.4);">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h4 class="text-muted mb-0 d-flex align-items-center">
              <i class="bi bi-people-fill me-2"></i>
              Known Duped Owners
            </h4>
            <span class="badge bg-secondary">${dupedOwners.count} owners</span>
          </div>
          <div class="collapse" id="dupedOwnersList">
            <div class="duped-owners-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px;">
              ${dupedOwners.list
                .map(
                  (owner) => `
                <a 
                  href="https://www.roblox.com/search/users?keyword=${encodeURIComponent(
                    owner.trim()
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="duped-owner-item p-2 rounded" 
                  style="
                    background-color: rgba(18, 78, 102, 0.2);
                    font-size: 0.9rem;
                    color: #d3d9d4;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    text-decoration: none;
                    transition: background-color 0.2s ease, color 0.2s ease;
                    cursor: pointer;
                  "
                  onmouseover="this.style.backgroundColor='rgba(18, 78, 102, 0.4)'; this.style.color='#ffffff';"
                  onmouseout="this.style.backgroundColor='rgba(18, 78, 102, 0.2)'; this.style.color='#d3d9d4';"
                >
                  ${owner.trim()}
                </a>
              `
                )
                .join("")}
            </div>
          </div>
          <button class="btn btn-link text-decoration-none w-100 mt-2" type="button" data-bs-toggle="collapse" data-bs-target="#dupedOwnersList" aria-expanded="false" aria-controls="dupedOwnersList" style="color: #748d92;">
            <i class="bi bi-chevron-down me-1"></i>
            <span class="toggle-text">Show Owners</span>
          </button>
        </div>
      </div>`
      : "";

    // Add event listener for toggle button text
    setTimeout(() => {
      const toggleBtn = document.querySelector('[data-bs-toggle="collapse"]');
      if (toggleBtn) {
        const toggleText = toggleBtn.querySelector(".toggle-text");
        document
          .querySelector("#dupedOwnersList")
          .addEventListener("show.bs.collapse", () => {
            toggleText.textContent = "Hide Owners";
            toggleBtn
              .querySelector(".bi")
              .classList.replace("bi-chevron-down", "bi-chevron-up");
          });
        document
          .querySelector("#dupedOwnersList")
          .addEventListener("hide.bs.collapse", () => {
            toggleText.textContent = "Show Owners";
            toggleBtn
              .querySelector(".bi")
              .classList.replace("bi-chevron-up", "bi-chevron-down");
          });
      }
    }, 100);

    const additionalInfo = `
  ${
    (item.description && item.description !== "N/A") ||
    (item.notes && item.notes !== "N/A")
      ? `
    <div class="additional-info mt-4">
      ${
        item.description && item.description !== "N/A"
          ? `
        <div class="info-card mb-4 p-4 rounded-3" style="background-color: rgba(46, 57, 68, 0.3); border: 1px solid rgba(46, 57, 68, 0.4);">
          <h4 class="text-muted mb-3 d-flex align-items-center">
            <i class="bi bi-info-circle me-2"></i>
            Description
          </h4>
          <p class="mb-0" style="color: #D3D9D4; line-height: 1.6;">
            ${item.description}
          </p>
        </div>
      `
          : ""
      }
      ${
        item.notes && item.notes !== "N/A"
          ? `
        <div class="info-card p-4 rounded-3" style="background-color: rgba(46, 57, 68, 0.3); border: 1px solid rgba(46, 57, 68, 0.4);">
          <h4 class="text-muted mb-3 d-flex align-items-center">
            <i class="bi bi-journal-text me-2"></i>
            Notes
          </h4>
          <p class="mb-0" style="color: #D3D9D4; line-height: 1.6;">
            ${item.notes}
          </p>
        </div>
      `
          : ""
      }
    </div>
  `
      : `
    <div class="additional-info mt-4">
      <div class="info-card p-4 rounded-3 text-center" style="background-color: rgba(46, 57, 68, 0.3); border: 1px solid rgba(46, 57, 68, 0.4);">
        <i class="bi bi-info-circle mb-3" style="font-size: 1.5rem; color: #748D92;"></i>
        <p class="mb-0" style="color: #748D92;">No additional information available for this item.</p>
      </div>
    </div>
  `
  }`;

    // Modify the valuesSection template to include additionalInfo:
    const valuesSection = `
      <div class="values-section border-top border-bottom py-4 my-4">
        <div class="row g-4">
          <div class="col-md-6">
            <div class="value-card p-4 rounded-3" style="background-color: rgba(24, 101, 131, 0.1); border: 1px solid rgba(24, 101, 131, 0.2);">
              <h4 class="text-muted mb-3 d-flex align-items-center">
                <i class="bi bi-cash-stack me-2"></i>
                Cash Value
              </h4>
              <p class="h2 mb-0" style="color: rgb(24, 101, 131); font-weight: 600;">
                ${
                  value === "-"
                    ? '<span class="text-muted">Not Available</span>'
                    : value
                }
              </p>
            </div>
          </div>
          <div class="col-md-6">
            <div class="value-card p-4 rounded-3" style="background-color: rgba(116, 141, 146, 0.1); border: 1px solid rgba(116, 141, 146, 0.2);">
              <h4 class="text-muted mb-3 d-flex align-items-center">
                <i class="bi bi-graph-down me-2"></i>
                Duped Value
              </h4>
              <p class="h2 mb-0" style="color: #748D92; font-weight: 600;">
                ${
                  duped_value === "-"
                    ? '<span class="text-muted">Not Available</span>'
                    : duped_value
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      ${additionalInfo}
      ${dupedOwnersSection}`;

    // Determine if we should show the graph
    const graphSection = hasValues
      ? `
      <!-- Combined Graph Section -->
      <div class="row mb-4" style="padding-top: 40px;">
        <div class="col-12">
          <div class="card chart-container">
            <div class="card-header text-center">
              <h3 class="card-title" style="font-weight: revert; font-family: 'Luckiest Guy', cursive;">Value History for ${item.name}</h3>
            </div>
            <div class="card-body" style="padding: 20px;">
              <canvas id="combinedChart" style="height: 450px;">
                <!-- Combined graph will be inserted here -->
              </canvas>
            </div>
          </div>
        </div>
      </div>`
      : `
      <!-- No Values Message -->
      <div class="row mb-4" style="padding-top: 40px;">
        <div class="col-12">
          <div class="card chart-container">
            <div class="card-body text-center py-5">
              <h3 style="color: #748d92; font-family: 'Luckiest Guy', cursive;">No values available to generate graph</h3>
              <p class="text-muted">This item currently has no recorded values</p>
            </div>
          </div>
        </div>
      </div>`;

    container.innerHTML = `
            <!-- Breadcrumb Navigation -->
            <div class="container-fluid mt-3">
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/">Home</a></li>
                        <li class="breadcrumb-item"><a href="/values">Values</a></li>
                        <li class="breadcrumb-item">
                            <a href="/values?sort=name-${formattedUrlType.toLowerCase()}s&valueSort=alpha-asc">
                                ${formattedUrlType}s
                            </a>
                        </li>
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
                            : item.name === "HyperShift" &&
                              item.type === "HyperChrome"
                            ? element
                            : `
                          <div class="media-container ${
                            item.is_limited ? "limited-item" : ""
                          }">
                              <img 
                                  src="/assets/items/${encodeURIComponent(
                                    image_type
                                  )}s/${item.name}.webp"
                                  class="img-fluid rounded thumbnail"
                                  alt="${item.name}"
                                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain;"
                                  onerror="handleimage(this)"
                              >
                              ${item.is_limited ? specialBadgeHtml : ""}
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
                              ${typeBadgeHtml}
                          </div>
                          <!-- Values Section -->
                          ${valuesSection}
                      </div>
                  </div>
              </div>
            </div>
        
            ${graphSection}`;

    // Only initialize chart if values exist
    if (hasValues) {
      setTimeout(() => {
        const ctx = document.getElementById("combinedChart")?.getContext("2d");
        if (!ctx) return;

        // Generate dummy data
        const dates = [];
        const values = [];
        const trades = [];
        const baseValue = Math.floor(Math.random() * 1000000) + 500000;

        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(
            date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          );

          // Generate random value fluctuations
          const randomChange = Math.floor(Math.random() * 50000) - 25000;
          values.push(baseValue + randomChange);

          // Generate random trade volume
          trades.push(Math.floor(Math.random() * 50));
        }

        new Chart(ctx, {
          type: "line",
          data: {
            labels: dates,
            datasets: [
              {
                label: "Cash Value",
                data: values,
                borderColor: "rgb(24, 101, 131)",
                backgroundColor: "rgba(24, 101, 131, 0.1)",
                tension: 0.4,
                fill: true,
                borderWidth: 2,
              },
              {
                label: "Duped Value",
                data: values.map((v) => v * 0.6),
                borderColor: "#748D92",
                backgroundColor: "rgba(116, 141, 146, 0.1)",
                tension: 0.4,
                fill: true,
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                labels: {
                  color: "#D3D9D4",
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 12,
                    weight: "bold",
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                type: "linear",
                display: true,
                title: {
                  display: true,
                  text: "Value",
                  color: "#D3D9D4",
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                },
                grid: {
                  color: "rgba(46, 57, 68, 0.1)",
                  borderColor: "#2E3944",
                  tickColor: "#2E3944",
                  lineWidth: 1,
                  borderDash: [5, 5],
                  drawBorder: true,
                  drawTicks: true,
                },
                ticks: {
                  color: "#D3D9D4",
                  padding: 10,
                  callback: function (value) {
                    return value.toLocaleString();
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Date",
                  color: "#D3D9D4", // Light grayish-green for axis title
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                },
                grid: {
                  color: "rgba(46, 57, 68, 0.1)", // Dark grayish-blue with opacity for grid
                  borderColor: "#2E3944",
                  tickColor: "#2E3944",
                  display: true,
                  lineWidth: 1,
                  borderDash: [5, 5],
                  drawBorder: true,
                  drawTicks: true,
                },
                ticks: {
                  color: "#D3D9D4", // Light grayish-green for tick labels
                  padding: 10,
                  font: {
                    size: 11,
                  },
                },
              },
            },
            layout: {
              padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10,
              },
            },
          },
        });
      }, 100);
    }

    // After the container HTML is set, add resize observer
    setTimeout(() => {
      const mediaContainer = document.querySelector(".media-container");
      const mediaElement = mediaContainer.querySelector("img, video");

      // Initial log of dimensions
      logDimensions(mediaContainer, mediaElement);

      // Create resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          logDimensions(mediaContainer, mediaElement);
        }
      });

      // Observe both container and media element
      resizeObserver.observe(mediaContainer);
      resizeObserver.observe(mediaElement);

      // Add zoom event listener
      window.addEventListener("resize", () => {
        logDimensions(mediaContainer, mediaElement);
      });
    }, 100);

    // After loading the main item content, update the comments section
    const commentsWrapper = document.querySelector(".comments-wrapper");
    if (commentsWrapper) {
      const user = JSON.parse(sessionStorage.getItem("user"));
      const disabled = user ? "" : "disabled";
      const placeholder = user
        ? `Comment as ${user.global_name}`
        : "Login to comment";
      commentsWrapper.innerHTML = commentTemplate(item, disabled, placeholder);
      const submitButton = document.getElementById("submit-comment");
      const commentInput = document.getElementById("commenter-text");

      // helper function for error toasts
      function throw_error(message) {
        toastr.error(message, "Error creating comment.", {
          positionClass: "toast-bottom-right",
          timeOut: 3000,
          closeButton: true,
          progressBar: true,
        });
      }

      submitButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (!user) {
          throw_error("Please login to comment.");
          return;
        }

        // check for null global_name and use username as fallback
        const authorName = user.global_name || user.username;
        if (!authorName) {
          throw_error(
            "Unable to determine username. Please try logging in again."
          );
          return;
        }

        const comment = commentInput.value;
        if (!comment) {
          throw_error("Please enter a comment.");
          return;
        }
        const avatarUrl = sessionStorage.getItem("avatar");

        const defaultAvatarUrl =
          "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";
        const src = avatarUrl.endsWith("null.png")
          ? defaultAvatarUrl
          : avatarUrl;

        const listItem = document.createElement("li");
        listItem.className = "d-flex align-items-start mb-3";
        listItem.innerHTML = `
          <img
            src=${src}
            class="rounded-circle m-1"
            width="32"
            height="32"
            alt="User Avatar"
            onerror=handleinvalidImage
          />
          <div
            class="ms-2 comment-item w-100"
            style="background-color: #2e3944; padding: 12px; border-radius: 8px; margin-bottom: 8px;"
          >
            <a href="/users/${
              user.id
            }" style="font-weight: bold; color: #748d92; text-decoration: none;">${authorName}</a>
            <small class="text-muted
              "> · ${new Date().toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}</small>
            <p class="mb-0 comment-text" style="color: #d3d9d4; margin-top: 4px">
              ${comment}
            </p>
          </div>
        `;
        const commentsList = document.getElementById("comments-list");
        commentsList.appendChild(listItem);
        fetch("https://api3.jailbreakchangelogs.xyz/comments/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: authorName,
            content: comment,
            item_id: item.id,
            item_type: item.type,
            user_id: user.id,
            owner: getCookie("token"),
          }),
        })
          .then(async (response) => {
            const data = await response.json();

            if (response.status === 429) {
              throw_error(
                `Wait ${data.remaining} seconds before commenting again.`
              );
              return;
            }

            if (!response.ok) {
              throw_error(data.error || "Failed to create comment.");
              return;
            }

            commentsList.appendChild(listItem);
            commentInput.value = "";
          })
          .catch((error) => {
            console.error("Error adding comment:", error);
            throw_error("An unexpected error occurred while adding comment.");
          });
      });

      const CommentForm = document.getElementById("comment-form");
      const commentinput = document.getElementById("commenter-text");
      const commentbutton = document.getElementById("submit-comment");
      const avatarUrl = sessionStorage.getItem("avatar");
      const userdata = JSON.parse(sessionStorage.getItem("user"));
      const userid = sessionStorage.getItem("userid");

      if (userid) {
        const displayName = userdata.global_name || userdata.username;
        commentinput.placeholder = "Comment as " + displayName;
        commentbutton.disabled = false;
        commentinput.disabled = false;
      } else {
        commentinput.disabled = true;
        commentinput.placeholder = "Login to comment";
        commentbutton.disabled = false;
        commentbutton.innerHTML =
          '<i class="bi bi-box-arrow-in-right"></i> Login';

        // Remove any existing event listeners from the form
        const newForm = CommentForm.cloneNode(true);
        CommentForm.parentNode.replaceChild(newForm, CommentForm);

        // Add click event to the button for login redirect
        newForm
          .querySelector("#submit-comment")
          .addEventListener("click", function (event) {
            event.preventDefault();
            localStorage.setItem(
              "redirectAfterLogin",
              window.location.pathname
            );
            window.location.href = "/login";
          });
      }

      // Add submit handler
      CommentForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const comment = document.getElementById("commenter-text");
        addComment(comment);
        comment.value = "";
      });
    }
  }
  function loadComments(id, type) {
    fetch(
      `https://api3.jailbreakchangelogs.xyz/comments/get?id=${id}&type=${type}`
    )
      .then((response) => response.json())
      .then((comments) => {
        const commentsList = document.getElementById("comments-list");
        commentsList.innerHTML = "";

        // Check if comments is null, undefined, or not an array
        if (!comments || !Array.isArray(comments) || comments.length === 0) {
          // Display "No comments yet" message with style to hide marker
          const noCommentsMessage = document.createElement("li");
          noCommentsMessage.className = "text-center p-4";
          noCommentsMessage.style.listStyle = "none"; // Add this line to hide the marker
          noCommentsMessage.innerHTML = `
            <div class="text-muted">
              <i class="bi bi-chat-square"></i>
              <p class="mb-0">No comments yet. Be the first to comment!</p>
            </div>
          `;
          commentsList.appendChild(noCommentsMessage);
          return;
        }

        // If we have comments, proceed with rendering them
        comments.forEach((comment) => {
          fetch(
            `https://api3.jailbreakchangelogs.xyz/users/get?id=${comment.user_id}`
          )
            .then((response) => response.json())
            // Handle errors in the fetch request
            // Log the error and return the comment
            .catch((error) => {
              console.error("Error fetching user:", error);
              return comment;
            })
            .then((userdata) => {
              const avatarUrl = userdata.avatar
                ? `https://cdn.discordapp.com/avatars/${userdata.id}/${userdata.avatar}.png`
                : "assets/profile-pic-placeholder.png";

              // Create and append the comment to the comments list
              const formattedDate = formatDate(comment.date);
              const listItem = document.createElement("li");
              listItem.className = "d-flex align-items-start mb-3";
              listItem.innerHTML = `
              <img
                src=${avatarUrl}
                class="rounded-circle m-1"
                width="32"
                height="32"
                alt="User Avatar"
                onerror=handleinvalidImage
              />
              <div
                class="ms-2 comment-item w-100"
                style="background-color: #2e3944; padding: 12px; border-radius: 8px; margin-bottom: 8px;"
              >
               <a href="/users/${comment.user_id}" style="font-weight: bold; color: #748d92; text-decoration: none;">${comment.author}</a>
                <small class="text-muted
                  "> · ${formattedDate}</small>
                <p class="mb-0 comment-text" style="color: #d3d9d4; margin-top: 4px">
                 ${comment.content}
                </p>
                </div>
                `;
              commentsList.appendChild(listItem);
            });
        });
      })
      .catch((error) => {
        console.error("Error loading comments:", error);
        const commentsList = document.getElementById("comments-list");
        commentsList.innerHTML = `
          <li class="text-center p-4">
            <div class="text-danger">
              <i class="bi bi-exclamation-circle"></i>
              <p class="mb-0">Error loading comments. Please try again later.</p>
            </div>
          </li>
        `;
      });
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

  // Update handleimage function to skip HyperShift
  window.handleimage = function (element) {
    console.log("handleimage called for:", {
      id: element.id,
      alt: element.alt,
      tagName: element.tagName,
      src: element.src,
      isHyperShiftVideo: element.id === "hypershift-video",
      isHyperShiftAlt: element.alt === "HyperShift",
    });

    const isHyperShift =
      element.id === "hypershift-video" ||
      (element.alt === "HyperShift" &&
        element.closest(".media-container").querySelector("video"));

    if (isHyperShift) {
      console.log("Skipping placeholder for HyperShift");
      return; // Don't replace HyperShift video with placeholder
    }
    element.src =
      "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp";
  };

  loadItemDetails();
});

function formatDate(timestamp) {
  // Convert Unix timestamp to milliseconds and create a Date object
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const commentTemplate = (item, disabled, placeholder) => `
  <h2
    class="comment-header text-center"
    id="comment-header"
    style="font-family: 'Luckiest Guy', cursive"
  >
    Comments for ${item.name}
  </h2>

  <!-- Comment submission form -->
  <form id="comment-form" class="mb-4">
    <div
      class="input-group px-3 py-2"
      style="background-color: #2e3944; border-radius: 8px"
    >
      <input
        type="text"
        class="form-control"
        id="commenter-text"
        ${disabled}
        placeholder='${placeholder}'
        required
        style="background-color: transparent; border: none"
      />
      <button
        type="submit"
        class="btn btn-primary"
        id="submit-comment"
        ${disabled}
      >
        <i class="bi bi-send-fill me-1"></i> Submit
      </button>
    </div>
  </form>

  <ul id="comments-list" class="list-group">
    <!-- Dummy comments for ${item.name} -->




  </ul>

  <!-- Pagination Controls -->
  <div
    id="paginationControls"
    class="pagination d-flex align-items-center justify-content-center gap-2 flex-nowrap mt-4"
  >
    <button
      class="btn btn-primary rounded-circle pagination-btn"
      disabled
      style="
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        background-color: #124e66;
      "
    >
      <i class="bi bi-chevron-left"></i>
    </button>
    <div
      class="input-group mx-1 align-items-center px-3 py-2"
      style="
        background-color: #2e3944;
        border-radius: 8px;
        width: auto;
        display: inline-flex;
        justify-content: center;
      "
    >
      <span class="text-muted fw-semibold" style="font-size: 14px">Page </span>
      <input
        type="number"
        value="1"
        min="1"
        max="1"
        class="form-control text-center pagination-input mx-2"
        style="
          max-width: 70px;
          min-width: 60px;
          background-color: #212a31;
          border: 1px solid #748d92;
          color: #d3d9d4;
          border-radius: 4px;
          font-size: 14px;
        "
      />
      <span class="text-muted" style="font-size: 14px"> / 1</span>
    </div>
    <button
      class="btn btn-primary rounded-circle pagination-btn"
      disabled
      style="
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        background-color: #124e66;
      "
    >
      <i class="bi bi-chevron-right"></i>
    </button>
  </div>
`;

function handleinvalidImage() {
  setTimeout(() => {
    const userId = this.id.replace("avatar-", "");
    const username = this.closest("li").querySelector("a").textContent;
    this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;
  }, 0);
}

function logDimensions(container, mediaElement) {
  const containerRect = container.getBoundingClientRect();
  const mediaRect = mediaElement.getBoundingClientRect();
}

//  modal for editing comments
document.body.insertAdjacentHTML(
  "beforeend",
  `
  <div class="modal fade" id="editCommentModal" tabindex="-1" aria-labelledby="editCommentModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="editCommentModalLabel">Edit Comment</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <textarea class="form-control" id="editCommentText" rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-primary" id="saveCommentEdit">Save changes</button>
        </div>
      </div>
    </div>
  </div>
`
);

const editCommentModal = new bootstrap.Modal(
  document.getElementById("editCommentModal")
);

// Add event listener for saving edited comment
document
  .getElementById("saveCommentEdit")
  .addEventListener("click", function () {
    const commentId = document
      .getElementById("editCommentText")
      .getAttribute("data-comment-id");
    const newContent = document.getElementById("editCommentText").value.trim();
    const token = getCookie("token");

    if (newContent) {
      fetch("https://api3.jailbreakchangelogs.xyz/comments/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: commentId,
          content: newContent,
          author: token,
        }),
      })
        .then((response) => {
          return response.json().then((data) => {
            if (!response.ok)
              throw new Error(data.error || "Failed to edit comment");
            return data;
          });
        })
        .then((data) => {
          editCommentModal.hide();
          toastr.success("Comment updated successfully!", "Success", {
            positionClass: "toast-bottom-right",
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
          });
          setTimeout(() => {
            loadComments(item.id, item.type);
          }, 100);
        })
        .catch((error) => {
          console.error("Error editing comment:", error);
          toastr.error(error.message || "Failed to update comment", "Error", {
            positionClass: "toast-bottom-right",
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
          });
        });
    }
  });

// Modify loadComments function to include action buttons for user's own comments
function loadComments(id, type) {
  fetch(
    `https://api3.jailbreakchangelogs.xyz/comments/get?id=${id}&type=${type}`
  )
    .then((response) => response.json())
    .then((comments) => {
      const commentsList = document.getElementById("comments-list");
      commentsList.innerHTML = "";

      // Check if comments is null, undefined, or not an array
      if (!comments || !Array.isArray(comments) || comments.length === 0) {
        // Display "No comments yet" message with style to hide marker
        const noCommentsMessage = document.createElement("li");
        noCommentsMessage.className = "text-center p-4";
        noCommentsMessage.style.listStyle = "none"; // Add this line to hide the marker
        noCommentsMessage.innerHTML = `
          <div class="text-muted">
            <i class="bi bi-chat-square"></i>
            <p class="mb-0">No comments yet. Be the first to comment!</p>
          </div>
        `;
        commentsList.appendChild(noCommentsMessage);
        return;
      }

      // If we have comments, proceed with rendering them
      comments.forEach((comment) => {
        // Add action buttons container for user's own comments
        if (userdata && comment.user_id === userdata.id) {
          const actionsContainer = document.createElement("div");
          actionsContainer.classList.add("comment-actions");

          const actionsToggle = document.createElement("button");
          actionsToggle.classList.add("comment-actions-toggle");
          actionsToggle.innerHTML = '<i class="bi bi-three-dots-vertical"></i>';

          const actionsMenu = document.createElement("div");
          actionsMenu.classList.add("comment-actions-menu");
          actionsMenu.style.display = "none";

          // Create edit button
          const editButton = document.createElement("button");
          editButton.classList.add("comment-action-item");
          editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';
          editButton.setAttribute("data-comment-id", comment.id);
          editButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const commentText = e.target
              .closest(".comment-item")
              .querySelector(".comment-text").textContent;
            document.getElementById("editCommentText").value = commentText;
            document
              .getElementById("editCommentText")
              .setAttribute("data-comment-id", comment.id);
            editCommentModal.show();
            actionsMenu.style.display = "none";
          });

          // Create delete button
          const deleteButton = document.createElement("button");
          deleteButton.classList.add("comment-action-item", "delete");
          deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
          deleteButton.setAttribute("data-comment-id", comment.id);
          deleteButton.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-comment-id");
            fetch("https://api3.jailbreakchangelogs.xyz/comments/delete", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: id,
                author: getCookie("token"),
              }),
            })
              .then((response) => {
                if (!response.ok) throw new Error("Failed to delete comment");
                return response.json();
              })
              .then(() => {
                const commentElement = document.getElementById(`comment-${id}`);
                if (commentElement) {
                  commentElement.remove();
                }
                toastr.success("Comment deleted successfully!", "Success", {
                  positionClass: "toast-bottom-right",
                  timeOut: 3000,
                  closeButton: true,
                  progressBar: true,
                });
              })
              .catch((error) => {
                console.error("Error deleting comment:", error);
                toastr.error("Failed to delete comment", "Error", {
                  positionClass: "toast-bottom-right",
                  timeOut: 3000,
                  closeButton: true,
                  progressBar: true,
                });
              });
          });

          actionsMenu.appendChild(editButton);
          actionsMenu.appendChild(deleteButton);
          actionsContainer.appendChild(actionsToggle);
          actionsContainer.appendChild(actionsMenu);

          commentContainer.appendChild(actionsContainer);

          // Toggle menu on click
          actionsToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            actionsMenu.style.display =
              actionsMenu.style.display === "none" ? "block" : "none";
          });

          // Close menu when clicking outside
          document.addEventListener("click", () => {
            actionsMenu.style.display = "none";
          });
        }
      });
    });
}
