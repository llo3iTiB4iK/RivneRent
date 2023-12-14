# Generated by Django 4.2.6 on 2023-10-31 21:47

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('bookings', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='bookingform',
            name='processed',
        ),
        migrations.AddField(
            model_name='bookingform',
            name='confirmed_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='bookingform',
            name='creation_time',
            field=models.DateTimeField(default=datetime.datetime(2023, 10, 31, 21, 47, 2, 893281, tzinfo=datetime.timezone.utc)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='bookingform',
            name='status',
            field=models.CharField(choices=[('new', 'Нові'), ('needs_confirmation', 'Потребують підтвердження'), ('confirmed', 'Підтверджені'), ('rejected', 'Відхилені'), ('rental_failed', 'Прокат зірваний'), ('rental_successful', 'Прокат успішний')], default='new', max_length=20),
        ),
        migrations.AlterField(
            model_name='bookingform',
            name='email',
            field=models.EmailField(max_length=320, null=True),
        ),
    ]
