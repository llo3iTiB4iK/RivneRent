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


def page_view(request, page=''):
    if page == '':  # returns main page
        return render(request, 'index.html')
    elif page == 'cars':  # returns rendered cars' list page
        cars = Car.objects.filter(cannot_be_rented=False)  # get available cars
        return render(request, f'{page}.html', {'cars': cars})
    elif page.count('_') >= 3:  # returns rendered page of specific car
        id = page.split('_', 1)[0]  # get id of requested car from url
        car = Car.objects.get(id=id)  # get car with requested id
        return render(request, 'car.html', {'car': car})
    elif page == 'booking':  # returns rendered page of sending the booking form
        Cars = Car.objects.filter(cannot_be_rented=False).values()  # get available cars as dictionary
        for car in Cars:  # for each car
            # create list of dates when this car is unavailable
            dates_to_disable = set()
            for booking in BookingForm.objects.filter(car=Car.objects.get(id=car['id']), status__in=['new', 'needs_confirmation', 'confirmed', 'acquisition_today', 'in_rental', 'returning_today']):
                date_list = [str(booking.acquisition_date + datetime.timedelta(days=x)) for x in range(booking.rental_term + 1)]
                dates_to_disable.update(date_list)
            car['dates_to_disable'] = ','.join(list(dates_to_disable))
            car['prices'] = json.dumps(model_to_dict(Prices.objects.get(id=car['prices_id'])))  # get prices for this car
            car['image'] = Car.objects.get(id=car['id']).image.url  # get image url for this car
        return render(request, f'{page}.html', {'cars': Cars})
    elif page == 'bookings':  # returns rendered employee's page of bookings
        return render(request, f'{page}.html', {'today': localdate()})
    elif page == 'administration':  # returns rendered administrator's page
        auth_token = request.GET.get('token')  # get authorization token from URL
        try:
            user = check_authentication(request, auth_token)  # check if the user is authorized
        except KeyError:
            return HttpResponseForbidden('Unauthorized')  # if there is no token in url, return error
        if isinstance(user, JsonResponse):
            return HttpResponseForbidden('Unauthorized')  # if auth check is failed, return error
        cars = Car.objects.filter(cannot_be_rented=False)  # get available cars
        workers = User.objects.filter(is_active=True, is_staff=True)  # get current workers
        return render(request, f'{page}.html', {'cars': cars, 'workers': workers, 'localdate': localdate()})
    else:  # returns other pages if they exist
        return render(request, f'{page}.html')
