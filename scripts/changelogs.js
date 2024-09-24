$(document).ready(function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const $searchResultsContainer = $("#search-results");
  const $navbarCollapse = $("#navbarContent");
  const clearFilterBtn = document.getElementById("clearDateFilter");

  const dateFilterModal = new bootstrap.Modal(
    document.getElementById("dateFilterModal")
  );
  document
    .getElementById("mobileOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });
  document
    .getElementById("desktopOpenDateFilterModal")
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
          // Update the button text to show the date range
          updateDropdownButton(getDateRangeText());
          setTimeout(openChangelogDropdown, 100);
        } else {
          populateChangelogDropdown([]);
        }

        dateFilterModal.hide();
      }
    });

  let changelogsData = [];
  let debounceTimer;

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
  function closeNavbar() {
    if ($navbarCollapse.hasClass("show")) {
      $navbarCollapse.collapse("hide");
    }
  }

  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $exampleQueries = $("#exampleQueries");
  const $clearButton = $("#clear-search-button");

  $searchInput.on("input", function () {
    clearTimeout(debounceTimer); // Clear the previous timer
    const query = $(this).val().trim(); // Get the trimmed query
    $exampleQueries.addClass("d-none"); // Hide example queries

    debounceTimer = setTimeout(() => {
      performSearch(); // Call performSearch after the delay
      toggleClearButton(); // Toggle clear button visibility
    }, 300); // 300 milliseconds delay
  });

  $clearButton.on("click", function () {
    $searchInput.val("");

    clearSearch();
  });

  // Handle Enter key press or mobile 'Go' button
  $searchInput.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults();
      dismissKeyboard(); // Dismiss the keyboard on mobile
    }
  });

  // Handle example query click
  $(".example-query").on("click", function (e) {
    e.preventDefault();
    const query = $(this).text();
    $searchInput.val(query);
    performSearch();
    $exampleQueries.addClass("d-none");
  });

  // Show example queries when clicking on the search input
  $searchInput.on("focus", function () {
    if ($(this).val().trim() === "") {
      $exampleQueries.removeClass("d-none");
    }
  });

  // Hide example queries when clicking outside
  $(document).on("click", function (event) {
    if (!$(event.target).closest(".d-flex").length) {
      $exampleQueries.addClass("d-none");
    }
  });
  function focusOnSearchResults() {
    if ($searchResultsContainer.children().length > 0) {
      $searchResultsContainer.children().first().focus();
    }
  }

  function populateChangelogDropdown(changelogs) {
    const $mobileDropdown = $("#mobileChangelogList");
    const $desktopDropdown = $("#desktopChangelogList");

    $mobileDropdown.empty();
    $desktopDropdown.empty();

    if (changelogs.length === 0) {
      $mobileDropdown.append(`
            <li>
                <span class="dropdown-item-text">No data for selected dates</span>
            </li>
        `);
      $desktopDropdown.append(`
            <li>
                <span class="dropdown-item-text">No data for selected dates</span>
            </li>
        `);
    } else {
      const sortedChangelogs = changelogs.sort((a, b) => b.id - a.id);

      sortedChangelogs.forEach((changelog) => {
        $mobileDropdown.append(`
                <li class="w-100">
                    <a class="dropdown-item changelog-dropdown-item w-100" href="#" data-changelog-id="${changelog.id}">
                        <span class="changelog-title">${changelog.title}</span>
                    </a>
                </li>
            `);
        $desktopDropdown.append(`
                <li class="w-100">
                    <a class="dropdown-item changelog-dropdown-item w-100" href="#" data-changelog-id="${changelog.id}">
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
    },
  };
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

  var startDatePicker = new Pikaday({
    ...pikadayConfig,
    field: document.getElementById("startDate"),
    trigger: document.getElementById("startDateBtn"),
    onSelect: function () {
      updateButtonText("startDate");
      updateChangelogList();
    },
  });

  var endDatePicker = new Pikaday({
    ...pikadayConfig,
    field: document.getElementById("endDate"),
    trigger: document.getElementById("endDateBtn"),
    onSelect: function () {
      updateButtonText("endDate");
      updateChangelogList();
    },
  });

  // Modify the event listener for the dropdown button
  $(document).on(
    "click",
    "#mobileChangelogDropdown, #desktopChangelogDropdown",
    function (e) {
      const buttonText = $(this).text().trim();
      if (buttonText === "No data for selected dates") {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  );

  // Update the dropdown button text
  function updateDropdownButton(text) {
    const $mobileDropdownButton = $("#mobileChangelogDropdown");
    const $desktopDropdownButton = $("#desktopChangelogDropdown");

    if (text === "default") {
      $mobileDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
      $desktopDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>View Changelogs'
      );
    } else {
      $mobileDropdownButton.html(
        `<i class="bi bi-calendar-event me-2"></i>${text}`
      );
      $desktopDropdownButton.html(
        `<i class="bi bi-calendar-event me-2"></i>${text}`
      );
    }

    // Initialize the dropdown instance
    var dropdownElementList = [].slice.call(
      document.querySelectorAll(".dropdown-toggle")
    );
    var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
      return new bootstrap.Dropdown(dropdownToggleEl);
    });
  }

  // Open date filter modal
  document
    .getElementById("mobileOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });
  document
    .getElementById("desktopOpenDateFilterModal")
    .addEventListener("click", function () {
      dateFilterModal.show();
    });

  // Define buttons
  const mobileCopyChangelogBtn = $("#mobileCopyChangelog");
  const desktopCopyChangelogBtn = $("#desktopCopyChangelog");

  // Combined function to handle copying the changelog
  function copyChangelog() {
    // Disable buttons to prevent spamming
    mobileCopyChangelogBtn.prop("disabled", true);
    desktopCopyChangelogBtn.prop("disabled", true);

    // Get the content of the changelog
    const changelogContent = $("#content").clone();

    // Get the current page URL
    const currentPageUrl = window.location.href;

    // Get the sidebar image URL
    const sidebarImageUrl = $("#sidebarImage").attr("src");

    // Process the content
    let processedContent = [];

    // Add the title (h1) with '#' before it
    const title = changelogContent.find("h1.display-4").first().text().trim();
    processedContent.push("# " + title, ""); // '#' added before the title, Empty string for a blank line after title

    // Process other elements
    changelogContent.children().each(function () {
      const $elem = $(this);
      if ($elem.is("h2")) {
        // Add two newlines before each h2 to separate sections
        processedContent.push("", $elem.text().trim(), "");
      } else if ($elem.is("p.lead")) {
        processedContent.push($elem.text().trim());
      } else if ($elem.hasClass("d-flex")) {
        const text = $elem.find(".lead").text().trim();
        if ($elem.find(".bi-arrow-return-right").length > 0) {
          // This is an inline item (- -)
          processedContent.push("• • " + text);
        } else if ($elem.find(".bi-arrow-right").length > 0) {
          // This is a regular item (-)
          processedContent.push("• " + text);
        } else {
          // Fallback for any items without hyphens
          processedContent.push("• " + text);
        }
      }
    });

    // Add the sidebar image URL if available
    if (sidebarImageUrl) {
      processedContent.push("", "Media:", sidebarImageUrl);
    }

    // Add custom message at the end with the current page URL
    processedContent.push(
      "",
      "",
      "This changelog was copied from jailbreakchangelogs.xyz",
      `Source: ${currentPageUrl}`
    );

    // Join the processed content with newlines
    const cleanedContent = processedContent.join("\n");

    navigator.clipboard
      .writeText(cleanedContent)
      .then(() => {
        // Show the toast notification
        copiedChangelogToast("Changelog copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy changelog. Please try again.");
      })
      .finally(() => {
        // Re-enable buttons after 5 seconds
        setTimeout(() => {
          mobileCopyChangelogBtn.prop("disabled", false);
          desktopCopyChangelogBtn.prop("disabled", false);
        }, 3500);
      });
  }

  // Attach the combined function to both buttons
  mobileCopyChangelogBtn.on("click", copyChangelog);
  desktopCopyChangelogBtn.on("click", copyChangelog);

  function getDateRangeText() {
    const startDate = startDatePicker.getDate();
    const endDate = endDatePicker.getDate();

    if (startDate && endDate) {
      return `From: ${formatDate(startDate)} - To: ${formatDate(endDate)}`;
    } else if (startDate) {
      return `From: ${formatDate(startDate)}`;
    } else if (endDate) {
      return `To: ${formatDate(endDate)}`;
    }
    return "Select Start Date and End Date";
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function openChangelogDropdown() {
    const $mobileDropdownEl = $("#mobileChangelogDropdown");
    const $desktopDropdownEl = $("#desktopChangelogDropdown");

    const mobileDropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $mobileDropdownEl[0]
    );
    const desktopDropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $desktopDropdownEl[0]
    );

    // Force the dropdown to show
    mobileDropdownInstance.show();
    desktopDropdownInstance.show();

    // Ensure the dropdown stays open
    setTimeout(() => {
      if (!$mobileDropdownEl.hasClass("show")) {
        $mobileDropdownEl.dropdown("show");
      }
      if (!$desktopDropdownEl.hasClass("show")) {
        $desktopDropdownEl.dropdown("show");
      }
    }, 100);
  }
  function copiedChangelogToast(message) {
    toastr.success(message, "Changelog copied!", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }
  // Toast function for clearing filters
  function clearedFilterToast(message) {
    toastr.success(message, "Filter cleared!", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  // Function to clear date filter
  function clearDateFilter() {
    startDatePicker.setDate(null);
    endDatePicker.setDate(null);

    // Update button texts
    updateButtonText("startDate");
    updateButtonText("endDate");

    // Hide the modal
    dateFilterModal.hide();

    populateChangelogDropdown(changelogsData);

    // Show the toast notification
    clearedFilterToast("The date filter has been cleared successfully!");
  }

  // Function to handle clearing the filter with spam prevention
  function handleClearDateFilter(event) {
    event.preventDefault();

    // Disable buttons to prevent spamming
    document
      .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
      .forEach((button) => {
        button.disabled = true;
      });

    clearDateFilter();

    // Re-enable buttons after 5 seconds
    setTimeout(() => {
      document
        .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
        .forEach((button) => {
          button.disabled = false;
        });
    }, 4000);
  }

  // Attach the event listener to both buttons
  document
    .querySelectorAll("#mobileClearDateFilter, #desktopClearDateFilter")
    .forEach((button) => {
      button.addEventListener("click", handleClearDateFilter);
    });

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

    // Highlight @mentions
    highlightedText = highlightedText.replace(
      /@(\w+)/g,
      '<span class="highlight mention">@$1</span>'
    );

    // Highlight other query words
    words.forEach((word) => {
      if (word !== "has:" && word !== "mention") {
        const regex = new RegExp(`(${word})`, "gi");
        highlightedText = highlightedText.replace(
          regex,
          '<span class="highlight">$1</span>'
        );
      }
    });

    return highlightedText;
  }

  const convertMarkdownToHtml = (markdown) => {
    return markdown
      .split("\n")
      .map((line) => {
        line = line.trim();
        if (line.startsWith("# ")) {
          return `<h1 class="display-4 mb-4 text-custom-header border-bottom border-custom-header pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`;
        } else if (line.startsWith("## ")) {
          return `<h2 class="display-5 mt-5 mb-3 text-custom-subheader">${wrapMentions(
            line.substring(3)
          )}</h2>`;
        } else if (line.startsWith("- - ")) {
          return `<div class="d-flex mb-2 position-relative">
                    <i class="bi bi-arrow-return-right text-custom-icon position-absolute" style="left: 20px; font-size: 1.5rem;"></i>
                    <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                      line.substring(4)
                    )}</p>
                  </div>`;
        } else if (line.startsWith("- ")) {
          return `<div class="d-flex mb-2 position-relative">
                    <i class="bi bi-arrow-right text-custom-icon position-absolute" style="left: 0; font-size: 1.5rem;"></i>
                    <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                      line.substring(2)
                    )}</p>
                  </div>`;
        } else if (line.startsWith("(audio)")) {
          const audioUrl = line.substring(7).trim();
          const audioType = audioUrl.endsWith(".wav")
            ? "audio/wav"
            : "audio/mpeg";
          return `<audio class="w-100 mt-2 mb-2" controls><source src="${audioUrl}" type="${audioType}"></audio>`;
        } else if (line.startsWith("(image)")) {
          const imageUrl = line.substring(7).trim();
          return `<img src="${imageUrl}" alt="Image" class="img-fluid mt-2 mb-2 rounded" style="max-height: 500px;">`;
        } else if (line.startsWith("(video)")) {
          const videoUrl = line.substring(7).trim();
          return `<video class="w-100 mt-2 mb-2 rounded" style="max-height: 500px;" controls><source src="${videoUrl}" type="video/mp4"></video>`;
        } else {
          return `<p class="lead mb-2">${wrapMentions(line)}</p>`;
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
        populateChangelogDropdown(data); // Populate the dropdown with all changelogs
        const urlParams = new URLSearchParams(window.location.search);
        const changelogId = urlParams.get("id");
        const selectedChangelog = changelogsData.find(
          (cl) => cl.id == changelogId
        );
        if (selectedChangelog) {
          displayChangelog(selectedChangelog); // Display the changelog that corresponds to the ID in the URL query parameter
        } else {
          const latestChangelog = data[0]; // Get the latest changelog
          displayChangelog(latestChangelog); // Display the latest changelog if no ID is provided in the URL
        }
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

    if (query.length === 0) {
      // Hide search results if the input is empty
      hideSearchResults();
      return; // Exit the function early
    }

    let searchResults = [];

    if (query.startsWith("has:")) {
      // Handle special query for media types and mentions
      const queryType = query.split(":")[1].trim();

      searchResults = changelogsData.filter((changelog) => {
        switch (queryType) {
          case "audio":
            return changelog.sections.includes("(audio)");
          case "video":
            return changelog.sections.includes("(video)");
          case "image":
            return changelog.sections.includes("(image)");
          case "mention":
            return /@\w+/.test(changelog.sections); // Check for @ mentions
          default:
            return false;
        }
      });
    } else {
      // Regular search
      searchResults = changelogsData.filter((changelog) => {
        const titleMatch = changelog.title.toLowerCase().includes(query);
        const contentMatch =
          changelog.sections &&
          typeof changelog.sections === "string" &&
          changelog.sections.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      });
    }

    displaySearchResults(searchResults, query);
    toggleClearButton();
  }

  function hideSearchResults() {
    $searchResultsContainer.hide(); // Hide the search results container
    $searchInput.focus(); // Focus on the search input
  }

  function displaySearchResults(results, query) {
    $searchResultsContainer.empty();

    if (results.length === 0) {
      $searchResultsContainer.html('<p class="p-3">No results found.</p>');
    } else {
      const $resultsList = $("<ul>").addClass("list-group list-group-flush");
      results.forEach((changelog) => {
        const $listItem = $("<li>").addClass(
          "list-group-item custom-search-item"
        );

        let previewText = "";
        let highlightedPreview = "";

        if (query.startsWith("has:")) {
          const mediaType = query.split(":")[1].trim();
          switch (mediaType) {
            case "audio":
            case "video":
            case "image":
              const mediaRegex = new RegExp(`\\(${mediaType}\\)`, "g");
              const mediaCount = (changelog.sections.match(mediaRegex) || [])
                .length;
              previewText = `${mediaCount} ${mediaType}${
                mediaCount !== 1 ? "s" : ""
              } found`;
              highlightedPreview = previewText; // No highlighting for media types
              break;
            case "mention":
              const mentionMatches = [
                ...new Set(changelog.sections.match(/@\w+/g) || []),
              ];
              if (mentionMatches.length > 0) {
                previewText = `Mentions found: ${mentionMatches.join(", ")}`;
                highlightedPreview = highlightText(previewText, query); // Highlight mentions
              } else {
                previewText = "No mentions found";
                highlightedPreview = previewText;
              }
              break;
          }
        } else {
          // Regular search preview logic (unchanged)
          const cleanedSections = cleanContentForSearch(changelog.sections);
          const queryPosition = cleanedSections.toLowerCase().indexOf(query);
          if (queryPosition !== -1) {
            const startPos = Math.max(0, queryPosition - 50);
            const endPos = Math.min(
              cleanedSections.length,
              queryPosition + query.length + 50
            );
            previewText = cleanedSections.substring(startPos, endPos);
            if (startPos > 0) previewText = "..." + previewText;
            if (endPos < cleanedSections.length) previewText += "...";
          } else {
            previewText =
              cleanedSections.substring(0, 100) +
              (cleanedSections.length > 100 ? "..." : "");
          }
          highlightedPreview = highlightText(previewText, query);
        }

        const highlightedTitle = highlightText(changelog.title, query);

        // Create media labels
        const hasAudio = changelog.sections.includes("(audio)");
        const hasVideo = changelog.sections.includes("(video)");
        const hasImage = changelog.sections.includes("(image)");
        const mediaLabels = [
          hasAudio ? '<span class="badge bg-primary me-1">Audio</span>' : "",
          hasVideo ? '<span class="badge bg-success me-1">Video</span>' : "",
          hasImage ? '<span class="badge bg-info me-1">Image</span>' : "",
        ].join("");

        $listItem.html(`
          <h5 class="mb-1">${highlightedTitle} ${mediaLabels}</h5>
          <p class="mb-1 small">${highlightedPreview}</p>
        `);

        $listItem.on("click", () => {
          displayChangelog(changelog);
          clearSearch();
          dismissKeyboard();
          closeNavbar();
        });

        $resultsList.append($listItem);
      });
      $searchResultsContainer.append($resultsList);
    }
    $searchResultsContainer.show();
  }
  $searchResultsContainer.on("wheel", function (event) {
    event.stopPropagation(); // Prevent the body from scrolling
  });

  $searchResultsContainer.on("touchstart touchmove", function (event) {
    event.stopPropagation(); // Prevent body scrolling on touch devices
  });

  function cleanContentForSearch(content) {
    return content
      .replace(/- /g, " ")
      .replace(/- - /g, " ")
      .replace(/### /g, " ")
      .replace(/## /g, " ")
      .replace(/\(audio\) /g, " ")
      .replace(/\(video\) /g, " ")
      .replace(/\(image\) /g, " ")
      .replace(/\(audio\)\s*\S+/g, "")
      .replace(/\(video\)\s*\S+/g, "")
      .replace(/\(image\)\s*\S+/g, "")
      .replace(/@(\w+)/g, "@$1")
      .replace(/\s+/g, " ")
      .trim();
  }

  const displayChangelog = (changelog) => {
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
    const dropdownText = $("#mobileChangelogDropdown").text().trim();
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
    $("html, body").animate({ scrollTop: 0 }, 100);
  });

  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const changelogId = $(this).data("changelog-id");
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId);
    if (selectedChangelog) {
      displayChangelog(selectedChangelog);
      const accordion = document.getElementById("filterAccordion");
      const collapseElement = accordion.querySelector(".collapse");
      bootstrap.Collapse.getInstance(collapseElement).hide();
    }
  });

  bootstrap.Dropdown.getOrCreateInstance($("#mobileChangelogDropdown")[0]);
  bootstrap.Dropdown.getOrCreateInstance($("#desktopChangelogDropdown")[0]);
});
