import json
from django.http import JsonResponse, HttpResponseForbidden, HttpResponseNotFound
from bookings.models import BookingForm
from cars.models import Car
from django.utils import timezone
from auth.views import check_authentication
from datetime import datetime
from django.core.exceptions import ValidationError
from random import randint, choice


def make_booking(request):
    def get_price(car, period, gps=False, child_seat=False, delivery=False):
        """
        This function is designed to calculate rental price depending on all factors but discount
        :param car: cars.models.Car object, car to be rented
        :param period: int object, number of car rental days
        :param gps: bool object, specifies whether the customer picked gps as additional service
        :param child_seat: bool object, specifies whether the customer picked child seat as additional service
        :param delivery: bool object, specifies whether the customer picked car delivery as additional service
        :return: int object, calculated price of car rental
        """
        # calculate price per day without additional services depending on the rental term
        if 1 <= period <= 3:
            price_per_day = car.prices.daily_1to3
        elif 4 <= period <= 9:
            price_per_day = car.prices.daily_4to9
        elif 10 <= period <= 25:
            price_per_day = car.prices.daily_10to25
        elif 26 <= period <= 89:
            price_per_day = car.prices.daily_26to89
        else:
            raise ValueError('error')
        price_per_day += gps*200 + child_seat*200  # add gps and child seat, if customer picked them, to daily price
        return period * price_per_day + delivery*400

    def get_discount(phone_number, not100=False):
        """
        This function is designed to calculate the personal discount by customer's phone number
        :param phone_number: str object, customer's phone number
        :param not100: bool object, specifies whether personal discount cannot be 100
        :return: int object, personal discount percentage
        """
        successful_bookings = BookingForm.objects.filter(phone_number=phone_number, status='rental_successful')  # get the list of successful rentals for customer with this phone number
        if len(successful_bookings):  # if there are any successful rentals
            if not not100:  # if discount can be 100 for this customer
                # count the sum of days of successful rentals in this year
                days_sum = sum(booking.rental_term for booking in successful_bookings.filter(acquisition_date__year=timezone.localdate().year))
                if days_sum >= 30:  # if there are not less than 30 days of successful rental in this year
                    # check whether the customer used free rental this year
                    free_rental_used = bool(successful_bookings.filter(discount=100, acquisition_date__year=timezone.localdate().year))
                    if not free_rental_used:
                        return 100  # free rental for price not more than 10000uah
            # discount for every third rental
            if (len(successful_bookings)+1) % 3 == 0:
                return 20
            # customer has no discount
            return 0
        else:  # if customer has no successful rentals yet
            return 10  # discount for the first rental

    if request.method == 'POST':  # process POST request
        try:
            data = json.loads(request.body.decode('utf-8'))  # create object from json string in request body
            try:  # get data from request
                car, period, gps, child_seat, delivery = Car.objects.get(id=data['car_id']), int(data['rental_term']), data['gps'], data['child_seat'], data['delivery']
            except ValueError as e:  # return error if ones occur
                return JsonResponse({'message': 'Валідація не пройдена. Ви намагаєтесь внести невірні дані! Більш докладна інформація в консолі.', 'validation_error': str(e)}, status=400)
            initial_price = get_price(car, period, gps, child_seat, delivery)  # calculate price without discount
            # calculate discount
            discount = get_discount(data['phone_number'])
            if discount == 100 & initial_price > 10000:
                discount = get_discount(data['phone_number'], not100=True)
            # chosen car validation (processing the case when car became unavailable while user was doing the booking)
            if car.cannot_be_rented:
                message = 'На жаль, обране авто більше не доступне для прокату.' if car.cannot_be_rented else 'На жаль, обране авто потребує ремонту.'
                return JsonResponse({'message': message+' Ви можете змінити його.', 'car_unavailable': 'true'}, status=400)
            # rental term validation (processing the case when some dates of rental became unavailable for rental while user was doing the booking)
            dates_to_disable = []  # list of unavailable rental dates for this car
            for booking in BookingForm.objects.filter(car=car, status__in=['new', 'needs_confirmation', 'confirmed', 'acquisition_today', 'in_rental', 'returning_today']):
                date_list = [booking.acquisition_date + timezone.timedelta(days=x) for x in range(booking.rental_term + 1)]
                dates_to_disable += date_list
            booking_dates = [datetime.strptime(data['acquisition_date'], "%Y-%m-%d").date() + timezone.timedelta(days=x) for x in range(period + 1)]  # list of customer's rental dates
            common_elements = bool(set(dates_to_disable) & set(booking_dates))  # check whether two lists have common elements
            if common_elements:  # if some dates are not available, notify the user
                return JsonResponse({'message': 'Хтось вже забронював це авто на обрану дату, змініть авто, дату отримання або період прокату.', 'date_unavailable': 'true'}, status=400)
            # create new BookingForm object and fill the fields
            new_booking = BookingForm(
                full_name=data['full_name'],
                email=data['email'],
                phone_number=data['phone_number'],
                acquisition_date=data['acquisition_date'],
                rental_term=period,
                car=car,
                creation_time=timezone.now(),
                gps=gps,
                child_seat=child_seat,
                delivery=delivery,
                price=initial_price * (1 - discount/100),
                discount=discount
            )
            try:  # validate and save the object
                new_booking.full_clean()
                new_booking.save()
            except ValidationError as e:  # notify the user if errors occurred
                return JsonResponse({'message': 'Валідація не пройдена. Ви намагаєтесь внести невірні дані! Більш докладна інформація в консолі.', 'validation_error': str(e)}, status=400)
            return JsonResponse({'message': 'Форма успішно надіслана! Очікуйте дзвінка на вказаний у формі номер для підтвердження бронювання! Дякуємо, що обрали нас!'})
        except json.JSONDecodeError:  # if json couldn't decode the data correctly
            return JsonResponse({'message': 'Невірний формат даних JSON'}, status=400)
    elif request.method == 'GET':  # process GET request
        try:
            phone_num = request.GET.get('phone_number').replace(' ', '+')  # get the customer's phone number from request
        except AttributeError:
            return HttpResponseNotFound('<h1>Page not found</h1>')
        discount = get_discount(phone_num)  # calculate personal discount for this phone number
        data = {'message': 'Персональна знижка обрахована', 'discount': discount}
        # if the personal discount is 100, calculate the discount if personal discount 100 will be unavailable
        if discount == 100:
            data['discount_'] = get_discount(phone_num, not100=True)
        return JsonResponse(data)
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def bookings(request):
    # check authentication before managing the bookings
    user = check_authentication(request)
    if isinstance(user, (JsonResponse, HttpResponseForbidden)):
        return user

    if request.method == 'GET':  # process GET request
        Bookings = BookingForm.objects.select_related('car').all()  # get all the bookings from db
        # filter bookings depending on request parameters
        if bool(request.GET.get('employee')):
            if user.is_superuser:
                return JsonResponse({'message': 'Доступ заборонено'}, status=401)
            Bookings = Bookings.filter(status__in=['new', 'needs_confirmation', 'acquisition_today', 'returning_today'])
        phone_num = request.GET.get('phone_num')
        car_id = request.GET.get('car_id')
        if phone_num:
            Bookings = Bookings.filter(phone_number=phone_num.replace(' ', '+'))
        if car_id:
            Bookings = Bookings.filter(car_id=car_id.replace(' ', '+'))
        # form the data array
        bookings_data = [
            {
                'id': booking.id,
                'full_name': booking.full_name,
                'email': booking.email,
                'phone_number': booking.phone_number,
                'acquisition_date': booking.acquisition_date.strftime('%Y-%m-%d'),
                'rental_term': f'{booking.rental_term} днів',
                'car_id': booking.car.id,
                'car': f'{booking.car.make} {booking.car.model} ({booking.car.year})',
                'car_img': booking.car.image.url,
                'status': booking.get_status_display(),
                'confirmed_by': f'{booking.confirmed_by.first_name} {booking.confirmed_by.last_name} ({booking.confirmed_by.id})' if booking.confirmed_by else '',
                'creation_time': booking.creation_time.strftime('%Y-%m-%d %H:%M:%S'),
                'comment': booking.comment if booking.comment else '-',
                'price': f'{booking.price} грн',
                'discount': f'{booking.discount}%',
                'mortgage': f'{booking.car.prices.mortgage} грн',
                'gps': 'GPS-навігатор' if booking.gps else '',
                'child_seat': 'Дитяче автокрісло' if booking.child_seat else '',
                'delivery': 'Доставка та підбір автомобіля' if booking.delivery else ''
            }
            for booking in Bookings
        ]
        return JsonResponse({'message': 'Успіх', 'bookings': json.dumps(bookings_data)})
    elif request.method == 'PUT':  # process PUT request
        data = json.loads(request.body.decode('utf-8'))  # form the object from the json string in request
        booking = BookingForm.objects.get(id=data['booking_id'])  # get the booking that will be updated
        if booking.get_status_display() == data['old_status']:  # check whether the old status property in received object equals current status in db
            booking.status = data['new_status']  # update status in db
            booking.save()  # save changes
        else:
            return JsonResponse({'message': 'Не знайдено таке бронювання у базі даних'}, status=400)
        if data['new_status'] == 'confirmed':  # if booking is confirmed now
            booking.confirmed_by = user  # set the worker to confirmed_by field
            if booking.acquisition_date == timezone.localdate():  # if booking is made for today
                booking.status = 'acquisition_today'  # set status 'acquisition today'
            booking.save()  # save changes
        # set the comment field if it exists in received object
        try:
            BookingForm.objects.filter(id=data['booking_id']).update(comment=data['comment'])
        except KeyError:
            pass
        return JsonResponse({'message': 'Успіх'})
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def captchas(request):
    if request.method == 'GET':  # process GET request
        num1 = randint(1, 10)  # generate first operand
        num2 = randint(1, 10)  # generate second operand
        operation = choice(['+', '-', '*'])  # generate operator
        captcha = f"{num1} {operation} {num2}"  # make the string from operands and operator
        request.session['captcha_result'] = eval(captcha)  # set the captcha_result session attribute to the result of operation
        return JsonResponse({'captcha': captcha})
    elif request.method == 'POST':  # process POST request
        user_answer = request.GET.get('user_answer')  # get user's answer from url
        captcha_result = request.session.get('captcha_result')  # get the right answer from session's captcha_result property
        if user_answer is not None and captcha_result is not None:  # if both objects exist
            # compare user's answer and right answer
            try:
                user_answer = int(user_answer)
                if user_answer == captcha_result:
                    del request.session['captcha_result']
                    return JsonResponse({'success': True})
            except ValueError:
                pass
        return JsonResponse({'success': False}, status=400)
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)