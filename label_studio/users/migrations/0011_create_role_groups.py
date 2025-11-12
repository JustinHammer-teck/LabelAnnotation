from django.db import migrations


def create_role_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')

    roles = ['Annotator', 'Researcher', 'Manager']
    for role in roles:
        Group.objects.get_or_create(name=role)


def remove_role_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['Annotator', 'Researcher', 'Manager']).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0010_userproducttour'),
    ]

    operations = [
        migrations.RunPython(create_role_groups, remove_role_groups),
    ]
