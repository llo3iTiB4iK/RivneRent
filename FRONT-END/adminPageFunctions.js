/**
 * This function switches user between car page and employee page
 * @param event - event, called when user clicked on a toggle Cars/Workers
 */
function toggle(event){
    if (event.target.tagName !== 'TD' || event.target.id === "page_selected"){ // not do anything when none of Cars/Workers clicked
        return;
    }
    page_selected.id = ""; // unset the id of element chosen before
    event.target.id = "page_selected"; // set the id of element clicked
    const is_car_page = page_selected.textContent === 'Автомобілі'; // create variable that defines whether the car page was wanted to view
    // hide or show elements whose need to show depends on the page chosen, clear filters
    auto_list.hidden = !is_car_page;
    add_car.hidden = !is_car_page;
    search.value = "";
    search.placeholder = is_car_page ? "Введіть марку/модель/рік" : "Введіть ім'я/прізвище";
    workers.hidden = is_car_page;
    add_worker.hidden = is_car_page;
    // clear filtering
    filter("");
}

/**
 * This function filters cars or workers depending on the value entered
 * @param queryText - string, entered filter value
 */
function filter(queryText){
    if (page_selected.textContent === 'Автомобілі'){ // if user is on the cars' page
        auto_list.querySelectorAll('li').forEach(car => { // for each car
            // show or hide car depending on whether it's name contains entered value
            let car_title = car.firstElementChild.textContent;
            car_title = car_title.substring(0, car_title.indexOf(')')+1);
            const to_show = car_title.includes(queryText) || car_title.toLowerCase().includes(queryText);
            car.hidden = !to_show;
        })
        const new_li = auto_list.querySelectorAll('li')[auto_list.querySelectorAll('li').length-1]; // get hidden new car list item
        new_li.hidden = true; // make new car list item invisible
    } else { // if user is on the workers' page
        workers.tBodies[0].querySelectorAll('tr').forEach(worker => { // for each worker
            // show or hide worker depending on whether it's name contains entered value
            let name = worker.cells[1].textContent;
            const to_show = name.includes(queryText) || name.toLowerCase().includes(queryText);
            worker.hidden = !to_show;
        })
    }
}

/**
 * This function opens modal window and fill in its content
 * @param row - table-row HTML element, row with worker that was clicked to show info about the worker
 */
function open_modal(row){
    const info_modal = (row.tagName === 'TR'); // checks whether the worker was clicked or button to add worker
    employee_modal.hidden = false; // make modal visible
    page_content.style.pointerEvents = "none"; // disable pointer events outside the modal
    page_content.style.filter = 'blur(5px)'; // blur the page outside the modal
    close_button.onclick = close_modal; // make clicking on the close button close the modal
    if (info_modal){ // if specific worker was clicked
        const keys = ['employee_id', 'first_name', 'last_name', 'username', 'email', 'date_joined', 'last_login']; // list of keys of worker's properties
        // create key:value object with worker's properties
        let data = {}
        for (let i=0, j=0; i<row.cells.length; i++, j++){
            if (i===1){
                data[keys[j++]] = row.cells[i].textContent.split(' ')[0];
                data[keys[j]] = row.cells[i].textContent.split(' ')[1];
            } else {
                data[keys[j]] = row.cells[i].textContent;
            }
        }
        // fill the modal window spans with worker's properties
        for (let key of keys){
            document.getElementById(key).textContent = data[key];
        }
        modal_header.replaceChild(document.createTextNode("Працівник № "), modal_header.firstChild); // set the modal header
        make_editable(false); // make worker's info non-editable
        // hide or show different modal window elements, set the text and functions for all the buttons shown
        date_joined_p.hidden = false;
        last_login_p.hidden = false;
        password_p.hidden = true;
        change_password_p.hidden = true;
        employee_green.hidden = true;
        employee_red.hidden = false;
        employee_red.textContent = "Видалити працівника";
        employee_red.onclick = function (){
            deleteEmployee(row);
        }
        edit_employee.hidden = false;
        edit_employee.onclick = function (){
            editEmployee(row);
        }
    } else { // if "add worker" was clicked
        const keys = ['employee_id', 'first_name', 'last_name', 'username', 'email', 'password']; // list of keys of new worker's properties
        // clear all the properties' fields
        for (let key of keys){
            document.getElementById(key).textContent = "";
        }
        modal_header.replaceChild(document.createTextNode("Додати працівника"), modal_header.firstChild); // set the modal window header
        make_editable(true); // make worker's info spans editable
        // add confirmation before closing the modal
        close_button.onclick = function(){
            if (window.confirm("Всі незбережні зміни будуть незбереженими, закрити вікно?")){
                close_modal();
            }
        }
        // hide or show different modal window elements, set the text and functions for all the buttons shown
        date_joined_p.hidden = true;
        last_login_p.hidden = true;
        password_p.hidden = false;
        change_password_p.hidden = true;
        edit_employee.hidden = true;
        employee_red.textContent = "Скасувати";
        employee_red.onclick = close_modal;
        employee_green.hidden = false;
        employee_green.textContent = "Додати працівника";
        employee_green.onclick = function(){
            if (validateEmployeeFields(password=true)){ // if all the worker's info fields pass validation
                const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get the CSRF-token from corresponding input
                // create the key-value object from entered values
                let data = {'password': document.getElementById('password').textContent};
                employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => {
                    data[span.id] = span.textContent;
                })
                // do fetch-request to the server that creates new worker
                fetch(`users/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(data), // convert object to json
                })
                .then(response => { // process server's response
                    if (response.status !== 200) {
                        window.alert('Не вдалося додати працівника. Перезавантажте сторінку або спробуйте пізніше!');
                    } else {
                        return response.json();
                    }
                })
                .then(data => {
                    // add new row to the workers' table with newly added worker
                    const user = JSON.parse(data.user);
                    const arr = [user.id, `${user.first_name} ${user.last_name}`, user.username, user.email, user.date_joined, user.last_login];
                    let newRow = workers_list.insertRow();
                    newRow.onclick = function(){ open_modal(this); }
                    for (let i = 0; i < arr.length; i++) {
                        let cell = newRow.insertCell();
                        cell.textContent = arr[i];
                    }
                    close_modal();
                })
                .catch(error => {
                    window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
                });
            }
        }
    }
}

/**
 * This function correctly closes a modal window
 */
function close_modal(){
    employee_modal.hidden = true; // hide a modal
    page_content.style.pointerEvents = "auto"; // enable pointer events on the page
    page_content.style.filter = ''; // disable blur on the page
}

/**
 * This functions deletes specific worker from the server
 * @param table_row - table-row HTML element, row with worker that must be deleted
 */
function deleteEmployee(table_row){
    if (window.confirm('Ви впевнені, що бажаєте видалити цього працівника?')){ // ask user to confirm deletion
        const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get the CSRF-token from the corresponding input
        // do fetch-request to the server that deletes the user
        fetch(`users/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                'X-CSRFToken': csrftoken
            },
            body: table_row.cells[0].textContent, // pass the worker's id in request's body
        })
        .then(response => { // process the server's response
            if (response.status !== 200){
                window.alert('Не вдалося видалити працівника. Перезавантажте сторінку або спробуйте пізніше!');
            } else { // if server returns OK, close the modal and delete the worker from the table
                close_modal();
                table_row.remove();
            }
        })
        .catch(error => {
            window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
        });
    }
}

/**
 * This function makes spans with info about worker editable
 * @param editable - boolean, defines whether to make spans editable, or non-editable
 */
function make_editable(editable){
    employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => { // for each editable field
        if (editable){
            // make field editable and change its style so that user saw it's editable
            span.contentEditable = true;
            span.classList.add('editable');
            span.onpaste = function(e){
                e.preventDefault();
                let text = e.clipboardData.getData("text/plain");
                document.execCommand("insertHTML", false, text);
            }
        } else {
            // make field non-editable and change its style so that user saw it's not editable anymore
            span.contentEditable = false;
            span.classList.remove('editable');
        }
    })
}

/**
 * This function edits info about specific worker on the server
 * @param table_row - table-row HTML element, row with worker whose info must be edited
 */
function editEmployee(table_row){
    make_editable(true); // make info editable
    // change the aside block so that worker's password could be changed
    date_joined_p.hidden = true;
    last_login_p.hidden = true;
    change_password_p.hidden = false;
    change_password.textContent = "";
    close_button.onclick = function(){ // add confirmation before closing a modal
        if (window.confirm("Всі незбережні зміни будуть незбереженими, закрити вікно?")){
            close_modal();
        }
    }
    // hide or show different modal window elements, set the text and functions for all the buttons shown
    edit_employee.hidden = true;
    employee_red.textContent = "Скасувати зміни";
    employee_red.onclick = function(){
        close_modal();
        open_modal(table_row);
    }
    employee_green.hidden = false;
    employee_green.textContent = "Зберегти зміни";
    employee_green.onclick = function (){
        const new_password = change_password.textContent; // get the new password field value
        const new_password_valid = new_password.length ? (new_password.length <= 100) : true; // the value is valid if field is blank - then password does not change, or if entered value is up to 100 symbols long
        if (!new_password_valid){ // alert user if new password didn't pass the validation
            window.alert('Помилка при валідації нового пароля. Допустимим значенням є текстове значення довжиною не більше 100 символів! Якщо ж Ви не хочете змінювати пароль, залиште відповідне поле пустим!');
        }
        const validation_result = validateEmployeeFields() && new_password_valid;
        if (validation_result){ // if all the entered worker's properties pass validation
            const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get the CSRF-token from the corresponding input
            // form the key-value object from worker's info
            let data = {'user_id': employee_id.textContent};
            // add new password to this object if one was entered and validated
            if (new_password.length){
                data['new_password'] = new_password;
            }
            employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => {
                data[span.id] = span.textContent;
            })
            // do fetch-request to the server that updates info about specific worker
            fetch(`users/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data), // make json-string from worker's data object
            })
            .then(response => { // process server's response
                if (response.status !== 200){
                    if (response.status === 401){
                        window.alert('Схоже, Ваш пароль було змінено або закінчилась сесія авторизації! Увійдіть заново!');
                        window.location.href = 'login.html';
                    } else {
                        window.alert('Не вдалося оновити дані працівника. Перезавантажте сторінку або спробуйте пізніше!');
                    }
                } else { // if server returned OK, update row with worker whose info was edited, reopen the modal with this worker
                    table_row.cells[1].textContent = `${data.first_name} ${data.last_name}`;
                    table_row.cells[2].textContent = data.username;
                    table_row.cells[3].textContent = data.email;
                    close_modal();
                    open_modal(table_row);
                }
            })
            .catch(error => {
                window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
            });
        }
    }
}

/**
 * This function validates fields with worker's info
 * @param password - boolean, defines whether the password field needs to be validated (e.g. when new worker is created)
 * @returns {boolean} - defines whether validation was passed
 */
function validateEmployeeFields(password=false){
    // define the regular expression for first name, that checks if the string is not blank, has less than 51 ukrainian letters, starts from capital one and can be double word divided by -
    let regex = /^(?=.{1,50}$)[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)?$/;
    if (!regex.test(first_name.textContent)){ // alert user if string doesn't match the regular expression
        window.alert('Помилка при валідації імені. Довжина імені має бути не більше 50 символів, воно може містити букви кирилиці, апостроф або дефіс та має починатись з ВЕЛИКОЇ літери!');
        return false;
    }
    // define the regular expression for last name, that checks if the string is not blank, has less than 71 ukrainian letters, starts from capital one and can be double word divided by -
    regex = /^(?=.{1,70}$)[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)?$/;
    if (!regex.test(last_name.textContent)){ // alert user if string doesn't match the regular expression
        window.alert('Помилка при валідації прізвища. Довжина прізвища має бути не більше 70 символів, воно може містити букви кирилиці, апостроф або дефіс та має починатись з ВЕЛИКОЇ літери!');
        return false;
    }
    // define the regular expression for username, that checks if string has 1 to 150 characters and contains of alphanumeric symbols or _@+.-
    regex = /^(?=.{1,150}$)[A-Za-z0-9_@+.-]+$/;
    if (!regex.test(username.textContent)){ // alert user if string doesn't match the regular expression
        window.alert('Помилка при валідації логіна. Довжина логіна має бути не більше 150 символів, він може містити букви латиниці, цифри та символи _@+.-');
        return false;
    }
    // define the regular expression for email, that checks if string is in email format
    regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.textContent)){ // alert user if string doesn't match the regular expression
        window.alert('Невірний формат email!');
        return false;
    }
    if (password){ // if password must be checked
        const length = document.getElementById('password').textContent.length; // get the length of entered password
        if (length === 0 || length > 100){ // alert user if password field is blank ot it's length more than 100
            window.alert('Пароль повинен бути непорожнім та довжиною не більше 100 символів!');
            return false;
        }
    }
    return true;
}

/**
 * This function switches the page to car editing mode
 * @param edit_icon - img HTML element, icon that was clicked to start editing the car
 */
function editCar(edit_icon){
    const this_li = edit_icon.closest('li'); // get list item with the car user wants to edit
    this_li.scrollIntoView({ behavior: "smooth"}); // show the car user wants to edit at the top of the viewport
    document.body.style.pointerEvents = "none"; // disable pointer events all over the page
    this_li.style.pointerEvents = "auto"; // enable pointer events on this car's list item
    // blur all the cars but this one
    for (let element of auto_list.querySelectorAll('li')){
        if (element !== this_li){
            element.style.filter = "blur(5px)";
        } else {
            element.style.position = "relative";
        }
    }
    // blur the other elements of the page
    ['header', '#toggle', '#search_container', 'footer', '#add_car'].forEach(element_selector => {
        document.querySelector(element_selector).style.filter = "blur(5px)";
    })
    document.querySelector('header').style.position = "static"; // make page header static
    for (let element of this_li.getElementsByClassName('can_be_editable')){ // for every field that can be editable
        // make field editable, change its style and change the paste function so that only the plain text could be pasted in this field
        element.contentEditable = true;
        element.classList.add('editable');
        element.addEventListener("paste", function(e){
            e.preventDefault();
            let text = e.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
        })
    }
    // get all the icons in this list element and make them shown or hidden
    const images = this_li.querySelectorAll('img');
    images[0].hidden = true;
    images[1].hidden = true;
    images[2].hidden = false;
    images[3].hidden = false;
    // allow user to change the car's image, make editing process correct
    images[4].onclick = function(){
        if (window.confirm("Ви бажаєте видалити це фото та встановити нове?")){
            const fileInputBlock = this.nextElementSibling;
            fileInputBlock.style.height = this.offsetHeight + 'px';
            fileInputBlock.hidden = false;
            fileInputBlock.querySelector(':first-child').style.marginTop = `${this.offsetHeight*0.3}px`;
            const fileInput = fileInputBlock.nextElementSibling;
            fileInput.style.height = this.offsetHeight + 'px';
            this.src = "";
            this.hidden = true;
        }
    }
}

/**
 * This function provides correct car deletion from the server
 * @param delete_icon - img HTML element, icon that was clicked to delete the car
 */
function deleteCar(delete_icon){
    const this_li = delete_icon.closest('li'); // get list item with the car user wants to delete
    const car_id = this_li.dataset.id; // get id of the car
    const confirm_deleting = window.confirm("Ви впевнені, що хочете видалити це авто? Перегляньте прокати на це авто у новій вкладці. Незавершені прокати будуть відмінені!"); // ask user to confirm deletion
    if (confirm_deleting){
        window.open(`archive.html?car_id=${car_id}`, '_blank'); // open archive of bookings with the car in new tab
        setTimeout(() => {
            const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get CSRF-token from the corresponding input
            // do fetch-request that marks car as deleted on the server
            fetch(`cars/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                    'X-CSRFToken': csrftoken
                },
                body: car_id,
            })
                .then(response => { // process server response
                    if (response.status !== 200) {
                        window.alert('Не вдалося видалити авто. Перезавантажте сторінку або спробуйте пізніше!');
                    } else {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
                });
        }, 1000); // wait 1 second before deleting the car so that bookings on archive page were loaded with their old status
    }
}

/**
 * This function validates the car image file
 * @param fileInput - input[type:file] HTML element, input where user uploads the image file
 * @returns {boolean} - defines whether validation is passed
 */
function validateFile(fileInput){
    const size = fileInput.files[0].size; // get file size
    const name = fileInput.files[0].name; // get full name of file
    fileInput.previousElementSibling.style.borderColor = "black"; // make styled file input's border color black
    // validation of file format
    if (!['jpg', 'jpeg'].includes(name.split('.').pop().toLowerCase())) { // if file format is not one of jpg or jpeg
        // alert user and change file input style
        alert("Файл повинен бути у форматі jpg або jpeg!");
        fileInput.previousElementSibling.style.borderColor = "red";
        return false;
    }
    // validation of file size
    if (2621440<size) { // if file size is more than 2.5 Mb
        // alert user and change file input style
        alert("Розмір файла перевищує 2.5 Мб!")
        fileInput.previousElementSibling.style.borderColor = "red";
        return false;
    }
    const reader = new FileReader(); // create FileReader object
    // when FileReader is loaded, set the shown car image source as FileReader and make file input inactive
    reader.onload = function(event) {
        const car_img = fileInput.previousElementSibling.previousElementSibling;
        car_img.src = event.target.result;
        car_img.hidden = false;
        fileInput.previousElementSibling.hidden = true;
        fileInput.style.height = "0";
    };
    reader.readAsDataURL(fileInput.files[0]); // set the uploaded image file as source for shown car image
    return true;
}

/**
 * This function saves changes when user adds or edits existing car
 * @param saveIcon - img HTML element, icon that was clicked to save the changes
 * @param method - string, method of request that will be sent to server
 */
function saveChanges(saveIcon, method) {
    const this_li = saveIcon.closest('li'); // get list item with the car user wants to save changes of
    if (validateCarFields(this_li)){ // if all the car fields pass validation
        const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value; // get CSRF-token from the corresponding input
        // create key:value object with properties of the car
        let car_data = {'id': this_li.dataset.id};
        const keys = ['make', 'model', 'year', 'category', 'engine_size', 'fuel_type', 'gearbox', 'seats', 'conditioner', 'fuel_consumption', 'price_1to3', 'price_4to9', 'price_10to25', 'price_26to89', 'mortgage'];
        const spans = this_li.querySelectorAll(".can_be_editable");
        for (let i=0; i<spans.length; i++){
            car_data[keys[i]] = spans[i].textContent;
        }
        const formData = new FormData(); // create new FormData object
        formData.append("_method", method); // set "_method" attribute value depending on the parameter given to this function
        formData.append('data', JSON.stringify(car_data)); // set data attribute value as the json created from the car properties object
        const fileInput = this_li.querySelector('input[type="file"]'); // get file input element
        if (fileInput.files.length){ // if user uploaded any file
            formData.append('image', fileInput.files[0]); // add this file to FormData object as the value for attribute "image"
        } else if (method === 'POST'){ // if user NOT uploaded any file, but it is creation of new car, alert user that image is required
            window.alert('Ви маєте прикріпити фото авто щоб створити його!');
            return;
        }
        // do fetch-request that creates new car on the server
        fetch(`cars/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                'X-CSRFToken': csrftoken
            },
            body: formData
        })
        .then(response => {
            if (response.status !== 200){ // process the server response
                window.alert('Не вдалося обробити дані про авто. Перезавантажте сторінку або спробуйте пізніше!');
            } else {
                window.location.reload();
            }
        })
        .catch(error => {
            window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
        });
    }
}

/**
 * This function validates entered car properties
 * @param li - LI HTML element, list item with car which properties must be validated
 * @returns {boolean} - defines whether validation is passed
 */
function validateCarFields(li) {
    const fields = li.querySelectorAll(".can_be_editable"); // get the array of all the car properties fields
    // validate make that must contain 1-40 symbols
    if (!fields[0].textContent.length || fields[0].textContent.length > 40) { // if validation failed, alert user
        window.alert('Поле марки авто має бути не пустим та довжиною не більше 40 символів!');
        return false;
    }
    // validate model that must contain 1-50 symbols
    if (!fields[1].textContent.length || fields[1].textContent.length > 50) { // if validation failed, alert user
        window.alert('Поле моделі авто має бути не пустим та довжиною не більше 50 символів!');
        return false;
    }
    // validate production year that must be positive integer number
    const year = Number(fields[2].textContent);
    if (isNaN(year) || year <= 0 || !Number.isInteger(year)) { // if validation failed, alert user
        window.alert('Рік випуску авто має бути цілим додатнім числом!');
        return false;
    }
    // validate car category that must be one of listed below items
    if (!["Бюджетні", "Комфорт", "Кросовери", "Бізнес", "Спорт", "Преміум 4х4"].includes(fields[3].textContent)){ // if validation failed, alert user
        window.alert('Категорія авто повинна бути однієї з:' + '\nБюджетні,Комфорт,Кросовери,Бізнес,Спорт,Преміум 4х4');
        return false;
    }
    // validate engine size that must be number not less than 0.1
    const engine_size = fields[4].textContent;
    if (isNaN(Number(engine_size)) || Number(engine_size) < 0.1) { // if validation failed, alert user
        window.alert("Об'єм двигуна повинен бути числом не менше за 0.1!");
        return false;
    }
    // validate fuel type that must be one of listed below items
    if (!["Бензин", "Дизель", "Газ/бензин"].includes(fields[5].textContent)){ // if validation failed, alert user
        window.alert('Тип пального повинен бути одним з:' + '\nБензин,Дизель,Газ/бензин');
        return false;
    }
    // validate gearbox type that must be one of listed below items
    if (!["Механіка", "Автомат", "Робот", "Варіатор"].includes(fields[6].textContent)){ // if validation failed, alert user
        window.alert('Тип КПП повинен бути одним з:' + "\nМеханіка,Автомат,Робот,Варіатор");
        return false;
    }
    // validate number of seats that must be positive integer number
    const seats = Number(fields[7].textContent);
    if (isNaN(seats) || seats <= 0 || !Number.isInteger(seats)){ // if validation failed, alert user
        window.alert('Кількість сидінь має бути цілим додатнім числом!');
        return false;
    }
    // validate conditioner type that must be one of listed below items
    if (!["Відсутній", "Кондиціонер", "Клімат-контроль"].includes(fields[8].textContent)){ // if validation failed, alert user
        window.alert('Тип кондиціонера повинен бути одним з таких:' + '\nВідсутній,Кондиціонер,Клімат-контроль');
        return false;
    }
    // validate fuel consumption per 100km that must be positive number
    const fuel_consumption = fields[9].textContent;
    if (!fuel_consumption || isNaN(Number(fuel_consumption)) || Number(fuel_consumption) < 0){ // if validation failed, alert user
        window.alert("Розхід палива повинен бути невід'ємним числом!");
        return false;
    }
    // validate prices and mortgage that must all be positive integer numbers
    for (let index of [10, 11, 12, 13, 14]){ // loop through every price
        const price = Number(fields[index].textContent);
        if (isNaN(price) || price <= 0 || !Number.isInteger(price)){ // if validation failed, alert user
            window.alert('Добові ціни та задаток повинні бути цілими додатніми значеннями!');
            return false;
        }
    }
    return true;
}

/**
 * This function processes car adding
 * @param add_container - div HTML element, container with "Add a car" button
 */
function addCar(add_container){
    add_container.hidden = true; // hide "Add a car" button
    const new_li = auto_list.querySelectorAll('li')[auto_list.querySelectorAll('li').length-1]; // get hidden new car list item
    new_li.hidden = false; // make new car list item visible
    editCar(new_li); // allow user edit the new car list item
}