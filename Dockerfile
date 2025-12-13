# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
ARG PYTHON_VERSION=3.13
ARG POETRY_VERSION=2.1.4
ARG VERSION_OVERRIDE
ARG BRANCH_OVERRIDE

################################ Overview

# This Dockerfile builds a Label Studio environment.
# It consists of five main stages:
# 1. "frontend-builder" - Compiles the frontend assets using Node.
# 2. "frontend-version-generator" - Generates version files for frontend sources.
# 3. "venv-builder" - Prepares the virtualenv environment.
# 4. "py-version-generator" - Generates version files for python sources.
# 5. "prod" - Creates the final production image with the Label Studio, Nginx, and other dependencies.

################################ Stage: frontend-builder (build frontend assets)
FROM --platform=${BUILDPLATFORM} node:${NODE_VERSION}-alpine AS frontend-builder
ENV BUILD_NO_SERVER=true \
    BUILD_NO_HASH=true \
    BUILD_NO_CHUNKS=true \
    BUILD_MODULE=true \
    YARN_CACHE_FOLDER=/root/web/.yarn \
    NX_CACHE_DIRECTORY=/root/web/.nx \
    NODE_ENV=production

WORKDIR /label-studio/web

RUN apk add --no-cache python3 make g++

RUN yarn config set registry https://registry.npmjs.org/ && \
    yarn config set network-timeout 1200000

COPY web/package.json web/yarn.lock ./
COPY web/tools tools
RUN --mount=type=cache,target=/root/web/.yarn,id=yarn-cache,sharing=locked \
    --mount=type=cache,target=/root/web/.nx,id=nx-cache,sharing=locked \
    yarn install --prefer-offline --no-progress --pure-lockfile --frozen-lockfile --ignore-engines --non-interactive --production=false

COPY web/ .
COPY pyproject.toml ../pyproject.toml
RUN --mount=type=cache,target=/root/web/.yarn,id=yarn-cache,sharing=locked \
    --mount=type=cache,target=/root/web/.nx,id=nx-cache,sharing=locked \
    yarn run build && \
    rm -rf node_modules .yarn .nx

################################ Stage: frontend-version-generator
FROM frontend-builder AS frontend-version-generator

RUN apk add --no-cache git

RUN --mount=type=cache,target=/root/web/.yarn,id=yarn-cache,sharing=locked \
    --mount=type=cache,target=/root/web/.nx,id=nx-cache,sharing=locked \
    --mount=type=bind,source=.git,target=../.git \
    yarn install --production=false --frozen-lockfile && \
    yarn version:libs

################################ Stage: easyocr-models (download OCR models)
FROM python:${PYTHON_VERSION}-slim-trixie AS easyocr-models

ENV PYTHONUNBUFFERED=1 \
    EASYOCR_MODULE_PATH=/opt/easyocr/models

WORKDIR /tmp

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get install --no-install-recommends -y \
        libgl1 libglib2.0-0t64; \
    apt-get autoremove -y

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install easyocr==1.7.2

RUN --mount=type=cache,target=/root/.EasyOCR,id=easyocr-cache,sharing=locked \
    mkdir -p ${EASYOCR_MODULE_PATH} && \
    python3 -c "import easyocr; easyocr.Reader(['ch_sim', 'en'], gpu=False, download_enabled=True, model_storage_directory='${EASYOCR_MODULE_PATH}')" && \
    echo "EasyOCR models downloaded successfully" && \
    ls -lh ${EASYOCR_MODULE_PATH}

################################ Stage: venv-builder (prepare the virtualenv)
FROM python:${PYTHON_VERSION}-slim-trixie AS venv-builder
ARG POETRY_VERSION

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_CACHE_DIR="/.cache" \
    POETRY_CACHE_DIR="/.poetry-cache" \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_VIRTUALENVS_PREFER_ACTIVE_PYTHON=true \
    PATH="/opt/poetry/bin:$PATH"

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install poetry==${POETRY_VERSION}

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get install --no-install-recommends -y build-essential git; \
    apt-get autoremove -y

WORKDIR /label-studio

ENV VENV_PATH="/label-studio/.venv"
ENV PATH="$VENV_PATH/bin:$PATH"

COPY pyproject.toml poetry.lock README.md ./

ARG INCLUDE_DEV=false

RUN --mount=type=cache,target=/.poetry-cache,id=poetry-cache,sharing=locked \
    poetry check --lock && \
    if [ "$INCLUDE_DEV" = "true" ]; then \
        poetry install --no-root --extras uwsgi --with test; \
    else \
        poetry install --no-root --without test --extras uwsgi; \
    fi

COPY label_studio label_studio
RUN --mount=type=cache,target=/.poetry-cache,id=poetry-cache,sharing=locked \
    poetry install --only-root --extras uwsgi && \
    python3 label_studio/manage.py collectstatic --no-input && \
    find $VENV_PATH -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
    find $VENV_PATH -type f -name '*.pyc' -delete && \
    find $VENV_PATH -type f -name '*.pyo' -delete && \
    find $VENV_PATH/lib/python*/site-packages -type d -name 'tests' ! -path '*/django/*' -exec rm -rf {} + 2>/dev/null || true && \
    find $VENV_PATH/lib/python*/site-packages -type d -name 'test' ! -path '*/django/*' -exec rm -rf {} + 2>/dev/null || true && \
    rm -rf $VENV_PATH/src

################################ Stage: py-version-generator
FROM venv-builder AS py-version-generator
ARG VERSION_OVERRIDE
ARG BRANCH_OVERRIDE

RUN --mount=type=bind,source=.git,target=./.git \
    VERSION_OVERRIDE=${VERSION_OVERRIDE} BRANCH_OVERRIDE=${BRANCH_OVERRIDE} poetry run python label_studio/core/version.py

################################### Stage: prod
FROM python:${PYTHON_VERSION}-slim-trixie AS production

ENV LS_DIR=/label-studio \
    HOME=/label-studio \
    LABEL_STUDIO_BASE_DATA_DIR=/label-studio/data \
    OPT_DIR=/opt/heartex/instance-data/etc \
    VENV_PATH=/label-studio/.venv \
    DJANGO_SETTINGS_MODULE=core.settings.label_studio \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    EASYOCR_MODULE_PATH=/opt/easyocr/models

ENV PATH="$VENV_PATH/bin:$PATH"

WORKDIR $LS_DIR

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    set -eux; \
    apt-get update; \
    apt-get upgrade -y; \
    apt-get install --no-install-recommends -y \
        libexpat1 libgl1 libglx-mesa0 libglib2.0-0t64 \
        gnupg2 curl nginx; \
    apt-get autoremove -y; \
    rm -rf /tmp/* /var/tmp/*

RUN set -eux; \
    mkdir -p $LS_DIR $LABEL_STUDIO_BASE_DATA_DIR $OPT_DIR \
        $LABEL_STUDIO_BASE_DATA_DIR/media \
        $LABEL_STUDIO_BASE_DATA_DIR/upload && \
    chown -R 1001:0 $LS_DIR $LABEL_STUDIO_BASE_DATA_DIR $OPT_DIR /var/log/nginx /etc/nginx

COPY --chown=1001:0 deploy/default.conf /etc/nginx/nginx.conf
COPY --chown=1001:0 pyproject.toml poetry.lock README.md ./
COPY --chown=1001:0 LICENSE LICENSE
COPY --chown=1001:0 licenses licenses
COPY --chown=1001:0 deploy deploy

RUN cd $LS_DIR/deploy/docker-entrypoint.d && \
    rm -f app/11-configure-custom-cabundle.sh app/20-wait-for-db.sh app/30-run-db-migrations.sh && \
    rm -f app-init/11-configure-custom-cabundle.sh app-init/20-wait-for-db.sh && \
    rm -f nginx/10-configure-nginx.sh && \
    cp common/11-configure-custom-cabundle.sh app/11-configure-custom-cabundle.sh && \
    cp common/20-wait-for-db.sh app/20-wait-for-db.sh && \
    cp common/30-run-db-migrations.sh app/30-run-db-migrations.sh && \
    cp common/11-configure-custom-cabundle.sh app-init/11-configure-custom-cabundle.sh && \
    cp common/20-wait-for-db.sh app-init/20-wait-for-db.sh && \
    cp common/10-configure-nginx.sh nginx/10-configure-nginx.sh && \
    chmod +x common/*.sh app/*.sh app-init/*.sh nginx/*.sh

COPY --chown=1001:0 --from=venv-builder $VENV_PATH $VENV_PATH
COPY --chown=1001:0 --from=venv-builder $LS_DIR/label_studio $LS_DIR/label_studio
COPY --chown=1001:0 --from=py-version-generator $LS_DIR/label_studio/core/version_.py $LS_DIR/label_studio/core/version_.py
COPY --chown=1001:0 --from=frontend-builder $LS_DIR/web/dist $LS_DIR/web/dist
COPY --chown=1001:0 --from=frontend-version-generator $LS_DIR/web/dist/apps/labelstudio/version.json $LS_DIR/web/dist/apps/labelstudio/version.json
COPY --chown=1001:0 --from=frontend-version-generator $LS_DIR/web/dist/libs/editor/version.json $LS_DIR/web/dist/libs/editor/version.json
COPY --chown=1001:0 --from=frontend-version-generator $LS_DIR/web/dist/libs/datamanager/version.json $LS_DIR/web/dist/libs/datamanager/version.json
COPY --chown=1001:0 --from=easyocr-models /opt/easyocr/models /opt/easyocr/models

USER 1001

EXPOSE 8080

ENTRYPOINT ["./deploy/docker-entrypoint.sh"]
CMD ["label-studio"]
