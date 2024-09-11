document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const loadingOverlay = document.getElementById("loading-overlay");
  const searchInput = document.getElementById("searchInput");
  const searchDropdownButton = document.getElementById("searchDropdownButton");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchResultsElement = document.getElementById("searchResults");

  const dropdownButtonIcon = searchDropdownButton
    ? searchDropdownButton.querySelector("i")
    : null;

  if (searchDropdownButton && searchDropdown) {
    const dropdown = new bootstrap.Dropdown(searchDropdownButton);

    searchDropdownButton.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.toggle();
    });

    document.addEventListener("click", function (event) {
      if (
        !searchDropdownButton.contains(event.target) &&
        !searchDropdown.contains(event.target)
      ) {
        dropdown.hide();
      }
    });
  }

  // Function to show loading overlay
  function showLoadingOverlay() {
    loadingOverlay.classList.add("show");
  }

  // Function to hide loading overlay
  function hideLoadingOverlay() {
    loadingOverlay.classList.remove("show");
  }

  // Show loading overlay immediately when the script starts
  showLoadingOverlay();
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const themeToggleButton = document.getElementById("theme-toggle");
  const darkIcon = document.querySelector(".dark-icon");
  const timelineCollapse = document.getElementById("timelineCollapse");

  const timelineToggle = document.getElementById("timeline-toggle");

  let changelogsData = [];
  let currentFocusedIndex = -1;

  // Initialize Bootstrap dropdown
  const dropdownInstance = new bootstrap.Dropdown(searchDropdownButton);

  let isDropdownOpen = false;
  let lastScrollTop = 0;

  const wrapMentions = (text) =>
    text.replace(
      /@(\w+)/g,
      (_, username) =>
        `<span class="mention"><span class="at">@</span><span class="username">${username}</span></span>`
    );

  const preprocessMarkdown = (markdown) =>
    markdown
      .replace(/ - /g, "\n- ")
      .replace(/ - - /g, "\n- - ")
      .replace(/## /g, "\n## ")
      .replace(/### /g, "\n### ")
      .replace(/\(audio\) /g, "\n(audio) ")
      .replace(/\(video\) /g, "\n(video) ")
      .replace(/\(image\) /g, "\n(image) ");

  function cleanContentForSearch(content) {
    return content
      .replace(/- /g, " ") // Replace " - " with a space
      .replace(/- - /g, " ") // Replace " - - " with a space
      .replace(/### /g, " ") // Replace "### " with a space
      .replace(/\(audio\) /g, " ") // Replace "(audio) " with a space
      .replace(/\(video\) /g, " ") // Replace "(video) " with a space
      .replace(/\(image\) /g, " ") // Replace "(image) " with a space
      .replace(/\(audio\)\s*\S+/g, "[Audio]") // Replace audio links with [Audio]
      .replace(/\(video\)\s*\S+/g, "[Video]") // Replace video links with [Video]
      .replace(/\(image\)\s*\S+/g, "[Image]") // Replace image links with [Image]
      .replace(/@(\w+)/g, "@$1") // Keep mentions as is
      .replace(/\s+/g, " ") // Replace multiple spaces with a single space
      .trim(); // Remove leading and trailing whitespace
  }
  function createTimeline(changelogs) {
    const timeline = document.getElementById("timeline");
    timeline.innerHTML = ""; // Clear existing content

    changelogs.forEach((changelog, index) => {
      const timelineItem = document.createElement("div");
      timelineItem.classList.add("timeline-item", "me-3");

      timelineItem.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h3 class="card-title h5 mb-3">${changelog.title}</h3>
            <button class="btn btn-primary btn-sm timeline-view-btn">View Details</button>
          </div>
        </div>
      `;

      timeline.appendChild(timelineItem);

      const viewBtn = timelineItem.querySelector(".timeline-view-btn");
      viewBtn.addEventListener("click", () => displayChangelog(changelog));
    });
  }
  function debounce(func, delay) {
    let debounceTimer;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }
  // Add this new function
  const debouncedSearch = debounce((query) => {
    if (query.length > 0) {
      performSearch(query);
      expandSearch();
    } else {
      searchResultsElement.style.display = "none";
      contractSearch();
    }
  }, 300); // 300ms delay

  function initializeTimelineCollapse() {
    const timelineToggle = document.getElementById("timeline-toggle");
    const timelineCollapse = document.getElementById("timelineCollapse");
    const timelineToggleIcon = timelineToggle
      ? timelineToggle.querySelector("i")
      : null;

    if (timelineToggle && timelineCollapse && timelineToggleIcon) {
      timelineToggle.addEventListener("click", function () {
        const isCollapsed = timelineCollapse.classList.contains("show");

        if (isCollapsed) {
          timelineCollapse.classList.remove("show");
          timelineToggleIcon.classList.replace(
            "bi-chevron-down",
            "bi-chevron-up"
          );
        } else {
          timelineCollapse.classList.add("show");
          timelineToggleIcon.classList.replace(
            "bi-chevron-up",
            "bi-chevron-down"
          );
        }
      });
    } else {
      console.warn(
        "Timeline elements not found. Make sure the IDs are correct."
      );
    }
  }

  function improveKeyboardNavigation() {
    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableContent = document.querySelectorAll(focusableElements);
    const firstFocusableElement = focusableContent[0];
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    document.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
        line = line.trim();
        if (line.startsWith("# ")) {
          return `<h1>${wrapMentions(line.substring(2))}</h1>`;
        } else if (line.startsWith("## ")) {
          return `<h2>${wrapMentions(line.substring(3))}</h2>`;
        } else if (line.startsWith("- - - ")) {
          return `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${wrapMentions(
            line.substring(6)
          )}</p>`;
        } else if (line.startsWith("- - ")) {
          return `<p><span class="bullet">•</span> <span class="sub-bullet">•</span> ${wrapMentions(
            line.substring(4)
          )}</p>`;
        } else if (line.startsWith("- ")) {
          return `<p><span class="bullet">•</span> ${wrapMentions(
            line.substring(2)
          )}</p>`;
        } else if (line.startsWith("(audio)")) {
          const audioUrl = line.substring(7).trim();
          const audioType = audioUrl.endsWith(".wav")
            ? "audio/wav"
            : "audio/mpeg";
          return `<audio controls><source src="${audioUrl}" type="${audioType}"></audio>`;
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim();
          return `<img src="${imageUrl}" alt="Image" style="max-width: 100%; max-height: 500px;">`;
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim();
          return `<video controls style="max-width: 80%; max-height: 500px;"><source src="${videoUrl}" type="video/mp4"></video>`;
        } else {
          return `<p>${wrapMentions(line)}</p>`;
        }
      })
      .join("");
  };

  // console.log("Fetching list of changelogs from:", apiUrl);

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data received:", data);
      changelogsData = data;

      if (Array.isArray(data) && data.length > 0) {
        const savedId = localStorage.getItem("selectedChangelogId");
        const idFromUrl = new URLSearchParams(window.location.search).get("id");
        const initialChangelog =
          changelogsData.find((cl) => cl.id == (idFromUrl || savedId)) ||
          changelogsData[0];
        displayChangelog(initialChangelog);

        createTimeline(changelogsData);

        improveKeyboardNavigation();

        createDropdownContent();
      } else {
        console.error("No changelogs found.");
      }

      // Hide loading overlay when data is loaded and processed
      hideLoadingOverlay();
    })
    .catch((error) => {
      console.error("Error fetching changelogs:", error);
      document.getElementById("content").innerHTML =
        "<p>Error loading changelogs. Please try again later.</p>";

      // Hide loading overlay even if there's an error
      hideLoadingOverlay();
    });

  const displayChangelog = (changelog) => {
    // console.log("Displaying changelog:", changelog);

    history.pushState(null, "", `?id=${changelog.id}`);
    localStorage.setItem("selectedChangelogId", changelog.id);

    document.title = `Jailbreak Changelog: ${changelog.title}`;
    if (titleElement) {
      titleElement.textContent = changelog.title;
    }

    const sidebarImageWrapper = document.getElementById(
      "sidebar-image-wrapper"
    );
    const sidebarImage = document.getElementById("sidebarImage");

    if (changelog.image_url) {
      imageElement.src = changelog.image_url;
      imageElement.alt = `Image for ${changelog.title}`;
      imageElement.style.display = "block";
    } else {
      imageElement.src = "";
      imageElement.alt = "No image available";
      imageElement.style.display = "none";
    }

    let contentHtml = `<h1>${changelog.title}</h1>`;

    if (changelog.sections) {
      const processedMarkdown = preprocessMarkdown(changelog.sections);
      const processedSections = convertMarkdownToHtml(processedMarkdown);
      contentHtml += processedSections;
    } else {
      console.warn("No sections available for changelog.");
      contentHtml += "<p>No sections available.</p>";
    }

    sectionsElement.innerHTML = contentHtml;
  };

  function createDropdownContent() {
    const searchDropdown = document.getElementById("searchDropdown");
    if (!searchDropdown) {
      console.error("Search dropdown element not found");
      return;
    }

    searchDropdown.innerHTML = "";
    changelogsData.forEach((changelog) => {
      const item = document.createElement("a");
      item.classList.add("dropdown-item");
      item.href = "#";
      item.textContent = changelog.title;
      item.addEventListener("click", (e) => {
        e.preventDefault();
        displayChangelog(changelog);
        const dropdown = bootstrap.Dropdown.getInstance(searchDropdownButton);
        if (dropdown) {
          dropdown.hide();
        }
      });
      searchDropdown.appendChild(item);
    });
  }

  //   searchDropdown.innerHTML = "";
  //   changelogsData.forEach((changelog) => {
  //     const item = document.createElement("div");
  //     item.classList.add("search-dropdown-item");
  //     item.textContent = changelog.title;
  //     item.addEventListener("click", () => {
  //       displayChangelog(changelog);
  //       searchDropdown.classList.remove("show");
  //       if (searchDropdownButton && dropdownButtonIcon) {
  //         dropdownButtonIcon.classList.remove("bi-chevron-up");
  //         dropdownButtonIcon.classList.add("bi-chevron-down");
  //       }
  //     });
  //     searchDropdown.insertBefore(item, searchDropdown.firstChild);
  //   });
  // }

  // Function to expand the search
  function expandSearch() {
    document.body.classList.add("search-expanded");
  }
  // Function to contract the search
  function contractSearch() {
    if (searchInput.value.trim() === "") {
      document.body.classList.remove("search-expanded");
    }
  }
  // Add event listeners for expanding and contracting
  searchInput.addEventListener("focus", expandSearch);
  searchInput.addEventListener("blur", contractSearch);

  // Search functionality
  function performSearch(query) {
    const filteredChangelogs = changelogsData.filter(
      (changelog) =>
        changelog.title.toLowerCase().includes(query) ||
        changelog.sections.toLowerCase().includes(query)
    );
    displaySearchResults(filteredChangelogs, query);
  }

  // Add event listener for 'Enter' key in search input
  // searchInput.addEventListener("input", () => {
  //   const query = searchInput.value.trim().toLowerCase();
  //   updateSearchButtonState(query);
  //   if (query.length > 0) {
  //     performSearch(query);
  //     expandSearch();
  //   } else {
  //     searchResultsElement.style.display = "none";
  //     contractSearch();
  //   }
  // });

  // With debounce
  searchInput.addEventListener("input", () => {
    debouncedSearch(searchInput.value);
  });

  if (searchDropdownButton) {
    const dropdown = new bootstrap.Dropdown(searchDropdownButton);

    searchDropdownButton.addEventListener("click", function (e) {
      e.stopPropagation();
      dropdown.toggle();
    });

    document.addEventListener("click", function (event) {
      if (
        !searchDropdownButton.contains(event.target) &&
        !searchDropdown.contains(event.target)
      ) {
        dropdown.hide();
      }
    });
  } else {
    console.error("Search dropdown button not found");
  }

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      const query = searchInput.value.trim().toLowerCase();
      if (query.length >= 3) {
        performSearch(query);
        expandSearch();

        searchInput.blur();
      }
    }
  });

  // Update search button click handler
  // searchButton.addEventListener("click", (e) => {
  //   e.preventDefault();
  //   const query = searchInput.value.trim().toLowerCase();
  //   if (searchButton.getAttribute("title") === "Clear search") {
  //     // Clear search
  //     searchInput.value = "";
  //     searchResultsElement.style.display = "none";
  //     updateSearchButtonState("");
  //     contractSearch();
  //   } else {
  //     // Perform search
  //     if (query.length > 0) {
  //       performSearch(query);
  //       expandSearch();
  //     }
  //   }
  // });

  function displaySearchResults(results, query) {
    if (results.length > 0) {
      let resultsHtml = '<div class="search-results-content">';
      results.forEach((changelog, index) => {
        const titleHighlight = highlightMatch(changelog.title, query);
        const cleanedContent = cleanContentForSearch(changelog.sections);
        const contentPreview = getContentPreview(cleanedContent, query);

        // Check for media types
        const hasAudio = cleanedContent.includes("[Audio]");
        const hasVideo = cleanedContent.includes("[Video]");
        const hasImage = cleanedContent.includes("[Image]");

        // Create tags
        const audioTag = hasAudio
          ? '<span class="media-tag audio-tag">Audio</span>'
          : "";
        const videoTag = hasVideo
          ? '<span class="media-tag video-tag">Video</span>'
          : "";
        const imageTag = hasImage
          ? '<span class="media-tag image-tag">Image</span>'
          : "";

        resultsHtml += `
          <div class="search-result-item" data-index="${index}">
            <strong>${titleHighlight}${audioTag}${videoTag}${imageTag}</strong>
            <p>${contentPreview}</p>
          </div>
        `;
      });
      resultsHtml += "</div>";
      searchResultsElement.innerHTML = resultsHtml;
      searchResultsElement.style.display = "block";
      addSearchResultListeners(results);
    } else {
      searchResultsElement.innerHTML = "<p>No results found.</p>";
      searchResultsElement.style.display = "block";
    }
  }

  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  function getContentPreview(content, query) {
    const cleanedContent = cleanContentForSearch(content);
    const index = cleanedContent.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return cleanedContent.slice(0, 100) + "...";

    const start = Math.max(0, index - 50);
    const end = Math.min(cleanedContent.length, index + 50);
    let preview = cleanedContent.slice(start, end);
    if (start > 0) preview = "..." + preview;
    if (end < cleanedContent.length) preview += "...";
    return highlightMatch(preview, query);
  }

  function addSearchResultListeners(results) {
    const items = searchResultsElement.querySelectorAll(".search-result-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        displayChangelog(results[index]);
        searchResultsElement.style.display = "none";
        searchInput.value = "";
        contractSearch();
      });
    });

    // Add keyboard navigation
    document.addEventListener("keydown", handleKeyNavigation);
  }

  function handleKeyNavigation(e) {
    const items = searchResultsElement.querySelectorAll(".search-result-item");
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentFocusedIndex = (currentFocusedIndex + 1) % items.length;
      updateFocus(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentFocusedIndex =
        (currentFocusedIndex - 1 + items.length) % items.length;
      updateFocus(items);
    } else if (e.key === "Enter" && currentFocusedIndex !== -1) {
      e.preventDefault();
      items[currentFocusedIndex].click();
    }
  }

  function updateFocus(items) {
    items.forEach((item, index) => {
      if (index === currentFocusedIndex) {
        item.classList.add("focused");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("focused");
      }
    });
  }

  // Close search results when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !searchResultsElement.contains(e.target) &&
      e.target !== searchButton &&
      e.target !== searchInput
    ) {
      searchResultsElement.style.display = "none";
      document.removeEventListener("keydown", handleKeyNavigation);
    }
  });
  searchInput.value = "";

  contractSearch();
  initializeTimelineCollapse();
});
