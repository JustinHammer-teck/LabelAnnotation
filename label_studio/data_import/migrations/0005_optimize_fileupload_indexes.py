"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
# Generated migration for optimizing FileUpload and Task indexes

from django.db import migrations, models, connection
from django.conf import settings
from core.redis import start_job_async_or_sync
from core.models import AsyncMigrationStatus
import logging

logger = logging.getLogger(__name__)

migration_name = '0005_optimize_fileupload_indexes'


def forward_migration(migration_name):
    migration = AsyncMigrationStatus.objects.create(
        name=migration_name,
        status=AsyncMigrationStatus.STATUS_STARTED,
    )
    logger.debug(f'Start async migration {migration_name}')

    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            # Add varchar_pattern_ops index on fileupload.file for ILIKE queries (file type filtering)
            cursor.execute('''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "fileupload_file_pattern_idx"
                ON "data_import_fileupload" ("file" varchar_pattern_ops);
            ''')

            # Add composite index on fileupload(project_id, id) for common query patterns
            cursor.execute('''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "fileupload_project_id_idx"
                ON "data_import_fileupload" ("project_id", "id");
            ''')

            # CRITICAL: Add index on task.file_upload_id (currently missing!)
            # This index is essential for COUNT queries on tasks filtered by file_upload_id
            cursor.execute('''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "task_file_upload_id_idx"
                ON "task" ("file_upload_id")
                WHERE "file_upload_id" IS NOT NULL;
            ''')

            # Add composite index on task(file_upload_id, is_labeled) for labeled count optimization
            # This optimizes queries like: SELECT COUNT(*) FROM task WHERE file_upload_id = X AND is_labeled = true
            cursor.execute('''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "task_file_upload_labeled_idx"
                ON "task" ("file_upload_id", "is_labeled")
                WHERE "file_upload_id" IS NOT NULL;
            ''')
        else:
            # SQLite fallback
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS "fileupload_file_pattern_idx"
                ON "data_import_fileupload" ("file");
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS "fileupload_project_id_idx"
                ON "data_import_fileupload" ("project_id", "id");
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS "task_file_upload_id_idx"
                ON "task" ("file_upload_id");
            ''')

            cursor.execute('''
                CREATE INDEX IF NOT EXISTS "task_file_upload_labeled_idx"
                ON "task" ("file_upload_id", "is_labeled");
            ''')

    migration.status = AsyncMigrationStatus.STATUS_FINISHED
    migration.save()
    logger.debug(f'Async migration {migration_name} complete')


def reverse_migration(migration_name):
    migration = AsyncMigrationStatus.objects.create(
        name=migration_name,
        status=AsyncMigrationStatus.STATUS_STARTED,
    )
    logger.debug(f'Start async migration rollback {migration_name}')

    with connection.cursor() as cursor:
        if connection.vendor == 'postgresql':
            cursor.execute('DROP INDEX CONCURRENTLY IF EXISTS "fileupload_file_pattern_idx";')
            cursor.execute('DROP INDEX CONCURRENTLY IF EXISTS "fileupload_project_id_idx";')
            cursor.execute('DROP INDEX CONCURRENTLY IF EXISTS "task_file_upload_id_idx";')
            cursor.execute('DROP INDEX CONCURRENTLY IF EXISTS "task_file_upload_labeled_idx";')
        else:
            cursor.execute('DROP INDEX IF EXISTS "fileupload_file_pattern_idx";')
            cursor.execute('DROP INDEX IF EXISTS "fileupload_project_id_idx";')
            cursor.execute('DROP INDEX IF EXISTS "task_file_upload_id_idx";')
            cursor.execute('DROP INDEX IF EXISTS "task_file_upload_labeled_idx";')

    migration.status = AsyncMigrationStatus.STATUS_FINISHED
    migration.save()
    logger.debug(f'Async migration rollback {migration_name} complete')


def forwards(apps, schema_editor):
    start_job_async_or_sync(forward_migration, migration_name=migration_name)


def backwards(apps, schema_editor):
    start_job_async_or_sync(reverse_migration, migration_name=migration_name)


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("data_import", "0004_enhance_fileupload_model"),
        ("tasks", "0056_alter_task_options"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
