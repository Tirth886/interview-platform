import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type JobPerformanceRow = {
  jobId: string;
  jobTitle: string;
  applications: number;
  conversionRate: number;
};

type JobPerformanceSectionProps = {
  jobPerformanceRows: JobPerformanceRow[];
};

export const JobPerformanceSection = ({
  jobPerformanceRows,
}: JobPerformanceSectionProps): JSX.Element => {
  const jobBarData = {
    labels: jobPerformanceRows.map((row) => row.jobTitle),
    datasets: [
      {
        label: "Applications",
        data: jobPerformanceRows.map((row) => row.applications),
        backgroundColor: "rgba(59, 130, 246, 0.75)",
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
        <CardTitle>Job-wise Performance</CardTitle>
        <CardDescription>Applications and conversion trends by job.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-72">
          <Bar data={jobBarData} options={chartOptions} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead>Conversion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobPerformanceRows.map((row) => (
              <TableRow key={row.jobId}>
                <TableCell>{row.jobTitle}</TableCell>
                <TableCell>{row.applications}</TableCell>
                <TableCell>{row.conversionRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
