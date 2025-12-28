import { SimpleCard, Spinner } from "@humansignal/ui";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { useDashboardAnalytics } from "../../hooks/useDashboardAnalytics";
import { useState } from "react";
import { DASHBOARD_COLORS, generateChartColors } from "./dashboard-theme";
import { useTranslation } from "react-i18next";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const Dashboard = () => {
  const { t } = useTranslation();
  const [activeProjectTab, setActiveProjectTab] = useState(0);
  const { data: analyticsData, isLoading: analyticsLoading, isError: analyticsError } = useDashboardAnalytics();

  if (analyticsLoading) {
    return (
      <div className="h-64 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (analyticsError || !analyticsData || !analyticsData.projectAnnotations) {
    return (
      <div className="h-64 flex justify-center items-center">
        {t("home_page.dashboard.error")}
      </div>
    );
  }

  const chartColors = generateChartColors(analyticsData.projectAnnotations.length);

  const pieChartData = {
    labels: analyticsData.projectAnnotations.map((p) => p.name),
    datasets: [
      {
        label: t("home_page.dashboard.annotations_by_project"),
        data: analyticsData.projectAnnotations.map((p) => p.annotations),
        backgroundColor: chartColors,
        borderColor: chartColors,
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: analyticsData.dailyAnnotationHistory.map((d) => d.date),
    datasets: [
      {
        label: t("home_page.dashboard.daily_annotations_history"),
        data: analyticsData.dailyAnnotationHistory.map((d) => d.count),
        backgroundColor: DASHBOARD_COLORS.chart.primary,
        borderColor: DASHBOARD_COLORS.chart.primary,
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const totalAnnotations = analyticsData.projectAnnotations.reduce(
    (sum, p) => sum + p.annotations,
    0
  );

  const generateSummary = () => {
    if (analyticsData.projectAnnotations.length === 0) {
      return t("home_page.dashboard.no_projects");
    }
    const topProject = analyticsData.projectAnnotations.reduce((prev, current) =>
      prev.annotations > current.annotations ? prev : current
    );
    return t("home_page.dashboard.summary_text", {
      totalProjects: analyticsData.totalProjects,
      totalUsers: analyticsData.totalUsers,
      dailyAnnotations: analyticsData.dailyAnnotations,
      totalAnnotations,
      topProjectName: topProject.name,
      topProjectAnnotations: topProject.annotations,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard title={t("home_page.dashboard.total_projects")}>
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.totalProjects}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">{t("home_page.dashboard.active_projects")}</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title={t("home_page.dashboard.organization_users")}>
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.totalUsers}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">{t("home_page.dashboard.team_members")}</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title={t("home_page.dashboard.today_annotations")}>
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.dailyAnnotations}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">{t("home_page.dashboard.completed_today")}</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title={t("home_page.dashboard.completion_rate")}>
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.projectProgress.length > 0
                  ? Math.round(
                      (analyticsData.projectProgress.reduce(
                        (sum, p) => sum + p.completedTasks,
                        0
                      ) /
                        analyticsData.projectProgress.reduce(
                          (sum, p) => sum + p.totalTasks,
                          0
                        )) *
                        100
                    )
                  : 0}
                %
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">{t("home_page.dashboard.overall_progress")}</div>
            </div>
          </div>
        </SimpleCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SimpleCard title={t("home_page.dashboard.daily_annotations_history")}>
          <div className="p-4">
            <div className="h-64">
              {analyticsData.dailyAnnotationHistory.some(d => d.count > 0) ? (
                <Bar
                  key={`bar-${analyticsData.dailyAnnotationHistory.length}-${analyticsData.dailyAnnotations}`}
                  data={barChartData}
                  options={barChartOptions}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-content-subtler">
                  {t("home_page.dashboard.no_annotations_yet")}
                </div>
              )}
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title={t("home_page.dashboard.annotations_by_project")}>
          <div className="p-4">
            <div className="h-64 flex items-center justify-center">
              {totalAnnotations > 0 ? (
                <Pie
                  key={`pie-${analyticsData.projectAnnotations.length}-${totalAnnotations}`}
                  data={pieChartData}
                  options={pieChartOptions}
                />
              ) : (
                <div className="text-neutral-content-subtler">
                  {t("home_page.dashboard.no_annotations_yet")}
                </div>
              )}
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title={t("home_page.dashboard.project_progress")}>
          <div className="p-4">
            <div className="flex border-b border-primary-border-subtle mb-4 overflow-x-auto">
              {analyticsData.projectProgress.map((project, index) => (
                <button
                  key={project.id}
                  onClick={() => setActiveProjectTab(index)}
                  className={`px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                    activeProjectTab === index
                      ? "border-b-2 border-blue-500 text-neutral-content"
                      : "text-neutral-content-subtler hover:text-neutral-content"
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {analyticsData.projectProgress[activeProjectTab] && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary-emphasis-subtle p-3 rounded-lg border border-primary-border-subtle">
                      <div className="text-neutral-content-subtler text-xs">{t("home_page.dashboard.total_tasks")}</div>
                      <div className="text-xl font-bold text-neutral-content mt-1">
                        {analyticsData.projectProgress[activeProjectTab].totalTasks}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ backgroundColor: DASHBOARD_COLORS.status.completed.bg, borderColor: DASHBOARD_COLORS.status.completed.border }}>
                      <div className="text-xs" style={{ color: DASHBOARD_COLORS.status.completed.text }}>{t("home_page.dashboard.completed")}</div>
                      <div className="text-xl font-bold mt-1" style={{ color: DASHBOARD_COLORS.status.completed.textDark }}>
                        {analyticsData.projectProgress[activeProjectTab].completedTasks}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ backgroundColor: DASHBOARD_COLORS.status.inProgress.bg, borderColor: DASHBOARD_COLORS.status.inProgress.border }}>
                      <div className="text-xs" style={{ color: DASHBOARD_COLORS.status.inProgress.text }}>{t("home_page.dashboard.in_progress")}</div>
                      <div className="text-xl font-bold mt-1" style={{ color: DASHBOARD_COLORS.status.inProgress.textDark }}>
                        {analyticsData.projectProgress[activeProjectTab].inProgressTasks}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border" style={{ backgroundColor: DASHBOARD_COLORS.status.pending.bg, borderColor: DASHBOARD_COLORS.status.pending.border }}>
                      <div className="text-xs" style={{ color: DASHBOARD_COLORS.status.pending.text }}>{t("home_page.dashboard.pending")}</div>
                      <div className="text-xl font-bold mt-1" style={{ color: DASHBOARD_COLORS.status.pending.textDark }}>
                        {analyticsData.projectProgress[activeProjectTab].pendingTasks}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-content-subtler">{t("home_page.dashboard.overall_progress")}</span>
                      <span className="font-semibold text-neutral-content">
                        {analyticsData.projectProgress[activeProjectTab].totalTasks > 0
                          ? Math.round(
                              (analyticsData.projectProgress[activeProjectTab].completedTasks /
                                analyticsData.projectProgress[activeProjectTab].totalTasks) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-neutral-surface rounded-full h-3 overflow-hidden border border-primary-border-subtle">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          backgroundColor: DASHBOARD_COLORS.status.completed.textDark,
                          width: `${
                            analyticsData.projectProgress[activeProjectTab].totalTasks > 0
                              ? (analyticsData.projectProgress[activeProjectTab].completedTasks /
                                  analyticsData.projectProgress[activeProjectTab].totalTasks) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </SimpleCard>
      </div>

      <SimpleCard title={t("home_page.dashboard.summary")}>
        <div className="p-4">
          <p className="text-neutral-content-subtler text-sm leading-relaxed">
            {generateSummary()}
          </p>
        </div>
      </SimpleCard>
    </div>
  );
};
