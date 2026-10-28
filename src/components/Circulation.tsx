import React, { useState } from 'react';
import {
  Repeat,
  PlusCircle,
  Barcode,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  User,
  BookOpen,
  DollarSign,
  Filter,
  Check,
  X,
  CreditCard,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Member, Loan } from '../types/library';

interface CirculationProps {
  onOpenScanner: () => void;
  selectedBookForBorrow?: Book | null;
  onClearSelectedBook?: () => void;
}

export const Circulation: React.FC<CirculationProps> = ({
  onOpenScanner,
  selectedBookForBorrow,
  onClearSelectedBook,
}) => {
  const {
    books,
    members,
    loans,
    borrowBook,
    returnBook,
    payFine,
    settings,
  } = useLibrary();

  // Active Tab: 'active-loans' or 'new-borrow' or 'return-flow'
  const [activeSubTab, setActiveSubTab] = useState<'loans' | 'new-borrow'>('loans');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New Borrow Form
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(selectedBookForBorrow ? selectedBookForBorrow.id : '');
  const [borrowDuration, setBorrowDuration] = useState(settings.borrowDurationDays || 7);
  const [borrowNotes, setBorrowNotes] = useState('');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Return Book modal state
  const [returningLoan, setReturningLoan] = useState<Loan | null>(null);
  const [finePaidImmediately, setFinePaidImmediately] = useState(true);
  const [returnNotes, setReturnNotes] = useState('Buku dalam kondisi baik');

  // React to prop change if a book was passed from catalog or scanner
  React.useEffect(() => {
    if (selectedBookForBorrow) {
      setSelectedBookId(selectedBookForBorrow.id);
      setActiveSubTab('new-borrow');
    }
  }, [selectedBookForBorrow]);

  // Handle Borrow Submission
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedBookId) {
      setActionAlert({ type: 'error', message: 'Silakan pilih anggota dan buku terlebih dahulu.' });
      return;
    }

    const result = borrowBook(selectedMemberId, selectedBookId, borrowDuration, borrowNotes);
    if (result.success) {
      setActionAlert({ type: 'success', message: result.message });
      setSelectedMemberId('');
      setSelectedBookId('');
      setBorrowNotes('');
      if (onClearSelectedBook) onClearSelectedBook();
      setTimeout(() => setActiveSubTab('loans'), 1200);
    } else {
      setActionAlert({ type: 'error', message: result.message });
    }
  };

  // Handle Return Submission
  const handleReturnConfirm = () => {
    if (!returningLoan) return;

    const res = returnBook(returningLoan.id, finePaidImmediately, returnNotes);
    setReturningLoan(null);
    setActionAlert({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
  };

  // Calculate projected return date
  const projectedDueDate = new Date();
  projectedDueDate.setDate(projectedDueDate.getDate() + (borrowDuration || 7));
  const projectedDueDateStr = projectedDueDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Filter loans
  const filteredLoans = loans.filter((loan) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      loan.bookTitle.toLowerCase().includes(term) ||
      loan.memberName.toLowerCase().includes(term) ||
      loan.id.toLowerCase().includes(term) ||
      loan.bookIsbn.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return loan.status === 'Dipinjam';
    if (filterStatus === 'overdue') return loan.status === 'Terlambat';
    if (filterStatus === 'returned') return loan.status === 'Dikembalikan';
    if (filterStatus === 'unpaid') return !loan.finePaid && loan.fineAmount > 0;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Repeat className="w-6 h-6 text-indigo-600" />
            Sirkulasi Peminjaman & Pengembalian
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan peminjaman, pengembalian buku, kalkulasi denda otomatis, dan status jatuh tempo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Barcode className="w-4 h-4 text-indigo-400" /> Scan Barcode Transaksi
          </button>

          <button
            onClick={() => setActiveSubTab(activeSubTab === 'loans' ? 'new-borrow' : 'loans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeSubTab === 'new-borrow'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
            }`}
          >
            {activeSubTab === 'new-borrow' ? 'Lihat Semua Transaksi' : '+ Catat Pinjam Baru'}
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View 1: New Borrow Form */}
      {activeSubTab === 'new-borrow' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Form Peminjaman Buku Baru
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Otomasi Jatuh Tempo: {settings.borrowDurationDays} Hari
            </span>
          </div>

          <form onSubmit={handleBorrowSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Member Picker */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>1. Pilih Anggota Peminjam *</span>
                  <span className="text-slate-400 font-normal">atau scan kartu anggota</span>
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Pilih Anggota Pemustaka --</option>
                  {members.map((m) => {
                    const activeCount = loans.filter(
                      (l) => l.memberId === m.id && l.status !== 'Dikembalikan'
                    ).length;
                    return (
                      <option
                        key={m.id}
                        value={m.id}
                        disabled={m.status !== 'Aktif' || activeCount >= m.maxBorrowLimit}
                      >
                        {m.name} ({m.type}) - {m.id} [Pinjam: {activeCount}/{m.maxBorrowLimit}]
                        {m.status !== 'Aktif' ? ' - NONAKTIF' : ''}
                      </option>
                    );
                  })}
                </select>

                {selectedMemberId && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
                    {(() => {
                      const m = members.find((x) => x.id === selectedMemberId);
                      if (!m) return null;
                      return (
                        <>
                          <img
                            src={m.avatarUrl}
                            alt={m.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{m.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {m.email} • {m.phone}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Book Picker */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>2. Pilih Buku yang Dipinjam *</span>
                  <span className="text-slate-400 font-normal">atau scan barcode ISBN</span>
                </label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  <option value="">-- Pilih Buku dari Katalog --</option>
                  {books.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.availableCopies <= 0}
                    >
                      {b.title} - {b.author} ({b.availableCopies}/{b.totalCopies} tersedia)
                    </option>
                  ))}
                </select>

                {selectedBookId && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-3">
                    {(() => {
                      const b = books.find((x) => x.id === selectedBookId);
                      if (!b) return null;
                      return (
                        <>
                          <div className="w-8 h-11 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-200">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{b.title}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              Harga: <span className="font-bold text-emerald-700">Rp {(b.price || 0).toLocaleString('id-ID')}</span> • ISBN: {b.isbn} • {b.shelfLocation}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Loan Duration & Calculated Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Durasi Peminjaman (Hari)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={borrowDuration}
                  onChange={(e) => setBorrowDuration(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tanggal Jatuh Tempo Otomatis</label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-indigo-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  {projectedDueDateStr}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Peminjaman</label>
                <input
                  type="text"
                  value={borrowNotes}
                  onChange={(e) => setBorrowNotes(e.target.value)}
                  placeholder="Kebutuhan tugas / referensi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('loans')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" /> Proses Transaksi Peminjaman
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View 2: Circulation Transactions List & Return Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari transaksi, peminjam, buku, ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto text-xs">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'active', label: 'Dipinjam' },
              { id: 'overdue', label: 'Terlambat' },
              { id: 'returned', label: 'Dikembalikan' },
              { id: 'unpaid', label: 'Denda Tertunggak' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterStatus === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Transaksi</th>
                <th className="px-4 py-3">Buku Dipinjam</th>
                <th className="px-4 py-3">Anggota Pemustaka</th>
                <th className="px-4 py-3">Tgl Pinjam & Jatuh Tempo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Denda Keterlambatan</th>
                <th className="px-4 py-3 text-right">Aksi Sirkulasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada transaksi peminjaman yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const isOverdue = loan.status === 'Terlambat';
                  const isReturned = loan.status === 'Dikembalikan';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                        {loan.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={loan.bookCoverUrl}
                            alt={loan.bookTitle}
                            className="w-8 h-11 object-cover rounded shadow-xs shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">
                              {loan.bookTitle}
                            </p>
                            <p className="font-mono text-[10px] text-slate-400">{loan.bookIsbn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{loan.memberName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{loan.memberId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="text-slate-600">Pinjam: {loan.borrowDate}</p>
                          <p className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-indigo-600'}`}>
                            Tempo: {loan.dueDate}
                          </p>
                          {isReturned && (
                            <p className="text-[10px] text-emerald-600">Kembali: {loan.returnDate}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : isReturned
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {loan.status}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-600 font-medium mt-0.5">
                            Telat {loan.daysLate} hari
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {loan.fineAmount > 0 ? (
                          <div>
                            <p className="font-bold text-slate-800">
                              Rp {loan.fineAmount.toLocaleString('id-ID')}
                            </p>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                loan.finePaid
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {loan.finePaid ? 'Lunas' : 'Tertunggak'}
                            </span>
                            {!loan.finePaid && (
                              <button
                                onClick={() => payFine(loan.id)}
                                className="block mt-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline"
                              >
                                Lunaskan Denda
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isReturned ? (
                          <button
                            onClick={() => setReturningLoan(loan)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors ml-auto shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Kembalikan Buku
                          </button>
                        ) : (
                          <span className="text-slate-400 font-medium text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Confirmation Modal with Fine Calculation */}
      {returningLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                Konfirmasi Pengembalian Buku
              </h3>
              <button
                onClick={() => setReturningLoan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-sm text-slate-900">{returningLoan.bookTitle}</p>
                <p className="text-slate-600">Peminjam: {returningLoan.memberName}</p>
                <p className="text-slate-500">Jatuh Tempo: {returningLoan.dueDate}</p>
              </div>

              {/* Fine status calculation */}
              {returningLoan.status === 'Terlambat' || returningLoan.daysLate > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
                  <div className="flex items-center justify-between font-bold">
                    <div>
                      <span>Terlambat: {returningLoan.daysLate} Hari</span>
                      <span className="block text-[10px] text-rose-700 font-normal">
                        Tarif: Rp {(returningLoan.fineRatePerDay || 1000).toLocaleString('id-ID')}/hari (1% harga buku)
                      </span>
                    </div>
                    <span className="text-sm font-black">
                      Denda: Rp {returningLoan.fineAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 pt-1 border-t border-rose-200 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={finePaidImmediately}
                      onChange={(e) => setFinePaidImmediately(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Denda dilunasi sekarang saat pengembalian</span>
                  </label>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengembalian tepat waktu tanpa denda keterlambatan!</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Catatan Kondisi Buku</label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturningLoan(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReturnConfirm}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Konfirmasi & Kembalikan ke Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
