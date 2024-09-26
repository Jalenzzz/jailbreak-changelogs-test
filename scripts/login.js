$(document).ready(function () {
  const RedirectURI = "http://127.0.0.1:5500/login.html";
  const OauthRedirect =
    "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A5500%2Flogin.html&scope=identify";
  const DiscordLoginButton = document.getElementById("login-button");
  DiscordLoginButton.addEventListener("click", () => {
    console.log("Redirecting to Discord OAuth...");
    window.location.href = OauthRedirect;
  });
  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: "1281308669299920907",
        client_secret: "fXzm515uf2e_nfRPNVvvjkRpWgfN6wkt",
        redirect_uri: RedirectURI, // Ensure this matches your registered redirect URI
        code: code,
      }).toString(),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          console.log("Access token received:", data.access_token);
          // Store the access token in sessionStorage
          sessionStorage.setItem("token", data.access_token);
          // Fetch user data
          return fetch("https://discord.com/api/users/@me", {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
            },
          });
        } else {
          console.error("No access token received");
        }
      })
      .then((response) => response.json())
      .then((userData) => {
        // Update the user info in the database
        fetch("https://api.jailbreakchangelogs.xyz/add_user", {
          method: "POST",
          body: JSON.stringify(userData),
        });
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("avatar");
        sessionStorage.removeItem("userid");
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("avatar", avatarURL);
        sessionStorage.setItem("userid", userData.id);
        window.location.href = "/";
      });
  }
});
