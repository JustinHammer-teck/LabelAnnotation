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
    queryFn: async (): Promise<DashboardAnalytics> => {
      const result = await api.callApi<DashboardAnalytics>("dashboardAnalytics");

      if (!result || result.error) {
        throw new Error(result?.error || 'Failed to fetch dashboard analytics');
      }

      // Extract the data from the wrapped response
      return {
        totalProjects: result.totalProjects ?? 0,
        totalUsers: result.totalUsers ?? 0,
        dailyAnnotations: result.dailyAnnotations ?? 0,
        dailyAnnotationHistory: result.dailyAnnotationHistory ?? [],
        projectAnnotations: result.projectAnnotations ?? [],
        projectProgress: result.projectProgress ?? [],
      };
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
};