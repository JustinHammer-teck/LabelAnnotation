### React project structure

### Frontend
- **Framework**: React 18.x with TypeScript
- **Build Tool**: Nx monorepo with Webpack
- **State Management**: Jotai atoms, MobX State Tree (legacy)
- **UI Libraries**: Ant Design v4, Custom UI components in `web/libs/ui`
- **Styling**: SCSS modules, Tailwind CSS

### Frontend Structure
- **`web/apps/labelstudio/`**: Main Label Studio application
- **`web/libs/editor/`**: Annotation editor library
- **`web/libs/datamanager/`**: Data Manager library
- **`web/libs/ui/`**: Shared UI components
- **`web/libs/core/`**: Core utilities and helpers
- **`web/libs/app-common/`**: Shared application components

## React Component Guidelines
- Use functional components with hooks
- Follow kebab-case naming for files: `list-item.tsx`
- Co-locate SCSS modules: `list-item.module.scss`
- Add Storybook stories: `list-item.stories.tsx`
- Use Jotai atoms for global state (not Context API)
- Implement proper TypeScript types
- Follow accessibility standards (WCAG 2.1 AA)

### Frontend Commands

DO NOT run long running command

``` bash
# WRONG 
yarn run dev

# Main Web Package Manager
yarn add i18next
```

```bash
# Install dependencies
cd web && yarn install --frozen-lockfile

# Run development server (HMR mode)
cd web && yarn dev

# Watch and build continuously
cd web && yarn watch

# Build production bundle
cd web && yarn build

# Run linting
cd web && yarn lint
cd web && yarn lint-scss

# Run tests
cd web && yarn test:unit
cd web && yarn ls:unit  # Label Studio unit tests
cd web && yarn lsf:unit  # Label Studio Frontend (editor) unit tests
cd web && yarn dm:unit   # Data Manager unit tests
```
