import React, { useState } from 'react';
import {
  BookOpen,
  Bell,
  Barcode,
  Search,
  UserCheck,
  Shield,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Clock,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { UserRole } from '../types/library';

interface NavbarProps {
  onOpenScanner: () => void;
  onOpenNotifications: () => void;
  onSelectTab: (tab: string) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScanner,
  onOpenNotifications,
  onSelectTab,
  activeTab,
}) => {
  const { currentUser, switchRole, loans, settings, users, triggerAutomaticReminderCheck } = useLibrary();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Calculate overdue & upcoming due loans
  const overdueCount = loans.filter((l) => l.status === 'Terlambat').length;
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam');
  const alertTotal = overdueCount;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Pustaka</span>
              <span className="font-extrabold text-lg text-indigo-600 tracking-tight">Digital</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
              {settings.libraryName}
            </p>
          </div>
        </div>

        {/* Center Quick Barcode Scanner Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow active:scale-95"
            title="Buka Pemindai Barcode / ISBN"
          >
            <Barcode className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Scan Barcode / ISBN</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">
              Alt+S
            </kbd>
          </button>

          <button
            onClick={() => onSelectTab('books')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              activeTab === 'books'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Katalog & Pencarian</span>
          </button>
        </div>

        {/* Right Actions: Notifications & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
              title="Notifikasi & Pengingat Jatuh Tempo"
            >
              <Bell className="w-5 h-5" />
              {alertTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {alertTotal}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-40 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-800">Pemberitahuan Otomatis</span>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                    {overdueCount} Terlambat
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                  {overdueCount === 0 && activeLoans.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Semua peminjaman dalam kondisi baik!</p>
                  ) : (
                    <>
                      {loans
                        .filter((l) => l.status === 'Terlambat')
                        .slice(0, 3)
                        .map((l) => (
                          <div
                            key={l.id}
                            className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5"
                          >
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-rose-900">{l.memberName}</p>
                              <p className="text-rose-700 line-clamp-1">{l.bookTitle}</p>
                              <p className="text-[10px] text-rose-500 mt-0.5 font-medium">
                                Telat {l.daysLate} hari • Denda: Rp {l.fineAmount.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        ))}

                      {activeLoans.slice(0, 2).map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5"
                        >
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-800">{l.memberName}</p>
                            <p className="text-slate-600 line-clamp-1">{l.bookTitle}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Jatuh tempo: {l.dueDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      triggerAutomaticReminderCheck();
                      setShowNotifMenu(false);
                      onSelectTab('emails');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Kirim Email Massal
                  </button>
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      onSelectTab('emails');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Lihat Semua Log
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher Badge Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all text-left shadow-2xs"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      currentUser.role === 'admin'
                        ? 'bg-rose-500'
                        : currentUser.role === 'librarian'
                        ? 'bg-indigo-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    {currentUser.role === 'admin'
                      ? 'Admin'
                      : currentUser.role === 'librarian'
                      ? 'Pustakawan'
                      : 'Anggota'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1 hidden sm:block" />
            </button>

            {/* Role switch menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Ganti Peran Pengguna (Demo Role)
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Uji coba sudut pandang Admin vs Anggota
                  </p>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      switchRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                      currentUser.role === 'admin'
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Administrator / Kepala</p>
                      <p className="text-[10px] text-slate-500">Akses penuh CRUD, Laporan PDF, Sistem</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('librarian');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                      currentUser.role === 'librarian'
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Pustakawan</p>
                      <p className="text-[10px] text-slate-500">Sirkulasi, Scanner, Manajemen Koleksi</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchRole('member');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-colors ${
                      currentUser.role === 'member'
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Anggota (Siswa / Pembaca)</p>
                      <p className="text-[10px] text-slate-500">Portal buku pribadi, status pinjam, kartu digital</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
