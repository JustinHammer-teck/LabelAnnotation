default:
    just --list

init:
    just migrate
    just collectstatic

default_setting:
    DJANGO_SETTINGS_MODULE=core.settings.label_studio;

dev_setting:
    DJANGO_SETTINGS_MODULE=core.settings.cus_label_studio;

makemigrations:
    poetry run python ./label_studio/manage.py makemigrations

migrate:
    poetry run python ./label_studio/manage.py migrate

collectstatic:
    poetry run python ./label_studio/manage.py collectstatic

runserver:
    poetry run python ./label_studio/manage.py runserver

rundev: dev_setting
    just runserver

frontend:
    yarn --cwd ./web/ dev

