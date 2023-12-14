// перемикання між сторінками Автомобілі/Працівники
function toggle(event){
    if (event.target.tagName !== 'TD' || event.target.id === "page_selected"){
        return;
    }
    page_selected.id = "";
    event.target.id = "page_selected";
    const is_car_page = page_selected.textContent === 'Автомобілі';
    auto_list.hidden = !is_car_page;
    if (auto_list.querySelectorAll('li').length === 1){
        auto_list.hidden = true;
    }
    add_car.hidden = !is_car_page;
    search.value = "";
    search.placeholder = is_car_page ? "Введіть марку/модель/рік" : "Введіть ім'я/прізвище";
    workers.hidden = is_car_page;
    add_worker.hidden = is_car_page;
    filter("");
}

// фільтрування автомобілів або працівників відповідно до введеного в поле пошуку значення
function filter(queryText){
    if (page_selected.textContent === 'Автомобілі'){
        auto_list.querySelectorAll('li').forEach(car => {
            let car_title = car.firstElementChild.textContent;
            car_title = car_title.substring(0, car_title.indexOf(')')+1);
            const to_show = car_title.includes(queryText) || car_title.toLowerCase().includes(queryText);
            car.hidden = !to_show;
        })
    } else {
        workers.tBodies[0].querySelectorAll('tr').forEach(worker => {
            let name = worker.cells[1].textContent;
            const to_show = name.includes(queryText) || name.toLowerCase().includes(queryText);
            worker.hidden = !to_show;
        })
    }
}

// Функція відкриття та заповнення контенту модального вікна
function open_modal(row){
    const info_modal = (row.tagName === 'TR');
    employee_modal.hidden = false;
    page_content.style.pointerEvents = "none";
    page_content.style.filter = 'blur(5px)';
    close_button.onclick = close_modal;
    if (info_modal){
        const keys = ['employee_id', 'first_name', 'last_name', 'username', 'email', 'date_joined', 'last_login'];
        let data = {}
        for (let i=0, j=0; i<row.cells.length; i++, j++){
            if (i===1){
                data[keys[j++]] = row.cells[i].textContent.split(' ')[0];
                data[keys[j]] = row.cells[i].textContent.split(' ')[1];
            } else {
                data[keys[j]] = row.cells[i].textContent;
            }
        }
        for (let key of keys){
            document.getElementById(key).textContent = data[key];
        }
        modal_header.replaceChild(document.createTextNode("Працівник № "), modal_header.firstChild);
        make_editable(false);
        date_joined_p.hidden = false;
        last_login_p.hidden = false;
        password_p.hidden = true;
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
    } else {
        const keys = ['employee_id', 'first_name', 'last_name', 'username', 'email', 'password'];
        for (let key of keys){
            document.getElementById(key).textContent = "";
        }
        modal_header.replaceChild(document.createTextNode("Додати працівника"), modal_header.firstChild);
        make_editable(true);
        close_button.onclick = function(){
            if (window.confirm("Всі незбережні зміни будуть незбереженими, закрити вікно?")){
                close_modal();
            }
        }
        date_joined_p.hidden = true;
        last_login_p.hidden = true;
        password_p.hidden = false;
        edit_employee.hidden = true;
        employee_red.textContent = "Скасувати";
        employee_red.onclick = close_modal;
        employee_green.hidden = false;
        employee_green.textContent = "Додати працівника";
        employee_green.onclick = function(){
            if (validateEmployeeFields(password=true)){
                const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
                let data = {'password': document.getElementById('password').textContent};
                employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => {
                    data[span.id] = span.textContent;
                })
                fetch(`users/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(data),
                })
                .then(response => {
                    if (response.status !== 200) {
                        window.alert('Не вдалося додати працівника. Перезавантажте сторінку або спробуйте пізніше!');
                    } else {
                        return response.json();
                    }
                })
                .then(data => {
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

// Функція закриття модального вікна
function close_modal(){
    employee_modal.hidden = true;
    page_content.style.pointerEvents = "auto";
    page_content.style.filter = '';
}

// Функція видалення працівника
function deleteEmployee(table_row){
    if (window.confirm('Ви впевнені, що бажаєте видалити цього працівника?')){
        const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
        fetch(`users/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                'X-CSRFToken': csrftoken
            },
            body: table_row.cells[0].textContent,
        })
        .then(response => {
            if (response.status !== 200){
                window.alert('Не вдалося видалити працівника. Перезавантажте сторінку або спробуйте пізніше!');
            } else {
                close_modal();
                table_row.remove();
            }
        })
        .catch(error => {
            window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
        });
    }
}

// Функція, що робить інформацію про працівника в модальному вікні доступною/недоступною для редагування
function make_editable(editable){
    employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => {
        if (editable){
            span.contentEditable = true;
            span.classList.add('editable');
            span.onpaste = function(e){
                e.preventDefault();
                let text = e.clipboardData.getData("text/plain");
                document.execCommand("insertHTML", false, text);
            }
        } else {
            span.contentEditable = false;
            span.classList.remove('editable');
        }
    })
}

// Функція редагування інформації про працівника
function editEmployee(table_row){
    make_editable(true);
    close_button.onclick = function(){
        if (window.confirm("Всі незбережні зміни будуть незбереженими, закрити вікно?")){
            close_modal();
        }
    }
    edit_employee.hidden = true;
    employee_red.textContent = "Скасувати зміни";
    employee_red.onclick = function(){
        close_modal();
        open_modal(table_row);
    }
    employee_green.hidden = false;
    employee_green.textContent = "Зберегти зміни";
    employee_green.onclick = function (){
        if (validateEmployeeFields()){
            const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
            let data = {'user_id': employee_id.textContent};
            employee_modal.querySelectorAll("#modal_body>p>span").forEach(span => {
                data[span.id] = span.textContent;
            })
            fetch(`users/`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                    'X-CSRFToken': csrftoken
                },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (response.status !== 200){
                    window.alert('Не вдалося оновити дані працівника. Перезавантажте сторінку або спробуйте пізніше!');
                } else {
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

// Функція валідації полів працівника
function validateEmployeeFields(password=false){
    // валідація імені
    let regex = /^(?=.{1,50}$)[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)?$/;
    if (!regex.test(first_name.textContent)){
        window.alert('Помилка при валідації імені. Довжина імені має бути не більше 50 символів, воно може містити букви кирилиці, апостроф або дефіс та має починатись з ВЕЛИКОЇ літери!');
        return false;
    }
    // валідація прізвища
    regex = /^(?=.{1,70}$)[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)?$/;
    if (!regex.test(last_name.textContent)){
        window.alert('Помилка при валідації прізвища. Довжина прізвища має бути не більше 70 символів, воно може містити букви кирилиці, апостроф або дефіс та має починатись з ВЕЛИКОЇ літери!');
        return false;
    }
    // валідація логіна
    regex = /^(?=.{1,150}$)[A-Za-z0-9_@+.-]+$/;
    if (!regex.test(username.textContent)){
        window.alert('Помилка при валідації логіна. Довжина логіна має бути не більше 150 символів, він може містити букви латиниці, цифри та символи _@+.-');
        return false;
    }
    // валідація email
    regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.textContent)){
        window.alert('Невірний формат email!');
        return false;
    }
    // валідація пароля
    if (password){
        const length = document.getElementById('password').textContent.length;
        if (length === 0 || length > 100){
            window.alert('Пароль повинен бути непорожнім та довжиною не більше 100 символів!');
            return false;
        }
    }
    return true;
}

// Функція редагування інформації про автомобіль
function editCar(edit_icon){
    const this_li = edit_icon.closest('li');
    this_li.scrollIntoView({ behavior: "smooth"});
    document.body.style.pointerEvents = "none";
    this_li.style.pointerEvents = "auto";
    for (let element of auto_list.querySelectorAll('li')){
        if (element !== this_li){
            element.style.filter = "blur(5px)";
        } else {
            element.style.position = "relative";
        }
    }
    ['header', '#toggle', '#search_container', 'footer', '#add_car'].forEach(element_selector => {
        document.querySelector(element_selector).style.filter = "blur(5px)";
    })
    document.querySelector('header').style.position = "static";
    for (let element of this_li.getElementsByClassName('can_be_editable')){
        element.contentEditable = true;
        element.classList.add('editable');
        element.addEventListener("paste", function(e){
            e.preventDefault();
            let text = e.clipboardData.getData("text/plain");
            document.execCommand("insertHTML", false, text);
        })
    }
    const images = this_li.querySelectorAll('img');
    images[0].hidden = true;
    images[1].hidden = true;
    images[2].hidden = false;
    images[3].hidden = false;
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

// Функція видалення авто
function deleteCar(delete_icon){
    const this_li = delete_icon.closest('li');
    const car_id = this_li.dataset.id;
    const confirm_deleting = window.confirm("Ви впевнені, що хочете видалити це авто? Перегляньте прокати на це авто у новій вкладці. Незавершені прокати будуть відмінені!");
    if (confirm_deleting){
        window.open(`archive.html?car_id=${car_id}`, '_blank');
        setTimeout(() => {
            const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
            fetch(`cars/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                    'X-CSRFToken': csrftoken
                },
                body: car_id,
            })
                .then(response => {
                    if (response.status !== 200) {
                        window.alert('Не вдалося видалити авто. Перезавантажте сторінку або спробуйте пізніше!');
                    } else {
                        window.location.reload();
                    }
                })
                .catch(error => {
                    window.alert("Не вдалося встановити зв'язок з сервером. Вибачте за тимчасові незручності!");
                });
        }, 1000);
    }
}

// Функція валідації файлу-зображення
function validateFile(fileInput){
    const size = fileInput.files[0].size;
    const name = fileInput.files[0].name;
    fileInput.previousElementSibling.style.borderColor = "black";
    // перевірка формату
    if (!['jpg', 'jpeg'].includes(name.split('.').pop().toLowerCase())) {
        alert("Файл повинен бути у форматі jpg або jpeg!");
        fileInput.previousElementSibling.style.borderColor = "red";
        return false;
    }
    // перевірка розміру
    if (2621440<size) {
        alert("Розмір файла перевищує 2.5 Мб!")
        fileInput.previousElementSibling.style.borderColor = "red";
        return false;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        const car_img = fileInput.previousElementSibling.previousElementSibling;
        car_img.src = event.target.result;
        car_img.hidden = false;
        fileInput.previousElementSibling.hidden = true;
        fileInput.style.height = "0";
    };
    reader.readAsDataURL(fileInput.files[0]);
    return true;
}

// Функція збереження змін або створення автомобіля
function saveChanges(saveIcon, method) {
    const this_li = saveIcon.closest('li');
    if (validateCarFields(this_li)){
        const csrftoken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
        let car_data = {'id': this_li.dataset.id};
        const keys = ['make', 'model', 'year', 'category', 'engine_size', 'fuel_type', 'gearbox', 'seats', 'conditioner', 'fuel_consumption', 'price_1to3', 'price_4to9', 'price_10to25', 'price_26to89', 'mortgage'];
        const spans = this_li.querySelectorAll(".can_be_editable");
        for (let i=0; i<spans.length; i++){
            car_data[keys[i]] = spans[i].textContent;
        }
        const formData = new FormData();
        formData.append("_method", method);
        formData.append('data', JSON.stringify(car_data));
        const fileInput = this_li.querySelector('input[type="file"]');
        if (fileInput.files.length){
            formData.append('image', fileInput.files[0]);
        } else if (method === 'POST'){
            window.alert('Ви маєте прикріпити фото авто щоб створити його!');
            return;
        }
        fetch(`cars/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('rivnerent_auth_token')}`,
                'X-CSRFToken': csrftoken
            },
            body: formData
        })
        .then(response => {
            if (response.status !== 200){
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

// Функція валідації полів автомобіля
function validateCarFields(li) {
    const fields = li.querySelectorAll(".can_be_editable");
    if (!fields[0].textContent.length || fields[0].textContent.length > 40) {
        window.alert('Поле марки авто має бути не пустим та довжиною не більше 40 символів!');
        return false;
    }
    if (!fields[1].textContent.length || fields[1].textContent.length > 50) {
        window.alert('Поле моделі авто має бути не пустим та довжиною не більше 50 символів!');
        return false;
    }
    const year = Number(fields[2].textContent);
    if (isNaN(year) || year <= 0 || !Number.isInteger(year)) {
        window.alert('Рік випуску авто має бути цілим додатнім числом!');
        return false;
    }
    if (!["Бюджетні", "Комфорт", "Кросовери", "Бізнес", "Спорт", "Преміум 4х4"].includes(fields[3].textContent)){
        window.alert('Категорія авто повинна бути однієї з:' + '\nБюджетні,Комфорт,Кросовери,Бізнес,Спорт,Преміум 4х4');
        return false;
    }
    const engine_size = fields[4].textContent;
    if (isNaN(Number(engine_size)) || Number(engine_size) < 0.1) {
        window.alert("Об'єм двигуна повинен бути числом не менше за 0.1!");
        return false;
    }
    if (!["Бензин", "Дизель", "Газ/бензин"].includes(fields[5].textContent)){
        window.alert('Тип пального повинен бути одним з:' + '\nБензин,Дизель,Газ/бензин');
        return false;
    }
    if (!["Механіка", "Автомат", "Робот", "Варіатор"].includes(fields[6].textContent)){
        window.alert('Тип КПП повинен бути одним з:' + "\nМеханіка,Автомат,Робот,Варіатор");
        return false;
    }
    const seats = Number(fields[7].textContent);
    if (isNaN(seats) || seats <= 0 || !Number.isInteger(seats)){
        window.alert('Кількість сидінь має бути цілим додатнім числом!');
        return false;
    }
    if (!["Відсутній", "Кондиціонер", "Клімат-контроль"].includes(fields[8].textContent)){
        window.alert('Тип кондиціонера повинен бути одним з таких:' + '\nВідсутній,Кондиціонер,Клімат-контроль');
        return false;
    }
    const fuel_consumption = fields[9].textContent;
    if (!fuel_consumption || isNaN(Number(fuel_consumption)) || Number(fuel_consumption) < 0){
        window.alert("Розхід палива повинен бути невід'ємним числом!");
        return false;
    }
    for (let index of [10, 11, 12, 13, 14]){
        const price = Number(fields[index].textContent);
        if (isNaN(price) || price <= 0 || !Number.isInteger(price)){
            window.alert('Добові ціни та задаток повинні бути цілими додатніми значеннями!');
            return false;
        }
    }
    return true;
}

// Функція обробки додавання авто
function addCar(add_container){
    add_container.hidden = true;
    const new_li = auto_list.querySelectorAll('li')[auto_list.querySelectorAll('li').length-1];
    new_li.hidden = false;
    editCar(new_li);
}