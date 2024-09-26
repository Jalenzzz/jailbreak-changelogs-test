$(document).ready(function () {
  const OauthRedirect =
    "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Ftesting.jailbreakchangelogs.xyz%2Flogin&scope=identify";
  const DiscordLoginButton = document.getElementById("login-button");
  DiscordLoginButton.addEventListener("click", () => {
    console.log("Redirecting to Discord OAuth...");
    window.location.href = OauthRedirect;
  });
  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    fetch("https://api.jailbreakchangelogs.xyz/auth?code=" + code, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
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

