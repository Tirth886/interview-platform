import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "@shared/ui";
import { useAuthStore } from "../../stores/useAuthStore";
import { getQaBank, saveQaQuestions, type QaBankDetail } from "../../services/qaBanks";
import {
  blankQuestion,
  QaQuestionEditor,
  type DraftQuestion,
} from "./components/QaQuestionEditor";

const toDraftQuestions = (bank: QaBankDetail): DraftQuestion[] => {
  if (bank.questions.length === 0) {
    return [blankQuestion()];
  }
  return bank.questions.map((question) => ({
    key: question.id,
    id: question.id,
    questionText: question.questionText,
    isCodeView: question.isCodeView,
    options: question.options.map((option) => ({
      key: option.id,
      id: option.id,
      optionText: option.optionText,
      isCodeView: option.isCodeView,
      isCorrect: option.isCorrect,
    })),
  }));
};

export default function QaBankEditorPage(): JSX.Element {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const canEdit = session?.user.role === "admin";

  const [bank, setBank] = useState<QaBankDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.token || !bankId) return;
    setLoading(true);
    setLoadError(null);
    void getQaBank(bankId, session.token)
      .then((detail) => {
        setBank(detail);
        const draft = toDraftQuestions(detail);
        setQuestions(draft);
        setSelectedKey(draft[0]?.key ?? null);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Unable to load Q&A.");
        setBank(null);
      })
      .finally(() => setLoading(false));
  }, [session?.token, bankId]);

  if (!bankId) {
    return <Navigate to="/app/master/qa" replace />;
  }

  if (loading) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Loading Q&A…
      </div>
    );
  }

  if (loadError || !bank) {
    return (
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => navigate("/app/master/qa")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-destructive">{loadError ?? "Q&A not found."}</p>
      </div>
    );
  }

  const handleSave = async (): Promise<void> => {
    if (!session?.token || !canEdit) {
      setSaveError("You must be signed in as admin to save.");
      return;
    }
    setBusy(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const payload = questions.map((question, qIndex) => ({
        id: question.id,
        questionText: question.questionText,
        isCodeView: question.isCodeView,
        orderIndex: qIndex,
        options: question.options.map((option, oIndex) => ({
          id: option.id,
          optionText: option.optionText,
          isCodeView: option.isCodeView,
          isCorrect: option.isCorrect,
          orderIndex: oIndex,
        })),
      }));
      const updated = await saveQaQuestions(bank.id, payload, session.token);
      setBank(updated);
      const draft = toDraftQuestions(updated);
      setQuestions(draft);
      setSelectedKey((current) =>
        draft.some((item) => item.key === current) ? current : draft[0]?.key ?? null
      );
      setSavedMessage("Questions saved.");
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "Unable to save questions.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-xl"
            onClick={() => navigate("/app/master/qa")}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {bank.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveError ? <p className="text-sm font-medium text-rose-600">{saveError}</p> : null}
          {savedMessage ? (
            <p className="text-sm font-medium text-emerald-600">{savedMessage}</p>
          ) : null}
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              className="rounded-xl"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              Save
            </Button>
          ) : null}
        </div>
      </div>

      <QaQuestionEditor
        canEdit={canEdit}
        questions={questions}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onChange={(next) => {
          setQuestions(next);
          setSavedMessage(null);
        }}
      />
    </div>
  );
}
