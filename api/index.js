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
    const latestId = 351;
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
    const latestSeason = 24;
    res.redirect(`/seasons/${latestSeason}`);
  } catch (error) {
    console.error("Error fetching latest season:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/seasons/:season", async (req, res) => {
  let seasonId = req.params.season;
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/seasons/get?season=${seasonId}`;
  const rewardsUrl = `https://api3.jailbreakchangelogs.xyz/rewards/get?season=${seasonId}`;
  const latestSeason = 24;
  try {
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
      return res.redirect(`/seasons/${latestSeason}`);
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
        image_url: "/assets/images/changelogs/346.webp",
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
    let image_url = "/assets/images/changelogs/346.webp";
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
  const randomNumber = Math.floor(Math.random() * 12) + 1;
  const image = `/assets/backgrounds/background${randomNumber}.webp`;
  res.render("bot", {
    title: "Discord Bot / Changelogs",
    logoUrl: "/assets/logos/Discord_Bot_Logo.webp",
    logoAlt: "Bot Page Logo",
    image,
  });
});

app.get("/values", async (req, res) => {
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

  try {
    // Fetch items data
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    );

    const allItems = await response.json();

    res.render("values", {
      title: "Values / Changelogs",
      logoUrl: "/assets/logos/Values_Logo.webp",
      logoAlt: "Values Page Logo",
      initialSort: validSorts.includes(sortParam) ? sortParam : null,
      allItems, // Pass items data to template
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.render("values", {
      title: "Values / Changelogs",
      logoUrl: "/assets/logos/Values_Logo.webp",
      logoAlt: "Values Page Logo",
      initialSort: validSorts.includes(sortParam) ? sortParam : null,
      allItems: [], // Pass empty array if fetch fails
    });
  }
});

app.get("/values/calculator", (req, res) => {
  res.render("calculator", {
    title: "Value Calculator / Changelogs",
    logoUrl: "/assets/logos/Values_Logo.webp",
    logoAlt: "Values Calculator Logo",
  });
});

app.get("/servers", (req, res) => {
  res.render("servers", {
    title: "Private Servers / Changelogs",
    logoUrl: "/assets/logos/Private_Servers_Logo.webp",
    logoAlt: "Servers Logo",
  });
});

app.get("/item/:type/:item", async (req, res) => {
  let itemName = decodeURIComponent(req.params.item)
    .trim()
    .replace(/\s+/g, " ");
  let itemType = decodeURIComponent(req.params.type).trim().toLowerCase();
  const formattedUrlType = itemType.charAt(0).toUpperCase() + itemType.slice(1);

  const apiUrl = `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
    itemName
  )}&type=${itemType}`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://jailbreakchangelogs.xyz",
      },
    });

    const item = await response.json();

    // Enhanced SEO data
    const seoData = {
      pageTitle: `${itemName} - Jailbreak ${formattedUrlType} Value & Details | JailbreakChangelogs`,
      metaDescription:
        item.description && item.description !== "N/A"
          ? item.description
          : `Get the latest value and details for ${itemName} in Roblox Jailbreak. View current price, trading history, rarity status, and market trends.`,
      canonicalUrl: `https://testing.jailbreakchangelogs.xyz/item/${formattedUrlType.toLowerCase()}/${encodeURIComponent(
        itemName
      )}`,
      breadcrumbs: [
        { name: "Home", url: "/" },
        { name: "Values", url: "/values" },
        {
          name: `${formattedUrlType}s`,
          url: `/values?sort=${formattedUrlType.toLowerCase()}s`,
        },
        {
          name: itemName,
          url: `/item/${formattedUrlType.toLowerCase()}/${encodeURIComponent(
            itemName
          )}`,
        },
      ],
    };

    // If item not found, return error page with SEO data
    if (response.status === 404 || item.error) {
      return res.render("item", {
        ...seoData,
        title: seoData.pageTitle,
        logoUrl: "/assets/logos/Values_Logo.webp",
        logoAlt: "Item Page Logo",
        itemName,
        itemType,
        formattedUrlType,
        error: true,
        image_url: "/assets/logos/Values_Logo.webp",
        item: {
          name: itemName,
          image: "/assets/logos/Values_Logo.webp",
        },
      });
    }

    // Generate image URL for the item
    let image_url;
    if (item.type === "Drift") {
      image_url = `/assets/items/drifts/thumbnails/${item.name}.webp`;
    } else if (item.type === "HyperChrome" && item.name === "HyperShift") {
      image_url = `/assets/items/hyperchromes/HyperShift.webm`;
    } else {
      const pluralType = `${item.type.toLowerCase()}s`;
      image_url = `/assets/items/${pluralType}/${item.name}.webp`;
    }
    item.image = image_url;

    // Render page with SEO data
    res.render("item", {
      ...seoData,
      title: seoData.pageTitle,
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
    res.render("item", {
      title: `${itemName} - Error | JailbreakChangelogs`,
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
  const itemName = decodeURIComponent(req.params.item);

  // First, fetch the item without type to maintain backward compatibility
  const apiUrl = `https://api3.jailbreakchangelogs.xyz/items/get?name=${encodeURIComponent(
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
    // Redirect to the new URL structure with the correct type
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
    `https://api3.jailbreakchangelogs.xyz/users/settings?user=${user}`,
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
  const showfollowers = data.hide_followers === 0;
  const isPrivate = !showfollowers; // Add this line to define isPrivate

  if (!showfollowers) {
    // User has hidden their followers
    const userData = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`,
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
    `https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`,
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
    `https://api3.jailbreakchangelogs.xyz/users/settings?user=${user}`,
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
  const showfollowing = data.hide_following === 0;
  const isPrivate = !showfollowing; // Add this line to define isPrivate

  if (!showfollowing) {
    // User has hidden who they follow
    const userData = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`,
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
    `https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`,
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

// Render search page
app.get("/users", (req, res) => {
  res.render("usersearch", {
    title: "Users / Changelogs",
    logoUrl: "/assets/logos/Users_Logo.webp",
    logoAlt: "Users Page Logo",
  });
});

// Route to render a specific user profile
const getAvatar = async (userId, avatarHash, username) => {
  const defaultAvatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;

  if (!avatarHash) {
    return defaultAvatarUrl;
  }

  const fetchAvatar = async (format) => {
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  };

  try {
    const gifUrl = await fetchAvatar("gif");
    if (gifUrl) {
      return gifUrl;
    }

    const pngUrl = await fetchAvatar("png");
    if (pngUrl) {
      return pngUrl;
    }

    return defaultAvatarUrl;
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return defaultAvatarUrl;
  }
};

// Then update the users route to use the new getAvatar function
app.get("/users/:user", async (req, res) => {
  const user = req.params.user;

  if (!user) {
    return res.render("usersearch", {
      title: "Users / Changelogs",
      logoUrl: "/assets/logos/Users_Logo.webp",
      logoAlt: "Users Page Logo",
    });
  }

  try {
    // Fetch user settings and user data concurrently
    const [settings, userData] = await Promise.all([
      fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${user}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      ).then((response) => response.json()),
      fetch(`https://api3.jailbreakchangelogs.xyz/users/get?id=${user}`, {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }).then((response) => response.json()),
    ]);

    if (userData.error) {
      const defaultUserID = "659865209741246514";
      return res.redirect(`/users/${defaultUserID}`);
    }

    // Get avatar with the new function
    const avatar = await getAvatar(
      userData.id,
      userData.avatar,
      userData.username
    );

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
  const randomNumber = Math.floor(Math.random() * 12) + 1;
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
