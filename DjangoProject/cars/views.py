import json
from django.http import JsonResponse
from cars.models import Car, Prices, Features
from bookings.models import BookingForm
from auth.views import check_authentication
from django.core.exceptions import ValidationError


def manage_cars(request):
    user = check_authentication(request)
    if isinstance(user, JsonResponse):
        return user
    if request.method == 'POST' and request.POST.get('_method') == 'POST':
        data = json.loads(request.POST['data'])
        new_prices = Prices(
            daily_1to3=data['price_1to3'],
            daily_4to9=data['price_4to9'],
            daily_10to25=data['price_10to25'],
            daily_26to89=data['price_26to89'],
            mortgage=data['mortgage']
        )
        fuel_type_value = next(item[0] for item in Features.FUEL_TYPE_CHOICES if item[1] == data['fuel_type'])
        gearbox_value = next(item[0] for item in Features.GEARBOX_CHOICES if item[1] == data['gearbox'])
        conditioner_value = next(item[0] for item in Features.CONDITIONER_CHOICES if item[1] == data['conditioner'])
        new_features = Features(
            engine_size=data['engine_size'],
            fuel_type=fuel_type_value,
            gearbox=gearbox_value,
            seats=data['seats'],
            conditioner=conditioner_value,
            fuel_consumption=data['fuel_consumption']
        )
        category_value = next(item[0] for item in Car.CATEGORY_CHOICES if item[1] == data['category'])
        new_car = Car(
            make=data['make'],
            model=data['model'],
            year=data['year'],
            category=category_value
        )
        try:
            new_prices.full_clean()
            new_prices.save()
            new_features.full_clean()
            new_features.save()
            new_car.prices = new_prices
            new_car.features = new_features
            image_file = request.FILES['image']
            new_car.image.save(image_file.name, image_file, save=True)
            new_car.full_clean()
            new_car.save()
        except ValidationError as e:
            return JsonResponse({'message': 'Валідація не пройдена. Ви намагаєтесь внести невірні дані! Більш докладна інформація в консолі.', 'validation_error': str(e)}, status=400)
        return JsonResponse({'message': 'Успішне додавання'})
    elif request.method == 'POST' and request.POST.get('_method') == 'PUT':
        data = json.loads(request.POST['data'])
        fuel_type_value = next(item[0] for item in Features.FUEL_TYPE_CHOICES if item[1] == data['fuel_type'])
        gearbox_value = next(item[0] for item in Features.GEARBOX_CHOICES if item[1] == data['gearbox'])
        conditioner_value = next(item[0] for item in Features.CONDITIONER_CHOICES if item[1] == data['conditioner'])
        category_value = next(item[0] for item in Car.CATEGORY_CHOICES if item[1] == data['category'])
        car = Car.objects.get(id=data['id'])
        car.make = data['make']
        car.model = data['model']
        car.year = data['year']
        car.category = category_value
        car.features.engine_size = data['engine_size']
        car.features.fuel_type = fuel_type_value
        car.features.gearbox = gearbox_value
        car.features.seats = data['seats']
        car.features.conditioner = conditioner_value
        car.features.fuel_consumption = data['fuel_consumption']
        car.prices.daily_1to3 = data['price_1to3']
        car.prices.daily_4to9 = data['price_4to9']
        car.prices.daily_10to25 = data['price_10to25']
        car.prices.daily_26to89 = data['price_26to89']
        car.prices.mortgage = data['mortgage']
        if len(request.FILES):
            car.image.delete(save=False)
            image_file = request.FILES['image']
            car.image.save(image_file.name, image_file, save=True)
        car.features.save()
        car.prices.save()
        car.save()
        return JsonResponse({'message': 'Успішне редагування'})
    elif request.method == 'DELETE':
        car = Car.objects.get(id=request.body)
        car.cannot_be_rented = True
        car.save()
        BookingForm.objects.filter(car=car, status__in=['new', 'needs_confirmation', 'confirmed', 'acquisition_today']).update(status='rejected')
        return JsonResponse({'message': 'Успішне видалення'})
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)
