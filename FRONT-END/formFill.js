/**
 * This function formats phone number input so that it always had +380 at the beginning
 * @param input - input HTML element, phone number input element
 */
function formatPhoneNumber(input) {
    let phoneNumber = input.value; // value entered
    if (!phoneNumber.startsWith("+380")) {
        phoneNumber = "+380" + phoneNumber;
        input.value = phoneNumber;
    }
}

/**
 * This function checks the validity of full name input
 * @param full_name_input - input HTML element, full name input element
 * @param scroll - boolean, defines whether to scroll full name input into user's viewport if validation failed
 * @returns {boolean} - defines whether the validation is passed
 */
function validateFullName(full_name_input, scroll=false){
    // define the regular expression that has three words, divided by space, that can contain any ukrainian letters, start from capital letter, and first two words can be double words divided by -
    const regex = /^[А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)? [А-ЯІЇЄҐ][а-яіїєґ']*(-[А-ЯІЇЄҐ][а-яіїєґ']*)? [А-ЯІЇЄҐ][а-яіїєґ']*$/
    if (regex.test(full_name_input.value)){ // if entered full name matched regular expression, mark as validation passed
        incorrect_name.hidden = true;
        full_name_input.style = "";
        return true;
    } else { // if entered full name does not match regular expression, mark as validation failed
        incorrect_name.hidden = false;
        if (scroll){
            scroll.scrollIntoView({ behavior: "smooth" });
        }
        full_name_input.style = "border-color: red; background-color: #ffeeee;";
        return false;
    }
}

/**
 * This function checks the validity of entered phone number
 * @param phone_num_input - input HTML element, phone number input element
 * @param scroll - boolean, defines whether to scroll phone number input into user's viewport if validation failed
 * @param blank_allowed - boolean, defines whether blank value should pass validation
 * @returns {boolean} - defines whether the validation is passed
 */
function validatePhoneNumber(phone_num_input, scroll=false, blank_allowed=false){
    // checking if everything after "+380" are only numeric symbols and html validation passed
    if (/^\d+$/.test(phone_num_input.value.slice(4)) && phone_num_input.validity.valid){ // if entered phone number is valid, mark as validation passed
        incorrect_phone.hidden = true;
        phone_num_input.style = "";
        return true;
    } else { // if entered phone number is not valid, mark as validation failed
        if (scroll){
            scroll.scrollIntoView({ behavior: "smooth" });
        }
        if (!blank_allowed && phone_num_input.value==="+380"){ // if no user input can be acceptable on this stage of filling the form, don't mark it as invalid
            phone_num_input.style = "border-color: red; background-color: #ffeeee;";
            incorrect_phone.hidden = false;
        }
        return false;
    }
}

/**
 * This function checks whether on all the dates of rental, which user wants to make, chosen car is available
 * @returns {boolean} - defines whether the validation is passed
 */
function validatePeriod(){
    // set the default page view
    Form.period.style = "";
    datepicker.style = "";
    incorrect_period.hidden = true;
    incorrect_date.hidden = true;
    // check if the datetime input is actually a date (YYYY-MM-DD)
    const datetime_correct = /^\d{4}-\d{2}-\d{2}$/.test(Form.datetime.value);
    if (my_select.value && datetime_correct && Form.period.validity.valid){ // if car is chosen, period and acquisition date are ok
        // form the list of rental dates
        let date = new Date(Form.datetime.value);
        let dates = [];
        for (let i = 0; i < Form.period.value; i++) {
            date.setDate(date.getDate() + 1);
            dates.push(date.toISOString().slice(0, 10));
        }
        disabled_dates = my_select.options[my_select.selectedIndex].dataset.dates_to_disable.split(',');
        // check if the rental days not intersect with dates when car unavailable
        const isAnyDateDisabled = dates.some(function(date) {
            return disabled_dates.includes(date);
        });
        if (isAnyDateDisabled){ // if dates intersect, alert user and mark validation as failed
            incorrect_period.hidden = false;
            Form.period.style = "border-color: red; background-color: #ffeeee;";
            datepicker.style = "border-color: red; background-color: #ffeeee;";
            return false;
        } // if not - mark validation as passed
        return true;
    } else { // if any of the fields is blank or invalid, mark validation as failed
        if (!datetime_correct && datepicker.value){ // datetime entered not in right format, alert user
            incorrect_date.hidden = false;
            datepicker.style = "border-color: red; background-color: #ffeeee;";
        }
        if (!Form.period.validity.valid && Form.period.value){ // if period entered invalid, alert user
            Form.period.style = "border-color: red; background-color: #ffeeee;";
        }
        return false;
    }
}