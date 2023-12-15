/**
 * This function does logout from account and removes the authorization token from sessionStorage
 */
function log_out(){
    const auth_token = sessionStorage.getItem('rivnerent_auth_token'); // get authorization token from sessionStorage
    sessionStorage.removeItem('rivnerent_auth_token'); // remove authorization token from sessionStorage
    const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get CSRF-token value from corresponding input
    // do a fetch-request to server that makes logout
    fetch('http://127.0.0.1:8000/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth_token}`,
            'X-CSRFToken': csrftoken
        }
    })
    window.location.href = 'index.html'; // redirect user to main page
}