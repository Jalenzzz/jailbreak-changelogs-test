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

app.use((req, res, next) => {
  res.locals.req = req;
  next();
});

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

app.get("/changelogs", async (req, res) => {
  try {
    const latestResponse = await fetch(
      "https://api3.jailbreakchangelogs.xyz/changelogs/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!latestResponse.ok) {
      throw new Error("Failed to fetch latest changelog ID");
    }

    const latestData = await latestResponse.json();
    const latestId = latestData.id;

    res.redirect(`/changelogs/${latestId}`);
  } catch (error) {
    console.error("Error fetching latest changelog:", error);
    // Fallback to a default ID if the API request fails
    res.redirect("/changelogs/348");
  }
});

app.get("/owner/check/:user", (req, res) => {
  const user = req.params.user; // Get the user ID from the URL parameter
  const owners = ["1019539798383398946", "659865209741246514"];
  const isOwner = owners.includes(user);
  if (!isOwner) {
    res.status(403).json({ error: "Unauthorized" });
  }
  res.status(200).json({ isOwner });
});

app.get("/changelogs/:changelog", async (req, res) => {
  let changelogId = req.params.changelog || 1;
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/changelogs/get?id=${changelogId}`;

  try {
    const latestResponse = await fetch(
      "https://api3.jailbreakchangelogs.xyz/changelogs/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!latestResponse.ok) {
      throw new Error("Failed to fetch latest changelog");
    }

    const latestData = await latestResponse.json();
    const latestId = latestData.id;

    // Fetch the requested changelog
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (response.status === 404) {
      return res.redirect(`/changelogs/${latestId}`);
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const { title, image_url } = data;

    // Include additional SEO metadata
    const responseData = {
      title,
      image_url,
      logoUrl: "/assets/logos/Changelogs_Logo.webp",
      logoAlt: "Changelogs Page Logo",
      changelogId,
      embed_color: 0x134d64,
      isLatest: changelogId === latestId,
      canonicalUrl: "https://testing.jailbreakchangelogs.xyz/changelogs",
      metaDescription: `View detailed changelog information for Jailbreak update ${title}. Track new features, vehicles, and game improvements.`,
    };

    // Handle different response types
    if (
      req.headers["user-agent"]?.includes("DiscordBot") ||
      req.query.format === "discord"
    ) {
      res.json(responseData);
    } else {
      res.render("changelogs", responseData);
    }
  } catch (error) {
    console.error("Error fetching changelog data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons", async (req, res) => {
  try {
    const latestResponse = await fetch(
      "https://api3.jailbreakchangelogs.xyz/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!latestResponse.ok) {
      throw new Error("Failed to fetch latest season");
    }

    const latestData = await latestResponse.json();
    res.redirect(`/seasons/${latestData.season}`);
  } catch (error) {
    console.error("Error fetching latest season:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons/:season", async (req, res) => {
  let seasonId = req.params.season;
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`;
  const rewardsUrl = `https://api3.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`;

  try {
    // First fetch the latest season for fallback
    const latestResponse = await fetch(
      "https://api3.jailbreakchangelogs.xyz/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    if (!latestResponse.ok) {
      throw new Error("Failed to fetch latest season");
    }

    const latestData = await latestResponse.json();

    // Then fetch the requested season
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (response.status === 404 || !response.ok) {
      // Redirect to latest season if requested one doesn't exist
      return res.redirect(`/seasons/${latestData.season}`);
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
        image_url:
          "https://cdn.jailbreakchangelogs.xyz/images/changelogs/346.webp",
        logoUrl: "/assets/logos/Seasons_Logo.webpg",
        logoAlt: "Jailbreak Seasons Logo",
        seasonId,
      });
    }

    const data = await response.json();
    const rewardsData = await rewardsResponse.json();

    // Find the Level 10 reward
    const level_10_reward = rewardsData.find(
      (reward) => reward.requirement === "Level 10"
    );

    // Ensure we got the reward before accessing properties
    let image_url =
      "https://cdn.jailbreakchangelogs.xyz/images/changelogs/346.webp";
    if (level_10_reward) {
      image_url = level_10_reward.link;
    }

    const { season, title } = data; // Adjust the destructured properties based on the API response structure
    res.render("seasons", {
      season,
      title,
      image_url,
      logoUrl: "/assets/logos/Seasons_Logo.webp",
      logoAlt: "Jailbreak Seasons Logo",
      seasonId,
    }); // Render the seasons page with the retrieved data
  } catch (error) {
    console.error("Error fetching season data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/trading", (req, res) => {
  res.render("trading", {
    title: "Trading / Changelogs",
    logoUrl: "/assets/logos/Trade_Ads_Logo.webp",
    logoAlt: "Trading Page Logo",
  });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Admin Control Panel / Changelogs",
    logoUrl: "/assets/logos/Admin_Logo.webp", //TODO: Add logo for trading page
    logoAlt: "Admin Page Logo",
  });
});

app.get("/bot", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("bot", {
    title: "Discord Bot / Changelogs",
    logoUrl: "/assets/logos/Discord_Bot_Logo.webp",
    logoAlt: "Bot Page Logo",
    image,
  });
});

app.get("/values", (req, res) => {
  const validSorts = [
    "vehicles",
    "spoilers",
    "rims",
    "body-colors",
    "textures",
    "tire-stickers",
    "drifts",
  ];
  const sortParam = req.query.sort?.toLowerCase();

  res.render("values", {
    title: "Values / Changelogs",
    logoUrl: "/assets/logos/Values_Logo.webp",
    logoAlt: "Values Page Logo",
    initialSort: validSorts.includes(sortParam) ? sortParam : null,
  });
});

app.get("/item/:type/:item", async (req, res) => {
  let itemName = decodeURIComponent(req.params.item)
    .trim()
    .replace(/\s+/g, " ");
  let itemType = decodeURIComponent(req.params.type).trim().toLowerCase();
  const formattedUrlType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  const apiUrl = `https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
    itemName
  )}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    const item = await response.json();

    // If item not found, return the error page but with itemName in the title
    if (response.status === 404 || item.error) {
      return res.render("item", {
        title: `${itemName} / Changelogs`, // Keep the item name in title
        logoUrl: "/assets/logos/Values_Logo.webp",
        logoAlt: "Item Page Logo",
        itemName,
        itemType,
        formattedUrlType,
        error: true,
        image_url: "/assets/logos/Values_Logo.webp",
        item: {
          name: itemName, // Include the name in the item object
          image: "/assets/logos/Values_Logo.webp",
        },
      });
    }

    // For successful responses, generate image URL based on item type from API
    let image_url;
    if (item.type === "Drift") {
      // Special case for drifts - use thumbnails
      image_url = `/assets/items/drifts/thumbnails/${item.name}.webp`;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      // Special case for HyperShift - use video
      image_url = `/assets/items/hyperchromes/HyperShift.webm`;
    } else {
      // For all other items, use type directly from API response
      const pluralType = `${item.type.toLowerCase()}s`;
      image_url = `/assets/items/${pluralType}/${item.name}.webp`;
    }
    item.image = image_url;

    res.render("item", {
      title: `${item.name} / Changelogs`,
      logoUrl: "/assets/logos/Values_Logo.webp",
      logoAlt: "Item Page Logo",
      itemName: item.name,
      itemType,
      formattedUrlType,
      item,
      image_url,
    });
  } catch (error) {
    console.error("Error fetching item data:", error);
    // Even in case of error, keep the item name in the title
    res.render("item", {
      title: `${itemName} / Changelogs`,
      logoUrl: "/assets/logos/Values_Logo.webp",
      logoAlt: "Item Page Logo",
      itemName,
      itemType,
      formattedUrlType,
      error: true,
      errorMessage: "Internal Server Error",
      image_url: "/assets/logos/Values_Logo.webp",
      item: {
        name: itemName,
        image: "/assets/logos/Values_Logo.webp",
      },
    });
  }
});

// Keep the old route for backward compatibility
app.get("/item/:item", async (req, res) => {
  // Redirect to the new route structure
  const itemName = decodeURIComponent(req.params.item);

  // First, fetch the item to get its type
  const apiUrl = `https://api.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
    itemName
  )}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const item = await response.json();
    // Redirect to the new URL structure
    res.redirect(`/item/${item.type.toLowerCase()}/${itemName}`);
  } catch (error) {
    console.error("Error fetching item data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/faq", (req, res) => {
  res.render("faq", {
    title: "User FAQ",
    logoUrl: "/assets/logos/FAQ_Logo.webp",
    logoAlt: "FAQ Page Logo",
  });
});

app.get("/privacy", (req, res) => {
  res.render("privacy", {
    title: "Privacy Policy / Changelogs",
    logoUrl: "/assets/logos/Privacy_Logo.webp",
    logoAlt: "Privacy Policy Page Logo",
  });
});

app.get("/tos", (req, res) => {
  res.render("tos", {
    title: "Terms Of Service / Changelogs",
    logoUrl: "/assets/logos/Tos_Logo.webp",
    logoAlt: "TOS Page Logo",
  });
});

app.get("/botinvite", (req, res) => {
  res.render("botinvite");
});

app.get("/keys", (req, res) => {
  res.render("keys", {
    title: "API / Changelogs",
    logoUrl: "/assets/logos/Api_Logo.webp",
    logoAlt: "API Page Logo",
  });
});

app.get("/roblox", (req, res) => {
  res.render("roblox");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/users/:user/followers", async (req, res) => {
  const user = req.params.user;
  const response = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  );

  if (!response.ok) {
    return res.status(response.status).send("Error fetching user settings");
  }

  const data = await response.json();
  const showfollowers = data.hide_followers !== 0;
  const isPrivate = !showfollowers; // Add this line to define isPrivate

  if (!showfollowers) {
    // User has hidden their followers
    const userData = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    ).then((res) => res.json());

    return res.render("followers", {
      userData,
      avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
      showfollowers,
      isPrivate: true, // Ensure isPrivate is set for private profiles
      path: req.path, // Add this line
      title: "Followers / Changelogs",
      logoUrl: "/assets/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
      user: req.user || null, // Add this line - passes the logged in user or null if not logged in
    });
  }

  const userData = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((res) => res.json());

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
    isPrivate: false, // Add this line to define isPrivate for public profiles
    path: req.path, // Add this line
    title: "Followers / Changelogs",
    logoUrl: "/assets/logos/Users_Logo.webp",
    logoAlt: "Users Page Logo",
    user: req.user || null, // Add this line - passes the logged in user or null if not logged in
  });
});

app.get("/users/:user/following", async (req, res) => {
  const user = req.params.user;
  const response = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  );

  if (!response.ok) {
    return res.status(response.status).send("Error fetching user settings");
  }

  const data = await response.json();
  const showfollowing = data.hide_following !== 0;
  const isPrivate = !showfollowing; // Add this line to define isPrivate

  if (!showfollowing) {
    // User has hidden who they follow
    const userData = await fetch(
      `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    ).then((res) => res.json());

    return res.render("following", {
      userData,
      avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
      showfollowing,
      isPrivate: true, // Ensure isPrivate is set for private profiles
      path: req.path, // Add this line
      title: "Following / Changelogs",
      logoUrl: "/assets/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
      user: req.user || null, // Add this line - passes the logged in user or null if not logged in
    });
  }

  const userData = await fetch(
    `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((res) => res.json());

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
    isPrivate: false, // Add this line to define isPrivate for public profiles
    path: req.path, // Add this line
    title: "Users - Following",
    logoUrl: "/assets/logos/Users_Logo.webp",
    logoAlt: "Users Page Logo",
    user: req.user || null, // Add this line - passes the logged in user or null if not logged in
  });
});
// Sitemap route
app.get("/sitemap.xml", (req, res) => {
  // Set the Content-Type header to application/xml
  res.header("Content-Type", "application/xml");

  const sitemap = `
  <?xml version="1.0" encoding="utf-8"?><!--Generated by Screaming Frog SEO Spider 21.3-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/faq</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/tos</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/trading</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/privacy</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/keys</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/tradetracker</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/values</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/bot</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/timeline</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/users</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/botinvite</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://testing.jailbreakchangelogs.xyz/seasons/24</loc>
    <lastmod>2025-01-01</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

  // Send the sitemap
  res.send(sitemap);
});

// Render search page
app.get("/users", (req, res) => {
  res.render("usersearch", {
    title: "Users / Changelogs",
    logoUrl: "/assets/logos/Users_Logo.webp",
    logoAlt: "Users Page Logo",
  });
});

const getAvatar = async (url, username) => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (response.status === 404) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;
    }
    return url;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;
  }
};

// Route to render a specific user profile
app.get("/users/:user", async (req, res) => {
  const user = req.params.user; // Get the user from the URL params

  if (!user) {
    return res.render("usersearch", {
      title: "Users / Changelogs",
      logoUrl: "/assets/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
    });
  }

  // Fetch user settings and user data concurrently
  const settingsFetch = fetch(
    `https://api.jailbreakchangelogs.xyz/users/settings?user=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((response) => response.json());

  const userFetch = fetch(
    `https://api.jailbreakchangelogs.xyz/users/get?id=${user}`,
    {
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    }
  ).then((response) => response.json());

  try {
    // Use Promise.all to wait for both fetch requests to resolve
    const [settings1, userData] = await Promise.all([settingsFetch, userFetch]);

    const booleanSettings = {
      ...settings1,
      profile_public: Boolean(settings1.profile_public),
      show_recent_comments: Boolean(settings1.show_recent_comments),
      hide_following: Boolean(settings1.hide_following),
      hide_followers: Boolean(settings1.hide_followers),
      banner_discord: Boolean(settings1.banner_discord),
    };

    const settings = {
      ...booleanSettings,
      profile_public: !booleanSettings.profile_public,
      show_recent_comments: !booleanSettings.show_recent_comments,
      hide_following: !booleanSettings.hide_following,
      hide_followers: !booleanSettings.hide_followers,
      banner_discord: !booleanSettings.banner_discord,
    };

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}`);
    }

    // Assemble avatar URL
    const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;

    // Check if avatar exists and get the correct URL (or placeholder)
    const avatar = await getAvatar(avatarUrl, userData.username);

    // Render the page only after both data sets are fetched
    res.render("users", {
      userData,
      avatar,
      settings,
      title: "User Profile / Changelogs",
      logoUrl: "/assets/logos/Users_Logo.webp",
      logoAlt: "User Profile Logo",
    });
  } catch (error) {
    console.error("Error fetching user data or settings:", error);
    res.status(500).send("Error fetching user data");
  }
});

app.get("/timeline", (req, res) => {
  res.render("timeline", {
    title: "Timeline / Changelogs",
    logoUrl: "/assets/logos/Timeline_Logo.webp",
    logoAlt: "Timeline Page Logo",
  });
});

app.get("/tradetracker", (req, res) => {
  res.render("tradetracker", {
    title: "Trade Tracker / Changelogs",
    logoUrl: "/assets/logos/Trade_Tracker_Logo.webp",
    logoAlt: "Trade Tracker Page Logo",
  });
});

app.get("/", (req, res) => {
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("index", {
    title: "Home / Changelogs",
    logoUrl: "/assets/logos/Homepage_Logo.webp",
    logoAlt: "Home Page Logo",
    image,
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
