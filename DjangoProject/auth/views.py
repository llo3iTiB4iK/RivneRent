import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User


def check_authentication(request, key=None):
    """
    This function is designed to check authentication
    :param request: django.http.request object
    :param key: authorization token as str object, if blank - got from 'HTTP_AUTHORIZATION' request header
    :return: django.contrib.auth.models.User object if authorization successful else django.http.JsonResponse object with corresponding message
    """
    if not key:  # if key parameter not assigned when calling function
        key = request.META['HTTP_AUTHORIZATION'].split()[1]  # get token from 'HTTP_AUTHORIZATION' request header
    try:
        token = Token.objects.get(key=key)  # get token object from token tokens' db
        user = token.user  # get this token's user
        if not user.is_authenticated or request.user != user:  # check token user's authentication and compare request user and token user
            return JsonResponse({'message': 'Користувач не авторизований'}, status=401)
        return user
    except Token.DoesNotExist:  # process case when token by key is not found
        return JsonResponse({'message': 'Користувач не авторизований'}, status=401)


def login_view(request):
    if request.method == 'POST':  # POST request processing
        data = json.loads(request.body.decode('utf-8'))  # create object from json string in request's body
        user = authenticate(request, username=data['username'], password=data['password'])  # find user
        if user is not None:  # if user is found
            login(request, user)  # authorize user
            # set the role which will be returned
            role = 'employee'
            if user.is_superuser:
                role = 'admin'
            token, created = Token.objects.get_or_create(user=user)  # create token for this authorization
            return JsonResponse({'message': 'Успішний вхід', 'role': role, 'token': token.key})
        else:  # if user is not found
            return JsonResponse({'message': 'Неправильний логін та/або пароль'}, status=401)
    elif request.method == 'GET':  # process GET request
        user = check_authentication(request)  # check authentication using function below
        if isinstance(user, JsonResponse):  # if function did not return specific user, return error
            return user
        # if authorization is ok, return corresponding message and role of the user
        return JsonResponse({'authorized': True, 'role': 'admin' if user.is_superuser else 'employee'})
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def logout_view(request):
    if request.method == 'POST':  # process POST request
        logout(request)  # cancel the authorization
        key = request.META['HTTP_AUTHORIZATION'].split()[1]  # get authorization token from request
        Token.objects.get(key=key).delete()  # delete the token from db
        return JsonResponse({'message': 'Успішний вихід'})
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)


def manage_users(request):
    user = check_authentication(request)  # check authentication using function below
    if isinstance(user, JsonResponse):  # if function did not return specific user, return error
        return user
    if request.method == 'POST':  # process POST request
        data = json.loads(request.body)  # create object from json string in request body
        # create new user
        new_user = User.objects.create_user(username=data['username'], password=data['password'], is_staff=True, first_name=data['first_name'], last_name=data['last_name'], email=data['email'])
        # get newly created user's fields
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
    elif request.method == 'PUT':  # process PUT request
        data = json.loads(request.body)  # create object from json string in request body
        user = User.objects.get(id=data['user_id'])  # get user object that will be changed
        # change the values of user object's editable fields
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        user.username = data['username']
        user.email = data['email']
        try:  # if new password was passed in request body, set new password for this user
            user.set_password(data['new_password'])
        except KeyError:
            pass
        user.save()  # save the changes
        return JsonResponse({'message': 'Успішне редагування'})
    elif request.method == 'DELETE':  # process DELETE request
        user = User.objects.get(id=request.body)  # get user object that will be "deleted"
        user.is_active = False  # we do not delete user object but set is_active attribute to False, thus this user can't log in anymore
        user.save()  # save changes
        Token.objects.filter(user=user).delete()  # delete authorization tokens for this user so that user can't harm the system even if he is authorized at the moment of deletion
        return JsonResponse({'message': 'Успішне видалення'})
    else:  # if request method is any other
        return JsonResponse({'message': 'Метод не підтримується'}, status=405)
