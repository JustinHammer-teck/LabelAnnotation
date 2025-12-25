// Initialize i18n FIRST before any other imports that might use it
import "./utils/i18n";

import { registerAnalytics } from "@humansignal/core";
registerAnalytics();

import "./app/App";
import "./utils/service-worker";
