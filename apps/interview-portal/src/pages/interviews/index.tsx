import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { listInterviewsByEmail } from "../../services/interviews";
import { useInterviewSessionStore } from "../../stores/useInterviewSessionStore";
import type { Interview } from "../../types/interviews";
import { InterviewSessionsSection } from "./components/InterviewSessionsSection";

export default function InterviewsPage(): JSX.Element {
  const navigate = useNavigate();
  const profile = useInterviewSessionStore((state) => state.profile);
  const candidateEmail = profile.email;

  const interviewsQuery = useQuery({
    queryKey: ["candidate-interviews", candidateEmail],
    queryFn: () => {
      if (!candidateEmail) {
        return Promise.resolve([]);
      }
      return listInterviewsByEmail(candidateEmail);
    },
    enabled: Boolean(candidateEmail),
  });

  const interviews = interviewsQuery.data ?? [];

  const sortedInterviews = useMemo(
    () =>
      [...interviews].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [interviews]
  );

  const upcomingInterviews = useMemo(
    () => sortedInterviews.filter((i) => i.status === "scheduled" || i.status === "in-progress"),
    [sortedInterviews]
  );

  const completedInterviews = useMemo(
    () => sortedInterviews.filter((i) => i.status === "completed" || i.status === "cancelled"),
    [sortedInterviews]
  );

  const handleJoinInterview = (interview: Interview): void => {
    if (interview.status === "scheduled" || interview.status === "in-progress") {
      navigate(`/interview/${interview.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Run and review active interview sessions.
        </p>
      </div>

      {interviewsQuery.isError ? (
        <Card className="border-destructive/25 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load interviews</CardTitle>
            <CardDescription>
              {interviewsQuery.error instanceof Error
                ? interviewsQuery.error.message
                : "An error occurred while fetching your interviews."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {upcomingInterviews.length > 0 ? (
        <InterviewSessionsSection
          title="Upcoming Sessions"
          description={`${upcomingInterviews.length} interview${upcomingInterviews.length !== 1 ? "s" : ""} ready`}
          interviews={upcomingInterviews}
          isLoading={interviewsQuery.isLoading}
          showActions
          onJoin={handleJoinInterview}
        />
      ) : null}

      {completedInterviews.length > 0 ? (
        <InterviewSessionsSection
          title="Past Sessions"
          description={`${completedInterviews.length} session${completedInterviews.length !== 1 ? "s" : ""} completed or cancelled`}
          interviews={completedInterviews}
        />
      ) : null}

      {interviews.length === 0 && !interviewsQuery.isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>No Interviews Scheduled</CardTitle>
            <CardDescription>
              Your interview sessions will appear here once scheduled by the hiring team.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
