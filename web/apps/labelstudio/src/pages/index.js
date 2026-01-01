import { ProjectsPage } from './Projects/Projects';
import { HomePage } from './Home/HomePage';
import { OrganizationPage } from './Organization';
import { ModelsPage } from './Organization/Models/ModelsPage';
import { AviationPage } from './Aviation';
import { LabelPage } from './Label';
import { FF_HOMEPAGE, isFF } from '../utils/feature-flags';
import { pages } from '@humansignal/app-common';
import { ff } from '@humansignal/core';

export const Pages = [
  isFF(FF_HOMEPAGE) && HomePage,
  ProjectsPage,
  OrganizationPage,
  AviationPage,
  LabelPage,
  ModelsPage,
  ff.isFF(ff.FF_AUTH_TOKENS) && pages.AccountSettingsPage
].filter(Boolean);
