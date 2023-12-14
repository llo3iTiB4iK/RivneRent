# Generated by Django 4.2.6 on 2023-10-31 21:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('cars', '0003_alter_car_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='car',
            name='cannot_be_rented',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='car',
            name='features',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='cars.features'),
        ),
        migrations.AlterField(
            model_name='car',
            name='prices',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='cars.prices'),
        ),
    ]
