from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator
from cars.models import Car
from django.contrib.auth.models import User


class BookingForm(models.Model):  # object of booking
    full_name = models.CharField(max_length=200)  # customer's full name
    email = models.EmailField(max_length=320, null=True, blank=True)  # customer's email (optional)
    phone_number = models.CharField(max_length=13, validators=[MinLengthValidator(13)])  # customer's phone number
    acquisition_date = models.DateField()  # car acquisition date in rental
    rental_term = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(89)])  # rental term
    car = models.ForeignKey(Car, on_delete=models.PROTECT)  # car to be rented

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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')  # current status of the booking
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)  # if booking was already confirmed, then by which worker
    creation_time = models.DateTimeField()  # when booking was made
    comment = models.CharField(max_length=300, null=True, blank=True)  # comment to this booking, made by worker or automatically
    price = models.PositiveIntegerField()  # calculated price of this rental
    discount = models.PositiveSmallIntegerField(validators=[MaxValueValidator(100)], default=0)  # personal discount percentage
    gps = models.BooleanField()  # does customer need gps as additional service
    child_seat = models.BooleanField()  # does customer need child seat as additional service
    delivery = models.BooleanField()  # does customer need car delivery as additional service
