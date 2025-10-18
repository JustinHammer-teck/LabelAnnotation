import { useQuery } from "@tanstack/react-query";
import { useAPI } from "../providers/ApiProvider";

interface DashboardAnalytics {
  totalProjects: number;
  totalUsers: number;
  dailyAnnotations: number;
  dailyAnnotationHistory: Array<{ date: string; count: number }>;
  projectAnnotations: Array<{
    id: number;
    name: string;
    annotations: number;
    color: string;
  }>;
  projectProgress: Array<{
    id: number;
    name: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
  }>;
}

export const useDashboardAnalytics = () => {
  const api = useAPI();

  return useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async () => {
      return api.callApi<DashboardAnalytics>("dashboardAnalytics");
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
};