from django.apps import AppConfig
import os


class BookingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'bookings'
    # start scheduled tasks
    if os.environ.get('RUN_MAIN'):
        def ready(self):
            from . import tasks
            tasks.start()
