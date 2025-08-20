default:
    just --list

init:
    just migrate
    just collectstatic

makemigrations:
    poetry run python ./label_studio/manage.py makemigrations

migrate:
    poetry run python ./label_studio/manage.py migrate

collectstatic:
    poetry run python ./label_studio/manage.py collectstatic

runserver:
    poetry run python ./label_studio/manage.py runserver

frontend:
    yarn --cwd ./web/ dev

