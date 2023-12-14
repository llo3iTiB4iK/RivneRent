from django.db import models
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError


class Features(models.Model):
    engine_size = models.FloatField(validators=[MinValueValidator(0.1)])  # car's engine size

    FUEL_TYPE_CHOICES = (
        ('gasoline', 'Бензин'),
        ('diesel', 'Дизель'),
        ('gas/gasoline', 'Газ/бензин')
    )
    fuel_type = models.CharField(max_length=12, choices=FUEL_TYPE_CHOICES, default='gasoline')  # car's fuel type

    GEARBOX_CHOICES = (
        ('manual', 'Механіка'),
        ('automatic', 'Автомат'),
        ('robotic', 'Робот'),
        ('variator', 'Варіатор')
    )
    gearbox = models.CharField(max_length=10, choices=GEARBOX_CHOICES, default='manual')  # car's gearbox type

    seats = models.PositiveSmallIntegerField()  # car's number of seats

    CONDITIONER_CHOICES = (
        ('no', 'Відсутній'),
        ('conditioner', 'Кондиціонер'),
        ('climate control', 'Клімат-контроль')
    )
    conditioner = models.CharField(max_length=16, choices=CONDITIONER_CHOICES, default='no')  # car's type of conditioner

    fuel_consumption = models.FloatField(validators=[MinValueValidator(0)])  # car's fuel consumption


class Prices(models.Model):
    mortgage = models.PositiveIntegerField()  # mortgage when renting this car
    daily_1to3 = models.PositiveIntegerField()  # daily price when renting the car for 1 to 3 days
    daily_4to9 = models.PositiveIntegerField()  # daily price when renting the car for 4 to 9 days
    daily_10to25 = models.PositiveIntegerField()  # daily price when renting the car for 10 to 25 days
    daily_26to89 = models.PositiveIntegerField()  # daily price when renting the car for 26 to 89 days


def FileSizeValidator(image):
    """
    Function that checks whether file size not exceed the limit
    :param image: django.db.models.ImageField, car's image
    :return: None, ValidationError if image size exceeds the limit
    """
    file_size = image.file.size  # get the image's size
    megabyte_limit = 2.5  # max file size in megabytes
    if file_size > megabyte_limit * 1024 * 1024:  # if file size exceeds the limit
        raise ValidationError("Розмір файлу повинен бути менше {} МБ".format(megabyte_limit))


class Car(models.Model):
    make = models.CharField(max_length=40)  # car's make
    model = models.CharField(max_length=50)  # car's model
    year = models.PositiveIntegerField()  # car's production year

    CATEGORY_CHOICES = (
        ('economy', 'Бюджетні'),
        ('comfort', 'Комфорт'),
        ('crossover', 'Кросовери'),
        ('business', 'Бізнес'),
        ('sport', 'Спорт'),
        ('prem_4x4', 'Преміум 4х4')
    )
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)  # car's category

    image = models.ImageField(upload_to='', validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg']), FileSizeValidator])  # car's image
    features = models.ForeignKey(Features, on_delete=models.PROTECT)  # car's features
    prices = models.ForeignKey(Prices, on_delete=models.PROTECT)  # car's rental prices
    cannot_be_rented = models.BooleanField(default=False)  # True if car is not available for rental
