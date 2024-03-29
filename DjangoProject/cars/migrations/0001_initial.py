# Generated by Django 4.2.6 on 2023-10-25 11:00

import django.core.validators
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Features',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('engine_size', models.FloatField(validators=[django.core.validators.MinValueValidator(0.1)])),
                ('fuel_type', models.CharField(choices=[('gasoline', 'Бензин'), ('diesel', 'Дизель'), ('gas/gasoline', 'Газ/бензин')], default='gasoline', max_length=12)),
                ('gearbox', models.CharField(choices=[('manual', 'Механіка'), ('automatic', 'Автомат'), ('robotic', 'Робот'), ('variator', 'Варіатор')], default='manual', max_length=10)),
                ('seats', models.PositiveSmallIntegerField()),
                ('conditioner', models.CharField(choices=[('no', 'Відсутній'), ('conditioner', 'Кондиціонер'), ('climate control', 'Клімат-контроль')], default='no', max_length=16)),
                ('fuel_consumption', models.FloatField(validators=[django.core.validators.MinValueValidator(0)])),
            ],
        ),
        migrations.CreateModel(
            name='Prices',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('mortgage', models.PositiveIntegerField()),
                ('daily_1to3', models.PositiveIntegerField()),
                ('daily_4to9', models.PositiveIntegerField()),
                ('daily_10to25', models.PositiveIntegerField()),
                ('daily_26to89', models.PositiveIntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Car',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('make', models.CharField(max_length=40)),
                ('model', models.CharField(max_length=50)),
                ('year', models.PositiveIntegerField()),
                ('image', models.URLField(max_length=100)),
                ('features', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cars.features')),
                ('prices', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='cars.prices')),
            ],
        ),
    ]
