$(document).ready(function () {
  const ageCheck = $("#ageCheck");
  const tosCheck = $("#tosCheck");
  const loginButton = $("#login-button");

  function updateLoginButton() {
    loginButton.prop(
      "disabled",
      !(ageCheck.prop("checked") && tosCheck.prop("checked"))
    );
  }

  ageCheck.change(updateLoginButton);
  tosCheck.change(updateLoginButton);

  const OauthRedirect =
    "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Ftesting.jailbreakchangelogs.xyz%2Flogin&scope=identify";
  const DiscordLoginButton = document.getElementById("login-button");
  const currentPath = window.location.pathname + window.location.search;
  sessionStorage.setItem("loginRedirect", currentPath);
  DiscordLoginButton.addEventListener("click", () => {
    console.log("Redirecting to Discord OAuth...");
    window.location.href = OauthRedirect;
  });

  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    fetch("https://api3.jailbreakchangelogs.xyz/auth?code=" + code, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
      .then((response) => {
        if (response.status === 403) {
          throw new Error("banned");
        }
        if (!response.ok) {
          throw new Error("network");
        }
        return response.json();
      })

      .then((userData) => {
        if (userData && userData.id && userData.avatar) {
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          Cookies.set("token", userData.token, { expires: 7 });
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);

          // Show success toast
          toastr.success("Successfully logged in with Discord!", "Welcome", {
            positionClass: "toast-bottom-right",
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
            onHidden: function () {
              const redirectTo = sessionStorage.getItem("loginRedirect") || "/";
              sessionStorage.removeItem("loginRedirect"); // Clean up
              window.location.href = redirectTo;
            },
          });
        }
      })
      .catch((error) => {
        if (error.message === "banned") {
          toastr.error(
            "Your account has been banned from Jailbreak Changelogs.",
            "Access Denied",
            {
              positionClass: "toast-bottom-right",
              timeOut: 5000,
              closeButton: true,
              progressBar: true,
              onHidden: function () {
                window.location.href = "/";
              },
            }
          );
        } else {
          toastr.error(
            "An error occurred during login. Please try again.",
            "Error",
            {
              positionClass: "toast-bottom-right",
              timeOut: 3000,
              closeButton: true,
              progressBar: true,
              onHidden: function () {
                window.location.href = "/";
              },
            }
          );
        }
      });
  }
});
