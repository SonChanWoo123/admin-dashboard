"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function DebugPage() {
    const [status, setStatus] = useState<any>({});
    const [logs, setLogs] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        const envStatus = {
            url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) + "...",
        };
        setStatus(envStatus);

        try {
            const { data, error } = await supabase
                .from("detection_logs")
                .select("*")
                .limit(5);

            if (error) {
                setError(error);
            } else {
                setLogs(data);
            }
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="mb-4 text-2xl font-bold">Supabase Debugger</h1>

            <div className="mb-8 space-y-2 rounded border p-4">
                <h2 className="font-bold">Environment Variables</h2>
                <p>NEXT_PUBLIC_SUPABASE_URL: {status.url ? "✅ Present" : "❌ Missing"} ({status.urlValue})</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {status.key ? "✅ Present" : "❌ Missing"}</p>
            </div>

            <div className="mb-8 space-y-2 rounded border p-4">
                <h2 className="font-bold">Query Result (detection_logs)</h2>
                {error ? (
                    <div className="text-red-600">
                        <p className="font-bold">Error:</p>
                        <pre>{JSON.stringify(error, null, 2)}</pre>
                    </div>
                ) : (
                    <div>
                        <p className="font-bold text-green-600">Success!</p>
                        <p>Count: {logs?.length ?? 0}</p>
                        <pre className="mt-2 max-h-60 overflow-auto bg-gray-100 p-2 dark:bg-zinc-800">
                            {JSON.stringify(logs, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
