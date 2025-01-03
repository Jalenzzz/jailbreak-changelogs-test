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

    // Determine media element based on type - following values.js pattern
    let element = "";
    if (item.type === "Drift") {
      element = `
            <div class="media-container ${
              item.is_limited ? "limited-item" : ""
            }">
                <img 
                    src="https://cdn2.jailbreakchangelogs.xyz/images/items/drifts/thumbnails/${
                      item.name
                    }.webp"
                    class="img-fluid rounded thumbnail"
                    alt="${item.name}"
                    onerror="handleimage(this)"
                >
                <video 
                  src="https://cdn2.jailbreakchangelogs.xyz/images/items/drifts/${
                    item.name
                  }.webm"
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

      setTimeout(() => {
        try {
          const mediaContainer = document.querySelector(".media-container");
          const video = mediaContainer?.querySelector("video");

          sessionStorage.removeItem("firefoxNoticeShown");

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
    } else if (item.name === "HyperShift" && item.type === "HyperChrome") {
      element = `
      <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <div class="skeleton-loader"></div>
          <video 
              src="https://cdn2.jailbreakchangelogs.xyz/images/items/hyperchromes/HyperShift.webm"
              class="video-player card-img-top"
              playsinline 
              muted 
              loop
              autoplay
              onloadeddata="this.parentElement.querySelector('.skeleton-loader').style.display='none'; this.style.opacity='1'"
              onerror="handleimage(this)"
              style="width: 100%; height: 100%; object-fit: contain; opacity: 0; transition: opacity 0.3s ease;"
          ></video>
      </div>
  `;

      // Simplified video setup that matches the container pattern
      setTimeout(() => {
        const mediaContainer = document.querySelector(".media-container");
        const video = mediaContainer?.querySelector("video");
        if (video) {
          video.muted = true;
          video.volume = 0;
          video
            .play()
            .catch((err) => console.warn("Initial play failed:", err));
        }
      }, 100);
    } else {
      element = `
        <div class="media-container ${item.is_limited ? "limited-item" : ""}">
          <img 
            src="https://cdn2.jailbreakchangelogs.xyz/images/items/${encodeURIComponent(
              image_type
            )}s/${item.name}.webp"
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

    const hasValues = value !== "-" && duped_value !== "-";

    const valuesSection = `
      <div class="border-top border-bottom py-4 my-4">
        <div class="row g-4">
          <div class="col-6">
            <h4 class="text-muted mb-3">Cash Value</h4>
            <p class="h2 mb-0" style="color:rgb(24, 101, 131); font-weight: 600;">
              ${value === "-" ? "" : value}
            </p>
          </div>
          <div class="col-6">
            <h4 class="text-muted mb-3">Duped Value</h4>
            <p class="h2 mb-0" style="color: #748D92; font-weight: 600;">
              ${duped_value === "-" ? "" : duped_value}
            </p>
          </div>
        </div>
      </div>`;

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
                            : item.name === "HyperShift" &&
                              item.type === "HyperChrome"
                            ? element
                            : `
                          <div class="media-container ${
                            item.is_limited ? "limited-item" : ""
                          }">
                              <img 
                                  src="https://cdn2.jailbreakchangelogs.xyz/images/items/${encodeURIComponent(
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
      submitButton.addEventListener("click", async (event) => {
        event.preventDefault();
        if (!user) {
          alert("Please login to comment.");
          return;
        }
        const comment = commentInput.value;
        if (!comment) {
          alert("Please enter a comment.");
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
            <a href="#" style="font-weight: bold; color: #748d92; text-decoration: none;">${
              user.global_name
            }</a>
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
      });
    }
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
    <li class="d-flex align-items-start mb-3">
      <img
        src="https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg"
        class="rounded-circle m-1"
        width="32"
        height="32"
        alt="User Avatar"
      />
      <div
        class="ms-2 comment-item w-100"
        style="background-color: #2e3944; padding: 12px; border-radius: 8px; margin-bottom: 8px;"
      >
        <a href="#" style="font-weight: bold; color: #748d92; text-decoration: none;">Dummy User 1</a>
        <small class="text-muted"> · December 21st at 07:38 AM</small>
        <p class="mb-0 comment-text" style="color: #d3d9d4; margin-top: 4px">
          What will the value be?
        </p>
      </div>
    </li>
    <li class="d-flex align-items-start mb-3">
      <img
        src="https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg"
        class="rounded-circle m-1"
        width="32"
        height="32"
        alt="User Avatar"
      />
      <div
        class="ms-2 comment-item w-100"
        style="background-color: #2e3944; padding: 12px; border-radius: 8px; margin-bottom: 8px;"
      >
        <a href="#" style="font-weight: bold; color: #748d92; text-decoration: none;">Dummy User 1</a>
        <small class="text-muted"> · December 21st at 07:38 AM</small>
        <p class="mb-0 comment-text" style="color: #d3d9d4; margin-top: 4px">
          What will the value be?
        </p>
      </div>
    </li>
    <li class="d-flex align-items-start mb-3">
      <img
        src="https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg"
        class="rounded-circle m-1"
        width="32"
        height="32"
        alt="User Avatar"
      />
      <div
        class="ms-2 comment-item w-100"
        style="background-color: #2e3944; padding: 12px; border-radius: 8px; margin-bottom: 8px;"
      >
        <a href="#" style="font-weight: bold; color: #748d92; text-decoration: none;">Dummy User 1</a>
        <small class="text-muted"> · December 21st at 07:38 AM</small>
        <p class="mb-0 comment-text" style="color: #d3d9d4; margin-top: 4px">
          What will the value be?
        </p>
      </div>
    </li>

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
