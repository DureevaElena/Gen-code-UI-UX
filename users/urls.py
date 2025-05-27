from django.urls import path, include
from .views import Register, update_user, user_list, delete_user

urlpatterns = [
    path('', include('django.contrib.auth.urls')),
    path('register/', Register.as_view(), name='register'),
    path('update_user/', update_user, name='update_user'),
    path('users/', user_list, name='user_list'),
path('users/delete/<int:user_id>/', delete_user, name='delete_user'),

]