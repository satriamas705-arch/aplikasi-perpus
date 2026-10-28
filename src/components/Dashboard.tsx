import React from 'react';
import {
  BookOpen,
  Users,
  Repeat,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Barcode,
  PlusCircle,
  FileDown,
  Mail,
  Sparkles,
  ArrowUpRight,
  BookMarked,
  ShieldAlert,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { generateMonthlyReportPdf } from '../utils/pdfGenerator';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
  onOpenScanner: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onOpenScanner,
}) => {
  const {
    books,
    members,
    loans,
    activityLogs,
    settings,
    currentUser,
    triggerAutomaticReminderCheck,
  } = useLibrary();

  // Statistics calculation
  const totalBooks = books.length;
  const totalCopies = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableCopies = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam');
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat');
  const returnedLoans = loans.filter((l) => l.status === 'Dikembalikan');
  const totalFinesPaid = loans
    .filter((l) => l.finePaid && l.fineAmount > 0)
    .reduce((acc, l) => acc + l.fineAmount, 0);
  const totalFinesPending = loans
    .filter((l) => !l.finePaid && l.fineAmount > 0)
    .reduce((acc, l) => acc + l.fineAmount, 0);

  // Return punctuality percentage
  const totalFinishedLoans = returnedLoans.length;
  const punctualCount = returnedLoans.filter((l) => l.daysLate === 0).length;
  const punctualityRate = totalFinishedLoans > 0 ? Math.round((punctualCount / totalFinishedLoans) * 100) : 100;

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  books.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Latest collection
  const latestBooks = [...books]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // Quick download PDF
  const handleQuickDownloadPdf = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('id-ID', { month: 'long' });
    generateMonthlyReportPdf({
      monthName,
      year: now.getFullYear(),
      loans,
      settings,
      generatedBy: currentUser.name,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Greeting & Quick Librarian Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5" /> Sistem Otomasi Perpustakaan Real-Time
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pantau sirkulasi peminjaman, ketersediaan stok buku, status jatuh tempo, dan perolehan denda secara langsung.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Barcode className="w-4 h-4" /> Scan Barcode
            </button>
            <button
              onClick={() => onSelectTab('circulation')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <Repeat className="w-4 h-4 text-emerald-400" /> Sirkulasi Pinjam
            </button>
            <button
              onClick={handleQuickDownloadPdf}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <FileDown className="w-4 h-4 text-amber-400" /> Cetak Laporan PDF
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Koleksi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Koleksi
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">{totalBooks} Judul</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{availableCopies} dari {totalCopies} eksemplar ready</span>
            </div>
          </div>
        </div>

        {/* Peminjaman Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Peminjaman Aktif
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-blue-600">{activeLoans.length} Buku</div>
            <div className="text-xs text-slate-500 mt-1">
              {overdueLoans.length > 0 ? (
                <span className="text-rose-600 font-semibold">{overdueLoans.length} buku melewati tenggat</span>
              ) : (
                <span className="text-emerald-600 font-medium">Semua masih aman</span>
              )}
            </div>
          </div>
        </div>

        {/* Keterlambatan & Denda */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Denda Keterlambatan
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-600">
              Rp {totalFinesPending.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Terbayar: <span className="font-semibold text-emerald-600">Rp {totalFinesPaid.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Anggota & Kepatuhan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Anggota Aktif
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">{members.length} Orang</div>
            <div className="text-xs text-slate-500 mt-1">
              Kepatuhan tepat waktu: <span className="font-bold text-emerald-600">{punctualityRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Latest Books & Active Circulation Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Loans & Latest Collection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Loans Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Daftar Peminjaman Sedang Berjalan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor waktu jatuh tempo dan pengembalian buku
                </p>
              </div>
              <button
                onClick={() => onSelectTab('circulation')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Kelola Semua <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Buku</th>
                    <th className="px-4 py-3">Peminjam</th>
                    <th className="px-4 py-3">Jatuh Tempo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans
                    .filter((l) => l.status !== 'Dikembalikan')
                    .slice(0, 5)
                    .map((loan) => {
                      const isOverdue = loan.status === 'Terlambat';
                      return (
                        <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={loan.bookCoverUrl}
                                alt={loan.bookTitle}
                                className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                              />
                              <div>
                                <p className="font-bold text-slate-800 line-clamp-1 max-w-[180px]">
                                  {loan.bookTitle}
                                </p>
                                <p className="font-mono text-[10px] text-slate-400">
                                  {loan.bookIsbn}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{loan.memberName}</p>
                            <p className="text-[10px] text-slate-400">{loan.memberId}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700">{loan.dueDate}</span>
                            {isOverdue && (
                              <p className="text-[10px] text-rose-600 font-bold">
                                Lewat {loan.daysLate} hari
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isOverdue
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => onSelectTab('circulation')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg font-medium transition-colors"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Latest Books Showcase */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  Koleksi Buku Terbaru
                </h3>
                <p className="text-xs text-slate-500">
                  Buku baru yang baru saja ditambahkan ke rak digital
                </p>
              </div>
              <button
                onClick={() => onSelectTab('books')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Lihat Katalog <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {latestBooks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectTab('books')}
                  className="group cursor-pointer space-y-2 p-2 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                >
                  <div className="aspect-3/4 rounded-xl overflow-hidden shadow-sm relative bg-gradient-to-br from-indigo-700 to-slate-900 p-3 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between z-10">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-xs">
                        {b.category.split(' ')[0]}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/90 text-white">
                        {b.availableCopies} Ready
                      </span>
                    </div>
                    <div className="z-10 my-auto">
                      <h5 className="font-extrabold text-xs text-white line-clamp-2 leading-snug">
                        {b.title}
                      </h5>
                      <p className="text-[10px] text-indigo-200 line-clamp-1">{b.author}</p>
                    </div>
                    <div className="z-10 pt-1 border-t border-white/20 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-white">
                        Rp {(b.price || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9px] text-indigo-200 font-mono">{b.year}</span>
                    </div>
                    <BookOpen className="w-16 h-16 text-white/5 absolute -right-2 -bottom-2 pointer-events-none" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600">
                      {b.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{b.author}</p>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Rp {(b.price || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category Stats & Real-Time Activity Feed */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Distribusi Kategori Populer
            </h3>
            <div className="space-y-3">
              {topCategories.map(([cat, count]) => {
                const percent = Math.round((count / totalBooks) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat}</span>
                      <span className="text-slate-400 font-mono">{count} buku ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktivitas Perpustakaan Real-Time
              </h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activityLogs.slice(0, 6).map((act) => (
                <div key={act.id} className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-tight">{act.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
