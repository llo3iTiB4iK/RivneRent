from django.db import models
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.core.exceptions import ValidationError


class Features(models.Model):
    engine_size = models.FloatField(validators=[MinValueValidator(0.1)])

    FUEL_TYPE_CHOICES = (
        ('gasoline', 'Бензин'),
        ('diesel', 'Дизель'),
        ('gas/gasoline', 'Газ/бензин')
    )
    fuel_type = models.CharField(max_length=12, choices=FUEL_TYPE_CHOICES, default='gasoline')

    GEARBOX_CHOICES = (
        ('manual', 'Механіка'),
        ('automatic', 'Автомат'),
        ('robotic', 'Робот'),
        ('variator', 'Варіатор')
    )
    gearbox = models.CharField(max_length=10, choices=GEARBOX_CHOICES, default='manual')

    seats = models.PositiveSmallIntegerField()

    CONDITIONER_CHOICES = (
        ('no', 'Відсутній'),
        ('conditioner', 'Кондиціонер'),
        ('climate control', 'Клімат-контроль')
    )
    conditioner = models.CharField(max_length=16, choices=CONDITIONER_CHOICES, default='no')

    fuel_consumption = models.FloatField(validators=[MinValueValidator(0)])


class Prices(models.Model):
    mortgage = models.PositiveIntegerField()
    daily_1to3 = models.PositiveIntegerField()
    daily_4to9 = models.PositiveIntegerField()
    daily_10to25 = models.PositiveIntegerField()
    daily_26to89 = models.PositiveIntegerField()


def FileSizeValidator(image):
    file_size = image.file.size
    megabyte_limit = 2.5
    if file_size > megabyte_limit * 1024 * 1024:
        raise ValidationError("Розмір файлу повинен бути менше {} МБ".format(megabyte_limit))


class Car(models.Model):
    make = models.CharField(max_length=40)
    model = models.CharField(max_length=50)
    year = models.PositiveIntegerField()

    CATEGORY_CHOICES = (
        ('economy', 'Бюджетні'),
        ('comfort', 'Комфорт'),
        ('crossover', 'Кросовери'),
        ('business', 'Бізнес'),
        ('sport', 'Спорт'),
        ('prem_4x4', 'Преміум 4х4')
    )
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)

    image = models.ImageField(upload_to='', validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg']), FileSizeValidator])
    features = models.ForeignKey(Features, on_delete=models.PROTECT)
    prices = models.ForeignKey(Prices, on_delete=models.PROTECT)
    cannot_be_rented = models.BooleanField(default=False)
