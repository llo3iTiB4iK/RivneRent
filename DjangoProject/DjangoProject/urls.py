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
from django.contrib import admin
from django.urls import path
from cars.views import manage_cars
from auth.views import login_view, logout_view, manage_users
from bookings.views import make_booking, bookings, captchas
from views import page_view
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html')),
    path('<str:page>.html', page_view),
    path('cars/<str:page>.html', page_view),
    path('cars/', manage_cars),
    path('make_booking/', make_booking),
    path('bookings', bookings),
    path('login/', login_view),
    path('logout/', logout_view),
    path('users/', manage_users),
    path('discount/', make_booking),
    path('captcha/', captchas)
]
