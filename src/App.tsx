import React, { useState, useEffect } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { BookManagement } from './components/BookManagement';
import { MemberManagement } from './components/MemberManagement';
import { Circulation } from './components/Circulation';
import { ReportsAndFines } from './components/ReportsAndFines';
import { EmailNotifications } from './components/EmailNotifications';
import { MemberPortal } from './components/MemberPortal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { Book, Member } from './types/library';
import { RotateCcw, ShieldCheck, Heart } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, resetToDefaultData, settings } = useLibrary();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<Book | null>(null);

  // Auto switch tab if current user is member
  useEffect(() => {
    if (currentUser.role === 'member') {
      if (activeTab === 'dashboard' || activeTab === 'members' || activeTab === 'reports' || activeTab === 'emails') {
        setActiveTab('member-portal');
      }
    } else {
      if (activeTab === 'member-portal') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser.role]);

  // Global keyboard shortcut for Barcode Scanner (Alt+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsScannerOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBorrowBookRequested = (book: Book) => {
    setSelectedBookForBorrow(book);
    setActiveTab('circulation');
  };

  const handleScannerSelectBook = (book: Book) => {
    setSelectedBookForBorrow(book);
    setActiveTab('circulation');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Navigation */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNotifications={() => setActiveTab('emails')}
        onSelectTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              onSelectTab={(tab) => setActiveTab(tab)}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {activeTab === 'books' && (
            <BookManagement
              onBorrowBookRequested={handleBorrowBookRequested}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {activeTab === 'members' && <MemberManagement />}

          {activeTab === 'circulation' && (
            <Circulation
              onOpenScanner={() => setIsScannerOpen(true)}
              selectedBookForBorrow={selectedBookForBorrow}
              onClearSelectedBook={() => setSelectedBookForBorrow(null)}
            />
          )}

          {activeTab === 'reports' && <ReportsAndFines />}

          {activeTab === 'emails' && <EmailNotifications />}

          {activeTab === 'member-portal' && (
            <MemberPortal onSelectTab={(tab) => setActiveTab(tab)} />
          )}
        </main>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectBook={handleScannerSelectBook}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">{settings.libraryName}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Sistem Sirkulasi Otomatis v2.5
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Kembalikan semua data ke set awal default perpustakaan?')) {
                  resetToDefaultData();
                }
              }}
              className="text-slate-400 hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data Demo
            </button>
            <span>•</span>
            <span>Aturan Denda: {settings.finePercentPerDay || 1}% Harga Buku / hari (Min. Rp {(settings.minFinePerDay || 1000).toLocaleString('id-ID')})</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainAppContent />
    </LibraryProvider>
  );
}
