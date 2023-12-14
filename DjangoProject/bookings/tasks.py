from apscheduler.schedulers.background import BackgroundScheduler
from bookings.models import BookingForm
from rest_framework.authtoken.models import Token
from django.utils import timezone


def half_an_hour_task():
    twenty_four_hours_ago = timezone.localtime() - timezone.timedelta(hours=24)
    # зроблені понад 24 годин тому і не підтверджені стають відхилені
    BookingForm.objects.filter(status__in=['new', 'needs_confirmation'],
                               creation_time__lt=twenty_four_hours_ago).update(status='rejected', comment='Не підтверджено протягом 24 годин')
    with open('tasks.log', 'a+') as file:
        file.write(f'\n({timezone.localtime()}) Виконане півгодинне оновлення')


def daily_task():
    # зроблені на вже минулу дату і не підтверджені стають відхилені
    BookingForm.objects.filter(status__in=['new', 'needs_confirmation'],
                               acquisition_date__lt=timezone.localdate()).update(status='rejected', comment='Не підтверджено до кінця бажаного дня прокату')
    # підтверджені, дата отримання яких сьогодні, набувають статусу "Отримання сьогодні"
    BookingForm.objects.filter(status='confirmed', acquisition_date=timezone.localdate()).update(status='acquisition_today')
    # бронювання зі статусом "Отримання сьогодні", дата отримання яких уже пройшла, позначаються як "Прокат провалений"
    BookingForm.objects.filter(status='acquisition_today', acquisition_date__lt=timezone.localdate()).update(status='rental_failed', comment='Клієнт не прибув до салону в бажану дату отримання авто')
    # в прокаті, повернення сьогодні, даємо статус "повернення сьогодні"
    for booking in BookingForm.objects.filter(status='in_rental'):
        if booking.acquisition_date + timezone.timedelta(days=booking.rental_term) == timezone.localdate():
            booking.status = 'returning_today'
            booking.save()
    # видалити токени, які сьогодні стають недійсними
    Token.objects.filter(created__date__lte=timezone.localdate() - timezone.timedelta(days=7)).delete()
    with open('tasks.log', 'a+') as file:
        file.write(f'\n({timezone.localtime()}) Виконане добове оновлення')


def start():
    scheduler = BackgroundScheduler(timezone="Europe/Kiev")
    scheduler.add_job(half_an_hour_task, 'interval', minutes=30, next_run_time=timezone.now() + timezone.timedelta(seconds=5))
    scheduler.add_job(daily_task, 'cron', hour=0, minute=0, next_run_time=timezone.now() + timezone.timedelta(seconds=10))
    scheduler.start()
    with open('tasks.log', 'w') as file:
        file.write(f'({timezone.localtime()}) Планувальник завдань запущено разом з сервером')
