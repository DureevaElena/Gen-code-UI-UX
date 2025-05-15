from django.db import models
from django.conf import settings

class Project(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, default="Untitled Form")
    html_code = models.TextField()
    css_code = models.TextField()
    react_code = models.TextField(blank=True)
    react_css_code = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.user.username}"