"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { UserFeedback, DetectionLog } from "../types";
import { LogOut, RefreshCw, MessageSquare, Shield, ShieldAlert, Search } from "lucide-react";
import { format } from "date-fns";

export default function AdminPage() {
    const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
    const [feedbackPage, setFeedbackPage] = useState(1);
    const [hasMoreFeedback, setHasMoreFeedback] = useState(true);
    const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
    const [logs, setLogs] = useState<DetectionLog[]>([]);
    const [activeTab, setActiveTab] = useState<"feedback" | "logs">("feedback");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    const router = useRouter();

    useEffect(() => {
        // Simple client-side auth check
        const cookies = document.cookie.split(";");
        const authCookie = cookies.find((c) => c.trim().startsWith("admin_auth="));

        if (authCookie && authCookie.includes("true")) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        if (activeTab === "logs") {
            fetchLogs();
        } else if (activeTab === "feedback" && feedbackList.length === 0) {
            fetchFeedback(1);
        }
    }, [page, activeTab, isAuthenticated]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastFeedbackElementRef = useCallback((node: HTMLDivElement) => {
        if (isFetchingFeedback) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreFeedback) {
                setFeedbackPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isFetchingFeedback, hasMoreFeedback]);

    useEffect(() => {
        if (feedbackPage > 1) {
            fetchFeedback(feedbackPage);
        }
    }, [feedbackPage]);

    const fetchFeedback = async (pageToFetch: number) => {
        if (isFetchingFeedback) return;
        setIsFetchingFeedback(true);

        const from = (pageToFetch - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        const { data, error } = await supabase
            .from("user_feedback")
            .select("*")
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching feedback:", error);
        } else {
            if (data && data.length > 0) {
                setFeedbackList(prev => pageToFetch === 1 ? data : [...prev, ...data]);
                if (data.length < ITEMS_PER_PAGE) {
                    setHasMoreFeedback(false);
                }
            } else {
                setHasMoreFeedback(false);
            }
        }
        setIsFetchingFeedback(false);
    };

    const fetchLogs = async () => {
        setLoading(true);
        const { data, error, count } = await supabase
            .from("detection_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            setLogs(data || []);
            if (count !== null) {
                setTotalPages(Math.ceil(count / ITEMS_PER_PAGE) || 1);
            }
        }
        setLoading(false);
    };

    const handleUpdateFeedbackStatus = async (id: number, newStatus: string) => {
        const { error } = await supabase
            .from("user_feedback")
            .update({ status: newStatus })
            .eq("id", id);

        if (error) {
            console.error("Error updating feedback status:", error);
            alert("Failed to update status");
        } else {
            setFeedbackList((prev) =>
                prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
            );
        }
    };

    const handleLogout = () => {
        document.cookie = "admin_auth=; path=/; max-age=0";
        setIsAuthenticated(false);
        setPassword("");
        setLoginError("");
    };

    const handleLogin = () => {
        if (password === "admin1234") {
            document.cookie = "admin_auth=true; path=/; max-age=3600";
            setIsAuthenticated(true);
            // fetchFeedback will be triggered by useEffect
        } else {
            setLoginError("Incorrect password");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
                    <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-white">Admin Login</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setLoginError("");
                                }}
                                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            />
                            {loginError && <p className="mt-1 text-sm text-red-500">{loginError}</p>}
                        </div>
                        <button
                            onClick={handleLogin}
                            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("feedback")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "feedback"
                                ? "bg-indigo-600 text-white"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                }`}
                        >
                            User Feedback
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "logs"
                                ? "bg-indigo-600 text-white"
                                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                }`}
                        >
                            Detection Logs
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === "feedback") {
                                setFeedbackPage(1);
                                setHasMoreFeedback(true);
                                setFeedbackList([]);
                                fetchFeedback(1);
                            }
                            if (activeTab === "logs") fetchLogs();
                        }}
                        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {activeTab === "feedback" ? (
                    <div className="space-y-4">
                        {feedbackList.length === 0 && !isFetchingFeedback ? (
                            <p className="text-center text-zinc-500">No feedback found.</p>
                        ) : (
                            feedbackList.map((feedback, index) => {
                                if (feedbackList.length === index + 1) {
                                    return (
                                        <div
                                            ref={lastFeedbackElementRef}
                                            key={feedback.id}
                                            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                                        >
                                            <div className="mb-4 flex items-start justify-between">
                                                <div>
                                                    <span className="mb-2 inline-block rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {feedback.category}
                                                    </span>
                                                    <p className="mt-1 text-zinc-900 dark:text-white">{feedback.content}</p>
                                                </div>
                                                <select
                                                    value={feedback.status}
                                                    onChange={(e) => handleUpdateFeedbackStatus(feedback.id, e.target.value)}
                                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${feedback.status === "new"
                                                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : feedback.status === "read"
                                                            ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                                            : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        }`}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="read">Read</option>
                                                    <option value="resolved">Resolved</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>{new Date(feedback.created_at).toLocaleString()}</span>
                                                {feedback.contact_email && (
                                                    <span>Email: {feedback.contact_email}</span>
                                                )}
                                                {feedback.user_id && <span>User ID: {feedback.user_id}</span>}
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={feedback.id}
                                            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                                        >
                                            <div className="mb-4 flex items-start justify-between">
                                                <div>
                                                    <span className="mb-2 inline-block rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                        {feedback.category}
                                                    </span>
                                                    <p className="mt-1 text-zinc-900 dark:text-white">{feedback.content}</p>
                                                </div>
                                                <select
                                                    value={feedback.status}
                                                    onChange={(e) => handleUpdateFeedbackStatus(feedback.id, e.target.value)}
                                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${feedback.status === "new"
                                                        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                        : feedback.status === "read"
                                                            ? "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                                            : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        }`}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="read">Read</option>
                                                    <option value="resolved">Resolved</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span>{new Date(feedback.created_at).toLocaleString()}</span>
                                                {feedback.contact_email && (
                                                    <span>Email: {feedback.contact_email}</span>
                                                )}
                                                {feedback.user_id && <span>User ID: {feedback.user_id}</span>}
                                            </div>
                                        </div>
                                    );
                                }
                            })
                        )}
                        {isFetchingFeedback && (
                            <div className="py-4 text-center text-zinc-500">Loading more feedback...</div>
                        )}
                        {!hasMoreFeedback && feedbackList.length > 0 && (
                            <div className="py-4 text-center text-zinc-500">No more feedback</div>
                        )}
                    </div>
                ) : (
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
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                No logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                                    {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="line-clamp-2 max-w-md text-zinc-900 dark:text-zinc-100">{log.text_content}</p>
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
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-center gap-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                                className="rounded-full p-2 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
                            >
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
                    </div>
                )}
            </main>
        </div>
    );
}
