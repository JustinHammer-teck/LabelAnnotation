# Label Studio Core - Django Backend Instructions

## RQ Background Jobs

**ALWAYS use `start_job_async_or_sync` instead of raw RQ queue operations.**

```python
from label_studio.core.redis import start_job_async_or_sync

#  CORRECT
start_job_async_or_sync(
    job_function,
    arg1, arg2,
    queue_name='default',    # Optional
    job_timeout=300,         # Optional
    in_seconds=0            # Optional delay
)

# L WRONG - Don't use raw RQ
queue = django_rq.get_queue('default')
queue.enqueue(job_function, arg1, arg2)
```

**Available queues**: `default`, `critical`, `heavy`, `cleanup`

**Best practices**:
- Pass IDs, not model instances
- Handle exceptions in job functions
- Use appropriate queue for task type