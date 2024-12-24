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
    console.log("Code:", code);
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
        if (data.error) {
          console.error("Roblox auth error:", data.error);
          alert("Failed to authenticate with Roblox. Please try again.");
          window.location.href = "/trading";
          return;
        }

        if (data.robloxId && data.robloxUsername) {
          // Set cookies with proper path and expiration
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 1);
          document.cookie = `robloxId=${
            data.robloxId
          }; path=/; expires=${expires.toUTCString()}`;
          document.cookie = `robloxUsername=${
            data.robloxUsername
          }; path=/; expires=${expires.toUTCString()}`;

          console.log("Roblox auth successful, cookies set");
          console.log("Checking for pending trade...");

          // Check for pending trade
          const pendingTrade = localStorage.getItem("pendingTrade");
          if (pendingTrade) {
            console.log("Found pending trade, redirecting to trading page");
            window.location.href = "/trading";
          } else {
            console.log("No pending trade found, redirecting to home");
            window.location.href = "/";
          }
        } else {
          console.error("Invalid Roblox auth response:", data);
          alert("Invalid response from Roblox. Please try again.");
          window.location.href = "/trading";
        }
      })
      .catch((error) => {
        console.error("Roblox auth request failed:", error);
        alert("Failed to connect to authentication server. Please try again.");
        window.location.href = "/trading";
      });
  }
});
