import React from 'react';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CreditCard,
  Barcode,
  Search,
  Sparkles,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface MemberPortalProps {
  onSelectTab: (tab: string) => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({ onSelectTab }) => {
  const { currentUser, members, loans, settings } = useLibrary();

  // Find corresponding member object
  const memberData = members.find(
    (m) =>
      m.id === currentUser.memberId ||
      m.email.toLowerCase() === currentUser.email.toLowerCase()
  ) || members[0];

  // My Loans
  const myLoans = loans.filter((l) => l.memberId === memberData.id);
  const myActiveLoans = myLoans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const myFinishedLoans = myLoans.filter((l) => l.status === 'Dikembalikan');
  const myPendingFines = myLoans
    .filter((l) => !l.finePaid && l.fineAmount > 0)
    .reduce((sum, l) => sum + l.fineAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Member Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={memberData.avatarUrl}
              alt={memberData.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-md"
            />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                PORTAL PEMUSTAKA • {memberData.type.toUpperCase()}
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight">{memberData.name}</h1>
              <p className="text-xs text-slate-300">
                Nomor Anggota: <span className="font-mono text-emerald-400 font-semibold">{memberData.id}</span> • {memberData.identityNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('books')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-700/40 flex items-center gap-2 transition-all active:scale-95"
            >
              <Search className="w-4 h-4" /> Cari & Pinjam Buku Baru
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Buku Sedang Dipinjam</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {myActiveLoans.length} / {memberData.maxBorrowLimit}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sisa kuota pinjam: {Math.max(0, memberData.maxBorrowLimit - myActiveLoans.length)} buku
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Tagihan Denda Keterlambatan</span>
            <div className={`text-2xl font-black mt-1 ${myPendingFines > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              Rp {myPendingFines.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {myPendingFines > 0 ? 'Mohon segera lunasi di meja sirkulasi' : 'Tidak ada tagihan tertunggak'}
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Riwayat Selesai</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {myFinishedLoans.length} Buku
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Telah berhasil dikembalikan tepat waktu
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Borrowed Books List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Buku yang Sedang Anda Pinjam
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perhatikan batas waktu pengembalian agar terhindar dari denda
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {myActiveLoans.length} Buku
              </span>
            </div>

            <div className="p-5 space-y-4">
              {myActiveLoans.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-600 text-sm font-semibold">
                    Anda tidak sedang meminjam buku apapun saat ini.
                  </p>
                  <button
                    onClick={() => onSelectTab('books')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Buka Katalog Buku & Pinjam
                  </button>
                </div>
              ) : (
                myActiveLoans.map((loan) => {
                  const isOverdue = loan.status === 'Terlambat';
                  return (
                    <div
                      key={loan.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isOverdue
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={loan.bookCoverUrl}
                          alt={loan.bookTitle}
                          className="w-12 h-16 object-cover rounded-lg shadow-xs shrink-0"
                        />
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {loan.id} • ISBN: {loan.bookIsbn}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{loan.bookTitle}</h4>
                          <p className="text-xs text-slate-500">Dipinjam: {loan.borrowDate}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right space-y-1 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOverdue ? `Terlambat (${loan.daysLate} Hari)` : 'Sedang Dipinjam'}
                        </span>
                        <p className="text-xs font-semibold text-slate-700">
                          Batas Kembali: {loan.dueDate}
                        </p>
                        {isOverdue && (
                          <p className="text-xs font-bold text-rose-600">
                            Denda: Rp {loan.fineAmount.toLocaleString('id-ID')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Past Loans History */}
          {myFinishedLoans.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Riwayat Pengembalian Sebelumnya</h4>
              <div className="space-y-2">
                {myFinishedLoans.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{l.bookTitle}</p>
                      <p className="text-slate-500 text-[11px]">Dikembalikan pada: {l.returnDate}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      Selesai
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Member Digital Identity Card (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Kartu Anggota Digital Saya
              </h3>
              <button
                onClick={() => window.print()}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak
              </button>
            </div>

            {/* Card Widget */}
            <div className="bg-gradient-to-tr from-slate-900 to-emerald-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border border-emerald-500/30">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3 text-[10px]">
                <div className="font-bold uppercase tracking-wider">{settings.libraryName}</div>
                <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">
                  {memberData.type}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <img
                  src={memberData.avatarUrl}
                  alt={memberData.name}
                  className="w-14 h-18 rounded-xl object-cover border-2 border-emerald-400 shadow-sm shrink-0"
                />
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-sm text-white">{memberData.name}</p>
                  <p className="font-mono text-emerald-300 font-bold">{memberData.id}</p>
                  <p className="text-[10px] text-slate-300">{memberData.identityNumber}</p>
                  <p className="text-[10px] text-slate-400">Join: {memberData.joinDate}</p>
                </div>
              </div>

              {/* Barcode Mock */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-mono text-xs tracking-widest text-slate-200">
                    ||| | |||| | ||||| || | ||
                  </div>
                  <div className="font-mono text-[9px] text-emerald-300">{memberData.id}</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">STATUS AKTIF</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Tunjukkan barcode pada kartu ini ke petugas perpustakaan saat melakukan peminjaman atau pengembalian buku di meja sirkulasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
