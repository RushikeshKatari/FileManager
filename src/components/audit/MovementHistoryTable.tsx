import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { MovementRecord, ActionType } from '../../types';

interface MovementHistoryTableProps {
  records: MovementRecord[];
  filterFileId?: string;
  onSelectFile?: (fileId: string) => void;
  title?: string;
}

export const MovementHistoryTable: React.FC<MovementHistoryTableProps> = ({
  records,
  filterFileId,
  onSelectFile,
  title = 'File Movement History & Audit Trail',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<MovementRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (filterFileId && rec.fileId !== filterFileId) return false;
      if (actionFilter !== 'ALL' && rec.action !== actionFilter) return false;
      if (roleFilter !== 'ALL' && rec.personRole !== roleFilter) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        rec.fileId.toLowerCase().includes(term) ||
        rec.fileName.toLowerCase().includes(term) ||
        rec.fromLocation.toLowerCase().includes(term) ||
        rec.toLocation.toLowerCase().includes(term) ||
        rec.personName.toLowerCase().includes(term) ||
        rec.personId.toLowerCase().includes(term) ||
        (rec.scanSequence && rec.scanSequence.toLowerCase().includes(term))
      );
    });
  }, [records, filterFileId, actionFilter, roleFilter, searchTerm]);

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Timestamp', 'File ID', 'File Name', 'From Location', 'To Location', 'Action', 'Person ID', 'Person Name', 'Role', 'Scan Sequence', 'Notes'];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.timestamp,
      `"${r.fileId}"`,
      `"${r.fileName.replace(/"/g, '""')}"`,
      `"${r.fromLocation.replace(/"/g, '""')}"`,
      `"${r.toLocation.replace(/"/g, '""')}"`,
      r.action,
      r.personId,
      `"${r.personName.replace(/"/g, '""')}"`,
      r.personRole,
      `"${(r.scanSequence || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `File_Movement_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'TAKE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            TAKE (Shelf/Custody)
          </span>
        );
      case 'RECEIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            RECEIVE (Officer)
          </span>
        );
      case 'RELEASE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            RELEASE (Officer)
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            RETURN (Restock)
          </span>
        );
      case 'REGISTER':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            REGISTERED
          </span>
        );
      case 'RELOCATE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            RELOCATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      };
    } catch {
      return { time: iso, date: '' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-slate-900">{title}</h3>
              <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                {filteredRecords.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable physical ledger tracking every scan, location change, and person in custody
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search file, officer, attender, shelf..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Actions</option>
              <option value="TAKE">TAKE (From Shelf)</option>
              <option value="RECEIVE">RECEIVE (With Officer)</option>
              <option value="RELEASE">RELEASE (Officer to Attender)</option>
              <option value="RETURN">RETURN (To Shelf)</option>
              <option value="REGISTER">REGISTER</option>
              <option value="RELOCATE">RELOCATE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ATTENDER">Attenders</option>
              <option value="OFFICER">Officers</option>
              <option value="ADMIN">System Admin</option>
            </select>
          </div>

          {filterFileId && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs text-indigo-800 font-medium">
              <span>Showing: <strong>{filterFileId}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Time & Date</th>
              <th className="py-3 px-4">File ID & Name</th>
              <th className="py-3 px-4">From Location</th>
              <th className="py-3 px-4">To Location</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Responsible Person</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No movement records found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const ts = formatTimestamp(record.timestamp);
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ts.time}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {ts.date}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-xs border border-indigo-200">
                          {record.fileId}
                        </span>
                        {onSelectFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectFile(record.fileId);
                            }}
                            title="Filter by this file"
                            className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-slate-700 font-medium text-[11px] truncate max-w-[200px] mt-0.5">
                        {record.fileName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-[180px]">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{record.fromLocation}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium max-w-[180px]">
                      <div className="flex items-start gap-1">
                        <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="truncate text-slate-900">{record.toLocation}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(record.action)}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{record.personName}</div>
                      <div className="text-[11px] text-slate-400">
                        {record.personId} • <span className="capitalize">{record.personRole.toLowerCase()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(record);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        Audit Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                  {selectedRecord.id}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">Transaction Audit Proof</h4>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">File Reference:</span>
                <span className="font-bold text-indigo-600">
                  {selectedRecord.fileId} — {selectedRecord.fileName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">From</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedRecord.fromLocation}</div>
                </div>
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                  <div className="text-indigo-400 text-[10px] uppercase font-bold">To</div>
                  <div className="font-semibold text-indigo-950 mt-0.5">{selectedRecord.toLocation}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                  Scan Sequence & Verification
                </div>
                <div className="font-mono text-emerald-400 text-xs font-bold">
                  {selectedRecord.scanSequence || 'Direct Scan Transaction'}
                </div>
                <div className="text-[11px] text-slate-300 pt-1">
                  Validated against physical location matrix at {new Date(selectedRecord.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex justify-between border-t border-slate-100 pt-3">
                <span className="text-slate-500">Authenticated Actor:</span>
                <span className="font-bold text-slate-900">
                  {selectedRecord.personName} ({selectedRecord.personId})
                </span>
              </div>

              {selectedRecord.notes && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                  <strong>Notes:</strong> {selectedRecord.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
