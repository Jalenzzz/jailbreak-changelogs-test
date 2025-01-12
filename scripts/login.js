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

  function setCookie(name, value, days) {
    let date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Set expiration time
    let expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/"; // Set cookie with expiration and path
  }

  // Function to get a cookie value
  const OauthRedirect =
    "https://discord.com/oauth2/authorize?client_id=1281308669299920907&response_type=code&redirect_uri=https%3A%2F%2Ftesting.jailbreakchangelogs.xyz%2Flogin&scope=identify";
  const DiscordLoginButton = document.getElementById("login-button");
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
        // Only process if we have valid user data
        if (userData && userData.id && userData.avatar) {
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          setCookie("token", userData.token, 7);
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("avatar");
          sessionStorage.removeItem("userid");
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);

          const redirect = localStorage.getItem("redirectAfterLogin");
          if (redirect === null) {
            window.location.href = "/";
          } else {
            window.location.href = redirect;
            localStorage.removeItem("redirectAfterLogin");
          }
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
            }
          );
        }
        // Redirect to home page after showing the error
        setTimeout(() => {
          window.location.href = "/";
        }, 5000);
      });
  }
});
