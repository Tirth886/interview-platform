import Editor from "@monaco-editor/react";
import { cn } from "@shared/ui";
import { Maximize2, Minimize2, Play, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type WorkspaceLanguage = "javascript" | "typescript" | "python" | "java" | "cpp";

const LANGUAGE_OPTIONS: { value: WorkspaceLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const LANGUAGE_SNIPPETS: Record<WorkspaceLanguage, string> = {
  javascript: "// JavaScript workspace\\nfunction solve() {\\n  return \"Start coding here\";\\n}\\n",
  typescript: "// TypeScript workspace\\nfunction solve(): string {\\n  return \"Start coding here\";\\n}\\n",
  python: "# Python workspace\\ndef solve():\\n    return \"Start coding here\"\\n",
  java: "// Java workspace\\nclass Solution {\\n  public static String solve() {\\n    return \"Start coding here\";\\n  }\\n}\\n",
  cpp: "// C++ workspace\\n#include <string>\\n\\nstd::string solve() {\\n  return \"Start coding here\";\\n}\\n",
};

type CodeWorkspaceProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CodeWorkspace({ isOpen, onClose }: CodeWorkspaceProps): JSX.Element {
  const editorWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const isResizingOutputRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(420);

  const [activeLanguage, setActiveLanguage] = useState<WorkspaceLanguage>("javascript");
  const [languageDrafts, setLanguageDrafts] = useState<Record<WorkspaceLanguage, string>>(
    LANGUAGE_SNIPPETS,
  );
  const [runnerOutput, setRunnerOutput] = useState<string[]>([
    "Runner ready. Click Run to execute JavaScript.",
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkspaceFullscreen, setIsWorkspaceFullscreen] = useState(false);
  const [outputWidth, setOutputWidth] = useState(420);

  const runEditorCode = async (): Promise<void> => {
    if (activeLanguage !== "javascript") {
      const selectedLanguageLabel =
        LANGUAGE_OPTIONS.find((language) => language.value === activeLanguage)?.label ??
        activeLanguage;
      setRunnerOutput([
        `Run is currently available only for JavaScript. Selected language: ${selectedLanguageLabel}.`,
      ]);
      return;
    }

    setIsRunning(true);
    const logs: string[] = [];
    const editorCode = languageDrafts[activeLanguage];

    const stringify = (value: unknown): string => {
      if (typeof value === "string") return value;
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    };

    const runtimeConsole = {
      log: (...args: unknown[]) => logs.push(args.map(stringify).join(" ")),
      info: (...args: unknown[]) => logs.push(args.map(stringify).join(" ")),
      warn: (...args: unknown[]) => logs.push(`WARN: ${args.map(stringify).join(" ")}`),
      error: (...args: unknown[]) => logs.push(`ERROR: ${args.map(stringify).join(" ")}`),
    };

    try {
      const execute = new Function(
        "console",
        `"use strict"; return (async () => {\\n${editorCode}\\n})();`,
      ) as (console: typeof runtimeConsole) => Promise<unknown>;
      const result = await execute(runtimeConsole);
      if (result !== undefined) logs.push(`Return: ${stringify(result)}`);
      if (logs.length === 0) logs.push("Execution completed with no output.");
      setRunnerOutput(logs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRunnerOutput([`Execution failed: ${message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearRunnerOutput = (): void => {
    setRunnerOutput(["Output cleared."]);
  };

  const toggleWorkspaceFullscreen = async (): Promise<void> => {
    try {
      if (!document.fullscreenElement && editorWorkspaceRef.current) {
        await editorWorkspaceRef.current.requestFullscreen();
        setIsWorkspaceFullscreen(true);
        return;
      }
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsWorkspaceFullscreen(false);
      }
    } catch {
      setRunnerOutput(["Fullscreen mode is not available in this browser context."]);
    }
  };

  useEffect(() => {
    const onFullscreenChange = (): void => {
      setIsWorkspaceFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent): void => {
      if (!isResizingOutputRef.current || !editorWorkspaceRef.current) return;

      const deltaX = resizeStartXRef.current - event.clientX;
      const nextWidth = resizeStartWidthRef.current + deltaX;
      const maxWidth = Math.max(360, editorWorkspaceRef.current.clientWidth - 320);
      const clamped = Math.min(Math.max(280, nextWidth), maxWidth);
      setOutputWidth(clamped);
    };

    const onMouseUp = (): void => {
      isResizingOutputRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <>
      <div
        ref={editorWorkspaceRef}
        className={cn(
          "absolute inset-0 z-30 h-full w-full transform bg-[#111315] shadow-2xl transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div>
            <p className="text-sm font-semibold">Code Editor</p>
            <p className="text-xs text-slate-400"></p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="editor-language-select">
              Select language
            </label>
            <select
              id="editor-language-select"
              value={activeLanguage}
              onChange={(event) => setActiveLanguage(event.target.value as WorkspaceLanguage)}
              className="h-8 rounded-md border border-white/10 bg-[#1a1d20] px-2 text-xs font-medium text-slate-100 outline-none focus:ring-2 focus:ring-white/30"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
              onClick={() => {
                void runEditorCode();
              }}
              disabled={isRunning}
            >
              <Play className="h-3.5 w-3.5" />
              {isRunning ? "Running" : "Run"}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
              onClick={clearRunnerOutput}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Output
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
              onClick={() => {
                void toggleWorkspaceFullscreen();
              }}
            >
              {isWorkspaceFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
              {isWorkspaceFullscreen ? "Exit Full Screen" : "Full Screen"}
            </button>
            <button
              type="button"
              aria-label="Close editor"
              className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(100%-56px)] min-w-0">
          <div className="min-w-0 flex-1">
            <Editor
              height="100%"
              language={activeLanguage}
              theme="vs-dark"
              value={languageDrafts[activeLanguage]}
              onChange={(value) => {
                const nextValue = value ?? "";
                setLanguageDrafts((prev) => ({
                  ...prev,
                  [activeLanguage]: nextValue,
                }));
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>

          <button
            type="button"
            aria-label="Resize output panel"
            className="group flex h-full w-3 cursor-col-resize items-center justify-center border-x border-white/10 bg-[#141618]"
            onMouseDown={(event) => {
              isResizingOutputRef.current = true;
              resizeStartXRef.current = event.clientX;
              resizeStartWidthRef.current = outputWidth;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          >
            <span className="h-16 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-white/40" />
          </button>

          <div
            className="h-full border-l border-white/10 bg-[#0b0d0e] p-3"
            style={{ width: `${outputWidth}px` }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Output</p>
            <div className="h-[calc(100%-24px)] overflow-auto rounded-md border border-white/10 bg-black/40 p-3">
              <pre className="whitespace-pre-wrap text-xs text-emerald-300">{runnerOutput.join("\n")}</pre>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <button
          type="button"
          aria-label="Close editor overlay"
          className="absolute inset-0 z-20 bg-black/30"
          onClick={onClose}
        />
      )}
    </>
  );
}
