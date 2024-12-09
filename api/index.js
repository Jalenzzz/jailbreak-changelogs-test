const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 5500; // Set the port
const fs = require("fs");

// Serve your static HTML, CSS, and JS files
const DATA_SOURCE_URL =
  "https://badimo.nyc3.digitaloceanspaces.com/trade/frequency/snapshot/month/latest.json";

app.use(express.static(path.join(__dirname, "../")));
app.use(
  cors({
    origin: "https://jailbreakchangelogs.xyz",
  })
);
// Serve the changelogs.html file
app.get("/trade-data", async (req, res) => {
  try {
    // Fetch data from the external API
    const response = await fetch(DATA_SOURCE_URL, {
      timeout: 5000, // Set a 5-second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Send the fetched data as JSON response
    res.json(data);
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching data:", error.message);

    // Send an appropriate error response
    if (error.name === "AbortError") {
      res.status(504).json({ error: "Request timeout" });
    } else if (error.message.includes("HTTP error!")) {
      res.status(502).json({ error: "External API error" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Set the directory for your EJS files

app.get("/changelogs", (req, res) => {
  // Redirect to a default changelog if no ID is provided in the URL
  const defaultChangelogId = 346; // Set your default changelog ID here
  res.redirect(`/changelogs/${defaultChangelogId}`);
});

app.get("/owner/check/:user", (req, res) => {
  const user = req.params.user; // Get the user ID from the URL parameter
  const owners = ['1019539798383398946', '659865209741246514']
  const isOwner = owners.includes(user);
  if (!isOwner) {
    res.status(403).json({ error: "Unauthorized" });
  }  
  res.status(200).json({ isOwner });
});

app.get("/changelogs/:changelog", async (req, res) => {
  let changelogId = req.params.changelog || 1;
  console.log(`Fetching changelog with ID: ${changelogId}`);
  const apiUrl = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });
    if (response.status === 404) {
      res.render("changelogs", {
        title: "Changelog not found",
        image_url:
          "https://cdn.jailbreakchangelogs.xyz/images/changelogs/347.webp",
        logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Changelogs_Logo.webp',
        logoAlt: 'Changelogs Page Logo',
        changelogId
      });
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const { title, image_url } = data;

    res.render("changelogs", { 
      title, 
      image_url,
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Changelogs_Logo.webp',
      logoAlt: 'Changelogs Page Logo',
      changelogId
    });
  } catch (error) {
    console.error("Error fetching changelog data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons", (req, res) => {
  // Redirect to a default changelog if no ID is provided in the URL
  const defaultChangelogId = 23; // Set your default changelog ID here
  res.redirect(`/seasons/${defaultChangelogId}`);
});

app.get("/seasons/:season", async (req, res) => {
  let seasonId = req.params.season || 1; // Default to season 1 if no ID is provided
  const apiUrl = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`;
  const rewardsUrl = `https://api.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });
    if (!response.ok) {
      return res.render("seasons", {
        season: "???",
        title: "Season not found",
        image_url: "https://cdn.jailbreakchangelogs.xyz/images/changelogs/347.webp",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webp",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId
      });
    }
    const rewardsResponse = await fetch(rewardsUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });
    if (!rewardsResponse.ok) {
      return res.render("seasons", {
        season: "???",
        title: "Season not found",
        image_url: "https://cdn.jailbreakchangelogs.xyz/images/changelogs/347.webp",
        logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webpg",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId
      });
    }

    const data = await response.json();
    const rewardsData = await rewardsResponse.json();

    // Find the Level 10 reward
    const level_10_reward = rewardsData.find(
      (reward) => reward.requirement === "Level 10"
    );

    // Ensure we got the reward before accessing properties
    let image_url = "https://cdn.jailbreakchangelogs.xyz/images/changelogs/347.webp";
    if (level_10_reward) {
      image_url = level_10_reward.link;
    }

    const { season, title } = data; // Adjust the destructured properties based on the API response structure
    res.render("seasons", { 
      season, 
      title,
      image_url,
      logoUrl: "https://cdn.jailbreakchangelogs.xyz/logos/Seasons_Logo.webp",
      logoAlt: "Jailbreak Seasons Logo",
      seasonId
    }); // Render the seasons page with the retrieved data
  } catch (error) {
    console.error("Error fetching season data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/trading', (req, res) => {
  res.render('trading', {
    title: 'Trading / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Trade_Ads_Logo.webp',
    logoAlt: 'Trading Page Logo',
  });
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', {
    title: 'Admin Control Panel / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Admin_Logo.webp', //TODO: Add logo for trading page
    logoAlt: 'Admin Page Logo',
  });
});

app.get('/bot', (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `https://cdn.jailbreakchangelogs.xyz/backgrounds/background${randomNumber}.webp`;
  res.render('bot', {
    title: 'Discord Bot / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Discord_Bot_Logo.webp',
    logoAlt: 'Bot Page Logo',
    image
  });
});

app.get('/values', (req, res) => {
  res.render('values', {
    title: 'Values / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Items_Logo.webp',
    logoAlt: 'Values Page Logo'
  });
});

app.get("/item/:item", async (req, res) => {
  let itemName = decodeURIComponent(req.params.item)
    .trim()
    .replace(/\s+/g, ' ');
  const apiUrl = `https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(itemName)}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (response.status === 404) {
      res.render("item", {
        title: "Item not found",
        logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Items_Logo.webp',
        logoAlt: 'Item Page Logo',
        itemName,
        error: true
      });
      return;
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const item = await response.json();
    
    // Construct the image URL
    const image_type = item.type.toLowerCase();
    const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp`;

    res.render("item", {
      title: `${item.name} / Changelogs`,
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Items_Logo.webp',
      logoAlt: 'Item Page Logo',
      itemName,
      item,
      image_url // Pass the image URL to the template
    });
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get('/faq', (req, res) => {
  res.render('faq', {
    title: 'User FAQ',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/FAQ_Logo.webp',
    logoAlt: 'FAQ Page Logo'
  });
});

app.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Privacy Policy / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Privacy_Logo.webp',
    logoAlt: 'Privacy Policy Page Logo'
  });
});

app.get('/tos', (req, res) => {
  res.render('tos', {
    title: 'Terms Of Service / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Tos_Logo.webp',
    logoAlt: 'TOS Page Logo'
  });
});

app.get("/botinvite", (req, res) => {
  res.render("botinvite");
});

app.get('/keys', (req, res) => {
  res.render('keys', {
    title: 'API / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Api_Logo.webp',
    logoAlt: 'API Page Logo'
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/users/:user/followers", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params
  const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz",
    }
  });

  if (!response.ok) {
    return res.status(response.status).send('Error fetching user settings');
  }
  let showfollowers = true;

  const data = await response.json();
  if (data.hide_followers === 0) {
    showfollowers = false;
  } else {
    showfollowers = true;
  }
    if (!user) {
    return res.render("usersearch", {
      title: 'User Search / Changelogs',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'Users Page Logo'
    });
  }
  
  fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz", // Add your origin
    },
  })
  .then((response) => response.json())
  .then((userData) => {
    if (userData.error) {
      const defaultUserID = "659865209741246514"; // Set your default changelog ID here
      return res.redirect(`/users/${defaultUserID}/followers`);
    }
    // Render the page only after the data is fetched
    const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    res.render("followers", { 
      userData, 
      avatar,
      showfollowers,
      title: 'Followers / Changelogs',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'Users Page Logo'
    });
  })
  .catch((error) => {
    console.error("Error fetching user data:", error);

    // Optionally render an error page or send a response with an error message
    res.status(500).send("Error fetching user data");
  });
});


app.get("/users/:user/following", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params
  const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz",
    }
  });

  if (!response.ok) {
    return res.status(response.status).send('Error fetching user settings');
  }
  let showfollowing = true;

  const data = await response.json();
  if (data.hide_following === 0) {
    showfollowing = false;
  } else {
    showfollowing = true;
  }
  if (!user) {
    return res.render("usersearch", {
      title: 'User Search / Changelogs',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'Users Page Logo'
    });
  }
  
  fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz", // Add your origin
    },
  })
  .then((response) => response.json())
  .then((userData) => {
    if (userData.error) {
      const defaultUserID = "659865209741246514"; // Set your default changelog ID here
      return res.redirect(`/users/${defaultUserID}/following`);
    }
    // Render the page only after the data is fetched
    const avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
    res.render("following", { 
      userData, 
      avatar,
      showfollowing,
      title: 'Users - Following',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'Users Page Logo'
    });
  })
  .catch((error) => {
    console.error("Error fetching user data:", error);

    // Optionally render an error page or send a response with an error message
    res.status(500).send("Error fetching user data");
  });
});
// Sitemap route
app.get('/sitemap.xml', (req, res) => {
  // Set the Content-Type header to application/xml
  res.header('Content-Type', 'application/xml');

  const sitemap = `
 <?xml version="1.0" encoding="utf-8"?><!--Generated by Screaming Frog SEO Spider 21.1-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jailbreakchangelogs.xyz/</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/timeline</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/bot</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://status.jailbreakchangelogs.xyz/</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/tradetracker</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/tos</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/faq</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/keys</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/privacy</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/users</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://docs.jailbreakchangelogs.xyz/</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://status.jailbreakchangelogs.xyz/incidents</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/seasons/23</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/botinvite</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://jailbreakchangelogs.xyz/changelogs/347</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://status.jailbreakchangelogs.xyz/incident/471508</loc>
    <lastmod>2024-12-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  // Send the sitemap
  res.send(sitemap);
});


// Render search page
app.get('/users', (req, res) => {
  res.render('usersearch',  { 
    title: 'Users / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
    logoAlt: 'Users Page Logo'
  });
});

const getAvatar = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' }); // Use HEAD to just check the existence of the resource
    if (response.status === 404) {
      // If 404, return placeholder
      return '/assets/profile-pic-placeholder.png';
    }
    // If avatar exists, return the original avatar URL
    return url;
  } catch (error) {
    // In case of error, return the placeholder
    console.error('Error fetching avatar:', error);
    return '/assets/profile-pic-placeholder.png';
  }
};

// Route to render a specific user profile
app.get("/users/:user", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params

  if (!user) {
    return res.render("usersearch", {
      title: 'Users / Changelogs',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'Users Page Logo'
    });
  }

  // Fetch user settings and user data concurrently
  const settingsFetch = fetch(`https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz",
    },
  }).then((response) => response.json());

  const userFetch = fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${user}`, {
    headers: {
      "Content-Type": "application/json",
      Origin: "https://jailbreakchangelogs.xyz",
    },
  }).then((response) => response.json());

  try {
    // Use Promise.all to wait for both fetch requests to resolve
    const [settings1, userData] = await Promise.all([settingsFetch, userFetch]);

    const booleanSettings = {
      ...settings1,
      profile_public: Boolean(settings1.profile_public),
      show_recent_comments: Boolean(settings1.show_recent_comments),
      hide_following: Boolean(settings1.hide_following),
      hide_followers: Boolean(settings1.hide_followers),
      banner_discord: Boolean(settings1.banner_discord)
    };

    const settings = {
      ...booleanSettings,
      profile_public: !booleanSettings.profile_public,
      show_recent_comments: !booleanSettings.show_recent_comments,
      hide_following: !booleanSettings.hide_following,
      hide_followers: !booleanSettings.hide_followers,
      banner_discord: !booleanSettings.banner_discord
    };

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}`);
    }

    // Assemble avatar URL
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    // Check if avatar exists and get the correct URL (or placeholder)
    const avatar = await getAvatar(avatarUrl);

    // Render the page only after both data sets are fetched
    res.render("users", { 
      userData, 
      avatar, 
      settings,
      title: 'User Profile / Changelogs',
      logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Users_Logo.webp',
      logoAlt: 'User Profile Logo'
    });
  } catch (error) {
    console.error("Error fetching user data or settings:", error);
    res.status(500).send("Error fetching user data");
  }
});

app.get('/timeline', (req, res) => {
  res.render('timeline', {
    title: 'Timeline / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Timeline_Logo.webp',
    logoAlt: 'Timeline Page Logo'
  });
});

app.get('/tradetracker', (req, res) => {
  res.render('tradetracker', {
    title: 'Trade Tracker / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Trade_Tracker_Logo.webp',
    logoAlt: 'Trade Tracker Page Logo'
  });
});

app.get('/', (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `https://cdn.jailbreakchangelogs.xyz/backgrounds/background${randomNumber}.webp`;
  res.render('index', {
    title: 'Home / Changelogs',
    logoUrl: 'https://cdn.jailbreakchangelogs.xyz/logos/Homepage_Logo.webp',
    logoAlt: 'Home Page Logo',
    image
  });
});


app.get("/api", (req, res) => {
  res.redirect("/");
});

app.get("/faq.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../FAQ.png"));
});

app.get("/api.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../API.png"));
});

app.get("/icon-512.png", (req, res) => {
  res.sendFile(path.join(__dirname, "../icon-512.png"));
});

// Handle unknown routes by serving index.html
app.get("*", (req, res) => {
  res.redirect("/");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// Export the app for Vercel's serverless functions
module.exports = app;