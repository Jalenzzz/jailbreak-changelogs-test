document.addEventListener("DOMContentLoaded", () => {
  const loadingOverlay = document.getElementById("loading-overlay");
  const timelineContainer = document.getElementById("timeline");
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";

  function showLoadingOverlay() {
    loadingOverlay.classList.add("show");
  }

  function hideLoadingOverlay() {
    loadingOverlay.classList.remove("show");
  }

  function createTimeline(changelogs) {
    timelineContainer.innerHTML = "";

    changelogs.forEach((changelog, index) => {
      const timelineItem = document.createElement("div");
      timelineItem.classList.add(
        "timeline-item",
        index % 2 === 0 ? "left" : "right"
      );

      timelineItem.innerHTML = `
        <div class="timeline-content">
          <div class="timeline-icon">
            <i class="bi bi-calendar-event"></i>
          </div>
          <h3 class="timeline-title">${changelog.title}</h3>
         
          <button class="btn btn-primary btn-sm timeline-view-btn">View Details</button>
        </div>
      `;

      timelineContainer.appendChild(timelineItem);

      const viewBtn = timelineItem.querySelector(".timeline-view-btn");
      viewBtn.addEventListener("click", () => displayChangelog(changelog));
    });
  }

  function displayChangelog(changelog) {
    window.location.href = `index.html?id=${changelog.id}`;
  }

  showLoadingOverlay();

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data received:", data);
      if (Array.isArray(data) && data.length > 0) {
        createTimeline(data);
      } else {
        console.error("No changelogs found.");
      }
      hideLoadingOverlay();
    })
    .catch((error) => {
      console.error("Error fetching changelogs:", error);
      timelineContainer.innerHTML =
        "<p class='text-center text-danger'>Error loading changelogs. Please try again later.</p>";
      hideLoadingOverlay();
    });

  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;
  const iconElement = themeToggle.querySelector("i");

  function setTheme(theme) {
    htmlElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      iconElement.classList.replace("bi-moon-stars-fill", "bi-sun-fill");
    } else {
      iconElement.classList.replace("bi-sun-fill", "bi-moon-stars-fill");
    }
  }

  const savedTheme = localStorage.getItem("theme");
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (prefersDarkMode) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  themeToggle.addEventListener("click", function () {
    const currentTheme = htmlElement.getAttribute("data-bs-theme");
    setTheme(currentTheme === "light" ? "dark" : "light");
  });
});
