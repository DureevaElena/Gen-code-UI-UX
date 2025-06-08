from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings
import json
import os
from .models import Project

@ensure_csrf_cookie
@login_required
def form_builder(request, project_id=None):
    project = None
    if project_id:
        project = Project.objects.filter(id=project_id, user=request.user).first()
    return render(request, 'projects/form_builder.html', {'project': project})

@csrf_exempt
@login_required
def upload_image(request):
    if request.method == 'POST':
        try:
            image = request.FILES.get('image')
            if not image:
                return JsonResponse({'status': 'error', 'error': 'Файл не предоставлен'}, status=400)

            # Проверка, что файл является изображением
            if not image.content_type.startswith('image/'):
                return JsonResponse({'status': 'error', 'error': 'Файл должен быть изображением'}, status=400)

            # Создание директории для загрузок
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)

            # Генерация уникального имени файла
            file_name = f"{request.user.id}_{image.name}"
            file_path = os.path.join(upload_dir, file_name)

            # Сохранение файла
            with open(file_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            # Возвращаем относительный путь
            relative_path = os.path.join('uploads', file_name).replace('\\', '/')
            return JsonResponse({'status': 'success', 'file_path': f'/media/{relative_path}'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'error': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'error': 'Неверный метод запроса'}, status=400)

@login_required
def generate_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            elements = data.get('elements', [])
            form_name = data.get('name', 'Безымянная форма')

            html_code = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Generated Form</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n'
            css_code = 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}\n'

            for idx, element in enumerate(elements):
                element_id = f"{element['type']}{idx}"
                html_code += f'    <div style="position: absolute; left: {element.get("left", 0)}px; top: {element.get("top", 0)}px;">\n'
                if element['type'] == 'input':
                    placeholder = element.get('placeholder', 'Введите текст...')
                    html_code += f'        <input type="text" placeholder="{placeholder}" id="{element_id}" aria-label="{placeholder or "Поле ввода"}">\n'
                elif element['type'] == 'button':
                    text = element.get('text', 'Нажми меня')
                    html_code += f'        <button id="{element_id}" aria-label="{text or "Кнопка"}">{text}</button>\n'
                elif element['type'] == 'line':
                    html_code += f'        <hr id="{element_id}" role="separator" aria-label="Горизонтальная линия">\n'
                elif element['type'] == 'heading':
                    text = element.get('text', 'Заголовок')
                    html_code += f'        <h1 id="{element_id}" aria-label="{text or "Заголовок"}">{text}</h1>\n'
                elif element['type'] == 'rectangle':
                    html_code += f'        <div id="{element_id}" role="img" aria-label="Прямоугольник"></div>\n'
                elif element['type'] == 'image':
                    file_path = element.get('file_path', '/media/uploads/placeholder.jpg')
                    html_code += f'        <img src="{file_path}" id="{element_id}" alt="Изображение" aria-label="Изображение">\n'
                html_code += '    </div>\n'

                if element.get('customStyles'):
                    css_code += f'#{element_id} {{\n    {element["customStyles"]};\n}}\n'
                else:
                    if element['type'] == 'input':
                        css_code += f'#{element_id} {{\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}}\n'
                    elif element['type'] == 'button':
                        css_code += f'#{element_id} {{\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}}\n#{element_id}:hover {{\n    background-color: #0056b3;\n}}\n'
                    elif element['type'] == 'line':
                        css_code += f'#{element_id} {{\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 0;\n    height: 0;\n    width: {element.get("length", 100)}px;\n}}\n'
                    elif element['type'] == 'heading':
                        css_code += f'#{element_id} {{\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}}\n'
                    elif element['type'] == 'rectangle':
                        css_code += f'#{element_id} {{\n    width: {element.get("width", 100)}px;\n    height: {element.get("height", 50)}px;\n    background-color: #cccccc;\n    margin: 10px;\n}}\n'
                    elif element['type'] == 'image':
                        css_code += f'#{element_id} {{\n    width: {element.get("width", 100)}px;\n    height: {element.get("height", 50)}px;\n    margin: 10px;\n    object-fit: contain;\n}}\n'

            html_code += '</body>\n</html>'

            project = Project(
                user=request.user,
                name=form_name,
                html_code=html_code,
                css_code=css_code,
                elements=elements
            )
            project.save()

            return JsonResponse({'html': html_code, 'css': css_code, 'elements': elements})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Неверные JSON-данные'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Неверный метод запроса'}, status=400)
@login_required
def save_form(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form_name = data.get('name', 'Untitled Form')
            html_code = data.get('html_code', '')
            css_code = data.get('css_code', '')
            react_code = data.get('react_code', '')
            react_css_code = data.get('react_css_code', '')
            elements_data = data.get('elements', [])

            project = Project.objects.filter(name=form_name, user=request.user).first()
            if project:
                project.html_code = html_code
                project.css_code = css_code
                project.react_code = react_code
                project.react_css_code = react_css_code
                project.elements = elements_data
                project.save()
            else:
                project = Project(
                    user=request.user,
                    name=form_name,
                    html_code=html_code,
                    css_code=css_code,
                    react_code=react_code,
                    react_css_code=react_css_code,
                    elements=elements_data
                )
                project.save()
            return JsonResponse({'status': 'success'})
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=400)

@login_required
def project_list(request):
    projects = Project.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'projects/project_list.html', {'projects': projects})

@login_required
def create_project(request):
    if request.method == 'POST':
        project_name = request.POST.get('project_name')
        if project_name:
            project = Project(
                user=request.user,
                name=project_name,
                html_code='',
                css_code=''
            )
            project.save()
            return redirect('form_builder', project_id=project.id)
        else:
            return render(request, 'home.html', {'error': 'Название проекта не может быть пустым'})
    return render(request, 'home.html', {'error': 'Неверный запрос'})

@user_passes_test(lambda u: True)
def project_list_all(request):
    projects = Project.objects.all()
    return render(request, 'users/project_list.html', {'projects': projects})

@csrf_exempt
@login_required
def delete_project(request, project_id):
    if request.method == 'DELETE':
        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return JsonResponse({'status': 'success'})
        except Project.DoesNotExist:
            return JsonResponse({'status': 'error', 'error': 'Проект не найден'}, status=404)
    return JsonResponse({'status': 'error', 'error': 'Метод не поддерживается'}, status=405)