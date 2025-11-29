import { AviationProjectList } from './AviationProjectList';
import { AviationTaskList } from './AviationTaskList';
import { AviationAnnotationPage } from './AviationAnnotationPage';

export const AviationPage = {
  title: 'Aviation Safety',
  path: '/aviation',
  exact: true,
  component: AviationProjectList,
  routes: () => [
    {
      path: '/:projectId/tasks',
      exact: true,
      component: AviationTaskList,
    },
    {
      path: '/:projectId/tasks/:taskId',
      exact: true,
      component: AviationAnnotationPage,
    },
  ],
};
