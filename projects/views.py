from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
import json
from .models import Project

@ensure_csrf_cookie
@login_required
def form_builder(request, project_id=None):
    """
    Отображает страницу Form Builder для авторизованных пользователей.
    Если project_id передан, загружает данные проекта.
    """
    project = None
    if project_id:
        project = Project.objects.filter(id=project_id, user=request.user).first()
    return render(request, 'projects/form_builder.html', {'project': project})

@login_required
def generate_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            elements = data.get('elements', [])
            form_name = data.get('name', 'Untitled Form')

            html_code = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Generated Form</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n    <form style="display: flex; flex-direction: row; gap: 10px;">\n'
            css_code = 'body {\n    font-family: Arial, sans-serif;\n}\n'

            for idx, element in enumerate(elements):
                element_id = f"{element['type']}{idx}"
                if element['type'] == 'input':
                    html_code += f'        <input type="text" placeholder="{element["placeholder"]}" id="{element_id}">\n'
                elif element['type'] == 'button':
                    html_code += f'        <button id="{element_id}">{element["text"]}</button>\n'

                if element.get('customStyles'):
                    css_code += f'#{element_id} {{\n    {element["customStyles"]};\n}}\n'
                else:
                    if element['type'] == 'input':
                        css_code += f'#{element_id} {{\n    padding: 10px;\n    margin: 10px;\n    border: 1px solid #ccc;\n    border-radius: 4px;\n}}\n'
                    elif element['type'] == 'button':
                        css_code += f'#{element_id} {{\n    padding: 10px 20px;\n    margin: 10px;\n    background-color: #007BFF;\n    color: white;\n    border: none;\n    border-radius: 4px;\n    cursor: pointer;\n}}\n#{element_id}:hover {{\n    background-color: #0056b3;\n}}\n'

            html_code += '    </form>\n</body>\n</html>'

            project = Project(
                user=request.user,
                name=form_name,
                html_code=html_code,
                css_code=css_code
            )
            project.save()

            return JsonResponse({'html': html_code, 'css': css_code})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=400)

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

            project = Project(
                user=request.user,
                name=form_name,
                html_code=html_code,
                css_code=css_code,
                react_code=react_code,
                react_css_code=react_css_code
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
            # Перенаправляем на Form Builder с ID созданного проекта
            return redirect('form_builder', project_id=project.id)
        else:
            return render(request, 'home.html', {'error': 'Название проекта не может быть пустым'})
    return render(request, 'home.html', {'error': 'Неверный запрос'})