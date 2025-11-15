#!/bin/sh
set -e ${DEBUG:+-x}

echo >&3 "=> Setting up initial users and organization..."

has_legacy_config() {
    [ -n "$DJANGO_INITIAL_USER_EMAIL" ] && [ -n "$DJANGO_INITIAL_USER_PASSWORD" ]
}

has_indexed_config() {
    [ -n "$DJANGO_INITIAL_USERS_COUNT" ] && [ "$DJANGO_INITIAL_USERS_COUNT" -gt 0 ]
}

if ! has_legacy_config && ! has_indexed_config; then
    echo >&3 "=> No initial user configuration found, skipping user setup"
    exit 0
fi

if has_indexed_config; then
    echo >&3 "=> Using indexed user configuration (count: $DJANGO_INITIAL_USERS_COUNT)"
    export USER_CONFIG_MODE="indexed"
elif has_legacy_config; then
    echo >&3 "=> Using legacy single user configuration"
    export USER_CONFIG_MODE="legacy"
    export DJANGO_INITIAL_USERS_COUNT=1
    export DJANGO_INITIAL_USER_1_EMAIL="$DJANGO_INITIAL_USER_EMAIL"
    export DJANGO_INITIAL_USER_1_PASSWORD="$DJANGO_INITIAL_USER_PASSWORD"
    export DJANGO_INITIAL_USER_1_FIRSTNAME="${DJANGO_INITIAL_USER_FIRSTNAME:-}"
    export DJANGO_INITIAL_USER_1_LASTNAME="${DJANGO_INITIAL_USER_LASTNAME:-}"
    export DJANGO_INITIAL_USER_1_ROLE="${DJANGO_INITIAL_USER_ROLE:-annotator}"
fi

python3 /label-studio/label_studio/manage.py shell << 'EOF'
import os
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from organizations.models import Organization

User = get_user_model()

users_count = int(os.environ.get('DJANGO_INITIAL_USERS_COUNT', 0))
org_title = os.environ.get('DJANGO_ORGANIZATION_TITLE', 'Label Annotation')
superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if users_count == 0:
    print("No users to create, exiting")
    exit()

first_user_email = os.environ.get('DJANGO_INITIAL_USER_1_EMAIL')
if User.objects.filter(email=first_user_email).exists():
    print(f"User with email {first_user_email} already exists, skipping initial setup")
    exit()

manager_group, _ = Group.objects.get_or_create(name='Manager')
annotator_group, _ = Group.objects.get_or_create(name='Annotator')

org = None
created_users = []

for i in range(1, users_count + 1):
    email = os.environ.get(f'DJANGO_INITIAL_USER_{i}_EMAIL')
    password = os.environ.get(f'DJANGO_INITIAL_USER_{i}_PASSWORD')
    firstname = os.environ.get(f'DJANGO_INITIAL_USER_{i}_FIRSTNAME', '')
    lastname = os.environ.get(f'DJANGO_INITIAL_USER_{i}_LASTNAME', '')
    role = os.environ.get(f'DJANGO_INITIAL_USER_{i}_ROLE', 'manager')

    if not email or not password:
        print(f"Skipping user {i}: missing email or password")
        continue

    if User.objects.filter(email=email).exists():
        print(f"User {email} already exists, skipping")
        continue

    print(f"Creating user {i}: {email}")

    user = User.objects.create_user(
        email=email,
        password=password,
        first_name=firstname,
        last_name=lastname
    )
    user.username = user.email.split('@')[0]
    user.save()

    if i == 1:
        print(f"Creating organization: {org_title}")
        org = Organization.create_organization(created_by=user, title=org_title)
    else:
        org.add_user(user)

    user.active_organization = org
    user.save(update_fields=['active_organization'])

    if role == 'manager':
        user.groups.add(manager_group)
        print(f"User {email} created and assigned Manager role")
    else:
        user.groups.add(annotator_group)
        print(f"User {email} created with default role")

    created_users.append(email)

if org and superuser_email and superuser_password:
    if not User.objects.filter(email=superuser_email).exists():
        print(f"Creating superuser: {superuser_email}")

        superuser = User.objects.create_superuser(
            email=superuser_email,
            password=superuser_password
        )
        superuser.username = superuser.email.split('@')[0]
        superuser.save()

        org.add_user(superuser)
        superuser.active_organization = org
        superuser.save(update_fields=['active_organization'])
        superuser.groups.add(manager_group)

        print(f"Superuser {superuser_email} created and assigned Manager role")

print(f"Initial setup completed: {len(created_users)} user(s) created")
EOF

echo >&3 "=> Initial users and organization setup completed."