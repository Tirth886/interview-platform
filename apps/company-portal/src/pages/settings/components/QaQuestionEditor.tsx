import { Plus, Trash2 } from "lucide-react";
import { Button, Input, Label } from "@shared/ui";

export type DraftOption = {
  key: string;
  id?: string;
  optionText: string;
  isCodeView: boolean;
  isCorrect: boolean;
};

export type DraftQuestion = {
  key: string;
  id?: string;
  questionText: string;
  isCodeView: boolean;
  options: DraftOption[];
};

const newKey = (): string => crypto.randomUUID();

export const blankOption = (): DraftOption => ({
  key: newKey(),
  optionText: "",
  isCodeView: false,
  isCorrect: false,
});

export const blankQuestion = (): DraftQuestion => ({
  key: newKey(),
  questionText: "",
  isCodeView: false,
  options: [blankOption(), blankOption()],
});

type QaQuestionEditorProps = {
  canEdit: boolean;
  questions: DraftQuestion[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onChange: (questions: DraftQuestion[]) => void;
};

export const QaQuestionEditor = ({
  canEdit,
  questions,
  selectedKey,
  onSelect,
  onChange,
}: QaQuestionEditorProps): JSX.Element => {
  const selected =
    questions.find((item) => item.key === selectedKey) ?? questions[0] ?? null;

  const updateSelected = (updater: (question: DraftQuestion) => DraftQuestion): void => {
    if (!selected) return;
    onChange(
      questions.map((item) => (item.key === selected.key ? updater(item) : item))
    );
  };

  return (
    <div className="grid min-h-[calc(100vh-12rem)] gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Questions
          </p>
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-lg px-2"
              onClick={() => {
                const next = blankQuestion();
                onChange([...questions, next]);
                onSelect(next.key);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
        <div className="max-h-[calc(100vh-16rem)] space-y-1 overflow-y-auto">
          {questions.map((question, index) => {
            const active = selected?.key === question.key;
            const preview = question.questionText.trim() || "Untitled question";
            return (
              <button
                key={question.key}
                type="button"
                onClick={() => onSelect(question.key)}
                className={
                  active
                    ? "w-full rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-left"
                    : "w-full rounded-xl border border-transparent px-3 py-2 text-left hover:bg-slate-50"
                }
              >
                <p className="text-xs font-semibold text-slate-700">Q{index + 1}</p>
                <p className="truncate text-xs text-muted-foreground">{preview}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
        {!selected ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            Add a question to get started.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Question {questions.findIndex((item) => item.key === selected.key) + 1}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Edit the prompt, options, and correct answers.
                </p>
              </div>
              {canEdit && questions.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                  onClick={() => {
                    const next = questions.filter((item) => item.key !== selected.key);
                    onChange(next);
                    onSelect(next[0]?.key ?? "");
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Remove question
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qa-question-text">Question</Label>
              <textarea
                id="qa-question-text"
                className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 font-mono text-sm leading-6"
                value={selected.questionText}
                disabled={!canEdit}
                placeholder="Write the question…"
                onChange={(event) =>
                  updateSelected((question) => ({
                    ...question,
                    questionText: event.target.value,
                  }))
                }
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={selected.isCodeView}
                  disabled={!canEdit}
                  onChange={(event) =>
                    updateSelected((question) => ({
                      ...question,
                      isCodeView: event.target.checked,
                    }))
                  }
                />
                Question is code view
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Options</Label>
                {canEdit ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() =>
                      updateSelected((question) => ({
                        ...question,
                        options: [...question.options, blankOption()],
                      }))
                    }
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add option
                  </Button>
                ) : null}
              </div>

              {selected.options.map((option, index) => (
                <div
                  key={option.key}
                  className="space-y-3 rounded-xl border border-border bg-slate-50/80 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-2 w-6 shrink-0 text-xs font-semibold text-slate-500">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <textarea
                      className="min-h-[64px] w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
                      value={option.optionText}
                      disabled={!canEdit}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      onChange={(event) =>
                        updateSelected((question) => ({
                          ...question,
                          options: question.options.map((item) =>
                            item.key === option.key
                              ? { ...item, optionText: event.target.value }
                              : item
                          ),
                        }))
                      }
                    />
                    {canEdit && selected.options.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-rose-700"
                        onClick={() =>
                          updateSelected((question) => ({
                            ...question,
                            options: question.options.filter((item) => item.key !== option.key),
                          }))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-4 pl-8 text-sm text-muted-foreground">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateSelected((question) => ({
                            ...question,
                            options: question.options.map((item) =>
                              item.key === option.key
                                ? { ...item, isCorrect: event.target.checked }
                                : item
                            ),
                          }))
                        }
                      />
                      Correct answer
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={option.isCodeView}
                        disabled={!canEdit}
                        onChange={(event) =>
                          updateSelected((question) => ({
                            ...question,
                            options: question.options.map((item) =>
                              item.key === option.key
                                ? { ...item, isCodeView: event.target.checked }
                                : item
                            ),
                          }))
                        }
                      />
                      Code view
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
