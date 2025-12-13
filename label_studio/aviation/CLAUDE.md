# Aviation Module - Coding Standards

## Project ID Convention

**Critical**: Aviation has TWO project IDs:
- `AviationProject.id` - Aviation wrapper ID (used in frontend routes: `/aviation/:projectId/`)
- `AviationProject.project_id` - Label Studio Project ID (used in backend APIs that reference `projects/<pk>/`)

### Frontend
```typescript
// URL param is AviationProject ID
const { projectId } = useParams(); // AviationProject.id

// API returns both IDs
const project = await api.callApi('aviationProject', { pk: projectId });
// project.id = AviationProject ID
// project.project_id = Label Studio Project ID

// Use project.project_id for APIs that filter by Label Studio Project:
// - upload/validate endpoints
// - incidents list (?project=)
// - annotations list (?project=)
api.callApi('aviationIncidents', { params: { project: project.project_id } });
<ExcelUploadModal projectId={project.project_id} />
```

### Backend
- `/api/aviation/projects/<pk>` - Uses AviationProject.id
- `/api/projects/<pk>/aviation/upload/` - Uses Label Studio Project.id

## URL Trailing Slashes
Always include trailing slashes in Django URL patterns to match frontend API calls:
```python
path('projects/<int:pk>/aviation/upload/', ...)  # Correct
path('projects/<int:pk>/aviation/upload', ...)   # Wrong - causes 404
```

## Permission Methods
Models accessed via DRF object permissions must implement `has_permission`:
```python
class AviationProject(models.Model):
    project = models.OneToOneField('projects.Project', ...)

    def has_permission(self, user):
        return self.project.has_permission(user)
```
