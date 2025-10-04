#!/bin/sh
set -e ${DEBUG:+-x}

echo >&3 "=> Setting up initial user and organization..."

# Check if environment variables are set
if [ -z "$DJANGO_INITIAL_USER_EMAIL" ] || [ -z "$DJANGO_INITIAL_USER_PASSWORD" ]; then
    echo >&3 "=> No initial user configuration found, skipping user setup"
    exit 0
fi

# Run Django management command to create initial setup
python3 /label-studio/label_studio/manage.py shell << 'EOF'
import os
from django.contrib.auth import get_user_model
from organizations.models import Organization

User = get_user_model()

# Get environment variables
initial_email = os.environ.get('DJANGO_INITIAL_USER_EMAIL')
initial_password = os.environ.get('DJANGO_INITIAL_USER_PASSWORD')
initial_firstname = os.environ.get('DJANGO_INITIAL_USER_FIRSTNAME', '')
initial_lastname = os.environ.get('DJANGO_INITIAL_USER_LASTNAME', '')
org_title = os.environ.get('DJANGO_ORGANIZATION_TITLE', 'Label Annotation')
superuser_email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
superuser_password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

# Check if the specific user already exists
if User.objects.filter(email=initial_email).exists():
    print(f"User with email {initial_email} already exists, skipping initial setup")
    exit()

print(f"Creating initial user: {initial_email}")

# Create initial user (regular user)
user = User.objects.create_user(
    email=initial_email,
    password=initial_password,
    first_name=initial_firstname,
    last_name=initial_lastname
)
user.username = user.email.split('@')[0]
user.save()

print(f"Creating organization: {org_title}")

# Create organization with the initial user as owner
org = Organization.create_organization(created_by=user, title=org_title)

# Set user's active organization
user.active_organization = org
user.save(update_fields=['active_organization'])

print(f"User {initial_email} created and assigned to organization {org_title}")

# Create superuser if configured
if superuser_email and superuser_password:
    print(f"Creating superuser: {superuser_email}")

    superuser = User.objects.create_superuser(
        email=superuser_email,
        password=superuser_password
    )
    superuser.username = superuser.email.split('@')[0]
    superuser.save()

    # Add superuser to the organization
    org.add_user(superuser)
    superuser.active_organization = org
    superuser.save(update_fields=['active_organization'])

    print(f"Superuser {superuser_email} created and assigned to organization {org_title}")

print("Initial user and organization setup completed successfully")
EOF

echo >&3 "=> Initial user and organization setup completed."