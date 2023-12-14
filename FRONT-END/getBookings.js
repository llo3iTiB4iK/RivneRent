// Функція отримання бронювань з сервера
function getBookings(parameters='', first=true) {
    let authToken = sessionStorage.getItem('rivnerent_auth_token');
    if (authToken) {
        fetch(`bookings${window.location.search ? window.location.search : parameters}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(response => {
                if (response.status === 401) {
                    throw new Error('401 Unauthorized');
                }
                return response.json();
            })
            .then(data => {
                let bookings = JSON.parse(data.bookings);
                if (bookings.length === 0 && first) {
                    alert('На даний момент немає бронювань!');
                } else {
                    show_bookings(bookings, parameters.includes('employee'));
                }
            })
            .catch(error => {
                if (error.message === '401 Unauthorized') {
                    window.alert('Не авторизований доступ. Будь ласка, увійдіть знову!');
                } else {
                    window.alert('Не вдалося завантажити бронювання. Спробуйте пізніше!');
                }
                window.location.href = 'index.html';
            });
    } else {
        window.alert('У вас немає прав доступу до цієї сторінки :(');
        window.location.href = 'index.html';
    }
}

// Функція показу бронювань у вигляді списку
function show_bookings(bookings, employee=false){
    if (employee){
        let idList = bookings.map(function(booking) { return booking.id; });
        let statusList = bookings.map(function(booking) { return booking.status; });
        for (const row of bookings_list.querySelectorAll('tr')) {
            const opened_in_modal = (row.dataset.id == booking_id.textContent && bookings_modal.style.display === 'block')
            const status_changed = (!idList.includes(Number(row.dataset.id)) || statusList[idList.indexOf(Number(row.dataset.id))] !== row.dataset.status)
            if (status_changed && opened_in_modal){
                close_modal();
                alert('Статус відкритого Вами бронювання було змінено! Ви не можете з ним більше взаємодіяти, вікно буде закрите.');
            }
            row.remove();
        }
    }
    for (let booking of bookings){
        let new_row = document.createElement('tr');
        for (const key in booking){
            new_row.dataset[key] = booking[key];
            let properties_to_show = ['id', employee ? 'email' : 'status', 'full_name', 'phone_number', 'acquisition_date', 'rental_term', 'car'];
            if (properties_to_show.includes(key)){
                let new_cell = document.createElement('td');
                new_cell.textContent = booking[key];
                if (key === 'phone_number'){
                    new_cell.onclick = function(event){
                        event.stopPropagation();
                        window.open(`archive.html?phone_num=${new_row.dataset.phone_number}`, '_blank');
                    }
                    new_cell.style.textDecoration = 'underline';
                } else if (key === 'car'){
                    let new_image = document.createElement('img');
                    new_image.src = booking.car_img;
                    new_image.style = 'display: none; position: absolute; width: 400px; right:0;';
                    new_cell.appendChild(new_image);
                    new_cell.addEventListener('mouseenter', function(){
                        new_image.style.display = 'block';
                    });
                    new_cell.addEventListener('mouseleave', function(){
                        new_image.style.display = 'none';
                    });
                    new_cell.onclick = function(event){
                        event.stopPropagation();
                        window.open(`archive.html?car_id=${new_row.dataset.car_id}`, '_blank');
                    }
                    new_cell.style.textDecoration = 'underline';
                }
                new_row.appendChild(new_cell);
            }
        }
        bookings_list.appendChild(new_row);
        new_row.onclick = open_modal;
        if (employee){
            new_row.style.display = status_selected.textContent.includes(new_row.dataset.status) ? 'table-row' : 'none';
            new_row.addEventListener('click', function(){
                // якщо йде обробка прокатів, що розпочинаються або закінчуються сьогодні
                let starting_today = status_selected.textContent.includes('Отримання сьогодні')
                let ending_today = status_selected.textContent.includes('Повернення сьогодні')
                if (starting_today || ending_today){
                    failed_to_connect.style.display = 'none';
                    confirm_booking.textContent = starting_today ? 'Прокат розпочато' : 'Прокат успішно завершено';
                    confirm_booking.onclick = function(){
                        if (starting_today){
                            update_status(new_row.dataset.id, bookings_modal.dataset.status, 'in_rental');
                        } else {
                            update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rental_successful');
                        }
                        close_modal();
                        new_row.dataset.status = starting_today ? 'В прокаті' : 'Прокат успішний';
                        new_row.style.display = 'none';
                    }
                    cancel_booking.textContent = starting_today ? 'Прокат зірвано' : 'Виникли проблеми при прокаті';
                    cancel_booking.onclick = function(){
                        let comment = starting_today ? window.prompt('Вкажіть причину зриву прокату') : window.prompt('Вкажіть, які саме проблеми виникли');
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rental_failed', comment);
                        close_modal();
                        new_row.dataset.status = 'Прокат зірваний';
                        new_row.style.display = 'none';
                    }
                } else {
                    // якщо йде обробка нових прокатів, або таких, що потребують підтвердження
                    failed_to_connect.style.display = 'inline-block';
                    confirm_booking.textContent = 'Бронювання підтверджено';
                    confirm_booking.onclick = function(){
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'confirmed');
                        close_modal();
                        new_row.dataset.status = 'Підтверджені';
                        new_row.style.display = 'none';
                    }
                    cancel_booking.textContent = 'Бронювання скасовано';
                    cancel_booking.onclick = function(){
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rejected');
                        close_modal();
                        new_row.dataset.status = 'Відхилені';
                        new_row.style.display = 'none';
                    }
                    failed_to_connect.onclick = function(){
                        if (status_selected.textContent !== 'Потребують підтвердження'){
                            update_status(new_row.dataset.id, bookings_modal.dataset.status, 'needs_confirmation');
                            new_row.dataset.status = 'Потребують підтвердження';
                            new_row.style.display = 'none';
                        }
                        close_modal();
                    }
                }
            });
        }
    }
}

// Функція відкриття та заповнення контенту модального вікна
function open_modal(event){
    let row = event.target.closest('tr')
    bookings_modal.dataset.status = row.dataset.status;
    bookings_modal.style.display = 'block';
    page_content.style.pointerEvents = "none";
    page_content.style.filter = 'blur(5px)';
    booking_id.textContent = row.dataset.id;
    booking_status.textContent = row.dataset.status;
    let spans_to_fill = modal_body.querySelectorAll('p span');
    for (let i = 0; i < spans_to_fill.length; i++){
        spans_to_fill[i].textContent = row.dataset[spans_to_fill[i].id];
    }
    if (discount.textContent === '0%'){
        discount.textContent = 'Відсутня';
    }
}

// Функція закриття модального вікна
function close_modal(){
    bookings_modal.style.display = 'none';
    page_content.style.pointerEvents = "auto";
    page_content.style.filter = '';
}

// Фільтрація бронювань за статусом та номером
function filter(employee_page=false){
    if (employee_page && event.target.tagName !== 'TD'){
        return
    }
    let status = document.getElementById('status');
    status_selected.id = '';
    const selectedOption = employee_page ? event.target : status.options[status.selectedIndex];
    selectedOption.id = 'status_selected';
    const selectedStatus = selectedOption.textContent;
    const beginning = employee_page ? '' : search.value
    bookings_list.querySelectorAll('tr').forEach(booking => {
        const to_show = (selectedStatus==='Усі' || selectedStatus.includes(booking.dataset.status)) && booking.dataset.id.startsWith(beginning);
        booking.style.display = to_show ? 'table-row' : 'none';
    })
}

// Функція зміни статусу бронювання
function update_status(id, old_status, new_status, comment){
    data = {'booking_id': id, 'old_status': old_status, 'new_status': new_status};
    if (comment){
        data['comment'] = comment;
    }
    const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    fetch(`bookings`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (response.status !== 200){
            window.alert('Не вдалося оновити статус бронювання. Можливо, хтось уже змінив його. Перезавантажте сторінку або спробуйте пізніше!');
        }
    })
    .catch(error => {
        console.log(error);
    });
}