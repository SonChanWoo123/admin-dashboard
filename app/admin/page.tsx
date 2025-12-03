"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { AppSetting, DetectionLog } from "../types";
import { Settings, Save, LogOut, RefreshCw } from "lucide-react";

export default function AdminPage() {
    const [settings, setSettings] = useState<AppSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Simple client-side auth check
        const cookies = document.cookie.split(";");
        const authCookie = cookies.find((c) => c.trim().startsWith("admin_auth="));
        if (!authCookie || !authCookie.includes("true")) {
            router.push("/");
            return;
        }

        fetchSettings();
    }, [router]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("app_settings")
            .select("*")
            .order("key");

        if (error) {
            console.error("Error fetching settings:", error);
        } else {
            setSettings(data || []);
        }
        setLoading(false);
    };

    const [logs, setLogs] = useState<DetectionLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    const fetchLogs = async () => {
        setLoadingLogs(true);
        const { data, error } = await supabase
            .from("detection_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            setLogs(data || []);
        }
        setLoadingLogs(false);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleUpdate = async (key: string, newValue: string) => {
        setSaving(key);
        const { error } = await supabase
            .from("app_settings")
            .update({ value: newValue, updated_at: new Date().toISOString() })
            .eq("key", key);

        if (error) {
            console.error("Error updating setting:", error);
            alert("Failed to update setting");
        } else {
            // Update local state
            setSettings((prev) =>
                prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
            );
        }
        setSaving(null);
    };

    const handleLogout = () => {
        document.cookie = "admin_auth=; path=/; max-age=0";
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
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
                    <h2 className="text-2xl font-semibold">App Settings</h2>
                    <button onClick={fetchSettings} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
                    {loading ? (
                        <p className="col-span-full text-center text-zinc-500">Loading settings...</p>
                    ) : settings.length === 0 ? (
                        <p className="col-span-full text-center text-zinc-500">No settings found.</p>
                    ) : (
                        settings.map((setting) => (
                            <div
                                key={setting.key}
                                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                            >
                                <div className="mb-4">
                                    <h3 className="font-medium text-zinc-900 dark:text-white">{setting.key}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{setting.description}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:text-white"
                                        defaultValue={setting.value}
                                        onBlur={(e) => {
                                            if (e.target.value !== setting.value) {
                                                handleUpdate(setting.key, e.target.value);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                    />
                                    {saving === setting.key && (
                                        <span className="animate-spin text-indigo-600 dark:text-indigo-400">
                                            <RefreshCw size={16} />
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-zinc-400">
                                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Detection Logs</h2>
                    <button onClick={fetchLogs} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
                        <RefreshCw size={16} />
                    </button>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">ID</th>
                                    <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Date</th>
                                    <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Content</th>
                                    <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Confidence</th>
                                    <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Harmful</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {loadingLogs ? (
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
                                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{log.id}</td>
                                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 max-w-xs truncate" title={log.text_content}>
                                                {log.text_content}
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                                                {(log.confidence * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.is_harmful
                                                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                        }`}
                                                >
                                                    {log.is_harmful ? "Harmful" : "Safe"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
