import json
from django.contrib.auth import authenticate, login
from django.views import View
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .forms import UserCreationForm
from .models import User  # Импортируем кастомную модель User из users.models
from django.contrib.auth.decorators import user_passes_test, login_required


@method_decorator(csrf_exempt, name='dispatch')
class Register(View):
    template_name = 'registration/register.html'

    def get(self, request):
        context = {
            'form': UserCreationForm()
        }
        return render(request, self.template_name, context)

    def post(self, request):
        form = UserCreationForm(request.POST)

        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=password)
            login(request, user)
            return redirect('home')
        context = {
            'form': form
        }
        return render(request, self.template_name, context)

@csrf_exempt
def update_user(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'error', 'error': 'Пользователь не авторизован'}, status=403)

        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')

            if not username or not email:
                return JsonResponse({'status': 'error', 'error': 'Имя пользователя и email не могут быть пустыми'}, status=400)

            # Проверка уникальности имени пользователя и email
            if User.objects.filter(username=username).exclude(id=request.user.id).exists():
                return JsonResponse({'status': 'error', 'error': 'Имя пользователя уже занято'}, status=400)
            if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                return JsonResponse({'status': 'error', 'error': 'Email уже используется'}, status=400)

            # Обновляем данные пользователя
            user = request.user
            user.username = username
            user.email = email
            user.save()

            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'error': 'Неверный формат данных'}, status=400)
    return JsonResponse({'status': 'error', 'error': 'Метод не поддерживается'}, status=405)


from django.contrib.auth.decorators import user_passes_test

@user_passes_test(lambda u: True)
def user_list(request):
    users = User.objects.all()
    return render(request, 'users/user_list.html', {'users': users})

@csrf_exempt
@login_required
def delete_user(request, user_id):
    if request.method == 'DELETE':
        try:
            user = User.objects.get(id=user_id)
            # Не позволяем пользователю удалить самого себя
            if user == request.user:
                return JsonResponse({'status': 'error', 'error': 'Вы не можете удалить самого себя'}, status=403)
            user.delete()
            return JsonResponse({'status': 'success'})
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'error': 'Пользователь не найден'}, status=404)
    return JsonResponse({'status': 'error', 'error': 'Метод не поддерживается'}, status=405)