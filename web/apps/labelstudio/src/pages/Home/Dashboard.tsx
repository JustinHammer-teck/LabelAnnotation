import { SimpleCard, Spinner } from "@humansignal/ui";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { useDashboardAnalytics } from "../../hooks/useDashboardAnalytics";
import { useState } from "react";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const Dashboard = () => {
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
        Failed to load dashboard analytics
      </div>
    );
  }

  const pieChartData = {
    labels: analyticsData.projectAnnotations.map((p) => p.name),
    datasets: [
      {
        label: "Annotations",
        data: analyticsData.projectAnnotations.map((p) => p.annotations),
        backgroundColor: analyticsData.projectAnnotations.map((p) => p.color),
        borderColor: analyticsData.projectAnnotations.map((p) => p.color),
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: analyticsData.dailyAnnotationHistory.map((d) => d.date),
    datasets: [
      {
        label: "Daily Annotations",
        data: analyticsData.dailyAnnotationHistory.map((d) => d.count),
        backgroundColor: "#36A2EB",
        borderColor: "#36A2EB",
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

  const totalAnnotations = analyticsData.projectAnnotations.reduce(
    (sum, p) => sum + p.annotations,
    0
  );

  const generateSummary = () => {
    if (analyticsData.projectAnnotations.length === 0) {
      return "No projects found. Create your first project to get started!";
    }
    const topProject = analyticsData.projectAnnotations.reduce((prev, current) =>
      prev.annotations > current.annotations ? prev : current
    );
    return `Your organization has ${analyticsData.totalProjects} active projects with ${analyticsData.totalUsers} team members. Today, ${analyticsData.dailyAnnotations} annotations were completed. Across all projects, a total of ${totalAnnotations} annotations have been made, with "${topProject.name}" leading with ${topProject.annotations} annotations.`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard title="Total Projects">
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.totalProjects}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">Active Projects</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title="Organization Users">
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.totalUsers}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">Team Members</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title="Today's Annotations">
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-neutral-content">
                {analyticsData.dailyAnnotations}
              </div>
              <div className="text-neutral-content-subtler text-sm mt-2">Completed Today</div>
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title="Completion Rate">
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
              <div className="text-neutral-content-subtler text-sm mt-2">Overall Progress</div>
            </div>
          </div>
        </SimpleCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SimpleCard title="Daily Annotations History">
          <div className="p-4">
            <div className="h-64">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title="Annotations by Project">
          <div className="p-4">
            <div className="h-64 flex items-center justify-center">
              <Pie data={pieChartData} />
            </div>
          </div>
        </SimpleCard>

        <SimpleCard title="Project Progress">
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
                      <div className="text-neutral-content-subtler text-xs">Total Tasks</div>
                      <div className="text-xl font-bold text-neutral-content mt-1">
                        {analyticsData.projectProgress[activeProjectTab].totalTasks}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-green-700 text-xs">Completed</div>
                      <div className="text-xl font-bold text-green-800 mt-1">
                        {analyticsData.projectProgress[activeProjectTab].completedTasks}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-blue-700 text-xs">In Progress</div>
                      <div className="text-xl font-bold text-blue-800 mt-1">
                        {analyticsData.projectProgress[activeProjectTab].inProgressTasks}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="text-yellow-700 text-xs">Pending</div>
                      <div className="text-xl font-bold text-yellow-800 mt-1">
                        {analyticsData.projectProgress[activeProjectTab].pendingTasks}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-content-subtler">Overall Progress</span>
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
                        className="bg-green-500 h-full transition-all duration-300"
                        style={{
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

      <SimpleCard title="Summary">
        <div className="p-4">
          <p className="text-neutral-content-subtler text-sm leading-relaxed">
            {generateSummary()}
          </p>
        </div>
      </SimpleCard>
    </div>
  );
};