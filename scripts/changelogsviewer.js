document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "https://api.jailbreakchangelogs.xyz/get_changelogs";
  const imageElement = document.getElementById("sidebarImage");
  const sectionsElement = document.getElementById("content");
  const pageSelect = document.getElementById("pageSelect");

  console.log("Fetching list of changelogs from:", apiUrl);

  // Fetch the list of changelogs
  fetch(apiUrl)
    .then((response) => {
      console.log("Received response for changelogs list:", response);
      return response.json();
    })
    .then((data) => {
      console.log("Changelogs data:", data);

      if (Array.isArray(data) && data.length > 0) {
        // Populate the pageSelect dropdown with changelog titles
        data.forEach((changelog) => {
          const option = document.createElement("option");
          option.value = changelog.id;
          option.textContent = changelog.title;
          pageSelect.appendChild(option);
        });

        // Automatically display the first changelog
        displayChangelog(data[0].id);
      } else {
        console.error("No changelogs found.");
      }
    })
    .catch((error) => console.error("Error fetching changelogs:", error));

  document.addEventListener("DOMContentLoaded", function () {
    const sidebarImage = document.getElementById("sidebarImage");

    // Assuming you have the image URL stored somewhere
    const imageUrl = "https://cdn.jailbreakchangelogs.xyz/media/badimo.png"; // Replace with your actual image URL

    // Set the data-src attribute
    sidebarImage.setAttribute("data-src", imageUrl);

    // Move data-src to src to load the image
    if (sidebarImage && sidebarImage.getAttribute("data-src")) {
      sidebarImage.src = sidebarImage.getAttribute("data-src");
      sidebarImage.onload = () => {
        console.log("Image loaded successfully:", sidebarImage.src);
      };
      sidebarImage.onerror = () => {
        console.error("Failed to load image:", sidebarImage.src);
      };
    }
  });

  // Function to fetch and display a specific changelog by ID
  function displayChangelog(id) {
    const changelogUrl = `https://api.jailbreakchangelogs.xyz/get_changelog?id=${id}`;

    console.log("Fetching changelog details from:", changelogUrl);

    fetch(changelogUrl)
      .then((response) => {
        console.log("Received response for changelog details:", response);
        return response.json();
      })
      .then((data) => {
        console.log("Changelog details:", data);

        if (data.image_url) {
          console.log("Loading image from:", data.image_url);
          fetch(data.image_url)
            .then((response) => response.blob())
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              imageElement.src = url;
            })
            .catch((error) => console.error("Error loading image:", error));
        } else {
          console.warn("No image URL found for changelog.");
          imageElement.alt = "No image available";
        }

        if (data.sections) {
          console.log("Setting sections content.");
          sectionsElement.innerHTML = `<p>${data.sections.replace(
            /\n/g,
            "<br>"
          )}</p>`;
        } else {
          console.warn("No sections available for changelog.");
          sectionsElement.innerHTML = "<p>No sections available.</p>";
        }
      })
      .catch((error) =>
        console.error("Error fetching changelog details:", error)
      );
  }

  // Event listener for page selection change
  pageSelect.addEventListener("change", function () {
    const selectedId = this.value;
    console.log("Changelog selected:", selectedId);
    displayChangelog(selectedId);
  });
});
