import React, { useState } from 'react';
import {
  DatabaseZap,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Lock,
  Layers,
  Save,
  Clock,
  FileCode,
  AlertTriangle
} from 'lucide-react';
import { ACIDTestResult } from '../types';
import { api } from '../services/api';

export const AcidComplianceView: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    timestamp: string;
    allPassed: boolean;
    testResults: ACIDTestResult[];
  } | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    try {
      const res = await api.runAcidTests();
      setTestResponse(res);
    } catch (err: any) {
      alert(err.message || 'Failed to execute ACID tests');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              ACID Transaction Compliance & Concurrency Test Suite
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              System Section 10 Verification
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Live programmatic verification of Atomicity, Consistency, Isolation, and Durability guarantees running directly against the relational database engine.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={running}
          className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          {running ? 'Executing Verification Tests...' : 'Run Live ACID Verification Suite'}
        </button>
      </div>

      {/* 4 Pillars Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> A — Atomicity
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            All operations in a maintenance report submission (report row, inventory part deductions, status transitions, cost calculations) commit together or roll back completely upon error.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Mechanism: <span className="text-slate-300">db.transaction()</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Layers className="w-4 h-4" /> C — Consistency
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Enforces strict constraints: non-negative inventory quantities, valid foreign keys for equipment and authorized technicians, and valid status transition state machines.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Mechanism: <span className="text-slate-300">CHECK & FOREIGN KEY constraints</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Lock className="w-4 h-4" /> I — Isolation
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Concurrent technician requests issuing identical remaining stock cannot produce race conditions or oversell parts. Transactions execute in serializable isolation.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Mechanism: <span className="text-slate-300">SQLite WAL immediate serialization</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Save className="w-4 h-4" /> D — Durability
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Committed maintenance records and inventory logs are flushed to write-ahead logs (WAL) on disk, surviving server restarts and network disconnections without data loss.
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            Mechanism: <span className="text-slate-300">WAL mode & synchronous checkpoints</span>
          </div>
        </div>
      </div>

      {/* Live Test Results Display */}
      {testResponse ? (
        <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${testResponse.allPassed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <h3 className="font-bold text-sm text-slate-100">
                Test Execution Results ({testResponse.testResults.length} Tests Completed)
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-400">
              Execution Time: {testResponse.timestamp} PHT
            </span>
          </div>

          <div className="space-y-3">
            {testResponse.testResults.map((t, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {t.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-bold text-slate-100">{t.testName}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    t.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px] p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Initial State:</span>
                    <span className="text-slate-300">{t.initialState}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Action Under Test:</span>
                    <span className="text-amber-400">{t.simulatedAction}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Verified Final State:</span>
                    <span className="text-emerald-400 font-bold">{t.finalState}</span>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {t.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-850 border border-dashed border-slate-800 text-center text-slate-400 text-xs space-y-2">
          <DatabaseZap className="w-8 h-8 mx-auto text-amber-400" />
          <p className="font-semibold text-slate-200">ACID Test Runner Ready</p>
          <p className="text-slate-500 max-w-md mx-auto">
            Click "Run Live ACID Verification Suite" above to trigger transactions against the backend SQLite engine and verify atomicity rollback, constraint consistency, concurrency isolation, and WAL durability.
          </p>
        </div>
      )}

      {/* Database Schema & Technical Architecture Documentation */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-3 text-xs">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" /> Relational Schema & ACID Transaction Logic Architecture
        </h3>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 leading-relaxed">
          <div>
            <strong className="text-amber-400">1. Atomic Part Issuance & Maintenance Submission:</strong>
            <p className="text-slate-400 mt-0.5">
              Executed in a single <code className="text-cyan-400">db.transaction()</code>. When parts are consumed in <code className="text-cyan-400">/api/work-orders/:id/submit-report</code>, the engine queries the current balance. If available stock &lt; quantity requested, an error is thrown, immediately unwinding all uncommitted modifications to <code className="text-slate-200">work_orders</code>, <code className="text-slate-200">work_order_parts</code>, and <code className="text-slate-200">inventory_transactions</code>.
            </p>
          </div>

          <div>
            <strong className="text-amber-400">2. Invariant Consistency Constraints:</strong>
            <p className="text-slate-400 mt-0.5">
              The table <code className="text-cyan-400">parts_inventory</code> defines <code className="text-cyan-400">CHECK(quantity_on_hand &gt;= 0)</code>. Any update that would drive inventory negative is rejected at the SQLite engine level with a constraint violation. Foreign keys are enforced with <code className="text-cyan-400">PRAGMA foreign_keys = ON;</code>.
            </p>
          </div>

          <div>
            <strong className="text-amber-400">3. Concurrency & Isolation:</strong>
            <p className="text-slate-400 mt-0.5">
              The engine operates in <code className="text-cyan-400">PRAGMA journal_mode = WAL;</code> with a <code className="text-cyan-400">busy_timeout = 5000ms</code>. Read queries never block writes, and write transactions are serialized without dirty reads or phantom updates.
            </p>
          </div>

          <div>
            <strong className="text-amber-400">4. Crash Durability:</strong>
            <p className="text-slate-400 mt-0.5">
              Committed transactions are recorded in the write-ahead log (<code className="text-slate-200">heliomms.db-wal</code>) and periodically checkpointed to <code className="text-slate-200">heliomms.db</code>, ensuring non-volatile data retention across server restarts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
