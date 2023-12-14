import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User


def check_authentication(request, key=None):
    if not key:
        key = request.META['HTTP_AUTHORIZATION'].split()[1]
    try:
        token = Token.objects.get(key=key)
        user = token.user
        if not user.is_authenticated or request.user != user:
            return JsonResponse({'message': 'Користувач не авторизований'}, status=401)
        return user
    except Token.DoesNotExist:
        return JsonResponse({'message': 'Користувач не авторизований'}, status=401)


def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        user = authenticate(request, username=data['username'], password=data['password'])
        if user is not None:
            login(request, user)
            role = 'employee'
            if user.is_superuser:
                role = 'admin'
            token, created = Token.objects.get_or_create(user=user)
            return JsonResponse({'message': 'Успішний вхід', 'role': role, 'token': token.key})
        else:
            return JsonResponse({'message': 'Неправильний логін та/або пароль'}, status=401)
    elif request.method == 'GET':
        user = check_authentication(request)
        if isinstance(user, JsonResponse):
            return user
        return JsonResponse({'authorized': True, 'role': 'admin' if user.is_superuser else 'employee'})
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def logout_view(request):
    if request.method == 'POST':
        logout(request)
        key = request.META['HTTP_AUTHORIZATION'].split()[1]
        Token.objects.get(key=key).delete()
        return JsonResponse({'message': 'Успішний вихід'})
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def manage_users(request):
    user = check_authentication(request)
    if isinstance(user, JsonResponse):
        return user
    if request.method == 'POST':
        data = json.loads(request.body)
        new_user = User.objects.create_user(username=data['username'], password=data['password'], is_staff=True, first_name=data['first_name'], last_name=data['last_name'], email=data['email'])
        user_data = {
            'id': new_user.id,
            'username': new_user.username,
            'first_name': new_user.first_name,
            'last_name': new_user.last_name,
            'email': new_user.email,
            'date_joined': new_user.date_joined.strftime("%d-%m-%Y"),
            'last_login': new_user.last_login if new_user.last_login else "Не входив"
        }
        return JsonResponse({'message': 'Успішне додавання','user': json.dumps(user_data)})
    elif request.method == 'PUT':
        data = json.loads(request.body)
        user = User.objects.get(id=data['user_id'])
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.username = data['username']
        user.email = data['email']
        user.save()
        return JsonResponse({'message': 'Успішне редагування'})
    elif request.method == 'DELETE':
        user = User.objects.get(id=request.body)
        user.is_active = False
        user.save()
        Token.objects.filter(user=user).delete()
        return JsonResponse({'message': 'Успішне видалення'})
    else:
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)
