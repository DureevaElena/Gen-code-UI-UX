from django.urls import path
from .views import form_builder, generate_code, save_form, project_list, create_project

urlpatterns = [
    path('<int:project_id>/', form_builder, name='form_builder'),
    path('generate_code/', generate_code, name='generate_code'),
    path('save_form/', save_form, name='save_form'),
    path('list/', project_list, name='project_list'),
    path('create/', create_project, name='create_project'),
]