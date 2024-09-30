function keyCreated(message) {
    toastr.success(message, "API key created!", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}

function throw_error(message) {
    toastr.error(message, "Error creating key.", {
        positionClass: "toast-bottom-right", // Position at the bottom right
        timeOut: 3000, // Toast will disappear after 3 seconds
        closeButton: true, // Add a close button
        progressBar: true, // Show a progress bar
    });
}
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

document.addEventListener('DOMContentLoaded', async function(event) {
    // Fetch existing API keys
    const existingKeys = await fetchExistingKeys(); // Make this async
    existingKeys.forEach(key => {
        const row = `
            <tr>
                <td>${key.key}</td>
                <td>${key.name}</td>
                <td>${key.description}</td>
                <td>${key.createdAt}</td>
            </tr>
        `;
        document.getElementById('apiKeyList').innerHTML += row;
    });
    const apiKeys = []; // Store API keys
    const token = getCookie("token");

    document.getElementById('createKeyButton').addEventListener('click', async () => {
        const name = document.getElementById('keyName').value;
        const description = document.getElementById('keyDescription').value;
        
        if (name && description) {
          try {
            const response = await fetch('https://api.jailbreakchangelogs.xyz/keys/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                owner: token, // Your token here
                name: name,
                description: description,
                permissions: ["changelog"], // Sending permissions as an array
              }),
            });
      
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (response.status === 200) {
            const result = await response.json(); // Parse the JSON response
            console.log(result);
            const newKey = result.key; // Assuming the response contains the created key
      
            // Add the new key to your API key list and update the UI
            apiKeys.push(newKey);
            updateApiKeyList(); // Function to update the UI with the new list of keys
      
            // Show success message and close the modal
            keyCreated('API key successfully created!');
            $('#createKeyModal').modal('hide');
            }
            
          } catch (error) {
            console.error('Error creating API key:', error);
            throw_error(`Failed to create API key: ${error.message}`); // Show error message to the user
          }
        } else {
            throw_error('Please fill in both name and description.');
        }
      });
      

    async function fetchExistingKeys() {
        try {
            const token = getCookie("token");
            const response = await fetch('https://api.jailbreakchangelogs.xyz/keys/get?author=' + token);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching existing keys:', error);
            return [];
        }
    }

    function updateApiKeyList() {
        const apiKeyList = document.getElementById('apiKeyList');
        apiKeyList.innerHTML = ''; // Clear existing keys
        apiKeys.forEach(apiKey => {
            const row = `
                <tr>
                    <td>${apiKey.key}</td>
                    <td>${apiKey.name}</td>
                    <td>${apiKey.description}</td>
                    <td>${apiKey.createdAt}</td>
                </tr>
            `;
            apiKeyList.innerHTML += row; // Append new row
        });
    }
});