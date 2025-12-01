"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    if (!isOpen) return null;

    const handleLogin = () => {
        if (password === "admin1234") {
            // Set a simple cookie or local storage to persist login state if needed,
            // but for now we'll just redirect. The admin page will check this too.
            // For better security, we should set a cookie.
            document.cookie = "admin_auth=true; path=/; max-age=3600";
            router.push("/admin");
        } else {
            setError("Incorrect password");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Login</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                        <input
                            type="password"
                            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
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
