# views.py
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

            if not image.content_type.startswith('image/'):
                return JsonResponse({'status': 'error', 'error': 'Файл должен быть изображением'}, status=400)

            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)

            file_name = f"{request.user.id}_{image.name}"
            file_path = os.path.join(upload_dir, file_name)

            with open(file_path, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

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

            # Начало HTML-кода
            html_code = '''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Form</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            display: grid;
            grid-template-rows: auto 1fr auto;
            min-height: 100vh;
        }
        header {
            background-color: #cce5ff;
            padding: 20px;
            border-bottom: 2px solid #339;
        }
        main {
            background-color: #e6ffe6;
            padding: 20px;
        }
        footer {
            background-color: #dcdcdc;
            text-align: center;
            padding: 10px;
            border-top: 2px solid #666;
        }
'''
            css_code = ''

            # Разделение элементов по секциям
            header_elements = []
            main_elements = []
            footer_elements = []

            for element in elements:
                section = element.get('section', 'main')
                if section == 'header':
                    header_elements.append(element)
                elif section == 'footer':
                    footer_elements.append(element)
                else:
                    main_elements.append(element)

            # Функция для генерации HTML и CSS для элемента
            def generate_element_code(element, idx, section):
                element_id = f"{section}-{element['type']}{idx}"
                html = ''
                css = ''
                if element['type'] == 'article':
                    html += f'    <article id="{element_id}">\n'
                    for child_idx, child in enumerate(element.get('children', [])):
                        child_id = f"{element_id}-child{child_idx}"
                        if child['type'] == 'input':
                            placeholder = child.get('placeholder', 'Введите текст...')
                            html += f'        <input type="text" placeholder="{placeholder}" id="{child_id}" aria-label="{placeholder or "Поле ввода"}">\n'
                        elif child['type'] == 'button':
                            text = child.get('text', 'Нажми меня')
                            html += f'        <button id="{child_id}" aria-label="{text or "Кнопка"}">{text}</button>\n'
                        elif child['type'] == 'heading':
                            text = child.get('text', 'Заголовок')
                            html += f'        <h1 id="{child_id}" aria-label="{text or "Заголовок"}">{text}</h1>\n'
                        elif child['type'] == 'rectangle':
                            html += f'        <div id="{child_id}" role="img" aria-label="Прямоугольник"></div>\n'
                        elif child['type'] == 'image':
                            file_path = child.get('file_path', '/media/uploads/placeholder.jpg')
                            html += f'        <img src="{file_path}" id="{child_id}" alt="Изображение" aria-label="Изображение">\n'
                        elif child['type'] == 'line':
                            html += f'        <hr id="{child_id}" role="separator" aria-label="Горизонтальная линия">\n'

                        if child.get('customStyles'):
                            css += f'#{child_id} {{\n    {child["customStyles"]};\n}}\n'
                        else:
                            if child['type'] == 'input':
                                css += f'#{child_id} {{\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}}\n'
                            elif child['type'] == 'button':
                                css += f'#{child_id} {{\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}}\n#{child_id}:hover {{\n    background-color: #0056b3;\n}}\n'
                            elif child['type'] == 'heading':
                                css += f'#{child_id} {{\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}}\n'
                            elif child['type'] == 'rectangle':
                                css += f'#{child_id} {{\n    width: {child.get("width", 100)}px;\n    height: {child.get("height", 50)}px;\n    background-color: #cccccc;\n    margin: 10px;\n}}\n'
                            elif child['type'] == 'image':
                                css += f'#{child_id} {{\n    width: {child.get("width", 100)}px;\n    height: {child.get("height", 50)}px;\n    margin: 10px;\n    object-fit: contain;\n}}\n'
                            elif child['type'] == 'line':
                                css += f'#{child_id} {{\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 10px;\n    width: {child.get("length", 100)}px;\n}}\n'
                    html += '    </article>\n'
                    css += f'#{element_id} {{\n    {element.get("customStyles", "background-color: white; padding: 10px; border: 1px solid #ccc; display: flex; flex-direction: column;")}\n}}\n'
                else:
                    if element['type'] == 'input':
                        placeholder = element.get('placeholder', 'Введите текст...')
                        html += f'    <input type="text" placeholder="{placeholder}" id="{element_id}" aria-label="{placeholder or "Поле ввода"}">\n'
                    elif element['type'] == 'button':
                        text = element.get('text', 'Нажми меня')
                        html += f'    <button id="{element_id}" aria-label="{text or "Кнопка"}">{text}</button>\n'
                    elif element['type'] == 'heading':
                        text = element.get('text', 'Заголовок')
                        html += f'    <h1 id="{element_id}" aria-label="{text or "Заголовок"}">{text}</h1>\n'
                    elif element['type'] == 'rectangle':
                        html += f'    <div id="{element_id}" role="img" aria-label="Прямоугольник"></div>\n'
                    elif element['type'] == 'image':
                        file_path = element.get('file_path', '/media/uploads/placeholder.jpg')
                        html += f'    <img src="{file_path}" id="{element_id}" alt="Изображение" aria-label="Изображение">\n'
                    elif element['type'] == 'line':
                        html += f'    <hr id="{element_id}" role="separator" aria-label="Горизонтальная линия">\n'

                    if element.get('customStyles'):
                        css += f'#{element_id} {{\n    {element["customStyles"]};\n}}\n'
                    else:
                        if element['type'] == 'input':
                            css += f'#{element_id} {{\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}}\n'
                        elif element['type'] == 'button':
                            css += f'#{element_id} {{\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}}\n#{element_id}:hover {{\n    background-color: #0056b3;\n}}\n'
                        elif element['type'] == 'heading':
                            css += f'#{element_id} {{\n    margin: 10px;\n    font-size: 24px;\n    font-weight: bold;\n}}\n'
                        elif element['type'] == 'rectangle':
                            css += f'#{element_id} {{\n    width: {element.get("width", 100)}px;\n    height: {element.get("height", 50)}px;\n    background-color: #cccccc;\n    margin: 10px;\n}}\n'
                        elif element['type'] == 'image':
                            css += f'#{element_id} {{\n    width: {element.get("width", 100)}px;\n    height: {element.get("height", 50)}px;\n    margin: 10px;\n    object-fit: contain;\n}}\n'
                        elif element['type'] == 'line':
                            css += f'#{element_id} {{\n    border: none;\n    border-top: 2px solid #000000;\n    margin: 10px;\n    width: {element.get("length", 100)}px;\n}}\n'
                return html, css

            # Генерация HTML для header
            html_code += '    </style>\n</head>\n<body>\n<header>\n'
            for idx, element in enumerate(header_elements):
                h, c = generate_element_code(element, idx, 'header')
                html_code += h
                css_code += c

            # Генерация HTML для main
            html_code += '</header>\n<main>\n'
            for idx, element in enumerate(main_elements):
                h, c = generate_element_code(element, idx, 'main')
                html_code += h
                css_code += c

            # Генерация HTML для footer
            html_code += '</main>\n<footer>\n'
            for idx, element in enumerate(footer_elements):
                h, c = generate_element_code(element, idx, 'footer')
                html_code += h
                css_code += c

            html_code += '</footer>\n</body>\n</html>'

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