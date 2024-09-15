$(document).ready(function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const titleElement = document.getElementById("changelogTitle");
  const $searchResultsContainer = $("#search-results");
  const $navbarCollapse = $("#navbarContent");
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
  function closeNavbar() {
    if ($navbarCollapse.hasClass("show")) {
      $navbarCollapse.collapse("hide");
    }
  }

  const $searchInput = $('input[aria-label="Search changelogs"]');
  const $exampleQueries = $("#exampleQueries");
  const $clearButton = $("#clear-search-button");

  $searchInput.on("input", performSearch);
  $searchInput.on("input", function () {
    const query = $(this).val().trim();

    // Hide example queries as soon as typing starts
    if (query.length > 0) {
      $exampleQueries.addClass("d-none");
    } else {
      $exampleQueries.removeClass("d-none");
    }

    performSearch();
    toggleClearButton();
  });

  $clearButton.on("click", function () {
    $searchInput.val("");
    $exampleQueries.removeClass("d-none");
    clearSearch();
  });
  // Hide example queries when the search input loses focus
  $searchInput.on("blur", function () {
    setTimeout(() => $exampleQueries.addClass("d-none"));
  });
  // Show example queries when the search input is focused
  $searchInput.on("focus", function () {
    if ($(this).val().trim().length === 0) {
      $exampleQueries.removeClass("d-none");
    }
  });
  // Populate search input with example query when clicked
  $(".example-query").on("click", function (e) {
    e.preventDefault();
    const query = $(this).text();
    $searchInput.val(query).focus();
    performSearch();
    $exampleQueries.addClass("d-none");
  });

  // Handle Enter key press or mobile 'Go' button
  $searchInput.on("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission behavior
      focusOnSearchResults();
      dismissKeyboard(); // Dismiss the keyboard on mobile
    }
  });
  function focusOnSearchResults() {
    if ($searchResultsContainer.children().length > 0) {
      $searchResultsContainer.children().first().focus();
    }
  }

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
  const copyChangelogBtn = $("#copyChangelog");

  copyChangelogBtn.on("click", function () {
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
        // Change button icon to indicate success
        $(this).html('<i class="bi bi-check-lg me-2"></i>Copied!');

        // Revert button icon after 2 seconds
        setTimeout(() => {
          $(this).html('<i class="bi bi-clipboard me-2"></i>Copy Changelog');
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy changelog. Please try again.");
      });
  });

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

  function openChangelogDropdown() {
    const $dropdownEl = $("#changelogDropdown");
    const dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(
      $dropdownEl[0]
    );

    // Force the dropdown to show
    bootstrap.Dropdown.getOrCreateInstance($dropdownEl[0]).show();

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
    new bootstrap.Dropdown($dropdownButton[0]);
  }

  // Modify the event listener for the dropdown button
  $(document).on("click", "#changelogDropdown", function (e) {
    const buttonText = $(this).text().trim();
    if (buttonText === "No data for selected dates") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  $(document).on("click", function (event) {
    if (!$(event.target).closest(".d-flex.position-relative").length) {
      $exampleQueries.addClass("d-none");
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
    $exampleQueries.addClass("d-none");
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
      // Regular search (unchanged)
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
    $("html, body").animate({ scrollTop: 0 }, 100);
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
