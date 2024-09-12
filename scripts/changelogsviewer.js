$(document).ready(function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const clearFilterBtn = document.getElementById("clearDateFilter");
  const toast = new bootstrap.Toast(
    document.getElementById("clearFilterToast")
  );
  const dateFilterModal = new bootstrap.Modal(
    document.getElementById("dateFilterModal")
  );
  document
    .getElementById("openDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });
  document
    .getElementById("applyDateFilter")
    .addEventListener("click", function () {
      const startDate = startDatePicker.getDate();
      const endDate = endDatePicker.getDate();

      if (!startDate && !endDate) {
        alert("Please select at least one date before applying the filter.");
      } else {
        const filteredChangelogs = filterChangelogsByDate();

        if (filteredChangelogs.length > 0) {
          populateChangelogDropdown(filteredChangelogs);
          updateDropdownButton(getDateRangeText());
          setTimeout(openChangelogDropdown, 100);
        } else {
          populateChangelogDropdown([]);
          updateDropdownButton("No data for selected dates");
        }

        dateFilterModal.hide();
      }
    });

  let changelogsData = [];

  function showLoadingOverlay() {
    loadingOverlay.classList.add("show");
  }

  function hideLoadingOverlay() {
    loadingOverlay.classList.remove("show");
  }

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

  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $searchButton = $("#button-addon2");
  const $clearButton = $("#clear-search-button");

  $searchButton.on("click", performSearch);
  $searchInput.on("keyup", (e) => {
    if (e.key === "Enter") {
      performSearch();
      dismissKeyboard();
    }
    toggleClearButton();
  });

  $clearButton.on("click", clearSearch);
  function populateChangelogDropdown(changelogs) {
    const $dropdown = $("#changelogList");
    $dropdown.empty();

    if (changelogs.length === 0) {
      $dropdown.append(`
        <li>
          <span class="dropdown-item-text">No data for selected dates</span>
        </li>
      `);
    } else {
      const sortedChangelogs = changelogs.sort((a, b) => b.id - a.id);

      sortedChangelogs.forEach((changelog) => {
        $dropdown.append(`
          <li>
            <a class="dropdown-item changelog-dropdown-item" href="#" data-changelog-id="${changelog.id}">
              <span class="changelog-title">${changelog.title}</span>
            </a>
          </li>
        `);
      });
    }
  }

  // Initialize Bootstrap dropdowns
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle")
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl);
  });

  // Pikaday configuration
  var pikadayConfig = {
    format: "YYYY-MM-DD",
    showDaysInNextAndPreviousMonths: true,
    enableSelectionDaysInNextAndPreviousMonths: true,
    onSelect: function (date) {
      const fieldId = this._o.field.id;
      if (date) {
        // Adjust the date to local timezone
        const localDate = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        );
        document.getElementById(fieldId).value = localDate
          .toISOString()
          .split("T")[0];
      } else {
        document.getElementById(fieldId).value = "";
      }
      updateButtonText(fieldId);
    },
  };

  var startDatePicker = new Pikaday({
    ...pikadayConfig,
    field: document.getElementById("startDate"),
    trigger: document.getElementById("startDateBtn"),
  });
  var endDatePicker = new Pikaday({
    ...pikadayConfig,
    field: document.getElementById("endDate"),
    trigger: document.getElementById("endDateBtn"),
  });
  function updateButtonText(fieldId) {
    const btn = document.getElementById(fieldId + "Btn");
    const dateString = document.getElementById(fieldId).value;
    if (dateString) {
      const date = new Date(dateString);
      const formattedDate = formatDateForButton(date);
      btn.querySelector("span").textContent = formattedDate;
    } else {
      btn.querySelector("span").textContent =
        fieldId === "startDate" ? "Select Start Date" : "Select End Date";
    }
  }

  function formatDateForButton(date) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    };
    return date.toLocaleDateString("en-US", options);
  }

  function updateChangelogList() {
    const startDate = startDatePicker.getDate();
    const endDate = endDatePicker.getDate();

    if (startDate || endDate) {
      const filteredChangelogs = filterChangelogsByDate();

      if (filteredChangelogs.length > 0) {
        populateChangelogDropdown(filteredChangelogs);
        updateDropdownButton("filtered");
        setTimeout(openChangelogDropdown, 100);
      } else {
        populateChangelogDropdown([]);
        updateDropdownButton("No data for selected dates");
      }
    } else {
      populateChangelogDropdown(changelogsData);
      updateDropdownButton("default");
    }
  }

  function getDateRangeText() {
    const startDate = startDatePicker.getDate();
    const endDate = endDatePicker.getDate();

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Until: ${formatDate(endDate)}`;
    }
    return "All Changelogs";
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getDateRangeText() {
    const startDate = startDatePicker.getDate();
    const endDate = endDatePicker.getDate();

    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From ${formatDate(startDate)}`;
    } else if (endDate) {
      return `Until ${formatDate(endDate)}`;
    }
    return "All Changelogs";
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function openChangelogDropdown() {
    const $dropdownEl = $("#changelogDropdown");
    const dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $dropdownEl[0]
    );

    // Force the dropdown to show
    $dropdownEl.dropdown("show");

    // Ensure the dropdown stays open
    setTimeout(() => {
      if (!$dropdownEl.hasClass("show")) {
        $dropdownEl.dropdown("show");
      }
    }, 100);
  }

  function clearDateFilter() {
    startDatePicker.setDate(null);
    endDatePicker.setDate(null);

    // Update button texts
    updateButtonText("startDate");
    updateButtonText("endDate");

    // Hide the modal
    dateFilterModal.hide();

    updateDropdownButton("default");
    populateChangelogDropdown(changelogsData);

    // Show the toast
    toast.show();
  }

  document
    .getElementById("clearDateFilter")
    .addEventListener("click", clearDateFilter);

  function filterChangelogsByDate() {
    let startDate = startDatePicker.getDate();
    let endDate = endDatePicker.getDate();

    if (!startDate && !endDate) {
      updateDropdownButton("default");
      return changelogsData; // Return all changelogs if no dates are selected
    }

    if (startDate) {
      startDate = new Date(
        Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )
      );
    }
    if (endDate) {
      endDate = new Date(
        Date.UTC(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999
        )
      );
    }

    return changelogsData.filter((changelog) => {
      const changelogDate = parseDateFromTitle(changelog.title);
      if (!changelogDate) return false;

      if (startDate && endDate) {
        return changelogDate >= startDate && changelogDate <= endDate;
      } else if (startDate) {
        return changelogDate >= startDate;
      } else if (endDate) {
        return changelogDate <= endDate;
      }
      return true;
    });
  }

  function parseDateFromTitle(title) {
    const months = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11,
    };

    const match = title.match(/(\w+)\s(\d+)(?:st|nd|rd|th)\s(\d{4})/);
    if (match) {
      const [, month, day, year] = match;
      return new Date(Date.UTC(parseInt(year), months[month], parseInt(day)));
    }
    return null;
  }

  function updateDropdownButton(text) {
    const $dropdownButton = $("#changelogDropdown");
    if (text === "default") {
      $dropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
    } else if (text === "filtered") {
      $dropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>Filtered Changelogs'
      );
    } else {
      $dropdownButton.html(`<i class="bi bi-calendar-event me-2"></i>${text}`);
    }
    // Ensure the dropdown is still clickable after updating the text
    $dropdownButton.dropdown();
  }

  // Modify the event listener for the dropdown button
  $(document).on("click", "#changelogDropdown", function (e) {
    const buttonText = $(this).text().trim();
    if (buttonText === "No data for selected dates") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function toggleClearButton() {
    $clearButton.toggle($searchInput.val().length > 0);
  }

  function hideSearchResults() {
    $("#search-results").hide();
    $searchInput.focus();
  }

  function clearSearch() {
    $searchInput.val("");
    toggleClearButton();
    hideSearchResults();
    dismissKeyboard();
  }

  function highlightText(text, query) {
    const words = query
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0);
    let highlightedText = text;
    words.forEach((word) => {
      const regex = new RegExp(word, "gi");
      highlightedText = highlightedText.replace(
        regex,
        (match) => `<span class="highlight">${match}</span>`
      );
    });
    return highlightedText;
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
          return `<p class="mb-2 lead ps-5 position-relative"><i class="bi bi-arrow-right position-absolute start-0 ps-4 text-primary"></i> ${wrapMentions(
            line.substring(6)
          )}</p>`;
        } else if (line.startsWith("- - ")) {
          return `<p class="mb-2 lead ps-5 position-relative"><i class="bi bi-arrow-return-right position-absolute start-0 ps-4 text-primary"></i> ${wrapMentions(
            line.substring(4)
          )}</p>`;
        } else if (line.startsWith("- ")) {
          return `
  <div class="d-flex align-items-start mb-2">
    <i class="bi bi-arrow-right text-primary me-2 fs-4"></i>
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
    <p class="lead mb-0">${wrapMentions(line)}</p>
  </div>
  `;
        }
      })
      .join("");
  };

  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>'
    );
  };

  $.getJSON(apiUrl)
    .done((data) => {
      changelogsData = data;

      if (Array.isArray(data) && data.length > 0) {
        const savedId = localStorage.getItem("selectedChangelogId");
        const idFromUrl = new URLSearchParams(window.location.search).get("id");
        const initialChangelog =
          changelogsData.find((cl) => cl.id == (idFromUrl || savedId)) ||
          changelogsData[0];
        populateChangelogDropdown(data);
        displayChangelog(initialChangelog);
        updateDropdownButton("default");
      } else {
        console.error("No changelogs found.");
      }

      hideLoadingOverlay();
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error("Error fetching changelogs:", errorThrown);
      $("#content").html(
        "<p>Error loading changelogs. Please try again later.</p>"
      );
      hideLoadingOverlay();
    });

  function performSearch() {
    const query = $searchInput.val().trim().toLowerCase();
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
    const $searchResultsContainer = $("#search-results");
    $searchResultsContainer.empty();
    const query = $searchInput.val().trim().toLowerCase();

    if (results.length === 0) {
      const $noResultsItem = $("<li>").addClass(
        "list-group-item custom-search-item"
      );
      $noResultsItem.text("No results found.");
      $searchResultsContainer.append(
        $("<ul>").addClass("list-group list-group-flush").append($noResultsItem)
      );
    } else {
      const $resultsList = $("<ul>").addClass("list-group list-group-flush");
      results.forEach((changelog) => {
        const $listItem = $("<li>").addClass(
          "list-group-item custom-search-item"
        );

        const cleanedSections = cleanContentForSearch(changelog.sections);

        // Find the position of the query in the content
        const queryPosition = cleanedSections.toLowerCase().indexOf(query);
        let previewText = "";

        if (queryPosition !== -1) {
          // Get a substring around the found query
          const startPos = Math.max(0, queryPosition - 50);
          const endPos = Math.min(
            cleanedSections.length,
            queryPosition + query.length + 50
          );
          previewText = cleanedSections.substring(startPos, endPos);

          // Add ellipsis if we're not at the start or end of the content
          if (startPos > 0) previewText = "..." + previewText;
          if (endPos < cleanedSections.length) previewText += "...";
        } else {
          // If query not found in content, fall back to the first 100 characters
          previewText =
            cleanedSections.substring(0, 100) +
            (cleanedSections.length > 100 ? "..." : "");
        }

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

        const highlightedTitle = highlightText(changelog.title, query);
        const highlightedPreview = highlightText(previewText, query);

        $listItem.html(`
          <h5 class="mb-1">${highlightedTitle} ${mediaTags.join(" ")}</h5>
          <p class="mb-1 small">${highlightedPreview}</p>
        `);

        $listItem.on("click", () => {
          displayChangelog(changelog);
          clearSearch();
          dismissKeyboard();
        });

        $resultsList.append($listItem);
      });
      $searchResultsContainer.append($resultsList);
    }
    $searchResultsContainer.show();
  }

  function cleanContentForSearch(content) {
    return content
      .replace(/- /g, " ")
      .replace(/- - /g, " ")
      .replace(/### /g, " ")
      .replace(/\(audio\) /g, " ")
      .replace(/\(video\) /g, " ")
      .replace(/\(image\) /g, " ")
      .replace(/\(audio\)\s*\S+/g, "[Audio]")
      .replace(/\(video\)\s*\S+/g, "[Video]")
      .replace(/\(image\)\s*\S+/g, "[Image]")
      .replace(/@(\w+)/g, "@$1")
      .replace(/\s+/g, " ")
      .trim();
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
    const dropdownText = $("#changelogDropdown").text().trim();
    if (
      dropdownText !== "Filtered Changelogs" &&
      dropdownText !== "No data for selected dates"
    ) {
      updateDropdownButton("default");
    }

    sectionsElement.innerHTML = contentHtml;
  };

  // Back to Top button functionality
  const backToTopButton = $("#backToTop");

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      backToTopButton.addClass("show");
    } else {
      backToTopButton.removeClass("show");
    }
  });

  backToTopButton.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 800);
  });

  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const changelogId = $(this).data("changelog-id");
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
    }
  });

  bootstrap.Dropdown.getOrCreateInstance($("#changelogDropdown")[0]);
  $("#clearDateFilter").on("click", clearDateFilter);
});
