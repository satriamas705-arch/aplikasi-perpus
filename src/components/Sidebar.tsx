import React from 'react';
import {
  LayoutDashboard,
  BookMarked,
  Users,
  Repeat,
  Barcode,
  FileSpreadsheet,
  Mail,
  UserCheck,
  Sparkles,
  Settings,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenScanner: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
}) => {
  const { currentUser, loans, settings } = useLibrary();

  const overdueCount = loans.filter((l) => l.status === 'Terlambat').length;
  const isMemberRole = currentUser.role === 'member';

  const navItems = isMemberRole
    ? [
        { id: 'member-portal', label: 'Buku Pinjaman Saya', icon: UserCheck },
        { id: 'books', label: 'Jelajah Katalog Buku', icon: BookMarked },
        { id: 'dashboard', label: 'Statistik & Ringkasan', icon: LayoutDashboard },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard Pustakawan', icon: LayoutDashboard },
        { id: 'circulation', label: 'Sirkulasi & Peminjaman', icon: Repeat, badge: overdueCount > 0 ? `${overdueCount} telat` : undefined },
        { id: 'books', label: 'Katalog & Manajemen Buku', icon: BookMarked },
        { id: 'members', label: 'Data Anggota & Kartu ID', icon: Users },
        { id: 'reports', label: 'Laporan PDF & Denda', icon: FileSpreadsheet },
        { id: 'emails', label: 'Notifikasi & Email Reminder', icon: Mail },
      ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Role banner */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Akses Sistem
            </span>
            <span className="text-xs font-bold text-slate-800">
              {isMemberRole ? 'Portal Anggota' : 'Admin & Pustakawan'}
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              currentUser.role === 'admin'
                ? 'bg-rose-100 text-rose-700'
                : currentUser.role === 'librarian'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {currentUser.role.toUpperCase()}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Menu Utama
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Fast Scanner Button */}
        {!isMemberRole && (
          <div className="pt-2">
            <button
              onClick={onOpenScanner}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl text-xs font-semibold hover:shadow-md transition-all active:scale-95"
            >
              <Barcode className="w-4 h-4 text-indigo-400" />
              <span>Buka Barcode Scanner</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span>Otomasi Denda:</span>
          <span className="font-semibold text-slate-700">{settings.finePercentPerDay || 1}% Harga Buku</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Notifikasi Email:</span>
          <span className="font-semibold text-emerald-600">Terjadwal H-2</span>
        </div>
      </div>
    </aside>
  );
};
