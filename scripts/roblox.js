document.addEventListener("DOMContentLoaded", function () {
  const ageCheck = document.getElementById("ageCheck");
  const tosCheck = document.getElementById("tosCheck");
  const loginButton = document.getElementById("button");

  function updateLoginButton() {
    loginButton.disabled = !(ageCheck.checked && tosCheck.checked);
  }

  ageCheck.addEventListener("change", updateLoginButton);
  tosCheck.addEventListener("change", updateLoginButton);

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

  loginButton.addEventListener("click", () => {
    console.log("Redirecting to Roblox OAuth...");
    window.location.href = test_redirect;
  });

  if (window.location.search.includes("code=")) {
    const code = new URLSearchParams(window.location.search).get("code");
    console.log("Code:", code);
    const token = getCookie("token");
    let url;
    if (token) {
      url = `https://api3.jailbreakchangelogs.xyz/auth/roblox?code=${code}&owner=${token}`
    } else {
      url = `https://api3.jailbreakchangelogs.xyz/auth/roblox?code=${code}`
    }
    fetch(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });
  }
});
