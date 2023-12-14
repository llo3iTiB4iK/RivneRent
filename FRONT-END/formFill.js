// форматування введення в поле номеру телефону
function formatPhoneNumber(input) {
    let phoneNumber = input.value;
    if (!phoneNumber.startsWith("+380")) {
        phoneNumber = "+380" + phoneNumber;
        input.value = phoneNumber;
    }
}

// перевірка на коректність вводу в поле ПІБ ()
function validateFullName(full_name_input, scroll=false){
    const regex = /^[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)? [А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)? [А-ЯІЇЄҐ][а-яіїєґ']*$/
    if (regex.test(full_name_input.value)){
        incorrect_name.hidden = true;
        full_name_input.style = "";
        return true;
    } else {
        incorrect_name.hidden = false;
        if (scroll){
            scroll.scrollIntoView({ behavior: "smooth" });
        }
        full_name_input.style = "border-color: red; background-color: #ffeeee;";
        return false;
    }
}

// перевірка на тільки числові символи в полі вводу номера телефону
function validatePhoneNumber(phone_num_input, scroll=false, blank_allowed=false){
    if (/^\d+$/.test(phone_num_input.value.slice(4)) && phone_num_input.validity.valid){
        incorrect_phone.hidden = true;
        phone_num_input.style = "";
        return true;
    } else {
        if (scroll){
            console.log(scroll)
            scroll.scrollIntoView({ behavior: "smooth" });
        }
        if (!blank_allowed && phone_num_input.value==="+380"){
            phone_num_input.style = "border-color: red; background-color: #ffeeee;";
            incorrect_phone.hidden = false;
        }
        return false;
    }
}

// валідація періоду прокату (чи при обраній даті початку прокату та терміні прокату жодна дата, в яку цей прокат попадає, не є зайнятою)
function validatePeriod(){
    Form.period.style = "";
    datepicker.style = "";
    incorrect_period.hidden = true;
    incorrect_date.hidden = true;
    const datetime_correct = /^\d{4}-\d{2}-\d{2}$/.test(Form.datetime.value);
    if (my_select.value && datetime_correct && Form.period.validity.valid){
        let date = new Date(Form.datetime.value);
        let dates = [];
        for (let i = 0; i < Form.period.value; i++) {
            date.setDate(date.getDate() + 1);
            dates.push(date.toISOString().slice(0, 10));
        }
        disabled_dates = my_select.options[my_select.selectedIndex].dataset.dates_to_disable.split(',');
        // Перевірка, чи хоча б один елемент з dates є в disabled_dates
        const isAnyDateDisabled = dates.some(function(date) {
            return disabled_dates.includes(date);
        });
        if (isAnyDateDisabled){
            incorrect_period.hidden = false;
            Form.period.style = "border-color: red; background-color: #ffeeee;";
            datepicker.style = "border-color: red; background-color: #ffeeee;";
            return false;
        }
        return true;
    } else {
        if (!datetime_correct && datepicker.value){
            incorrect_date.hidden = false;
            datepicker.style = "border-color: red; background-color: #ffeeee;";
        }
        if (!Form.period.validity.valid && Form.period.value){
            Form.period.style = "border-color: red; background-color: #ffeeee;";
        }
        return false;
    }
}