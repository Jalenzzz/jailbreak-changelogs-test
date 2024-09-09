document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const pageSelect = document.getElementById("pageSelect");
  const titleElement = document.getElementById("changelogTitle");
  const themeToggleButton = document.getElementById("theme-toggle");
  const lightIcon = document.querySelector(".light-icon");
  const darkIcon = document.querySelector(".dark-icon");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const searchResultsElement = document.getElementById("searchResults");
  let changelogsData = [];
  let currentFocusedIndex = -1;

  const updateThemeIcons = () => {
    const isDarkTheme = document.body.classList.contains("dark-theme");
    lightIcon.style.display = isDarkTheme ? "none" : "inline";
    darkIcon.style.display = isDarkTheme ? "inline" : "none";
  };

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
      .replace(/### /g, "\n### ");

  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
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
        } else {
          return `<p>${wrapMentions(line)}</p>`;
        }
      })
      .join("");
  };

  // console.log("Fetching list of changelogs from:", apiUrl);

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      // console.log("Changelogs data:", data);
      changelogsData = data;

      if (Array.isArray(data) && data.length > 0) {
        data.reverse().forEach((changelog) => {
          const option = document.createElement("option");
          option.value = changelog.id;
          option.textContent = changelog.title;
          pageSelect.appendChild(option);
        });

        const savedId = localStorage.getItem("selectedChangelogId");
        const idFromUrl = new URLSearchParams(window.location.search).get("id");
        const initialId = idFromUrl || savedId || data[0].id;

        pageSelect.value = initialId;
        displayChangelog(data.find((cl) => cl.id == initialId));
      } else {
        console.error("No changelogs found.");
      }
    })
    .catch((error) => console.error("Error fetching changelogs:", error));

  const displayChangelog = (changelog) => {
    // console.log("Displaying changelog:", changelog);

    history.pushState(null, "", `?id=${changelog.id}`);
    localStorage.setItem("selectedChangelogId", changelog.id);

    document.title = `Jailbreak Changelog: ${changelog.title}`;
    if (titleElement) {
      titleElement.textContent = changelog.title;
    }

    if (changelog.image_url) {
      // console.log("Setting image src to:", changelog.image_url);
      imageElement.src = changelog.image_url;
      imageElement.alt = `Image for ${changelog.title}`;
      imageElement.style.display = "block";
    } else {
      console.warn("No image URL found for changelog.");
      imageElement.src = "";
      imageElement.alt = "No image available";
      imageElement.style.display = "none";
    }

    let contentHtml = `<h1>${changelog.title}</h1>`;

    if (changelog.sections) {
      // console.log("Setting sections content.");
      const processedMarkdown = preprocessMarkdown(changelog.sections);
      const processedSections = convertMarkdownToHtml(processedMarkdown);
      contentHtml += processedSections;
    } else {
      console.warn("No sections available for changelog.");
      contentHtml += "<p>No sections available.</p>";
    }

    sectionsElement.innerHTML = contentHtml;
  };

  pageSelect.addEventListener("change", function () {
    const selectedId = this.value;
    // console.log("Changelog selected:", selectedId);
    const selectedChangelog = changelogsData.find((cl) => cl.id == selectedId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
    } else {
      console.error("Selected changelog not found in data.");
    }
  });

  // Theme toggle logic
  themeToggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-theme") ? "dark" : "light"
    );
    updateThemeIcons();
  });

  // Initialize theme on page load
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
  updateThemeIcons();

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
  // Add this new event listener for the search input
  searchInput.addEventListener("blur", () => {
    if (searchInput.value.trim() === "") {
      updateSearchButtonState("");
    }
  });

  // Add event listener for 'Enter' key in search input
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    updateSearchButtonState(query);
    if (query.length > 0) {
      performSearch(query);
      expandSearch();
    } else {
      searchResultsElement.style.display = "none";
      contractSearch();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      const query = searchInput.value.trim().toLowerCase();
      if (query.length >= 3) {
        performSearch(query);
      }
    }
  });

  // Update search button click handler
  searchButton.addEventListener("click", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (searchButton.getAttribute("title") === "Clear search") {
      // Clear search
      searchInput.value = "";
      searchResultsElement.style.display = "none";
      updateSearchButtonState("");
      contractSearch();
    } else {
      // Perform search
      if (query.length > 0) {
        performSearch(query);
        expandSearch();
      }
    }
  });

  function displaySearchResults(results, query) {
    if (results.length > 0) {
      let resultsHtml = '<div class="search-results-content">';
      results.forEach((changelog, index) => {
        const titleHighlight = highlightMatch(changelog.title, query);
        const contentPreview = getContentPreview(changelog.sections, query);
        resultsHtml += `
          <div class="search-result-item" data-index="${index}">
            <strong>${titleHighlight}</strong>
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
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.slice(0, 100) + "...";

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 50);
    let preview = content.slice(start, end);
    if (start > 0) preview = "..." + preview;
    if (end < content.length) preview += "...";
    return highlightMatch(preview, query);
  }

  // Function to update search button state
  function updateSearchButtonState(query) {
    const searchButtonIcon = searchButton.querySelector("svg");
    if (query.length > 0) {
      searchButtonIcon.innerHTML =
        '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>';
      searchButton.setAttribute("title", "Clear search");
    } else {
      searchButtonIcon.innerHTML =
        '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>';
      searchButton.setAttribute("title", "Search");
    }

    // Update the stroke color based on the current theme
    const isDarkTheme = document.body.classList.contains("dark-theme");
    const strokeColor = isDarkTheme
      ? getComputedStyle(document.body).getPropertyValue("--footer-link-color")
      : getComputedStyle(document.body).getPropertyValue("--text-color");

    searchButtonIcon.style.stroke = strokeColor;
  }

  function addSearchResultListeners(results) {
    const items = searchResultsElement.querySelectorAll(".search-result-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const index = parseInt(item.dataset.index);
        displayChangelog(results[index]);
        searchResultsElement.style.display = "none";

        // Clear the search input
        searchInput.value = "";

        // Reset the search button state
        updateSearchButtonState("");

        // Contract the search bar
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

      // Update these lines
      searchInput.value = "";
      updateSearchButtonState("");
      contractSearch();
    }
  });
});
