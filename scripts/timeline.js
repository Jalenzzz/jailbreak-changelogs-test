$(document).ready(function () {
  const loadingOverlay = document.getElementById("loading-overlay");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const $timeline = $("#timeline");
  const $footer = $("footer");
  let isLoading = false;
  let lastScrollTop = 0;
  let footerTimeout;

  if ($timeline.length === 0) {
    console.error("Timeline element not found");
    return;
  }

  function toggleLoadingOverlay(show) {
    loadingOverlay.classList.toggle("show", show);
  }

  function createTimelineEntry(changelog, index) {
    if (!changelog || !changelog.title) return ""; // Skip empty entries
    const sideClass = index % 2 === 0 ? "left" : "right";
    return `
      <div class="timeline-entry-container ${sideClass}" style="display: none;">
        <div class="timeline-entry">
          <h5 class="text-custom-header">${changelog.title}</h5>
          <img src="${changelog.image_url}" alt="${changelog.title}" class="img-fluid">
          <p>${changelog.sections}</p>
        </div>
        <div class="timeline-line"></div>
      </div>
    `;
  }

  function loadAllEntries() {
    if (isLoading) return;
    isLoading = true;

    toggleLoadingOverlay(true);
    $footer.addClass("hide");

    $.getJSON(apiUrl)
      .done((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const validData = data.filter((entry) => entry && entry.title);
          if (validData.length > 0) {
            const entriesHtml = validData.map(createTimelineEntry).join("");
            $timeline.html(entriesHtml);
            fadeInEntries(0, validData.length);
          } else {
            $timeline.append("<p>No changelogs found.</p>");
          }
        } else {
          $timeline.append("<p>No changelogs found.</p>");
        }
      })
      .fail((jqXHR, textStatus, errorThrown) => {
        console.error("Error fetching changelogs:", errorThrown);
        $timeline.append(
          "<p>Error loading changelogs. Please try again later.</p>"
        );
      })
      .always(() => {
        isLoading = false;
        toggleLoadingOverlay(false);
        setTimeout(() => $footer.removeClass("hide"), 300);
      });
  }

  function fadeInEntries(start, end) {
    $timeline
      .find(".timeline-entry-container")
      .slice(start, end)
      .each((index, element) => {
        $(element)
          .delay(index * 100)
          .fadeIn(500);
      });
  }

  loadAllEntries();

  $(window).on("scroll", function () {
    const st = $(this).scrollTop();
    if (st > lastScrollTop) {
      $footer.addClass("hide");
      clearTimeout(footerTimeout);
    } else {
      clearTimeout(footerTimeout);
      footerTimeout = setTimeout(() => $footer.removeClass("hide"), 500);
    }
    lastScrollTop = st;
  });
});
