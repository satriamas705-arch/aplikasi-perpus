import React, { useState } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Sparkles,
  Inbox,
  X,
  Calendar,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { EmailLog } from '../types/library';

export const EmailNotifications: React.FC = () => {
  const { emailLogs, triggerAutomaticReminderCheck, settings, loans } = useLibrary();

  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ count: number; messages: string[] } | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Overdue and upcoming count
  const overdueCount = loans.filter((l) => l.status === 'Terlambat').length;
  const activeCount = loans.filter((l) => l.status === 'Dipinjam').length;

  const handleTriggerBulkEmails = () => {
    setIsSending(true);
    setTimeout(() => {
      const res = triggerAutomaticReminderCheck();
      setDispatchResult({ count: res.sentCount, messages: res.messages });
      setIsSending(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            Notifikasi & Pengingat Email Otomatis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengiriman pesan otomatis untuk tenggat waktu pengembalian buku dan pemberitahuan denda
          </p>
        </div>

        <button
          onClick={handleTriggerBulkEmails}
          disabled={isSending}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70 shrink-0"
        >
          {isSending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>{isSending ? 'Memproses Pengiriman...' : 'Jalankan Pengingat Email Sekarang'}</span>
        </button>
      </div>

      {/* Dispatch notice */}
      {dispatchResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Selesai Memproses Pengingat Email Otomatis ({dispatchResult.count} email terkirim)
            </span>
            <button
              onClick={() => setDispatchResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {dispatchResult.messages.length > 0 && (
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
              {dispatchResult.messages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Status Pengingat</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-slate-900">Otomasi Aktif</div>
          <p className="text-xs text-slate-500">
            Pengecekan H-2, Hari H, dan status terlambat aktif setiap hari
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Target Notifikasi Saat Ini</span>
          <div className="text-xl font-bold text-indigo-600">
            {overdueCount} Terlambat / {activeCount} Aktif
          </div>
          <p className="text-xs text-slate-500">
            Anggota dengan peminjaman yang memerlukan pemberitahuan
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Email Terkirim</span>
          <div className="text-xl font-bold text-slate-900">{emailLogs.length} Pesan</div>
          <p className="text-xs text-slate-500">
            Tingkat keberhasilan pengiriman sistem: 100%
          </p>
        </div>
      </div>

      {/* Email Dispatch Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-600" />
              Riwayat Log Pengiriman Email (Audit Trail)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik pada baris log untuk melihat pratinjau tampilan email HTML yang diterima anggota
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {emailLogs.length} Log Tersimpan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Waktu Terkirim</th>
                <th className="px-4 py-3">Penerima (Anggota)</th>
                <th className="px-4 py-3">Alamat Email</th>
                <th className="px-4 py-3">Buku Terkait</th>
                <th className="px-4 py-3">Jenis Pemberitahuan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Pratinjau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada log email. Klik tombol di atas untuk menjalankan pengingat sekarang.
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setPreviewEmail(log)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-slate-500">{log.sentAt}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{log.recipientName}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono">{log.recipientEmail}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{log.bookTitle}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.type.includes('Terlambat')
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewEmail(log);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 transition-colors"
                        title="Lihat Pratinjau Email"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email HTML Preview Modal */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Pratinjau Email Notifikasi</h3>
              </div>
              <button
                onClick={() => setPreviewEmail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Email Envelope */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-xs">
              <div className="bg-slate-50 p-3 border-b border-slate-200 space-y-1">
                <div className="flex">
                  <span className="w-16 font-semibold text-slate-400">Dari:</span>
                  <span className="font-medium text-slate-800">
                    {settings.libraryName} &lt;noreply@perpustakaan.id&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-16 font-semibold text-slate-400">Kepada:</span>
                  <span className="font-medium text-slate-800">
                    {previewEmail.recipientName} &lt;{previewEmail.recipientEmail}&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-16 font-semibold text-slate-400">Subjek:</span>
                  <span className="font-bold text-indigo-700">
                    [{previewEmail.type.toUpperCase()}] Pengembalian Buku "{previewEmail.bookTitle}"
                  </span>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-6 bg-white space-y-4 text-slate-700 leading-relaxed">
                <div
                  className="prose prose-sm max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: previewEmail.previewHtml }}
                />

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-700">Informasi Jam Layanan Perpustakaan:</p>
                  <p>Senin - Jumat: 08:00 - 16:00 WIB</p>
                  <p>Alamat: {settings.address}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewEmail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
