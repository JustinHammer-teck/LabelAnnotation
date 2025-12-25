## Project Structure with CLAUDE.md

> IMPORTANT: this is just scaffold of important files, other you would need to find it yourself
> Instruction : always reach out to the memory file on the project that you're working on
> example: if you are working on Backend/Django context reference @label_studio/CLAUDE.md.

```
.
├── CLAUDE.md
├── label_studio
│   ├── CLAUDE.md
│   ├── core 
│   │   ├── CLAUDE.md
├── web
│   ├── apps
│   │   ├── labelstudio
    │   │   ├── CLAUDE.md
│   ├── libs
│   │   ├── editor
│   │   │   ├── CLAUDE.md
│   │   ├── aviation
│   │   │   ├── CLAUDE.md
```
## Tech Stack

### Key Patterns
- Django REST Framework for API endpoints
- ViewSets and Serializers for API resources
- Django signals for event handling
- Jotai atoms for React state management
- Component-based architecture with SCSS modules
- Nx workspace for monorepo management

## Important Configuration Files
- **Backend**: `label_studio/core/settings/label_studio.py`
- **Frontend**: `web/apps/labelstudio/src/config/ApiConfig.js`
- **Environment**: `.env` (copy from `.env.development` for local setup)
