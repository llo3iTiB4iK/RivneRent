import json
import datetime
from cars.models import Car, Prices
from bookings.models import BookingForm
from django.shortcuts import render
from django.utils.timezone import localdate
from django.forms.models import model_to_dict
from django.contrib.auth.models import User
from django.http import HttpResponseForbidden, JsonResponse
from auth.views import check_authentication


def page_view(request, page):
    if page == 'cars':
        cars = Car.objects.filter(cannot_be_rented=False)
        return render(request, f'{page}.html', {'cars': cars})
    elif page.count('_') >= 3:
        id = page.split('_', 1)[0]
        car = Car.objects.get(id=id)
        return render(request, 'car.html', {'car': car})
    elif page == 'booking':
        Cars = Car.objects.filter(cannot_be_rented=False).values()
        for car in Cars:
            # створити список дат, в які дане авто недоступне
            dates_to_disable = set()
            for booking in BookingForm.objects.filter(car=Car.objects.get(id=car['id']), status__in=['new', 'needs_confirmation', 'confirmed', 'acquisition_today', 'in_rental', 'returning_today']):
                date_list = [str(booking.acquisition_date + datetime.timedelta(days=x)) for x in range(booking.rental_term + 1)]
                dates_to_disable.update(date_list)
            car['dates_to_disable'] = ','.join(list(dates_to_disable))
            car['prices'] = json.dumps(model_to_dict(Prices.objects.get(id=car['prices_id'])))
            car['image'] = Car.objects.get(id=car['id']).image.url
        return render(request, f'{page}.html', {'cars': Cars})
    elif page == 'bookings':
        return render(request, f'{page}.html', {'today': localdate()})
    elif page == 'administration':
        auth_token = request.GET.get('token')
        try:
            user = check_authentication(request, auth_token)
        except KeyError:
            return HttpResponseForbidden('Unauthorized')
        if isinstance(user, JsonResponse):
            return HttpResponseForbidden('Unauthorized')
        cars = Car.objects.filter(cannot_be_rented=False)
        workers = User.objects.filter(is_active=True, is_staff=True, is_superuser=False)
        return render(request, f'{page}.html', {'cars': cars, 'workers': workers, 'localdate': localdate()})
    else:
        return render(request, f'{page}.html')
