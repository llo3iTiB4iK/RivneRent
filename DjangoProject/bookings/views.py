import json
from django.http import JsonResponse
from bookings.models import BookingForm
from cars.models import Car
from django.utils import timezone
from auth.views import check_authentication
from datetime import datetime
from django.core.exceptions import ValidationError
from random import randint, choice


def make_booking(request):
    def get_price(car, period, gps=False, child_seat=False, delivery=False):
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
        price_per_day += gps*200 + child_seat*200
        return period * price_per_day + delivery*400

    def get_discount(phone_number, not100=False):
        successful_bookings = BookingForm.objects.filter(phone_number=phone_number, status='rental_successful')
        if len(successful_bookings):
            if not not100:
                days_sum = sum(booking.rental_term for booking in successful_bookings.filter(acquisition_date__year=timezone.localdate().year))
                if days_sum >= 30:
                    free_rental_used = bool(successful_bookings.filter(discount=100, acquisition_date__year=timezone.localdate().year))
                    if not free_rental_used:
                        return 100  # безкоштовний прокат на суму до 10000 грн
            if (len(successful_bookings)+1) % 3 == 0:
                return 20  # знижка на кожен третій прокат
            return 0  # жодна з категорій знижок
        else:
            return 10  # знижка на перший прокат

    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            try:
                car, period, gps, child_seat, delivery = Car.objects.get(id=data['car_id']), int(data['rental_term']), data['gps'], data['child_seat'], data['delivery']
            except ValueError as e:
                return JsonResponse({'message': 'Валідація не пройдена. Ви намагаєтесь внести невірні дані! Більш докладна інформація в консолі.', 'validation_error': str(e)}, status=400)
            initial_price = get_price(car, period, gps, child_seat, delivery)
            discount = get_discount(data['phone_number'])
            if discount == 100 & initial_price > 10000:
                discount = get_discount(data['phone_number'], not100=True)
            # валідація обраного авто
            if car.cannot_be_rented:
                message = 'На жаль, обране авто більше не доступне для прокату.' if car.cannot_be_rented else 'На жаль, обране авто потребує ремонту.'
                return JsonResponse({'message': message+' Ви можете змінити його.', 'car_unavailable': 'true'}, status=400)
            # валідація періоду бронювання
            dates_to_disable = []
            for booking in BookingForm.objects.filter(car=car, status__in=['new', 'needs_confirmation', 'confirmed', 'acquisition_today', 'in_rental', 'returning_today']):
                date_list = [booking.acquisition_date + timezone.timedelta(days=x) for x in range(booking.rental_term + 1)]
                dates_to_disable += date_list
            booking_dates = [datetime.strptime(data['acquisition_date'], "%Y-%m-%d").date() + timezone.timedelta(days=x) for x in range(period + 1)]
            common_elements = bool(set(dates_to_disable) & set(booking_dates))
            if common_elements:
                return JsonResponse({'message': 'Хтось вже забронював це авто на обрану дату, змініть авто, дату отримання або період прокату.', 'date_unavailable': 'true'}, status=400)
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
            try:
                new_booking.full_clean()
                new_booking.save()
            except ValidationError as e:
                return JsonResponse({'message': 'Валідація не пройдена. Ви намагаєтесь внести невірні дані! Більш докладна інформація в консолі.', 'validation_error': str(e)}, status=400)
            return JsonResponse({'message': 'Форма успішно надіслана! Очікуйте дзвінка на вказаний у формі номер для підтвердження бронювання! Дякуємо, що обрали нас!'})
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Невірний формат даних JSON'}, status=400)
    elif request.method == 'GET':
        phone_num = request.GET.get('phone_number').replace(' ', '+')
        discount = get_discount(phone_num)
        data = {'message': 'Персональна знижка обрахована', 'discount': discount}
        if discount == 100:
            data['discount_'] = get_discount(phone_num, not100=True)
        return JsonResponse(data)
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def bookings(request):
    user = check_authentication(request)
    if isinstance(user, JsonResponse):
        return user

    if request.method == 'GET':
        Bookings = BookingForm.objects.select_related('car').all()
        if bool(request.GET.get('employee')):
            Bookings = Bookings.filter(status__in=['new', 'needs_confirmation', 'acquisition_today', 'returning_today'])
        phone_num = request.GET.get('phone_num')
        car_id = request.GET.get('car_id')
        if phone_num:
            Bookings = Bookings.filter(phone_number=phone_num.replace(' ', '+'))
        if car_id:
            Bookings = Bookings.filter(car_id=car_id.replace(' ', '+'))
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
    elif request.method == 'PUT':
        data = json.loads(request.body.decode('utf-8'))
        booking = BookingForm.objects.get(id=data['booking_id'])
        if booking.get_status_display() == data['old_status']:
            booking.status = data['new_status']
            booking.save()
        else:
            return JsonResponse({'message': 'Не знайдено таке бронювання у базі даних'}, status=400)
        if data['new_status'] == 'confirmed':
            booking.confirmed_by = user
            if booking.acquisition_date == timezone.localdate():
                booking.status = 'acquisition_today'
            booking.save()

        try:
            BookingForm.objects.filter(id=data['booking_id']).update(comment=data['comment'])
        except KeyError:
            pass
        return JsonResponse({'message': 'Успіх'})
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def captchas(request):
    if request.method == 'GET':
        num1 = randint(1, 10)
        num2 = randint(1, 10)
        operation = choice(['+', '-', '*'])
        captcha = f"{num1} {operation} {num2}"
        request.session['captcha_result'] = eval(captcha)
        return JsonResponse({'captcha': captcha})
    elif request.method == 'POST':
        user_answer = request.GET.get('user_answer')
        captcha_result = request.session.get('captcha_result')
        if user_answer is not None and captcha_result is not None:
            try:
                user_answer = int(user_answer)
                if user_answer == captcha_result:
                    del request.session['captcha_result']
                    return JsonResponse({'success': True})
            except ValueError:
                pass
        return JsonResponse({'success': False}, status=400)
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)