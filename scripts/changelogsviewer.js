document.addEventListener("DOMContentLoaded", () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");

  let changelogsData = [];

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

  const preprocessMarkdown = (markdown) =>
    markdown
      .replace(/ - /g, "\n- ")
      .replace(/ - - /g, "\n- - ")
      .replace(/## /g, "\n## ")
      .replace(/### /g, "\n### ")
      .replace(/\(audio\) /g, "\n(audio) ")
      .replace(/\(video\) /g, "\n(video) ")
      .replace(/\(image\) /g, "\n(image) ");

  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
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
  function handleSearchResultsKeyboard(event) {
    const searchResults = document.querySelectorAll(".custom-search-item");
    const currentIndex = Array.from(searchResults).indexOf(
      document.activeElement
    );

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (currentIndex < searchResults.length - 1) {
          searchResults[currentIndex + 1].focus();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (currentIndex > 0) {
          searchResults[currentIndex - 1].focus();
        } else {
          searchInput.focus();
        }
        break;
      case "Enter":
        if (document.activeElement.classList.contains("custom-search-item")) {
          event.preventDefault();
          document.activeElement.click(); // This will trigger the click event, which now uses clearSearch
        }
        break;
      case "Escape":
        event.preventDefault();
        clearSearch(); // Use clearSearch instead of just hideSearchResults
        break;
    }
  }

  const searchInput = document.querySelector(
    'input[aria-label="Search changelogs"]'
  );
  const searchButton = document.querySelector("#button-addon2");
  const clearButton = document.querySelector("#clear-search-button");

  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      performSearch();
      dismissKeyboard();
    }
    toggleClearButton();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const firstResult = document.querySelector(".custom-search-item");
      if (firstResult) {
        firstResult.focus();
      }
    }
  });

  clearButton.addEventListener("click", clearSearch);
  searchInput.addEventListener("keydown", handleSearchResultsKeyboard);

  function toggleClearButton() {
    if (searchInput.value.length > 0) {
      clearButton.style.display = "block";
    } else {
      clearButton.style.display = "none";
    }
  }
  function hideSearchResults() {
    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.style.display = "none";
    searchInput.focus(); // Return focus to the search input
  }

  function clearSearch() {
    searchInput.value = "";
    toggleClearButton();
    hideSearchResults();
    dismissKeyboard();
  }

  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
        line = line.trim();
        if (line.startsWith("# ")) {
          return `<h1 class="display-4 mb-4 text-primary border-bottom border-primary pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`;
        } else if (line.startsWith("## ")) {
          return `<h2 class="display-5 mt-5 mb-3 text-warning">${wrapMentions(
            line.substring(3)
          )}</h2>`;
        } else if (line.startsWith("### ")) {
          return `<h3 class="display-6 mt-4 mb-3">${wrapMentions(
            line.substring(4)
          )}</h3>`;
        } else if (line.startsWith("- - - ")) {
          return `<p class="mb-2 lead ps-5 position-relative"><span class="position-absolute start-0 ps-4 text-primary">•</span> ${wrapMentions(
            line.substring(6)
          )}</p>`;
        } else if (line.startsWith("- - ")) {
          return `<p class="mb-2 lead ps-5 position-relative"><span class="position-absolute start-0 ps-4 text-primary">•</span> ${wrapMentions(
            line.substring(4)
          )}</p>`;
        } else if (line.startsWith("- ")) {
          return `
  <div class="d-flex align-items-start mb-2">
    <span class="text-primary me-2">•</span>
    <p class="lead mb-0">${wrapMentions(line.substring(2))}</p>
  </div>
`;
        } else if (line.startsWith("(audio)")) {
          const audioUrl = line.substring(7).trim();
          const audioType = audioUrl.endsWith(".wav")
            ? "audio/wav"
            : "audio/mpeg";
          return `<audio class="w-100 mt-2 mb-2" controls><source src="${audioUrl}" type="${audioType}"></audio>`;
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim();
          return `<img src="${imageUrl}" alt="Image" class="img-fluid mt-2 mb-2" style="max-height: 500px;">`;
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim();
          return `<video class="w-100 mt-2 mb-2" style="max-height: 500px;" controls><source src="${videoUrl}" type="video/mp4"></video>`;
        } else {
          return `
  <div class="d-flex align-items-start mb-2">
    <p class="lead mb-0">${wrapMentions(line.substring(2))}</p>
  </div>
`;
        }
      })
      .join("");
  };

  // Update the wrapMentions function to make mentioned text bold
  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>'
    );
  };

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

        improveKeyboardNavigation();
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

  function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query) {
      const searchResults = changelogsData.filter((changelog) => {
        const titleMatch = changelog.title.toLowerCase().includes(query);
        const contentMatch =
          changelog.sections &&
          typeof changelog.sections === "string" &&
          changelog.sections.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      });

      displaySearchResults(searchResults);
    } else {
      hideSearchResults();
    }
    dismissKeyboard();
  }

  function displaySearchResults(results) {
    const searchResultsContainer = document.getElementById("search-results");
    searchResultsContainer.innerHTML = "";
    if (results.length === 0) {
      searchResultsContainer.innerHTML = '<p class="p-3">No results found.</p>';
    } else {
      const resultsList = document.createElement("ul");
      resultsList.className = "list-group list-group-flush";
      results.forEach((changelog) => {
        const listItem = document.createElement("li");
        listItem.className =
          "list-group-item search-result-item custom-search-item";
        listItem.tabIndex = 0; // Make the item focusable

        const cleanedSections = cleanContentForSearch(changelog.sections);
        const previewText =
          cleanedSections.substring(0, 100) +
          (cleanedSections.length > 100 ? "..." : "");

        // Check for media tags
        const hasVideo = changelog.sections.includes("(video)");
        const hasImage = changelog.sections.includes("(image)");
        const hasAudio = changelog.sections.includes("(audio)");

        const mediaTags = [];
        if (hasVideo)
          mediaTags.push('<span class="media-tag video-tag">Video</span>');
        if (hasImage)
          mediaTags.push('<span class="media-tag image-tag">Image</span>');
        if (hasAudio)
          mediaTags.push('<span class="media-tag audio-tag">Audio</span>');

        listItem.innerHTML = `
          <h5 class="mb-1">${changelog.title} ${mediaTags.join(" ")}</h5>
          <p class="mb-1 small">${previewText}</p>
        `;

        listItem.addEventListener("click", () => {
          displayChangelog(changelog);
          clearSearch();
          dismissKeyboard();
        });
        listItem.addEventListener("keydown", handleSearchResultsKeyboard);
        resultsList.appendChild(listItem);
      });
      searchResultsContainer.appendChild(resultsList);
    }
    searchResultsContainer.style.display = "block";
  }

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

  const displayChangelog = (changelog) => {
    history.pushState(null, "", `?id=${changelog.id}`);
    localStorage.setItem("selectedChangelogId", changelog.id);

    document.title = `Jailbreak Changelog: ${changelog.title}`;
    if (titleElement) {
      titleElement.textContent = changelog.title;
    }

    if (changelog.image_url) {
      imageElement.src = changelog.image_url;
      imageElement.alt = `Image for ${changelog.title}`;
      imageElement.style.display = "block";
    } else {
      imageElement.src = "";
      imageElement.alt = "No image available";
      imageElement.style.display = "none";
    }

    let contentHtml = `<h1 class="display-4 mb-4">${changelog.title}</h1>`;

    if (changelog.sections) {
      const processedMarkdown = preprocessMarkdown(changelog.sections);
      const processedSections = convertMarkdownToHtml(processedMarkdown);
      contentHtml += processedSections;
    } else {
      console.warn("No sections available for changelog.");
      contentHtml += '<p class="lead">No sections available.</p>';
    }

    sectionsElement.innerHTML = contentHtml;
  };
});
