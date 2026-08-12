import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

type ApplicationsTimelineSectionProps = {
  timelineLabels: string[];
  applicationsByDay: number[];
};

export const ApplicationsTimelineSection = ({
  timelineLabels,
  applicationsByDay,
}: ApplicationsTimelineSectionProps): JSX.Element => {
  const lineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: "Applications",
        data: applicationsByDay,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        tension: 0.35,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications Over Time</CardTitle>
        <CardDescription>Daily trend within selected range.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <Line data={lineData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};
