document.addEventListener("DOMContentLoaded", () => {
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
    
    const token = getCookie("token");
    
    
        if (!token) {
            localStorage.setItem(
                "redirectAfterLogin",
                "/api"
              ); // Store the redirect URL in local storage
              window.location.href = "/login"; // Redirect to login page
        }
    const userid = sessionStorage.getItem("userid");
    const url = `https://api.jailbreakchangelogs.xyz/owner/check?user=${userid}`;
        
    fetch(url)
        .then(response => {
            if (response.ok) {  // Checks if the status code is in the 200-299 range
              console.log('Success:', response.status);  // Log status code (e.g., 200)
            } else {
              window.location.href = "/";  // Log status code for errors (e.g., 404, 500)
            }
          })
            .catch(error => {
            console.error('Request failed', error);  // Handle network or other errors
          });
});

