from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator
from cars.models import Car
from django.contrib.auth.models import User


class BookingForm(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(max_length=320, null=True, blank=True)
    phone_number = models.CharField(max_length=13, validators=[MinLengthValidator(13)])
    acquisition_date = models.DateField()
    rental_term = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(89)])
    car = models.ForeignKey(Car, on_delete=models.PROTECT)

    STATUS_CHOICES = (
        ('new', 'Нові'),
        ('needs_confirmation', 'Потребують підтвердження'),
        ('confirmed', 'Підтверджені'),
        ('rejected', 'Відхилені'),
        ('acquisition_today', 'Отримання сьогодні'),
        ('rental_failed', 'Прокат зірваний'),
        ('in_rental', 'В прокаті'),
        ('returning_today', 'Повернення сьогодні'),
        ('rental_successful', 'Прокат успішний')
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    creation_time = models.DateTimeField()
    comment = models.CharField(max_length=300, null=True, blank=True)
    price = models.PositiveIntegerField()
    discount = models.PositiveSmallIntegerField(validators=[MaxValueValidator(100)], default=0)
    gps = models.BooleanField()
    child_seat = models.BooleanField()
    delivery = models.BooleanField()
