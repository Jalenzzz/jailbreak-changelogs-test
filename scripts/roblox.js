document.addEventListener('DOMContentLoaded', function() {
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
    const redirect = 'https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code'
    const test_redirect = 'https://authorize.roblox.com/?client_id=8033575152059272055&redirect_uri=https://testing.jailbreakchangelogs.xyz/roblox&scope=openid%20profile&response_type=code'
    console.log('Hello from Roblox');
    document.getElementById('button').addEventListener('click', () => {
        console.log('Redirecting to Roblox OAuth...');
        window.location.href = test_redirect;
    });
    if (window.location.search.includes("code=")) {
        const code = new URLSearchParams(window.location.search).get("code");
        console.log('Code:', code);
        const token = getCookie('token');
        fetch(`https://api.jailbreakchangelogs.xyz/roblox/auth?code=${code}&owner=${token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            window.location.href = '/'
        })
    }
});