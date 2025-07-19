from django.contrib import admin
from guardian.admin import GuardedModelAdmin
from projects.models import Project


class ProjectAdmin(GuardedModelAdmin):
    pass

admin.site.register(Project, ProjectAdmin)
