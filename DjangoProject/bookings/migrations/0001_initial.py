# Generated by Django 4.2.6 on 2023-10-27 14:17

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cars', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='BookingForm',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('full_name', models.CharField(max_length=200)),
                ('email', models.EmailField(max_length=320)),
                ('phone_number', models.CharField(max_length=13)),
                ('acquisition_date', models.DateField()),
                ('rental_term', models.PositiveSmallIntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(89)])),
                ('processed', models.BooleanField(default=False)),
                ('car', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='cars.car')),
            ],
        ),
    ]
