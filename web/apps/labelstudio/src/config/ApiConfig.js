export const API_CONFIG = {
  gateway: `${window.APP_SETTINGS.hostname}/api`,
  sse: {
    baseUrl: window.APP_SETTINGS.hostname || 'http://localhost:8080',
    notifications: '/events',
  },
  endpoints: {
    // Users
    users: '/users',
    updateUser: 'PATCH:/users/:pk',
    updateUserAvatar: 'POST:/users/:pk/avatar',
    deleteUserAvatar: 'DELETE:/users/:pk/avatar',
    assignRole: 'POST:/users/:pk/assign_role/',
    me: '/current-user/whoami',

    // Organization
    memberships: '/organizations/:pk/memberships',
    userMemberships: '/organizations/:pk/memberships/:userPk',
    inviteLink: '/invite',
    resetInviteLink: 'POST:/invite/reset-token',

    // Project
    projects: '/projects',
    project: '/projects/:pk',
    updateProject: 'PATCH:/projects/:pk',
    createProject: 'POST:/projects',
    deleteProject: 'DELETE:/projects/:pk',
    projectResetCache: 'POST:/projects/:pk/summary/reset',
    // Project Assignment
    assignProject: 'POST:/projects/:pk/assignment',
    userPermission: 'GET:/projects/:pk/assignment',

    // Presigning
    presignUrlForTask: '/../tasks/:taskID/presign',
    presignUrlForProject: '/../projects/:projectId/presign',

    // Config and Import
    configTemplates: '/templates',
    validateConfig: 'POST:/projects/:pk/validate',
    createSampleTask: 'POST:/projects/:pk/sample-task',
    fileUploads: '/projects/:pk/file-uploads',
    deleteFileUploads: 'DELETE:/projects/:pk/file-uploads',
    fileUploadDownload: 'GET:/import/file-upload/:pk/download/',
    fileUploadTask: 'GET:/import/file-upload/:pk/task/',
    importFiles: 'POST:/projects/:pk/import',
    reimportFiles: 'POST:/projects/:pk/reimport',
    dataSummary: '/projects/:pk/summary',

    // DM
    deleteTabs: 'DELETE:/dm/views/reset',

    // Storages
    listStorages: '/storages/:target?',
    storageTypes: '/storages/:target?/types',
    storageForms: '/storages/:target?/:type/form',
    createStorage: 'POST:/storages/:target?/:type',
    deleteStorage: 'DELETE:/storages/:target?/:type/:pk',
    updateStorage: 'PATCH:/storages/:target?/:type/:pk',
    syncStorage: 'POST:/storages/:target?/:type/:pk/sync',
    validateStorage: 'POST:/storages/:target?/:type/validate',

    // ML
    mlBackends: 'GET:/ml',
    mlBackend: 'GET:/ml/:pk',
    addMLBackend: 'POST:/ml',
    updateMLBackend: 'PATCH:/ml/:pk',
    deleteMLBackend: 'DELETE:/ml/:pk',
    trainMLBackend: 'POST:/ml/:pk/train',
    predictWithML: 'POST:/ml/:pk/predict/test',
    projectModelVersions: '/projects/:pk/model-versions',
    deletePredictions: 'DELETE:/projects/:pk/model-versions',
    modelVersions: '/ml/:pk/versions',
    mlInteractive: 'POST:/ml/:pk/interactive-annotating',

    // Export
    export: '/projects/:pk/export',
    previousExports: '/projects/:pk/export/files',
    exportFormats: '/projects/:pk/export/formats',

    // Version
    version: '/version',

    // Dashboard
    dashboardAnalytics: '/dashboard/analytics',

    // Webhook
    webhooks: '/webhooks',
    webhook: '/webhooks/:pk',
    updateWebhook: 'PATCH:/webhooks/:pk',
    createWebhook: 'POST:/webhooks',
    deleteWebhook: 'DELETE:/webhooks/:pk',
    webhooksInfo: '/webhooks/info',

    // Product tours
    getProductTour: 'GET:/current-user/product-tour',
    updateProductTour: 'PATCH:/current-user/product-tour',

    // Tokens
    accessTokenList: 'GET:/token',
    accessTokenGetRefreshToken: 'POST:/token',
    accessTokenRevoke: 'POST:/token/blacklist',

    accessTokenSettings: 'GET:/jwt/settings',
    accessTokenUpdateSettings: 'POST:/jwt/settings',

    // Notifcations
    notifications: '/notifications',
    notification: '/notifications/:id',
    updateNotification: 'PATCH:/notifications/:id',
    sendNotification: 'POST:/notifications/send',

    // OCR
    taskOCRExtractions: 'GET:/tasks/:pk/ocr-extractions',

    // Tasks
    tasks: '/tasks',
    task: '/tasks/:pk',

    // Aviation
    aviationUpload: 'POST:/projects/:pk/aviation/upload/',
    aviationValidate: 'POST:/projects/:pk/aviation/validate/',
    aviationExportTemplate: '/aviation/export/template/',

    aviationIncidents: '/aviation/incidents',
    aviationIncident: '/aviation/incidents/:pk',
    createAviationIncident: 'POST:/aviation/incidents',
    updateAviationIncident: 'PATCH:/aviation/incidents/:pk',
    deleteAviationIncident: 'DELETE:/aviation/incidents/:pk',

    aviationAnnotations: '/aviation/annotations',
    aviationAnnotation: '/aviation/annotations/:pk',
    createAviationAnnotation: 'POST:/aviation/annotations',
    updateAviationAnnotation: 'PATCH:/aviation/annotations/:pk',

    aviationDropdowns: '/aviation/dropdowns',
    aviationDropdownsAll: '/aviation/dropdowns/all/',
    aviationDropdownsHierarchy: '/aviation/dropdowns/hierarchy/',
    aviationDropdownsSearch: '/aviation/dropdowns/search/',

    aviationTaskLock: '/aviation/tasks/:taskId/lock',
    acquireAviationTaskLock: 'POST:/aviation/tasks/:taskId/lock',
    releaseAviationTaskLock: 'DELETE:/aviation/tasks/:taskId/lock',

    aviationExport: '/aviation/export/',
    aviationTrainingMappings: '/aviation/training-mappings/',

    aviationProjects: '/aviation/projects',
    aviationProject: '/aviation/projects/:pk',
    createAviationProject: 'POST:/aviation/projects',
    updateAviationProject: 'PATCH:/aviation/projects/:pk',
    deleteAviationProject: 'DELETE:/aviation/projects/:pk',

    // Aviation Analytics (web/libs/aviation uses its own API client)
    aviationEventsAnalytics: '/aviation/projects/:pk/events/analytics/',
    aviationFilterOptions: '/aviation/projects/:pk/filter-options/',
  },
  alwaysExpectJSON: false
};
