$(document).ready(function () {
  // Get references to DOM elements
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api3.jailbreakchangelogs.xyz/changelogs/list";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const CommentHeader = document.getElementById("comment-header");
  const startDateBtn = document.getElementById("startDateBtn");
  const endDateBtn = document.getElementById("endDateBtn");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const applyFilterBtn = document.getElementById("applyDateFilter");
  const clearFilterBtn = document.getElementById("desktopClearDateFilter");
  const openModalBtn = document.getElementById("desktopOpenDateFilterModal");
  const mobileOpenModalBtn = document.getElementById(
    "mobileOpenDateFilterModal"
  );
  const dateFilterModal = new bootstrap.Modal(
    document.getElementById("dateFilterModal")
  );

  const desktopLatestChangelogBtn = document.getElementById(
    "desktopLatestChangelogBtn"
  );
  const mobileLatestChangelogBtn = document.getElementById(
    "mobileLatestChangelogBtn"
  );

  // jQuery references for search results and navbar
  const $searchResultsContainer = $("#search-results");
  const $navbarCollapse = $("#navbarContent");

  // Initialize changelogs data and debounce timer
  let changelogsData = [];
  let currentFilterState = null;
  let debounceTimer;

  function escapeHtml(text) {
    // Create a temporary div to handle HTML encoding
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function updateChangelogBreadcrumb(changelogId) {
    const breadcrumbHtml = `
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/">Home</a></li>
            <li class="breadcrumb-item"><a href="/changelogs">Changelogs</a></li>
            <li class="breadcrumb-item active" aria-current="page">Changelog ${changelogId}</li>
        </ol>
    `;
    document.querySelector('nav[aria-label="breadcrumb"]').innerHTML =
      breadcrumbHtml;
  }

  // Displays the most recent changelog entry.
  function displayLatestChangelog() {
    if (changelogsData && changelogsData.length > 0) {
      const latestChangelog = changelogsData[0]; // Get the first (latest) changelog

      // Update the URL without reloading the page
      const newUrl = `/changelogs/${latestChangelog.id}`;
      history.pushState({}, "", newUrl);

      // Display the changelog content
      displayChangelog(latestChangelog);

      // Update the breadcrumb
      updateChangelogBreadcrumb(latestChangelog.id);

      changelogToast("Showing latest changelog"); // Show a toast notification
    } else {
      console.warn("No changelog data available to display latest entry.");
      changelogToast("No changelog data available.");
    }
  }

  // Event listener for the desktop version of the "Latest Changelog" button
  desktopLatestChangelogBtn.addEventListener("click", displayLatestChangelog);

  // Event listener for the mobile version of the "Latest Changelog" button
  mobileLatestChangelogBtn.addEventListener("click", function (e) {
    e.preventDefault(); // Prevent default action if the button is a link
    displayLatestChangelog(); // Show the latest changelog
  });

  // Function to show the loading overlay
  function showLoadingOverlay() {
    loadingOverlay.classList.add("show");
  }

  // Function to hide the loading overlay
  function hideLoadingOverlay() {
    loadingOverlay.classList.remove("show");
  }

  showLoadingOverlay();
  mobileOpenModalBtn.addEventListener("click", function () {
    dateFilterModal.show();
  });

  // Open modal when clicking the "Select Date Range" button
  openModalBtn.addEventListener("click", function () {
    dateFilterModal.show();
  });

  // Function to create and open a date picker
  function openDatePicker(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);

    // Show the date input
    input.style.display = "block";
    button.style.display = "none";

    // Focus and click to open the date picker
    input.focus();
    input.click();

    // Add an event listener to hide the input when it loses focus
    input.addEventListener(
      "blur",
      function () {
        input.style.display = "none";
        button.style.display = "block";
      },
      { once: true }
    );
  }

  function updateButtonText(buttonId, date) {
    const btn = document.getElementById(buttonId);
    if (date) {
      const formattedDate = formatDateForButton(date);
      btn.querySelector("span").textContent = formattedDate;
    } else {
      btn.querySelector("span").textContent =
        buttonId === "startDateBtn" ? "Select Start Date" : "Select End Date";
    }
  }

  // Event listeners for the date buttons
  document.getElementById("startDateBtn").addEventListener("click", (e) => {
    e.preventDefault();
    openDatePicker("startDate", "startDateBtn");
  });

  document.getElementById("endDateBtn").addEventListener("click", (e) => {
    e.preventDefault();
    openDatePicker("endDate", "endDateBtn");
  });

  // Event listeners for the date inputs
  document.getElementById("startDate").addEventListener("change", function () {
    updateButtonText("startDateBtn", new Date(this.value));
    this.style.display = "none";
    document.getElementById("startDateBtn").style.display = "block";
  });

  document.getElementById("endDate").addEventListener("change", function () {
    updateButtonText("endDateBtn", new Date(this.value));
    this.style.display = "none";
    document.getElementById("endDateBtn").style.display = "block";
  });

  // Function to update button text
  function updateButtonText(buttonId, date) {
    const btn = document.getElementById(buttonId);
    if (date) {
      const formattedDate = formatDateForButton(date);
      btn.querySelector("span").textContent = formattedDate;
    } else {
      btn.querySelector("span").textContent =
        buttonId === "startDateBtn" ? "Select Start Date" : "Select End Date";
    }
  }

  // Function to format date for button display
  function formatDate(date) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  /**
   * Generates a formatted date range string based on provided start and end dates.
   *
   * @param {Date} startDate - The start date of the range
   * @param {Date} endDate - The end date of the range
   * @returns {string} A formatted string representing the date range.
   */
  function getDateRangeText(startDate, endDate) {
    // Helper function to format a date in the desired format (e.g., "Jan 1, 2023")
    const formatDate = (date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

    // Check different combinations of start and end dates
    if (startDate && endDate) {
      // Both start and end dates are provided
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    } else if (startDate) {
      // Only start date is provided
      return `From ${formatDate(startDate)}`;
    } else if (endDate) {
      // Only end date is provided
      return `Until ${formatDate(endDate)}`;
    }

    // Neither start nor end date is provided
    return "Invalid date range";
  }

  // Apply filter button click handler
  applyFilterBtn.addEventListener("click", function () {
    // Convert input values to Date objects, using UTC to avoid timezone issues
    // If no date is selected, the value will be null
    const startDate = startDateInput.value
      ? new Date(startDateInput.value + "T00:00:00Z")
      : null;
    const endDate = endDateInput.value
      ? new Date(endDateInput.value + "T00:00:00Z")
      : null;

    // Validate that at least one date is selected
    if (!startDate && !endDate) {
      alert("Please select at least one date before applying the filter.");
      return; // Exit the function if no dates are selected
    }

    // Filter changelogs based on the selected date range
    const filteredChangelogs = filterChangelogsByDate(startDate, endDate);

    // Determine the appropriate button text based on the selected date range
    let buttonText;
    if (startDate && endDate) {
      // Both start and end dates are selected
      buttonText = `${formatDateForButton(startDate)} - ${formatDateForButton(
        endDate
      )}`;
    } else if (startDate) {
      // Only start date is selected
      buttonText = `From ${formatDateForButton(startDate)}`;
    } else if (endDate) {
      // Only end date is selected
      buttonText = `Until ${formatDateForButton(endDate)}`;
    }

    // Store the current filter state for potential future use
    currentFilterState = buttonText;

    // Update the changelog dropdown with filtered results and new button text
    populateChangelogDropdown(filteredChangelogs, buttonText);

    // Open the changelog dropdown after a short delay
    // This delay ensures that the dropdown is populated before opening
    setTimeout(openChangelogDropdown, 100);

    // Hide the date filter modal after applying the filter
    dateFilterModal.hide();
  });

  // Clear filter button click handler
  clearFilterBtn.addEventListener("click", function () {
    startDateInput.value = "";
    endDateInput.value = "";
    updateButtonText("startDateBtn", null);
    updateButtonText("endDateBtn", null);
    currentFilterState = null; // Clear the filter state
    populateChangelogDropdown(changelogsData, "Select a Changelog");
    clearedFilterToast("The date filter has been cleared successfully!");
  });

  /// Function to populate the changelog dropdowns for mobile and desktop
  function populateChangelogDropdown(changelogs, buttonText) {
    const $mobileDropdown = $("#mobileChangelogList");
    const $desktopDropdown = $("#desktopChangelogList");
    const $mobileDropdownButton = $("#mobileChangelogDropdown");
    const $desktopDropdownButton = $("#desktopChangelogDropdown");

    $mobileDropdown.empty();
    $desktopDropdown.empty();

    if (changelogs.length === 0) {
      const noDataItem = `
      <li>
          <span class="dropdown-item-text">No data for selected dates</span>
      </li>
    `;
      $mobileDropdown.append(noDataItem);
      $desktopDropdown.append(noDataItem);
      $mobileDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>No data for selected dates'
      );
      $desktopDropdownButton.html(
        '<i class="bi bi-calendar-event me-2"></i>No data for selected dates'
      );
    } else {
      const sortedChangelogs = changelogs.sort((a, b) => b.id - a.id);

      sortedChangelogs.forEach((changelog) => {
        const fullTitle = changelog.title;
        const truncatedTitle = truncateText(fullTitle, 37);

        $mobileDropdown.append(`
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="?changelog=${changelog.id}" data-changelog-id="${changelog.id}" title="${fullTitle}">
                <span class="changelog-title">${truncatedTitle}</span>
            </a>
        </li>
      `);

        $desktopDropdown.append(`
        <li class="w-100">
            <a class="dropdown-item changelog-dropdown-item w-100" href="?changelog=${changelog.id}" data-changelog-id="${changelog.id}">
                <span class="changelog-title">${fullTitle}</span>
            </a>
        </li>
      `);
      });

      // Update the dropdown button text
      if (buttonText) {
        const iconHtml = '<i class="bi bi-calendar-event me-2"></i>';
        $mobileDropdownButton.html(`${iconHtml}${buttonText}`);
        $desktopDropdownButton.html(`${iconHtml}${buttonText}`);
      }

      // Add click event handlers for the dropdown items
      $(".changelog-dropdown-item").on("click", function (e) {
        e.preventDefault();
        const changelogId = $(this).data("changelog-id");

        // Update the URL without reloading the page
        const newUrl = `/changelogs/${changelogId}`;
        history.pushState({}, "", newUrl);

        // Find the selected changelog
        const selectedChangelog = changelogs.find((cl) => cl.id == changelogId);
        if (selectedChangelog) {
          displayChangelog(selectedChangelog);
          updateChangelogBreadcrumb(changelogId);
        }
      });
    }
  }

  // Function to preprocess Markdown text
  const preprocessMarkdown = (markdown) => {
    return markdown
      .replace(/^ - /gm, "\n- ") // Format top-level list items
      .replace(/^ - - /gm, "\n  - ") // Format nested list items (indent with two spaces)
      .replace(/^## /gm, "\n## ") // Format second-level headers
      .replace(/^### /gm, "\n### ") // Format third-level headers
      .replace(/\(audio\) /g, "\n(audio) ") // Format audio references
      .replace(/\(video\) /g, "\n(video) ") // Format video references
      .replace(/\(image\) /g, "\n(image) "); // Format image references
  };

  // Function to dismiss the keyboard on mobile
  function dismissKeyboard() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $exampleQueries = $("#exampleQueries");
  const $clearButton = $("#clearSearch");

  // Event listener for input in the search field
  $searchInput.on("input", function () {
    clearTimeout(debounceTimer); // Clear the previous timer
    const query = $(this).val().trim(); // Get the trimmed query
    $exampleQueries.addClass("d-none"); // Hide example queries

    $clearButton.toggle(query.length > 0);

    if (query.length > 0) {
      // Only search if there's actual input
      debounceTimer = setTimeout(() => {
        performSearch(); // Call performSearch after the delay
      }, 300); // 300 milliseconds delay
    } else {
      // Clear search results when input is empty
      clearSearch();
    }
  });

  // Unified clear search function
  function clearSearch() {
    $searchInput.val("").blur(); // Add blur() to remove focus
    $clearButton.hide();
    $searchResultsContainer.empty().hide();
    $exampleQueries.removeClass("d-none");
  }

  // Update clear button click handler
  $clearButton.on("click", clearSearch);

  // Update keyboard event handler
  $searchInput.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults(); // Focus on the search results
      dismissKeyboard(); // Dismiss the keyboard on mobile
    } else if (e.key === "Escape") {
      e.preventDefault();
      clearSearch();
    }
  });

  // Handle example query click
  $(".example-query").on("click", function (e) {
    e.preventDefault(); // Prevent default action
    const query = $(this).text(); // Get the example query text
    $searchInput.val(query); // Set the search input to the example query
    $clearButton.show();
    performSearch(); // Perform the search
    $exampleQueries.addClass("d-none"); // Hide example queries
  });

  // Show example queries when clicking on the search input
  $searchInput.on("focus", function () {
    if ($(this).val().trim() === "") {
      $exampleQueries.removeClass("d-none"); // Show example queries if input is empty
    }
  });

  // Hide example queries when clicking outside the search input or example queries container
  $(document).on("click", function (event) {
    // Check if the click event is not triggered on the example queries themselves
    if (
      !$exampleQueries.is(event.target) &&
      // Check if the click event is not triggered on any descendants of the example queries
      $exampleQueries.has(event.target).length === 0 &&
      // Check if the click event is not triggered on the search input
      !$(event.target).is($searchInput)
    ) {
      // If all conditions are true, hide the example queries
      $exampleQueries.addClass("d-none"); // Hide if clicked outside
    }
  });

  // Hide example queries on page load if search input is empty
  $(document).ready(function () {
    if ($searchInput.val().trim() === "") {
      $exampleQueries.addClass("d-none"); // Hide example queries if input is empty
    }
  });

  // Function to focus on the first search result
  function focusOnSearchResults() {
    if ($searchResultsContainer.children().length > 0) {
      $searchResultsContainer.children().first().focus(); // Focus on the first result
    }
  }

  // Initialize Bootstrap dropdowns
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  /**
   * Formats a date object for display on a button.
   *
   * @param {Date} date - The date to be formatted.
   * @returns {string} A formatted date string (e.g., "Jan 1, 2023").
   */
  function formatDateForButton(date) {
    const options = {
      year: "numeric", // Include the full year (e.g., 2023)
      month: "short", // Use abbreviated month name (e.g., Jan)
      day: "numeric", // Include the day of the month
      timeZone: "UTC", // Use UTC to avoid time zone discrepancies
    };
    return date.toLocaleDateString("en-US", options);
  }

  /**
   * Parses a date from a changelog title string.
   *
   * @param {string} title - The changelog title containing the date (e.g., "January 1st 2023").
   * @returns {Date|null} A Date object representing the parsed date, or null if parsing fails.
   */
  function parseDateFromTitle(title) {
    // Object mapping month names to their numeric representations (0-11)
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

    // Regular expression to match the date format in the title
    // Captures: (month name) (day) (year)
    // Ignores ordinal suffixes (st, nd, rd, th)
    const match = title.match(/(\w+)\s(\d+)(?:st|nd|rd|th)\s(\d{4})/);

    if (match) {
      // Destructure the matched groups
      const [, month, day, year] = match;

      // Create a new Date object using UTC to avoid timezone issues
      // months[month] converts the month name to its numeric value (0-11)
      return new Date(Date.UTC(parseInt(year), months[month], parseInt(day)));
    }

    // Return null if no valid date format is found in the title
    return null;
  }
  /**
   * Filters changelogs based on a given date range.
   *
   * @param {Date|null} startDate - The start date of the range (inclusive), or null if no start date.
   * @param {Date|null} endDate - The end date of the range (inclusive), or null if no end date.
   * @returns {Array} An array of changelog objects that fall within the specified date range.
   */
  function filterChangelogsByDate(startDate, endDate) {
    return changelogsData.filter((changelog) => {
      // Parse the date from the changelog title
      const changelogDate = parseDateFromTitle(changelog.title);

      // If the date couldn't be parsed, exclude this changelog
      if (!changelogDate) return false;

      // Apply different filtering logic based on the provided date range
      if (startDate && endDate) {
        // Both start and end dates provided: check if changelog is within range
        return changelogDate >= startDate && changelogDate <= endDate;
      } else if (startDate) {
        // Only start date provided: check if changelog is on or after start date
        return changelogDate >= startDate;
      } else if (endDate) {
        // Only end date provided: check if changelog is on or before end date
        return changelogDate <= endDate;
      }

      // If no dates are provided, include all changelogs
      return true;
    });
  }

  /**
   * Updates the text of the changelog dropdown buttons on both mobile and desktop views.
   *
   * @param {string} text - The text to display on the buttons. Use "default" for the default text.
   */
  function updateDropdownButton(text) {
    // Select the dropdown buttons for mobile and desktop views
    const $mobileDropdownButton = $("#mobileChangelogDropdown");
    const $desktopDropdownButton = $("#desktopChangelogDropdown");

    // Start with the calendar icon
    let buttonText = '<i class="bi bi-calendar-event me-2"></i>';

    // Set the button text based on the input
    if (text === "default") {
      buttonText += "Select a Changelog";
    } else {
      buttonText += text;
    }

    // Update both mobile and desktop buttons with the new text
    $mobileDropdownButton.html(buttonText);
    $desktopDropdownButton.html(buttonText);
  }

  // Initialize the dropdown instance for Bootstrap
  var dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle") // Select all dropdown toggle elements
  );
  var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl); // Create Bootstrap dropdown instances
  });

  // Define buttons for copying changelog
  const mobileCopyChangelogBtn = $("#mobileCopyChangelog");
  const desktopCopyChangelogBtn = $("#desktopCopyChangelog");

  function copyChangelog() {
    // Get the content of the changelog
    const changelogContent = $("#content").clone();

    // Check if there's actual changelog content to copy
    if (
      changelogContent.find("h1.display-4").length === 0 ||
      changelogContent.find(".api-error-container").length > 0
    ) {
      console.warn("No changelog data available to copy");
      alert("No changelog data available to copy!");
      return;
    }

    // Disable buttons to prevent spamming
    mobileCopyChangelogBtn.prop("disabled", true);
    desktopCopyChangelogBtn.prop("disabled", true);

    // Get the current page URL
    const currentPageUrl = window.location.href;

    // Process the content into an array
    let processedContent = [];

    // Add the title (h1) with '#' before it
    const title = changelogContent.find("h1.display-4").first().text().trim();
    processedContent.push("# " + title, "");

    // Process other elements in the changelog
    changelogContent.children().each(function () {
      const $elem = $(this);
      if ($elem.is("h2")) {
        // Add two newlines before each h2 to separate sections
        processedContent.push("", "## " + $elem.text().trim(), "");
      } else if ($elem.is("p.lead")) {
        // Handle italicized text in paragraphs
        let text = $elem.html();
        // Replace italic spans with underscore-wrapped text
        text = text.replace(
          /<span style="font-style: italic;[^"]*">([^<]+)<\/span>/g,
          "_$1_"
        );
        // Remove any other HTML tags and trim
        text = $("<div>").html(text).text().trim();
        processedContent.push(text);
      } else if ($elem.hasClass("d-flex")) {
        const $leadElem = $elem.find(".lead");
        // Handle italicized text in list items
        let text = $leadElem.html();
        // Replace italic spans with underscore-wrapped text
        text = text.replace(
          /<span style="font-style: italic;[^"]*">([^<]+)<\/span>/g,
          "_$1_"
        );
        // Remove any other HTML tags and trim
        text = $("<div>").html(text).text().trim();
        if ($elem.find(".bi-arrow-return-right").length > 0) {
          // Inline item indicator
          processedContent.push("  - " + text);
        } else if ($elem.find(".bi-arrow-right").length > 0) {
          // Regular item indicator
          processedContent.push("- " + text);
        } else {
          // Fallback for any items without hyphens
          processedContent.push("- " + text);
        }
      }
    });

    // Add custom message at the end with the current page URL
    processedContent.push(
      "",
      "",
      `This changelog was copied from ${currentPageUrl}`
    );

    // Join the processed content with newlines
    const cleanedContent = processedContent.join("\n");

    // Copy the cleaned content to the clipboard
    navigator.clipboard
      .writeText(cleanedContent)
      .then(() => {
        // Show the toast notification
        copiedChangelogToast("Changelog copied to clipboard!"); // Notify user of success
      })
      .catch((err) => {
        console.error("Failed to copy changelog: ", err); // Log error if copy fails
        alert("Failed to copy changelog. Please try again."); // Alert user of failure
      })
      .finally(() => {
        // Re-enable buttons after a delay
        setTimeout(() => {
          mobileCopyChangelogBtn.prop("disabled", false);
          desktopCopyChangelogBtn.prop("disabled", false); // Re-enable both buttons
        }, 5000); // 5 seconds delay
      });
  }

  // Attach the combined function to both copy changelog buttons
  mobileCopyChangelogBtn.on("click", copyChangelog);
  desktopCopyChangelogBtn.on("click", copyChangelog);

  // Function to open the changelog dropdown
  function openChangelogDropdown() {
    const $mobileDropdownEl = $("#mobileChangelogDropdown"); // Mobile dropdown reference
    const $desktopDropdownEl = $("#desktopChangelogDropdown"); // Desktop dropdown reference

    // Get or create Bootstrap dropdown instances
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

  // Function to show a toast notification after copying the changelog
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

  // Toast function for latest changelog
  function changelogToast(message) {
    toastr.info(message, "Changelog", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  // Function to highlight specific text in a string based on a query
  function highlightText(text, query) {
    // First escape HTML special characters
    let safeText = escapeHtml(text);

    // Check if this is a mention search
    const isMentionSearch = query.trim() === "has:mention";

    if (isMentionSearch) {
      // Only highlight mentions for has:mention searches
      safeText = safeText.replace(
        /@(\w+)/g,
        '<span class="highlight mention">@$1</span>'
      );
    } else {
      // For regular searches, highlight the search terms
      const words = query
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => escapeRegExp(word));

      const pattern = words.join("|");
      const regex = new RegExp(`(${pattern})`, "gi");
      safeText = safeText.replace(regex, '<span class="highlight">$1</span>');
    }

    return safeText;
  }

  // Helper function to escape special characters in regex
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Function to convert Markdown text to HTML
  const convertMarkdownToHtml = (markdown) => {
    // Handle inline italic formatting with color matching lead paragraphs
    markdown = markdown.replace(
      /\b_([^_]+)_\b/g,
      '<span style="font-style: italic; color: var(--content-paragraph);">$1</span>'
    );
    return markdown
      .split("\n") // Split the markdown into lines
      .map((line) => {
        line = line.trim(); // Trim whitespace from the line
        // Handle different Markdown syntaxes
        if (line.startsWith("# ")) {
          return `<h1 class="display-4 mb-4 text-custom-header border-bottom border-custom-header pb-2">${wrapMentions(
            line.substring(2)
          )}</h1>`; // Convert to H1
        } else if (line.startsWith("## ")) {
          return `<h2 class="display-5 mt-5 mb-3 text-custom-subheader">${wrapMentions(
            line.substring(3)
          )}</h2>`; // Convert to H2
        } else if (line.startsWith("- - ")) {
          return `<div class="d-flex mb-2 position-relative">
                          <i class="bi bi-arrow-return-right text-custom-icon position-absolute" style="left: 20px; font-size: 1.5rem;"></i>
                          <p class="lead mb-0 ms-4 ps-4">${wrapMentions(
                            line.substring(4)
                          )}</p>
                      </div>`; // Convert to styled list item
        } else if (line.startsWith("- ")) {
          return `<div class="d-flex mb-2 position-relative">
                          <i class="bi bi-arrow-right text-custom-icon position-absolute" style="left: 0; font-size: 1.5rem;"></i>
                          <p class="lead mb-0 ms-4 ps-1">${wrapMentions(
                            line.substring(2)
                          )}</p>
                      </div>`; // Convert to another styled list item
        } else if (
          line.startsWith("(audio)") ||
          line.startsWith("(video)") ||
          line.startsWith("(image)")
        ) {
          // Add class for media element and margin if it follows another media element
          const isMedia = true;
          const mediaElementClass = "media-element-spacing";

          if (line.startsWith("(video)")) {
            const videoUrl = line.substring(7).trim();
            return `<video class="${mediaElementClass}" controls preload="metadata" playsinline>
              <source src="${videoUrl}" type="video/webm">
              Your browser does not support the video tag.
            </video>`;
          } else if (line.startsWith("(image)")) {
            const imageUrl = line.substring(7).trim();
            return `<img src="${imageUrl}" alt="Image" class="${mediaElementClass}">`;
          } else if (line.startsWith("(audio)")) {
            const audioUrl = line.substring(7).trim();
            return `<audio class="${mediaElementClass}" controls>
              <source src="${audioUrl}" type="audio/mpeg">
            </audio>`;
          }
        } else {
          return `<p class="lead mb-2">${wrapMentions(line)}</p>`; // Default to paragraph
        }
      })
      .join(""); // Join all lines into a single HTML string
  };

  // Function to wrap mentions in a specific HTML structure
  const wrapMentions = (text) => {
    return text.replace(
      /@(\w+)/g,
      '<span class="mention fw-bold"><span class="at">@</span><span class="username">$1</span></span>' // Highlight mentions
    );
  };

  function processChangelogData(data) {
    changelogsData = data;

    if (Array.isArray(data) && data.length > 0) {
      populateChangelogDropdown(data);

      const pathSegments = window.location.pathname.split("/");
      let changelogId = pathSegments[pathSegments.length - 1];

      // Fetch latest changelog for fallback
      fetch("https://api3.jailbreakchangelogs.xyz/changelogs/latest", {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      })
        .then((response) => response.json())
        .then((latestData) => {
          // If invalid ID or not found, use latest
          if (!changelogId || !data.some((cl) => cl.id == changelogId)) {
            changelogId = latestData.id;
            // Update URL to match the latest changelog
            history.replaceState({}, "", `/changelogs/${changelogId}`);
          }

          const selectedChangelog = data.find((cl) => cl.id == changelogId);
          if (selectedChangelog) {
            // Update breadcrumb and display changelog
            document.querySelector('nav[aria-label="breadcrumb"]').innerHTML = `
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="/">Home</a></li>
                <li class="breadcrumb-item"><a href="/changelogs">Changelogs</a></li>
                <li class="breadcrumb-item active" aria-current="page">Changelog ${selectedChangelog.id}</li>
              </ol>
            `;

            displayChangelog(selectedChangelog);

            // Toggle button visibility based on if showing latest
            const isLatest = selectedChangelog.id === latestData.id;
            desktopLatestChangelogBtn.style.display = isLatest
              ? "none"
              : "block";
            mobileLatestChangelogBtn.style.display = isLatest
              ? "none"
              : "block";
          }
        })
        .catch((error) => {
          console.error("Error fetching latest changelog:", error);
          // Fallback to first changelog in list if latest fetch fails
          const selectedChangelog = data[0];
          displayChangelog(selectedChangelog);
        });
    }

    hideLoadingOverlay();
  }

  // Make the function globally accessible
  window.fetchDataFromAPI = function () {
    return $.getJSON(apiUrl)
      .done((data) => {
        processChangelogData(data);
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching changelogs:", errorThrown);

        const errorMessage = getErrorMessage(jqXHR.status);

        // Update main content
        $("#content").html(`
          <div class="api-error-container">
            <div class="api-error-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h2 class="api-error-title">Unable to Load Data</h2>
            <p class="api-error-message">
              We're having trouble loading the changelog information. This might be due to a temporary connection issue or server maintenance.
            </p>
            <button class="api-retry-button" id="retryButton">Try Again</button>
            <p class="api-error-details">
              If the problem persists, please refresh the page or try again later.<br>
              You can check our service status at <a href="https://status.jailbreakchangelogs.xyz/" target="_blank" class="status-link">status.jailbreakchangelogs.xyz</a>
            </p>
          </div>
        `);

        // Update sidebar image
        $("#sidebarImage").html(`
          <div class="api-error-container">
            <div class="api-error-icon">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h2 class="api-error-title">Unable to Load Changelog Image</h2>
          </div>
        `);

        // Add event listener after inserting the button
        $("#retryButton").on("click", () => {
          fetchDataFromAPI();
        });

        hideLoadingOverlay();
      });
  };

  // Initial data fetch
  fetchDataFromAPI();

  function getErrorMessage(statusCode) {
    switch (statusCode) {
      case 404:
        return "The requested information could not be found. Please check back later.";
      case 403:
        return "You don't have permission to access this information. Please check your credentials.";
      case 500:
        return "We're experiencing server issues. Our team has been notified and is working on it.";
      case 0:
        return "Unable to connect to the server. Please check your internet connection.";
      default:
        return "We're having trouble loading the changelog information. This might be due to a temporary connection issue or server maintenance.";
    }
  }

  // Function to perform a search based on user input
  function performSearch() {
    const query = $searchInput.val().trim().toLowerCase(); // Get and normalize the search query

    let searchResults = []; // Initialize an array for search results

    if (query.startsWith("has:")) {
      // Handle special query for media types and mentions
      const queryType = query.split(":")[1].trim(); // Extract the type of query

      searchResults = changelogsData.filter((changelog) => {
        switch (queryType) {
          case "audio":
            return changelog.sections.includes("(audio)"); // Check for audio sections
          case "video":
            return changelog.sections.includes("(video)"); // Check for video sections
          case "image":
            return changelog.sections.includes("(image)"); // Check for image sections
          case "mention":
            return /@\w+/.test(changelog.sections); // Check for @ mentions
          default:
            return false; // Default case, no match
        }
      });
    } else {
      // Regular search
      searchResults = changelogsData.filter((changelog) => {
        const titleMatch = changelog.title.toLowerCase().includes(query); // Check if title matches
        const contentMatch =
          changelog.sections &&
          typeof changelog.sections === "string" &&
          changelog.sections.toLowerCase().includes(query); // Check if content matches
        return titleMatch || contentMatch; // Return true if either matches
      });
    }

    displaySearchResults(searchResults, query); // Display the search results
  }

  // Function to display search results based on the user's query
  function displaySearchResults(results, query) {
    $searchResultsContainer.empty(); // Clear previous results

    if (results.length === 0) {
      $searchResultsContainer.html('<p class="p-3">No results found.</p>'); // Show message if no results
    } else {
      const $resultsList = $("<ul>").addClass("list-group list-group-flush"); // Create a list for results
      results.forEach((changelog) => {
        const $listItem = $("<li>").addClass(
          "list-group-item custom-search-item"
        ); // Create a list item

        let previewText = "";
        let highlightedPreview = "";

        if (query.startsWith("has:")) {
          // Handle special query for media types and mentions
          const mediaType = query.split(":")[1].trim();
          switch (mediaType) {
            case "audio":
            case "video":
            case "image":
              const mediaRegex = new RegExp(`\\(${mediaType}\\)`, "g"); // Create regex for media type
              const mediaCount = (changelog.sections.match(mediaRegex) || [])
                .length; // Count occurrences
              previewText = `${mediaCount} ${mediaType}${
                mediaCount !== 1 ? "s" : ""
              } found`; // Prepare preview text
              highlightedPreview = previewText; // No highlighting for media types
              break;
            case "mention":
              const mentionMatches = [
                ...new Set(changelog.sections.match(/@\w+/g) || []),
              ]; // Find unique mentions
              if (mentionMatches.length > 0) {
                previewText = `Mentions found: ${mentionMatches.join(", ")}`; // Prepare mention preview
                highlightedPreview = highlightText(previewText, query); // Highlight mentions
              } else {
                previewText = "No mentions found"; // No mentions case
                highlightedPreview = previewText;
              }
              break;
          }
        } else {
          // Regular search preview logic
          const cleanedSections = cleanContentForSearch(changelog.sections); // Clean content for search
          const queryPosition = cleanedSections.toLowerCase().indexOf(query); // Find query position
          if (queryPosition !== -1) {
            const startPos = Math.max(0, queryPosition - 50); // Determine start position for preview
            const endPos = Math.min(
              cleanedSections.length,
              queryPosition + query.length + 50
            ); // Determine end position
            previewText = cleanedSections.substring(startPos, endPos); // Create preview text
            if (startPos > 0) previewText = "..." + previewText; // Add ellipsis if needed
            if (endPos < cleanedSections.length) previewText += "..."; // Add ellipsis if needed
          } else {
            previewText =
              cleanedSections.substring(0, 100) +
              (cleanedSections.length > 100 ? "..." : ""); // Default preview
          }
          highlightedPreview = highlightText(previewText, query); // Highlight the preview text
        }

        const highlightedTitle = highlightText(changelog.title, query); // Highlight the changelog title

        // Create media labels based on available sections
        const hasAudio = changelog.sections.includes("(audio)");
        const hasVideo = changelog.sections.includes("(video)");
        const hasImage = changelog.sections.includes("(image)");
        const hasMention = /@\w+/.test(changelog.sections);
        const mediaLabels = [
          hasAudio ? '<span class="badge audio-badge me-1">Audio</span>' : "",
          hasVideo ? '<span class="badge video-badge me-1">Video</span>' : "",
          hasImage ? '<span class="badge image-badge me-1">Image</span>' : "",
          hasMention
            ? '<span class="badge mention-badge me-1">Mention</span>'
            : "",
        ].join("");

        $listItem.html(`
                <h5 class="mb-1">${highlightText(
                  changelog.title,
                  query
                )} ${mediaLabels}</h5>
                <p class="mb-1 small">${highlightText(previewText, query)}</p>
            `);

        // Click event to display the selected changelog
        $listItem.on("click", () => {
          // Update the URL without reloading the page
          const newUrl = `/changelogs/${changelog.id}`;
          history.pushState({}, "", newUrl);

          // Clear search when clicking a result
          clearSearch();

          displayChangelog(changelog); // Display the selected changelog
          updateChangelogBreadcrumb(changelog.id); // Update the breadcrumb
          dismissKeyboard(); // Dismiss the keyboard
        });

        $resultsList.append($listItem); // Append the list item to the results list
      });
      $searchResultsContainer.append($resultsList); // Append the results list to the container
    }
    $searchResultsContainer.show(); // Show the search results container
  }

  // Prevent body scrolling when interacting with the search results container
  $searchResultsContainer.on("wheel", function (event) {
    event.stopPropagation(); // Prevent the body from scrolling
  });

  $searchResultsContainer.on("touchstart touchmove", function (event) {
    event.stopPropagation(); // Prevent body scrolling on touch devices
  });

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }

  function displayRandomChangelog() {
    if (changelogsData && changelogsData.length > 0) {
      const randomIndex = Math.floor(Math.random() * changelogsData.length);
      const randomChangelog = changelogsData[randomIndex];

      // Update the URL without reloading the page
      const newUrl = `/changelogs/${randomChangelog.id}`;
      history.pushState({}, "", newUrl);

      displayChangelog(randomChangelog);
      updateChangelogBreadcrumb(randomChangelog.id); // Update the breadcrumb
      changelogToast("Showing a random changelog");
    } else {
      console.warn("No changelog data available to display a random entry.");
      changelogToast("No changelog data available.");
    }
  }

  const slowModeDelay = 4700;
  const buttons = ["#randomChangelogDesktopBtn", "#randomChangelogMobileBtn"]; // IDs of the buttons

  buttons.forEach(function (buttonSelector) {
    $(buttonSelector).on("click", function () {
      const $btn = $(this); // Cache the button element

      // Check if the button is disabled
      if ($btn.prop("disabled")) {
        return; // Exit if already in slow mode
      }

      displayRandomChangelog(); // Call the random changelog function

      // Disable the button and add a disabled class for styling
      $btn.prop("disabled", true).addClass("disabled");

      // Re-enable the button after the delay
      setTimeout(function () {
        $btn.prop("disabled", false).removeClass("disabled");
      }, slowModeDelay);
    });
  });

  // Function to clean content for search
  function cleanContentForSearch(content) {
    return content
      .replace(/- /g, " ") // Remove bullet points
      .replace(/- - /g, " ") // Remove double bullet points
      .replace(/### /g, " ") // Remove H3 headers
      .replace(/## /g, " ") // Remove H2 headers
      .replace(/\(audio\) /g, " ") // Remove audio tags
      .replace(/\(video\) /g, " ") // Remove video tags
      .replace(/\(image\) /g, " ") // Remove image tags
      .replace(/\(audio\)\s*\S+/g, "") // Remove audio file references
      .replace(/\(video\)\s*\S+/g, "") // Remove video file references
      .replace(/\(image\)\s*\S+/g, "") // Remove image file references
      .replace(/@(\w+)/g, "@$1") // Normalize mentions
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim(); // Trim leading and trailing whitespace
  }

  // Function to display the selected changelog
  function displayChangelog(changelog) {
    localStorage.setItem("selectedChangelogId", changelog.id);

    document.title = changelog.title;
    commentsList.innerHTML = ""; // Clear the comments list
    reloadcomments();

    if (titleElement) {
      titleElement.textContent = changelog.title;
    }

    // Update image element if available
    if (changelog.image_url) {
      imageElement.src = changelog.image_url;
      imageElement.alt = `Image for ${changelog.title}`;
      imageElement.style.display = "block"; // Show image
    } else {
      imageElement.src = ""; // Clear the source
      imageElement.alt = ""; // Clear alt text when no image is present
      imageElement.style.display = "none"; // Hide image
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

    // Use the stored filter state instead of checking the dropdown text
    if (currentFilterState) {
      updateDropdownButton(currentFilterState);
    } else {
      updateDropdownButton("default");
    }

    sectionsElement.innerHTML = contentHtml;
    const pathSegments = window.location.pathname.split("/");
    if (!isNaN(pathSegments[pathSegments.length - 1])) {
      pathSegments.pop();
    }
    const newPath = `${pathSegments.join("/")}/${changelog.id}`;
    window.history.pushState({}, "", newPath);

    const isLatestChangelog = changelog.id === changelogsData[0].id;

    if (isLatestChangelog) {
      desktopLatestChangelogBtn.style.display = "none";
      mobileLatestChangelogBtn.style.display = "none";
    } else {
      desktopLatestChangelogBtn.style.display = "";
      mobileLatestChangelogBtn.style.display = "";
    }
  }

  // Click event for changelog dropdown items
  $(document).on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault(); // Prevent default action
    const changelogId = $(this).data("changelog-id"); // Get changelog ID from data attribute
    const selectedChangelog = changelogsData.find((cl) => cl.id == changelogId); // Find selected changelog

    if (selectedChangelog) {
      displayChangelog(selectedChangelog); // Display the selected changelog

      // Close the dropdown after selection
      const dropdown = bootstrap.Dropdown.getInstance(
        this.closest(".dropdown-menu").previousElementSibling
      );
      if (dropdown) {
        dropdown.hide();
      }
    } else {
      console.error("Selected changelog not found!");
    }
  });

  const CommentForm = document.getElementById("comment-form");
  const commentinput = document.getElementById("commenter-text");
  const commentbutton = document.getElementById("submit-comment");
  const avatarUrl = sessionStorage.getItem("avatar");
  const userdata = JSON.parse(sessionStorage.getItem("user"));
  const commentsList = document.getElementById("comments-list");
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
    commentbutton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';

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
          "/changelogs/" + localStorage.getItem("selectedChangelogId")
        );
        window.location.href = "/login";
      });
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
  function throw_error(message) {
    toastr.error(message, "Error creating comment.", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }
  function addComment(comment) {
    if (!userdata) {
      throw_error("Please login to comment");
      return;
    }

    // Add check for null global_name and use username as fallback
    const authorName = userdata.global_name || userdata.username;
    if (!authorName) {
      throw_error("Unable to determine username. Please try logging in again.");
      return;
    }

    const listItem = document.createElement("li");
    listItem.classList.add(
      "list-group-item",
      "d-flex",
      "align-items-start",
      "mb-3"
    );

    const avatarElement = document.createElement("img");
    const defaultAvatarUrl =
      "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";
    avatarElement.src = avatarUrl.endsWith("null.png")
      ? defaultAvatarUrl
      : avatarUrl;
    avatarElement.classList.add("rounded-circle", "m-1");
    avatarElement.width = 32;
    avatarElement.id = `avatar-${userdata.id}`;
    avatarElement.height = 32;
    avatarElement.onerror = handleinvalidImage;

    const commentContainer = document.createElement("div");
    commentContainer.classList.add("ms-2", "comment-item", "w-100");
    commentContainer.style.backgroundColor = "#2E3944";
    commentContainer.style.padding = "12px";
    commentContainer.style.borderRadius = "8px";
    commentContainer.style.marginBottom = "8px";

    const headerContainer = document.createElement("div");
    headerContainer.classList.add("d-flex", "align-items-center", "flex-wrap");

    const usernameElement = document.createElement("a");
    usernameElement.href = `/users/${userdata.id}`; // Set the href to redirect to the user's page
    usernameElement.textContent = authorName; // Use fallback name
    usernameElement.style.fontWeight = "bold"; // Make the text bold
    usernameElement.style.color = "#748D92";
    usernameElement.style.textDecoration = "none";
    usernameElement.style.transition = "color 0.2s ease";
    usernameElement.style.fontWeight = "bold";

    usernameElement.addEventListener("mouseenter", () => {
      usernameElement.style.color = "#D3D9D4";
      usernameElement.style.textDecoration = "underline";
    });
    usernameElement.addEventListener("mouseleave", () => {
      usernameElement.style.color = "#748D92";
      usernameElement.style.textDecoration = "none";
    });

    const date = Math.floor(Date.now() / 1000);
    const formattedDate = formatDate(date); // Assuming comment.date contains the date string
    const dateElement = document.createElement("small");
    dateElement.textContent = ` · ${formattedDate}`; // Add the formatted date
    dateElement.classList.add("text-muted"); // Optional: Add a class for styling

    // Append elements to the comment container
    commentContainer.appendChild(usernameElement);
    commentContainer.appendChild(dateElement);

    const commentTextElement = document.createElement("p");
    commentTextElement.textContent = comment.value;
    commentTextElement.classList.add("mb-0", "comment-text");
    commentTextElement.style.color = "#D3D9D4";
    commentTextElement.style.marginTop = "4px";

    commentContainer.appendChild(headerContainer);
    commentContainer.appendChild(commentTextElement);

    // Append avatar and comment container to the list item
    listItem.appendChild(avatarElement);
    listItem.appendChild(commentContainer);

    // Prepend the new comment to the comments list

    const token = getCookie("token");

    // Post the comment to the server
    fetch("https://api3.jailbreakchangelogs.xyz/comments/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: authorName, // Use fallback name here too
        content: comment.value,
        item_id: localStorage.getItem("selectedChangelogId"),
        item_type: "changelog",
        user_id: userdata.id,
        owner: token,
      }),
    })
      .then(async (response) => {
        const data = await response.json(); // Parse JSON response

        if (response.status === 429) {
          const cooldown = data.remaining;
          throw_error("Wait " + cooldown + " seconds before commenting again.");
          return; // Stop further execution
        }

        if (response.ok) {
          commentsList.prepend(listItem);
          // im going to kill you
          // DO NOT MAKE UNNECESSARY REQUESTS
        } else {
          // Handle other non-429 errors (e.g., validation)
          throw_error(data.error || "An error occurred.");
        }
      })
      .catch((error) => {
        console.error(error);
        throw_error("An unexpected error occurred.");
      });
  }

  function formatDate(unixTimestamp) {
    // Check if timestamp is in seconds or milliseconds
    const isMilliseconds = unixTimestamp.toString().length > 10;
    const timestamp = isMilliseconds ? unixTimestamp : unixTimestamp * 1000;

    const date = new Date(timestamp);

    const options = {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    let formattedDate = date.toLocaleString("en-US", options);

    // Get the day of the month with the appropriate ordinal suffix
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    formattedDate = formattedDate.replace(day, `${day}${ordinalSuffix}`);

    return formattedDate;
  }

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th"; // Covers 11th to 19th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  let currentPage = 1; // Track the current page
  const commentsPerPage = 7; // Number of comments per page
  let comments = []; // Declare the comments array globally

  // Function to load comments
  function loadComments(commentsData) {
    if (!commentsData || !Array.isArray(commentsData)) {
      console.error("Invalid comments data received");
      return;
    }

    comments = commentsData; // Assign the fetched comments to the global variable
    commentsList.innerHTML = ""; // Clear existing comments
    comments.sort((a, b) => b.date - a.date);

    // Calculate the total number of pages
    const totalPages = Math.ceil(comments.length / commentsPerPage);

    // Get the comments for the current page
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const commentsToDisplay = comments.slice(startIndex, endIndex);

    const userDataPromises = commentsToDisplay.map((comment) => {
      if (!comment.user_id) {
        console.error("Comment missing user_id:", comment);
        return null;
      }

      return fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get?id=${comment.user_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
          credentials: "omit", // Changed from "include" to "omit"
          mode: "cors",
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((userdata) => ({ comment, userdata }))
        .catch((error) => {
          console.error("Error fetching user data:", error);
          return null;
        });
    });

    Promise.all(userDataPromises)
      .then((results) => {
        const validResults = results.filter((result) => result !== null);

        validResults.forEach(({ comment, userdata }) => {
          if (!userdata || !userdata.id) {
            console.error("Invalid user data:", userdata);
            return;
          }

          const avatarUrl = userdata.avatar
            ? `https://cdn.discordapp.com/avatars/${userdata.id}/${userdata.avatar}.png`
            : "assets/profile-pic-placeholder.png";

          const listItem = document.createElement("li");
          const commentel = document.getElementById(`comment-${comment.id}`); // Fixed: comment instead of comment
          if (commentel) {
            commentel.remove();
          }
          listItem.id = `comment-${comment.id}`; // Fixed: comment instead of comment
          listItem.classList.add(
            "list-group-item",
            "d-flex",
            "align-items-start",
            "mb-3"
          );

          const avatarElement = document.createElement("img");
          avatarElement.src = avatarUrl;
          avatarElement.classList.add("rounded-circle", "m-1");
          avatarElement.width = 32;
          avatarElement.height = 32;
          avatarElement.id = `avatar-${userdata.id}`; // Fixed: userData instead of userdata
          avatarElement.onerror = handleinvalidImage;

          const commentContainer = document.createElement("div");
          commentContainer.classList.add("ms-2", "comment-item", "w-100");
          commentContainer.style.cssText = `
        background-color: #2E3944;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 8px;
      `;

          // Create a container for the username and date
          const headerContainer = document.createElement("div");
          headerContainer.classList.add(
            "d-flex",
            "align-items-center",
            "flex-wrap"
          );

          const usernameElement = document.createElement("a");
          usernameElement.href = `/users/${userdata.id}`;
          usernameElement.textContent = userdata.global_name || "Unknown User";
          usernameElement.style.cssText = `
        font-weight: bold;
        color: #748D92;
        text-decoration: none;
        transition: color 0.2s ease;
      `;

          usernameElement.addEventListener("mouseenter", () => {
            usernameElement.style.color = "#D3D9D4";
            usernameElement.style.textDecoration = "underline";
          });

          usernameElement.addEventListener("mouseleave", () => {
            usernameElement.style.color = "#748D92";
            usernameElement.style.textDecoration = "none";
          });

          const dateContainer = document.createElement("div");
          dateContainer.classList.add("date-container");

          const dateElement = document.createElement("small");
          const formattedDate = formatDate(comment.date);

          if (comment.edited_at) {
            const formattedEditDate = formatDate(comment.edited_at);
            dateElement.textContent = ` · ${formattedEditDate} (Edited)`;
            dateElement.classList.add("text-muted");
          } else {
            dateElement.textContent = ` · ${formattedDate}`;
            dateElement.classList.add("text-muted");
          }
          dateContainer.appendChild(dateElement);

          headerContainer.appendChild(usernameElement);
          headerContainer.appendChild(dateContainer);

          const commentTextElement = document.createElement("p");
          commentTextElement.textContent = comment.content;
          commentTextElement.classList.add("mb-0", "comment-text");
          commentTextElement.style.cssText = `
        color: #D3D9D4;
        margin-top: 4px;
      `;

          // Add action buttons container
          const actionsContainer = document.createElement("div");
          actionsContainer.classList.add("comment-actions");

          // Inside the loadComments function, replace the actions container code with this:
          if (userdata.id === sessionStorage.getItem("userid")) {
            // Create dropdown toggle button
            const actionsToggle = document.createElement("button");
            actionsToggle.classList.add("comment-actions-toggle");
            actionsToggle.innerHTML =
              '<i class="bi bi-three-dots-vertical"></i>';

            // Create dropdown menu
            const actionsMenu = document.createElement("div");
            actionsMenu.classList.add("comment-actions-menu");
            actionsMenu.style.display = "none";

            // Create menu items
            const editButton = document.createElement("button");
            editButton.classList.add("comment-action-item");
            editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';
            editButton.setAttribute("data-comment-id", comment.id);

            editButton.addEventListener("click", (e) => {
              e.stopPropagation();
              const id = e.target.getAttribute("data-comment-id");
              const commentText = e.target
                .closest(".comment-item")
                .querySelector(".comment-text").textContent;

              // Set the current comment text in the modal
              document.getElementById("editCommentText").value = commentText;

              // Store the comment ID for later use
              document
                .getElementById("editCommentText")
                .setAttribute("data-comment-id", id);

              // Show the modal
              editCommentModal.show();

              // Hide the actions menu
              e.target.closest(".comment-actions-menu").style.display = "none";
            });

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("comment-action-item", "delete");
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
            deleteButton.setAttribute("data-comment-id", comment.id);
            deleteButton.addEventListener("click", (e) => {
              const id = e.target.getAttribute("data-comment-id");

              // make an http request to delete the comment
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
                  if (!response.ok) {
                    throw new Error("Failed to delete comment");
                  }
                  return response.json();
                })
                .then((data) => {
                  const commentElement = document.getElementById(
                    `comment-${id}`
                  );
                  if (commentElement) {
                    commentElement.remove();
                  }
                  // Add toast notification for successful deletion
                  toastr.success("Comment deleted successfully!", "Success", {
                    positionClass: "toast-bottom-right",
                    timeOut: 3000,
                    closeButton: true,
                    progressBar: true,
                  });
                })
                .catch((error) => {
                  console.error("Error deleting comment:", error);
                  // Add toast notification for deletion error
                  toastr.error("Failed to delete comment", "Error", {
                    positionClass: "toast-bottom-right",
                    timeOut: 3000,
                    closeButton: true,
                    progressBar: true,
                  });
                });
            });

            // Add items to menu
            actionsMenu.appendChild(editButton);
            actionsMenu.appendChild(deleteButton);

            // Add toggle and menu to container
            actionsContainer.appendChild(actionsToggle);
            actionsContainer.appendChild(actionsMenu);

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

          commentContainer.appendChild(headerContainer);
          commentContainer.appendChild(commentTextElement);
          commentContainer.appendChild(actionsContainer);
          listItem.appendChild(avatarElement);
          listItem.appendChild(commentContainer);
          commentsList.appendChild(listItem);
        });

        // Render pagination controls
        renderPaginationControls(totalPages);
      })
      .catch((error) => {
        console.error("Error processing comments:", error);
      });
  }

  // Function to render modern pagination controls
  function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationControls");
    paginationContainer.innerHTML = ""; // Clear existing controls

    // Add container styling to keep everything in a single row
    paginationContainer.classList.add(
      "d-flex",
      "align-items-center",
      "justify-content-center",
      "gap-2",
      "flex-nowrap"
    );

    // Create left arrow button
    const leftArrow = document.createElement("button");
    leftArrow.innerHTML = `<i class="bi bi-chevron-left"></i>`; // Use an icon (Bootstrap Icons)
    leftArrow.classList.add(
      "btn",
      "btn-primary",
      "rounded-circle",
      "pagination-btn"
    );
    leftArrow.disabled = currentPage === 1; // Disable if on the first page
    leftArrow.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadComments(comments); // Reload comments for the current page
        renderPaginationControls(totalPages); // Update pagination controls
      }
    });
    paginationContainer.appendChild(leftArrow);

    // Page number input with label
    const pageInputGroup = document.createElement("div");
    pageInputGroup.classList.add("input-group", "mx-1", "align-items-center");

    const pageLabel = document.createElement("span");
    pageLabel.textContent = `Page `;
    pageLabel.classList.add("text-muted", "fw-semibold");
    pageInputGroup.appendChild(pageLabel);

    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = currentPage;
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.classList.add("form-control", "text-center", "pagination-input");
    pageInput.style.maxWidth = "70px"; // Compact size for mobile
    pageInput.addEventListener("change", () => {
      const newPage = parseInt(pageInput.value, 10);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadComments(comments); // Reload comments for the new page
        renderPaginationControls(totalPages); // Update pagination controls
      } else {
        pageInput.value = currentPage; // Reset input if invalid
      }
    });
    pageInputGroup.appendChild(pageInput);

    const totalPageSpan = document.createElement("span");
    totalPageSpan.textContent = ` / ${totalPages}`;
    totalPageSpan.classList.add("text-muted");
    pageInputGroup.appendChild(totalPageSpan);

    paginationContainer.appendChild(pageInputGroup);

    // Create right arrow button
    const rightArrow = document.createElement("button");
    rightArrow.innerHTML = `<i class="bi bi-chevron-right"></i>`; // Use an icon
    rightArrow.classList.add(
      "btn",
      "btn-primary",
      "rounded-circle",
      "pagination-btn"
    );
    rightArrow.disabled = currentPage === totalPages; // Disable if on the last page
    rightArrow.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadComments(comments); // Reload comments for the current page
        renderPaginationControls(totalPages); // Update pagination controls
      }
    });
    paginationContainer.appendChild(rightArrow);
  }

  function reloadcomments() {
    CommentHeader.textContent =
      "Comments For Changelog " + localStorage.getItem("selectedChangelogId");
    const paginationControls = document.getElementById("paginationControls");

    // Reset pagination controls visibility and styling
    paginationControls.style.cssText =
      "display: none !important; visibility: hidden;";

    fetch(
      "https://api3.jailbreakchangelogs.xyz/comments/get?type=changelog&id=" +
        localStorage.getItem("selectedChangelogId"),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
        credentials: "omit",
        mode: "cors",
      }
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Unexpected response status:", response.status);
          return null;
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return;

        if (
          (data.message && data.message === "No comments found") ||
          (Array.isArray(data) && data.length === 0)
        ) {
          commentsList.innerHTML = `
            <div class="text-muted text-center d-flex flex-column align-items-center justify-content-center p-4">
              <i class="bi bi-chat-square mb-2 fs-4"></i>
              <p class="mb-0">No comments yet. Be the first to comment!</p>
            </div>
          `;
          // Keep pagination controls hidden
          return;
        }

        // Only show pagination if we have comments
        paginationControls.style.cssText =
          "display: flex !important; visibility: visible;";

        if (Array.isArray(data)) {
          loadComments(data);
        } else if (data.comments && Array.isArray(data.comments)) {
          loadComments(data.comments);
        } else {
          console.error("Unexpected response format:", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching comments:", error);
      });
  }

  CommentForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const comment = document.getElementById("commenter-text");
    addComment(comment);
    comment.value = ""; // Clear the comment input field
  });

  // Initialize Bootstrap dropdowns
  bootstrap.Dropdown.getOrCreateInstance($("#mobileChangelogDropdown")[0]);
  bootstrap.Dropdown.getOrCreateInstance($("#desktopChangelogDropdown")[0]);

  // Add this modal HTML structure to your document body using jQuery
  $("body").append(`
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
`);

  // Initialize the modal
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
      const newContent = document
        .getElementById("editCommentText")
        .value.trim();
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
              if (!response.ok) throw new Error("Failed to edit comment");
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

            // Reload comments with a slight delay to ensure server has processed the edit
            setTimeout(() => {
              reloadcomments();
            }, 100);
          })
          .catch((error) => {
            console.error("Error editing comment:", error);
            toastr.error("Failed to update comment", "Error", {
              positionClass: "toast-bottom-right",
              timeOut: 3000,
              closeButton: true,
              progressBar: true,
            });
          });
      }
    });

  // State machine for error handling
  const ErrorState = {
    SUCCESS: "success",
    NOT_FOUND: "not_found",
    FORBIDDEN: "forbidden",
    SERVER_ERROR: "server_error",
    NETWORK_ERROR: "network_error",
  };

  function handleError(status) {
    switch (status) {
      case 404:
        return {
          state: ErrorState.NOT_FOUND,
          message: "The requested information could not be found.",
        };
      case 403:
        return {
          state: ErrorState.FORBIDDEN,
          message: "You don't have permission to access this information.",
        };
      case 500:
        return {
          state: ErrorState.SERVER_ERROR,
          message: "We're experiencing server issues.",
        };
      case 0:
        return {
          state: ErrorState.NETWORK_ERROR,
          message: "Unable to connect to the server.",
        };
      default:
        return {
          state: ErrorState.SERVER_ERROR,
          message: "An unknown error occurred.",
        };
    }
  }

  // Switch statement for handling media types
  function handleMediaType(type, changelog) {
    switch (type) {
      case "audio":
        return changelog.sections.includes("(audio)");
      case "video":
        return changelog.sections.includes("(video)");
      case "image":
        return changelog.sections.includes("(image)");
      case "mention":
        return /@\w+/.test(changelog.sections);
      default:
        return false;
    }
  }

  // Switch statement for comment actions
  function handleCommentAction(action, commentId) {
    switch (action) {
      case "edit":
        return editComment(commentId);
      case "delete":
        return deleteComment(commentId);
      case "report":
        return reportComment(commentId);
      default:
        console.warn("Unknown comment action:", action);
        return false;
    }
  }

  // Switch statement for markdown parsing
  function parseMarkdownElement(line) {
    switch (true) {
      case line.startsWith("# "):
        return createH1Element(line.substring(2));
      case line.startsWith("## "):
        return createH2Element(line.substring(3));
      case line.startsWith("- - "):
        return createNestedListItem(line.substring(4));
      case line.startsWith("- "):
        return createListItem(line.substring(2));
      case line.startsWith("(audio)"):
        return createAudioElement(line.substring(7));
      case line.startsWith("(video)"):
        return createVideoElement(line.substring(7));
      case line.startsWith("(image)"):
        return createImageElement(line.substring(7));
      default:
        return createParagraph(line);
    }
  }

  // Add state tracking for pagination
  const PaginationState = {
    currentPage: 1,
    itemsPerPage: 7,
    totalPages: 0,
  };

  // Switch statement for pagination actions
  function handlePaginationAction(action) {
    switch (action) {
      case "next":
        if (PaginationState.currentPage < PaginationState.totalPages) {
          PaginationState.currentPage++;
          return true;
        }
        return false;
      case "prev":
        if (PaginationState.currentPage > 1) {
          PaginationState.currentPage--;
          return true;
        }
        return false;
      case "first":
        PaginationState.currentPage = 1;
        return true;
      case "last":
        PaginationState.currentPage = PaginationState.totalPages;
        return true;
      default:
        return false;
    }
  }
});

function handleinvalidImage() {
  setTimeout(() => {
    const userId = this.id.replace("avatar-", "");
    const username = this.closest("li").querySelector("a").textContent;
    this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;
  }, 0);
}
