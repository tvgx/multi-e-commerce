"use client";

import React, { useEffect, useState } from "react";
import { useAdminActions } from "@/hooks/useAdminActions";
import {
    Activity, Server, Database, Code2, Play, CheckCircle2, XCircle, AlertTriangle
} from "lucide-react";

export default function SystemHealth() {
    const { checkSystemHealth, validateJsonConfig, loading } = useAdminActions();
    const [healthData, setHealthData] = useState<any>(null);
    const [jsonInput, setJsonInput] = useState("");
    const [validationResult, setValidationResult] = useState<any>(null);

    const loadHealth = async () => {
        const data = await checkSystemHealth();
        if (data) setHealthData(data);
    };

    useEffect(() => {
        loadHealth();
        // Polling every 10 seconds for real-time monitoring
        const interval = setInterval(loadHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleValidate = async () => {
        if (!jsonInput.trim()) return;
        const result = await validateJsonConfig(jsonInput);
        setValidationResult(result);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 bg-slate-950 min-h-screen">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Server className="text-emerald-500" /> Master Admin Dashboard
            </h1>

            {/* Performance Metrics */}
            {healthData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* CPU Widget */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-slate-400">CPU Usage (Load)</h3>
                            <Activity className="text-blue-400 h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold">{healthData.os.loadAvg}</p>
                        <p className="text-xs text-slate-500 mt-1">Cores: {healthData.os.cpus}</p>
                    </div>

                    {/* Memory Widget */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-slate-400">Memory (RAM)</h3>
                            <Server className="text-purple-400 h-5 w-5" />
                        </div>
                        <p className="text-3xl font-bold">{healthData.os.memory.usedGB} / {healthData.os.memory.totalGB} GB</p>
                        <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${parseFloat(healthData.os.memory.usagePercent) > 85 ? 'bg-red-500' : 'bg-purple-500'}`}
                                style={{ width: `${healthData.os.memory.usagePercent}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{healthData.os.memory.usagePercent}% Used</p>
                    </div>

                    {/* Postgres Widget */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-slate-400">PostgreSQL</h3>
                            <Database className="text-indigo-400 h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            {healthData.databases.postgresql.status === 'Connected' ?
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                                <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="font-medium">{healthData.databases.postgresql.status}</span>
                        </div>
                        <p className="text-sm text-slate-400">Total Shops: <span className="text-white font-semibold">{healthData.databases.postgresql.shopCount}</span></p>
                    </div>

                    {/* MongoDB Widget */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-slate-400">MongoDB Atlas</h3>
                            <Database className="text-emerald-400 h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            {healthData.databases.mongodb.status === 'Connected' ?
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                                <XCircle className="h-4 w-4 text-red-500" />
                            }
                            <span className="font-medium">{healthData.databases.mongodb.status}</span>
                        </div>
                        <p className="text-sm text-slate-400">UI Templates: <span className="text-white font-semibold">{healthData.databases.mongodb.jsonCount}</span></p>
                    </div>
                </div>
            )}

            {/* JSON Schema Validator Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2"><Code2 className="text-amber-500" /> JSON Validator Simulator</h2>
                        <p className="text-sm text-slate-400 mt-1">Test Master JSON configurations against the Storefront Engine constraints.</p>
                    </div>
                    <button
                        onClick={handleValidate}
                        disabled={loading || !jsonInput}
                        className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Play className="h-4 w-4" /> Run Validator
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-4 bg-slate-950">
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='{"sections": [{"id": "s1", "type": "Hero"}]}'
                            className="w-full h-64 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                    </div>
                    <div className="p-6 bg-slate-900 flex flex-col justify-center border-l border-slate-800">
                        {validationResult ? (
                            <div className={`p-4 rounded-lg flex gap-3 ${validationResult.valid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                {validationResult.valid ? <CheckCircle2 className="text-emerald-500 shrink-0" /> : <AlertTriangle className="text-red-500 shrink-0" />}
                                <div>
                                    <h4 className={`font-medium ${validationResult.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                                    </h4>
                                    <p className="text-slate-300 text-sm mt-1">{validationResult.message}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-slate-500 flex flex-col items-center">
                                <Code2 className="h-10 w-10 mb-2 opacity-20" />
                                <p>Awaiting JSON payload validation...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
