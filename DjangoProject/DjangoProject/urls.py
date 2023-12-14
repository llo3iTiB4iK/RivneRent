"""
URL configuration for DjangoProject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# from django.contrib import admin  # leave as comment if admin panel is not needed
from django.urls import path
from cars.views import manage_cars
from auth.views import login_view, logout_view, manage_users
from bookings.views import make_booking, bookings, captchas
from views import page_view


urlpatterns = [
    # path('admin/', admin.site.urls),  # leave as comment if admin panel is not needed
    path('', page_view),  # returns main page
    path('<str:page>.html', page_view),  # returns "page.html" page
    path('cars/<str:page>.html', page_view),  # returns "car.html" page with the car requested
    path('cars/', manage_cars),  # add, edit or delete cars
    path('make_booking/', make_booking),  # add booking
    path('bookings', bookings),  # get bookings or change one's status
    path('login/', login_view),  # log in
    path('logout/', logout_view),  # log out
    path('users/', manage_users),  # add, edit or delete workers
    path('discount/', make_booking),  # get discount for user
    path('captcha/', captchas)  # get or check captcha
]
