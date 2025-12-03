"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DetectionLog } from "../types";
import { format } from "date-fns";
import { Shield, ShieldAlert, Search, Lock, Filter } from "lucide-react";

interface HomeClientProps {
    userId: string | null;
}

export default function HomeClient({ userId }: HomeClientProps) {
    const [logs, setLogs] = useState<DetectionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [minConfidence, setMinConfidence] = useState(0.0);
    const [maxConfidence, setMaxConfidence] = useState(1.0);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Feedback state
    const [feedback, setFeedback] = useState("");
    const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

    useEffect(() => {
        fetchLogs();
    }, [page, minConfidence, maxConfidence, userId]);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);

        if (!userId) {
            setLogs([]);
            setTotalPages(1);
            setLoading(false);
            return;
        }

        let query = supabase
            .from("detection_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .gte("confidence", minConfidence)
            .lte("confidence", maxConfidence)
            .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
            .eq("user_id", userId);

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching logs:", error);
            setError(error.message);
        } else {
            setLogs(data || []);
            if (count !== null) {
                setTotalPages(Math.ceil(count / ITEMS_PER_PAGE) || 1);
            }
        }
        setLoading(false);
    };

    const handleFeedbackSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.trim()) return;

        setFeedbackStatus("submitting");
        const { error } = await supabase.from("user_feedback").insert({ content: feedback });

        if (error) {
            console.error("Error submitting feedback:", error);
            setFeedbackStatus("error");
        } else {
            setFeedbackStatus("success");
            setFeedback("");
            setTimeout(() => setFeedbackStatus("idle"), 3000);
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
                    {userId && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            User ID: {userId}
                        </div>
                    )}
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
                                    onChange={(e) => {
                                        setMinConfidence(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="w-16 rounded border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                                />
                                <span className="text-zinc-400">-</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={maxConfidence}
                                    onChange={(e) => {
                                        setMaxConfidence(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="w-16 rounded border border-zinc-300 bg-transparent px-1 py-0.5 text-sm dark:border-zinc-700"
                                />
                            </div>
                        </div>
                        <button onClick={() => fetchLogs()} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
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
                                            Loading logs...
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

                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="rounded-full p-2 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                    >
                        <Search className="rotate-180" size={20} style={{ display: 'none' }} /> {/* Hack to keep imports if needed, but better to use proper icons */}
                        <span className="text-sm font-medium">Previous</span>
                    </button>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                        className="rounded-full p-2 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                    >
                        <span className="text-sm font-medium">Next</span>
                    </button>
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
