## DEVELOPER NOTE

Django should use the setting from label_studio.core.settings.label_studio

```python label_studio.core.settings.label_studio.py
from core.settings.base import *
...

```

### Run Development

The application need 2 parts to run the app.

Before you run these command please make sure you already have all dependencies and set all necessary environment variables in **_.env_**

```sh | run Django server
poetry run python ./label_studio/manage.py runserver

```

```sh | run yarn server
cd web

yarn run dev
```

> NOTE: Since we run our development environment with Minio, please also run minio in a container

```sh | start container
docker compose --env-file .env -f docker-compose.minio.dev.yml up -d
```

```sh | stop container
docker compose --env-file .env -f docker-compose.minio.dev.yml down --remove-orphans
```
