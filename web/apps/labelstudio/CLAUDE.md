### React project structure

#### Main Application
```
/web/apps/labelstudio/src
├── app
│   ├── App.jsx
│   ├── App.scss
│   ├── AsyncPage
│   │   └── AsyncPage.jsx
│   ├── ErrorBoundary.jsx
│   ├── RootPage.jsx
│   └── StaticContent
│       └── StaticContent.jsx
├── assets
│   └── images
│       ├── heidi-ai.svg
│       ├── heidi-speaking.svg
│       ├── index.js
│       └── logo.svg
├── components
│   ├── Breadcrumbs
│   │   ├── Breadcrumbs.jsx
│   │   └── Breadcrumbs.scss
│   ├── Button
│   │   ├── Button.jsx
│   │   └── Button.scss
│   ├── Caption
│   │   ├── Caption.scss
│   │   └── Caption.tsx
│   ├── Card
│   │   ├── Card.jsx
│   │   └── Card.scss
│   ├── Columns
│   │   ├── Columns.jsx
│   │   └── Columns.scss
│   ├── CopyableTooltip
│   │   └── CopyableTooltip.jsx
│   ├── Description
│   │   ├── Description.jsx
│   │   └── Description.scss
│   ├── DescriptionList
│   │   ├── DescriptionList.jsx
│   │   └── DescriptionList.scss
│   ├── Divider
│   │   └── Divider.jsx
│   ├── DraftGuard
│   │   └── DraftGuard.jsx
│   ├── Dropdown
│   │   ├── Dropdown.js
│   │   ├── Dropdown.scss
│   │   ├── DropdownComponent.jsx
│   │   ├── DropdownContext.js
│   │   └── DropdownTrigger.jsx
│   ├── EmptyState
│   │   ├── EmptyState.jsx
│   │   └── EmptyState.scss
│   ├── Error
│   │   ├── Error.jsx
│   │   ├── Error.scss
│   │   ├── InlineError.jsx
│   │   └── PauseError
│   ├── Form
│   │   ├── Elements
│   │   │   ├── Counter
│   │   │   │   ├── Counter.jsx
│   │   │   │   └── Counter.scss
│   │   │   ├── Input
│   │   │   │   ├── Input.jsx
│   │   │   │   └── Input.scss
│   │   │   ├── Label
│   │   │   │   ├── Label.jsx
│   │   │   │   └── Label.scss
│   │   │   ├── RadioGroup
│   │   │   │   ├── RadioGroup.jsx
│   │   │   │   └── RadioGroup.scss
│   │   │   ├── Select
│   │   │   │   └── Select.jsx
│   │   │   ├── TextArea
│   │   │   │   └── TextArea.jsx
│   │   │   ├── Toggle
│   │   │   │   └── Toggle.jsx
│   │   │   └── index.ts
│   │   ├── Form.jsx
│   │   ├── Form.scss
│   │   ├── FormContext.js
│   │   ├── FormField.js
│   │   ├── Utils.ts
│   │   ├── Validation
│   │   │   ├── Validation.scss
│   │   │   └── Validators.js
│   │   └── index.js
│   ├── Hamburger
│   │   ├── Hamburger.jsx
│   │   └── Hamburger.scss
│   ├── HeidiTips
│   │   ├── HeidiTip.scss
│   │   ├── HeidiTip.tsx
│   │   ├── HeidiTips.tsx
│   │   ├── content.ts
│   │   ├── hooks.ts
│   │   ├── liveContent.json
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── LanguageSwitcher
│   │   └── LanguageSwitcher.jsx
│   ├── LeaveBlocker
│   │   └── LeaveBlocker.tsx
│   ├── Menu
│   │   ├── Menu.jsx
│   │   ├── Menu.scss
│   │   ├── MenuContext.js
│   │   └── MenuItem.jsx
│   ├── Menubar
│   │   ├── MenuContent.scss
│   │   ├── MenuSidebar.scss
│   │   ├── Menubar.jsx
│   │   └── Menubar.scss
│   ├── Modal
│   │   ├── Modal.jsx
│   │   ├── Modal.scss
│   │   └── ModalPopup.jsx
│   ├── Notification
│   │   ├── Notification.jsx
│   │   └── Notification.scss
│   ├── Oneof
│   │   └── Oneof.js
│   ├── Pagination
│   │   ├── Pagination.scss
│   │   └── Pagination.tsx
│   ├── SidebarMenu
│   │   ├── SidebarMenu.jsx
│   │   └── SidebarMenu.scss
│   ├── Space
│   │   ├── Space.jsx
│   │   └── Space.scss
│   ├── Spinner
│   │   ├── Spinner.jsx
│   │   └── Spinner.scss
│   ├── ToggleItems
│   │   ├── ToggleItems.scss
│   │   └── ToggleItems.tsx
│   ├── VersionNotifier
│   │   ├── VersionNotifier.jsx
│   │   └── VersionNotifier.scss
│   └── index.js
├── config
│   ├── ApiConfig.example.js
│   ├── ApiConfig.js
│   └── Sentry.ts
├── favicon.ico
├── hooks
│   ├── useCopyText.ts
│   └── useOrgValidation.tsx
├── index.html
├── locales
│   ├── cn
│   │   └── translation.json
│   └── en
│       └── translation.json
├── main.tsx
├── pages
│   ├── CreateProject
│   │   ├── Config
│   │   │   ├── Config.jsx
│   │   │   ├── Config.scss
│   │   │   ├── Preview.jsx
│   │   │   ├── Template.js
│   │   │   ├── TemplatesList.jsx
│   │   │   ├── UnsavedChanges.tsx
│   │   │   ├── colors.js
│   │   │   ├── recipes.js
│   │   │   └── tags.js
│   │   ├── CreateProject.jsx
│   │   ├── CreateProject.jsx.bak
│   │   ├── CreateProject.scss
│   │   ├── Import
│   │   │   ├── Import.jsx
│   │   │   ├── Import.scss
│   │   │   ├── ImportModal.jsx
│   │   │   ├── samples.json
│   │   │   ├── useImportPage.js
│   │   │   └── utils.ts
│   │   └── utils
│   │       ├── atoms.ts
│   │       └── useDraftProject.js
│   ├── DataManager
│   │   ├── DataManager.jsx
│   │   ├── DataManager.scss
│   │   ├── api-config.example.js
│   │   ├── api-config.js
│   │   └── index.js
│   ├── ExportPage
│   │   ├── ExportPage.jsx
│   │   └── ExportPage.scss
│   ├── Home
│   │   └── HomePage.tsx
│   ├── Organization
│   │   ├── Models
│   │   │   ├── @components
│   │   │   │   ├── EmptyList.scss
│   │   │   │   └── EmptyList.tsx
│   │   │   └── ModelsPage.tsx
│   │   ├── PeoplePage
│   │   │   ├── InviteLink.tsx
│   │   │   ├── PeopleInvitation.scss
│   │   │   ├── PeopleList.jsx
│   │   │   ├── PeopleList.scss
│   │   │   ├── PeoplePage.jsx
│   │   │   ├── PeoplePage.scss
│   │   │   ├── SelectedUser.jsx
│   │   │   └── SelectedUser.scss
│   │   └── index.jsx
│   ├── Projects
│   │   ├── Projects.jsx
│   │   ├── Projects.scss
│   │   └── ProjectsList.jsx
│   ├── Settings
│   │   ├── AnnotationSettings
│   │   │   └── ModelVersionSelector.jsx
│   │   ├── AnnotationSettings.jsx
│   │   ├── DangerZone.jsx
│   │   ├── GeneralSettings.jsx
│   │   ├── LabelingSettings.jsx
│   │   ├── MachineLearningSettings
│   │   │   ├── Forms.jsx
│   │   │   ├── MachineLearningList.jsx
│   │   │   ├── MachineLearningList.scss
│   │   │   ├── MachineLearningSettings.jsx
│   │   │   ├── MachineLearningSettings.scss
│   │   │   ├── StartModelTraining.jsx
│   │   │   └── TestRequest.jsx
│   │   ├── PredictionsSettings
│   │   │   ├── PredictionsList.jsx
│   │   │   ├── PredictionsList.scss
│   │   │   ├── PredictionsSettings.jsx
│   │   │   └── PredictionsSettings.scss
│   │   ├── StorageSettings
│   │   │   ├── StorageCard.jsx
│   │   │   ├── StorageForm.jsx
│   │   │   ├── StorageSet.jsx
│   │   │   ├── StorageSettings.jsx
│   │   │   ├── StorageSettings.scss
│   │   │   ├── StorageSummary.jsx
│   │   │   └── hooks
│   │   │       └── useStorageCard.tsx
│   │   ├── TaskAssignmentSettings
│   │   │   └── TaskAssignmentSettings.jsx
│   │   ├── index.jsx
│   │   └── settings.scss
│   ├── WebhookPage
│   │   ├── WebhookDeleteModal.jsx
│   │   ├── WebhookDetail.jsx
│   │   ├── WebhookList.jsx
│   │   ├── WebhookPage.jsx
│   │   └── WebhookPage.scss
│   ├── index.js
│   └── types
│       └── Page.ts
├── providers
│   ├── ApiProvider.tsx
│   ├── AppStoreProvider.jsx
│   ├── AppStoreProvider.tsx
│   ├── ConfigProvider.jsx
│   ├── CurrentUser.d.ts
│   ├── CurrentUser.jsx
│   ├── MultiProvider.js
│   ├── ProjectProvider.tsx
│   ├── RoutesProvider.d.ts
│   └── RoutesProvider.jsx
├── routes
│   ├── ProjectRoutes.jsx
│   └── RouteWithStaticFallback.jsx
├── services
│   └── breadrumbs.js
├── themes
│   └── default
│       ├── colors.scss
│       ├── tokens.scss
│       ├── typography.scss
│       └── variables.scss
├── types
│   ├── Global.d.ts
│   ├── Project.d.ts
│   ├── router
│   │   └── pages.d.ts
│   └── shallow-equal.d.ts
└── utils
    ├── bem.tsx
    ├── colors.js
    ├── debounce.js
    ├── feature-flags.ts
    ├── helpers.ts
    ├── hooks.ts
    ├── i18n.js
    ├── jotai-store.ts
    ├── license-flags.ts
    ├── query-client.ts
    ├── routeHelpers.jsx
    ├── scripts.js
    ├── selectors.js
    └── service-worker.js
```


