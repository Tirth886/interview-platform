import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type HiringFunnelSectionProps = {
  funnelApplied: number;
  funnelScreening: number;
  funnelInterview: number;
  funnelSelected: number;
};

export const HiringFunnelSection = ({
  funnelApplied,
  funnelScreening,
  funnelInterview,
  funnelSelected,
}: HiringFunnelSectionProps): JSX.Element => {
  const funnelData = {
    labels: ["Applied", "Screening", "Interview", "Selected"],
    datasets: [
      {
        label: "Candidates",
        data: [funnelApplied, funnelScreening, funnelInterview, funnelSelected],
        backgroundColor: ["#c7d2fe", "#93c5fd", "#fcd34d", "#86efac"],
        borderRadius: 8,
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
        <CardTitle>Hiring Funnel</CardTitle>
        <CardDescription>Applied → Screening → Interview → Selected conversion flow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar data={funnelData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};
