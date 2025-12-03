"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DetectionLog } from "../types";
import { format } from "date-fns";
import { Shield, ShieldAlert, Filter } from "lucide-react";

interface DashboardClientProps {
  initialUserId: string | null;
}

export default function DashboardClient({ initialUserId }: DashboardClientProps) {
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Filter states
  const [minConfidence, setMinConfidence] = useState(0.0);
  const [maxConfidence, setMaxConfidence] = useState(1.0);

  // Feedback state
  const [feedback, setFeedback] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const fetchLogs = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // API Route를 통해 데이터 가져오기 (서버 사이드와 동일한 로직 사용)
      const response = await fetch("/api/detection-logs", {
        headers: {
          "uuid": userId
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setDebugInfo(`에러: ${result.error}`);
      } else {
        // confidence 필터링은 클라이언트 사이드에서 수행
        const filteredData = (result.logs || []).filter(
          (log: DetectionLog) => log.confidence >= minConfidence && log.confidence <= maxConfidence
        );
        
        setLogs(filteredData);
        setDebugInfo(
          `총 ${result.count}개 로그 중 ${filteredData.length}개 표시 (confidence: ${minConfidence}~${maxConfidence})`
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching logs:", err);
      setError(errorMessage);
      setDebugInfo(`에러 발생: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchLogs();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, minConfidence, maxConfidence]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setFeedbackStatus("submitting");
    
    try {
      // user_feedback 테이블에 데이터 삽입 (admin 페이지와 동일한 테이블 사용)
      const { data, error } = await supabase
        .from("user_feedback")
        .insert({
          content: feedback,
          category: "general",
          status: "new",
          user_id: userId || null
        })
        .select();

      if (error) {
        console.error("Error submitting feedback:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        setFeedbackStatus("error");
      } else {
        console.log("Feedback submitted successfully:", data);
        setFeedbackStatus("success");
        setFeedback("");
        setTimeout(() => setFeedbackStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("Unexpected error submitting feedback:", err);
      setFeedbackStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold">User Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold">Detection Logs</h2>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Filter size={16} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confidence:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-16 rounded border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                />
                <span className="text-zinc-400">-</span>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={maxConfidence}
                  onChange={(e) => setMaxConfidence(Number(e.target.value))}
                  className="w-16 rounded border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                />
              </div>
            </div>
            <button onClick={fetchLogs} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Content</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Confidence</th>
                  <th className="px-6 py-3 font-medium">Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      {userId ? "Loading logs..." : "Please log in to view logs."}
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                      Error: {error}
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      No logs found within this range.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4">
                        <p className="line-clamp-2 max-w-md">{log.text_content}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {log.is_harmful ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            <ShieldAlert size={12} />
                            Harmful
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <Shield size={12} />
                            Safe
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {(log.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">
                        {log.model_version || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-lg font-semibold">Feedback</h3>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <textarea
              className="w-full rounded-md border border-zinc-300 bg-transparent p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:text-white"
              rows={3}
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={feedbackStatus === "submitting"}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {feedbackStatus === "submitting" ? "Sending..." : "Send Feedback"}
              </button>
              {feedbackStatus === "success" && (
                <span className="text-sm text-green-600">Thank you for your feedback!</span>
              )}
              {feedbackStatus === "error" && (
                <span className="text-sm text-red-600">Failed to send feedback.</span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

