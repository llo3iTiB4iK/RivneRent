function log_out(){
    // скрипт виходу
    const auth_token = sessionStorage.getItem('rivnerent_auth_token');
    sessionStorage.removeItem('rivnerent_auth_token');
    const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    fetch('http://127.0.0.1:8000/logout/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${auth_token}`,
            'X-CSRFToken': csrftoken
        }
    })
    window.location.href = 'index.html';
}