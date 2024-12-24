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
        // Store Roblox user info in cookies with a long expiration
        if (data.robloxId && data.robloxUsername) {
          const expires = new Date();
          expires.setFullYear(expires.getFullYear() + 1); // Set cookie to expire in 1 year
          document.cookie = `robloxId=${
            data.robloxId
          }; path=/; expires=${expires.toUTCString()}`;
          document.cookie = `robloxUsername=${
            data.robloxUsername
          }; path=/; expires=${expires.toUTCString()}`;

          // Check if pending trade exists and redirect accordingly
          const pendingTrade = localStorage.getItem("pendingTrade");
          if (pendingTrade) {
            window.location.href = "/trading";
          } else {
            window.location.href = "/";
          }
        } else {
          console.error("Roblox auth failed:", data);
          toastr.error("Failed to authenticate with Roblox");
        }
      });
  }
});
