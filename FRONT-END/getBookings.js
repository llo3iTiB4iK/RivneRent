/**
 * This function gets bookings from server and calls further actions
 * @param parameters - string, defines whether user needs to get all or specific bookings
 * @param first - boolean, defines whether it is the first request for getting bookings on this page
 */
function getBookings(parameters='', first=true) {
    let authToken = sessionStorage.getItem('rivnerent_auth_token'); // get authorization token from sessionStorage
    if (authToken) { // if authorization token was found
        // do fetch-request that gets bookings from server
        fetch(`bookings${window.location.search ? window.location.search : parameters}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
            .then(response => {
                if (response.status === 401) { // throw error if response status is 401
                    throw new Error('401 Unauthorized');
                }
                return response.json();
            })
            .then(data => {
                let bookings = JSON.parse(data.bookings); // create object from json string
                if (bookings.length === 0 && first) { // if server returns no bookings and this was the first request on this page, show message
                    alert('На даний момент немає бронювань!');
                } else { // else process receiver data
                    show_bookings(bookings, parameters.includes('employee'));
                }
            })
            .catch(error => { // show message for user depending on server's response and redirect to main page
                if (error.message === '401 Unauthorized') {
                    window.alert('Не авторизований доступ. Завершилась сесія авторизації або Ви не маєте прав доступу до цієї сторінки!');
                } else {
                    window.alert('Не вдалося завантажити бронювання. Спробуйте пізніше!');
                }
                window.location.href = 'index.html';
            });
    } else { // if authorization token wasn't found - show message and redirect to main page
        window.alert('У вас немає прав доступу до цієї сторінки :(');
        window.location.href = 'index.html';
    }
}

/**
 * This function shows bookings in table and processes already shown bookings
 * @param bookings - array, list of booking-objects
 * @param employee - boolean, defines whether user is on employee page
 */
function show_bookings(bookings, employee=false){
    if (employee){ // if user is on employee page
        let idList = bookings.map(function(booking) { return booking.id; }); // create array of bookings got from server IDs
        let statusList = bookings.map(function(booking) { return booking.status; }); // create array of bookings got from server statuses
        for (const row of bookings_list.querySelectorAll('tr')) { // for all the already shown in table bookings
            const opened_in_modal = (row.dataset.id == booking_id.textContent && bookings_modal.style.display === 'block') // is this booking opened in modal window
            const status_changed = (!idList.includes(Number(row.dataset.id)) || statusList[idList.indexOf(Number(row.dataset.id))] !== row.dataset.status) // is this booking's status changed
            if (status_changed && opened_in_modal){ // if this booking's status changed, and it is opened in modal window, close this modal window and alert user that this booking's status changed
                close_modal();
                alert('Статус відкритого Вами бронювання було змінено! Ви не можете з ним більше взаємодіяти, вікно буде закрите.');
            }
            row.remove(); // remove row with this booking from table
        }
    }
    for (let booking of bookings){ // for all the bookings got from server
        let new_row = document.createElement('tr'); // create new table row
        for (const key in booking){ // for every property in booing object
            new_row.dataset[key] = booking[key]; // set the data-* attribute for new row, where * is property
            let properties_to_show = ['id', employee ? 'email' : 'status', 'full_name', 'phone_number', 'acquisition_date', 'rental_term', 'car']; // list of properties that will be shown in table
            if (properties_to_show.includes(key)){ // if this property must be shown in table
                let new_cell = document.createElement('td'); // create table cell
                new_cell.textContent = booking[key]; // fill the table cell with property's value
                if (key === 'phone_number'){ // if the property is phone number, make user redirect on archive of bookings of customer with this phone number when clicking on this cell
                    new_cell.onclick = function(event){
                        event.stopPropagation();
                        window.open(`archive.html?phone_num=${new_row.dataset.phone_number}`, '_blank');
                    }
                    new_cell.style.textDecoration = 'underline'; // make this cell's text underlined
                } else if (key === 'car'){ // if the property is car
                    // create and set up the image element so that contained this car's image and make it invisible
                    let new_image = document.createElement('img');
                    new_image.src = booking.car_img;
                    new_image.style = 'display: none; position: absolute; width: 400px; right:0;';
                    new_cell.appendChild(new_image); // add this image to new cell
                    // make car's image visible on user's hover over cell with car
                    new_cell.addEventListener('mouseenter', function(){
                        new_image.style.display = 'block';
                    });
                    new_cell.addEventListener('mouseleave', function(){
                        new_image.style.display = 'none';
                    });
                    // make user go on an archive page with only bookings for car in this cell shown
                    new_cell.onclick = function(event){
                        event.stopPropagation();
                        window.open(`archive.html?car_id=${new_row.dataset.car_id}`, '_blank');
                    }
                    new_cell.style.textDecoration = 'underline'; // make text in this cell underlines
                }
                new_row.appendChild(new_cell); // insert this cell into a row
            }
        }
        bookings_list.appendChild(new_row); // insert this row into the bookings' table
        new_row.onclick = open_modal; // open modal when the row is clicked
        if (employee){ // if user is on employee page
            new_row.style.display = status_selected.textContent.includes(new_row.dataset.status) ? 'table-row' : 'none'; // show table row if booking's status is the same as status filter selected
            new_row.addEventListener('click', function(){ // process clicking on this row depending on status of booking in the row
                // if booking has rental that is starting or ending today
                let starting_today = status_selected.textContent.includes('Отримання сьогодні')
                let ending_today = status_selected.textContent.includes('Повернення сьогодні')
                if (starting_today || ending_today){
                    failed_to_connect.style.display = 'none'; // not to show yellow button
                    confirm_booking.textContent = starting_today ? 'Прокат розпочато' : 'Прокат успішно завершено'; // set the text for green button
                    confirm_booking.onclick = function(){ // set up updating status when the green button is clicked
                        if (starting_today){
                            update_status(new_row.dataset.id, bookings_modal.dataset.status, 'in_rental');
                        } else {
                            update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rental_successful');
                        }
                        close_modal();
                        new_row.dataset.status = starting_today ? 'В прокаті' : 'Прокат успішний'; // change the data-status property of this row
                        new_row.style.display = 'none'; // not to show this row
                    }
                    cancel_booking.textContent = starting_today ? 'Прокат зірвано' : 'Виникли проблеми при прокаті'; // set the text for green button
                    cancel_booking.onclick = function(){ // set up updating status when red button is clicked
                        let comment = starting_today ? window.prompt('Вкажіть причину зриву прокату') : window.prompt('Вкажіть, які саме проблеми виникли'); // ask user for comment
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rental_failed', comment);
                        close_modal();
                        new_row.dataset.status = 'Прокат зірваний'; // change the data-status property of this row
                        new_row.style.display = 'none'; // not to show this row
                    }
                } else {
                    // if booking is new or needs confirmation
                    failed_to_connect.style.display = 'inline-block'; // show yellow button
                    confirm_booking.textContent = 'Бронювання підтверджено'; // set the text for green button
                    confirm_booking.onclick = function(){ // set up updating booking's status when the green button is clicked
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'confirmed');
                        close_modal();
                        new_row.dataset.status = 'Підтверджені';
                        new_row.style.display = 'none';
                    }
                    cancel_booking.textContent = 'Бронювання скасовано'; // set the text for red button
                    cancel_booking.onclick = function(){ // set up updating booking's status when the red button is clicked
                        update_status(new_row.dataset.id, bookings_modal.dataset.status, 'rejected');
                        close_modal();
                        new_row.dataset.status = 'Відхилені';
                        new_row.style.display = 'none';
                    }
                    failed_to_connect.onclick = function(){ // set up updating booking's status when the yellow button is clicked
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

/**
 * This function opens modal window and fills it with info about the specific booking
 * @param event - event that called this function
 */
function open_modal(event){
    let row = event.target.closest('tr'); // get the row with booking that was clicked
    bookings_modal.dataset.status = row.dataset.status; // set bookings' modal data-status property the same as the row has
    bookings_modal.style.display = 'block'; // show modal window
    page_content.style.pointerEvents = "none"; // disable pointer events outside the window
    page_content.style.filter = 'blur(5px)'; // blur the page outside the window
    // fill modal with this booking's info
    booking_id.textContent = row.dataset.id;
    booking_status.textContent = row.dataset.status;
    let spans_to_fill = modal_body.querySelectorAll('p span');
    for (let i = 0; i < spans_to_fill.length; i++){
        spans_to_fill[i].textContent = row.dataset[spans_to_fill[i].id];
    }
    if (discount.textContent === '0%'){ // change the discount field text content if discount is 0
        discount.textContent = 'Відсутня';
    }
}

/**
 * This function closes a modal window
 */
function close_modal(){
    bookings_modal.style.display = 'none'; // hide modal window
    page_content.style.pointerEvents = "auto"; // enable pointer events outside the modal window
    page_content.style.filter = ''; // unblur the page outside the modal
}

/**
 * This function filters bookings depending on status and ID
 * @param employee_page - boolean, defines whether user is on the employee page
 */
function filter(employee_page=false){
    if (employee_page && event.target.tagName !== 'TD'){ // not do anything if user clicked somewhere where it is not a table cell
        return
    }
    let status = document.getElementById('status'); // filters table
    status_selected.id = ''; // unset the previous filter's id
    const selectedOption = employee_page ? event.target : status.options[status.selectedIndex]; // get element user clicked on
    selectedOption.id = 'status_selected'; // set selected filter's id
    const selectedStatus = selectedOption.textContent; // get the status user wants to filter by
    const beginning = employee_page ? '' : search.value // get the beginning of ID user wants to filter by
    bookings_list.querySelectorAll('tr').forEach(booking => { // for all the bookings shown
        const to_show = (selectedStatus==='Усі' || selectedStatus.includes(booking.dataset.status)) && booking.dataset.id.startsWith(beginning); // define whether the booking must be shown
        booking.style.display = to_show ? 'table-row' : 'none'; // show booking depending on does it need to be shown
    })
}

/**
 * This function updates specific booking's status
 * @param id - integer number or string, ID of booking that need to be updated
 * @param old_status - string, status of booking before updating
 * @param new_status - string, status of booking that must be after updating
 * @param comment - string, comment to add to this booking
 */
function update_status(id, old_status, new_status, comment){
    data = {'booking_id': id, 'old_status': old_status, 'new_status': new_status}; // form object to be sent on the server
    if (comment){ // add comment to the object if there was any comment
        data['comment'] = comment;
    }
    const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get CSRF-token from corresponding input
    // do fetch-request that tries to update booking's status on the server
    fetch(`bookings`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data), // make json string from the data object
    })
    .then(response => {
        if (response.status !== 200){ // if server response is not OK, alert the user about it
            window.alert('Не вдалося оновити статус бронювання. Можливо, хтось уже змінив його. Перезавантажте сторінку або спробуйте пізніше!');
        }
    })
    .catch(error => {
        console.log(error);
    });
}