from apscheduler.schedulers.background import BackgroundScheduler
from bookings.models import BookingForm
from rest_framework.authtoken.models import Token
from django.utils import timezone


def half_an_hour_task():
    twenty_four_hours_ago = timezone.localtime() - timezone.timedelta(hours=24)
    # bookings made at least 24 hours ago and yet not confirmed become rejected
    BookingForm.objects.filter(status__in=['new', 'needs_confirmation'],
                               creation_time__lt=twenty_four_hours_ago).update(status='rejected', comment='Не підтверджено протягом 24 годин')
    # create log in tasks.log file
    with open('tasks.log', 'a+') as file:
        file.write(f'\n({timezone.localtime()}) Half-an-hour-ly task is performed')


def daily_task():
    # bookings where acquisition date less than today's date and yet not confirmed become rejected
    BookingForm.objects.filter(status__in=['new', 'needs_confirmation'],
                               acquisition_date__lt=timezone.localdate()).update(status='rejected', comment='Не підтверджено до кінця бажаного дня прокату')
    # confirmed bookings where acquisition date is today, become having corresponding status
    BookingForm.objects.filter(status='confirmed', acquisition_date=timezone.localdate()).update(status='acquisition_today')
    # bookings where acquisition date less than today, and not still in rental, become having status "rental failed"
    BookingForm.objects.filter(status='acquisition_today', acquisition_date__lt=timezone.localdate()).update(status='rental_failed', comment='Клієнт не прибув до салону в бажану дату отримання авто')
    # bookings in rental, where it must be returning today, become having corresponding status
    for booking in BookingForm.objects.filter(status='in_rental'):
        if booking.acquisition_date + timezone.timedelta(days=booking.rental_term) == timezone.localdate():
            booking.status = 'returning_today'
            booking.save()
    # delete tokens that are older than 7 days
    Token.objects.filter(created__date__lte=timezone.localdate() - timezone.timedelta(days=7)).delete()
    # create log in tasks.log file
    with open('tasks.log', 'a+') as file:
        file.write(f'\n({timezone.localtime()}) Daily task is performed')


def start():  # start, set up a scheduler, create the corresponding log
    scheduler = BackgroundScheduler(timezone="Europe/Kiev")
    scheduler.add_job(half_an_hour_task, 'interval', minutes=30, next_run_time=timezone.now() + timezone.timedelta(seconds=5))
    scheduler.add_job(daily_task, 'cron', hour=0, minute=0, next_run_time=timezone.now() + timezone.timedelta(seconds=10))
    scheduler.start()
    with open('tasks.log', 'w') as file:
        file.write(f'({timezone.localtime()}) Task scheduler is run with server')
