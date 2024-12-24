document.addEventListener("DOMContentLoaded", function () {
  // Your code here...
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
  const redirect =
    "https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code";
  const test_redirect =
    "https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://testing.jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code";
  const token = getCookie("token");
  if (!token) {
    window.location.href = "/login";
  }
  document.getElementById("button").addEventListener("click", () => {
    console.log("Redirecting to Roblox OAuth...");
    window.location.href = test_redirect;
  });
  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    console.log("Roblox auth code received:", code);
    const token = getCookie("token");
    fetch(
      `https://api.jailbreakchangelogs.xyz/roblox/auth?code=${code}&owner=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Roblox auth response:", data);
        if (data.robloxId && data.robloxUsername) {
          // Set cookies with a long expiration (7 days)
          const expires = new Date();
          expires.setDate(expires.getDate() + 7);
          document.cookie = `robloxId=${
            data.robloxId
          };expires=${expires.toUTCString()};path=/`;
          document.cookie = `robloxUsername=${
            data.robloxUsername
          };expires=${expires.toUTCString()};path=/`;

          console.log("Roblox cookies set:", {
            id: data.robloxId,
            username: data.robloxUsername,
          });

          // Check if we have a pending trade
          const pendingTrade = localStorage.getItem("pendingTrade");
          if (pendingTrade) {
            console.log("Found pending trade, redirecting to trading page");
            window.location.href = "/trading";
          } else {
            window.location.href = "/";
          }
        } else {
          console.error("Missing Roblox data in response");
          alert("Failed to authenticate with Roblox. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Roblox auth error:", error);
        alert("Failed to authenticate with Roblox. Please try again.");
      });
  }
});
