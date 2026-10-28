import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Settings,
  Sparkles,
  Receipt,
  Download,
  Calculator,
  Percent,
  Tag,
  ShieldAlert,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { generateMonthlyReportPdf } from '../utils/pdfGenerator';
import { calculateBookDailyFine, calculateTotalFine } from '../utils/fineCalculator';

export const ReportsAndFines: React.FC = () => {
  const { loans, books, settings, updateSettings, currentUser, payFine } = useLibrary();

  // Period state for PDF report
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [reportGeneratedNotice, setReportGeneratedNotice] = useState<string | null>(null);

  // Settings State for automatic price-based fine rules
  const [finePercent, setFinePercent] = useState(settings.finePercentPerDay || 1);
  const [minFineDaily, setMinFineDaily] = useState(settings.minFinePerDay || 1000);
  const [maxCapPercent, setMaxCapPercent] = useState(settings.maxFineCapPercent || 100);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Simulation test state
  const [simulatedBookId, setSimulatedBookId] = useState<string>(books[0]?.id || '');
  const [simulatedDaysLate, setSimulatedDaysLate] = useState<number>(5);

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  // Calculate statistics for fines
  const allFinedLoans = loans.filter((l) => l.fineAmount > 0);
  const totalFineRevenue = allFinedLoans
    .filter((l) => l.finePaid)
    .reduce((acc, l) => acc + l.fineAmount, 0);
  const totalFinePending = allFinedLoans
    .filter((l) => !l.finePaid)
    .reduce((acc, l) => acc + l.fineAmount, 0);

  // Active circulation book value liability
  const activeLoansValue = useMemo(() => {
    return loans
      .filter((l) => l.status !== 'Dikembalikan')
      .reduce((acc, l) => {
        const book = books.find((b) => b.id === l.bookId);
        return acc + (l.bookPrice || book?.price || 85000);
      }, 0);
  }, [loans, books]);

  // Download PDF handler
  const handleDownloadPdf = () => {
    generateMonthlyReportPdf({
      monthName: months[selectedMonth],
      year: selectedYear,
      loans,
      settings,
      generatedBy: currentUser.name,
    });
    setReportGeneratedNotice(
      `Laporan PDF periode ${months[selectedMonth]} ${selectedYear} dengan aturan denda berbasis harga buku berhasil diunduh.`
    );
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      finePercentPerDay: finePercent,
      minFinePerDay: minFineDaily,
      maxFineCapPercent: maxCapPercent,
    });
    setIsSavingSettings(true);
    setTimeout(() => setIsSavingSettings(false), 1500);
  };

  // Find simulated book for interactive fine calculation demonstration
  const simBook = books.find((b) => b.id === simulatedBookId) || books[0];
  const simPrice = simBook?.price || 85000;
  const simDailyRate = calculateBookDailyFine(simPrice, {
    finePercentPerDay: finePercent,
    minFinePerDay: minFineDaily,
  });
  const simTotalFine = calculateTotalFine(simulatedDaysLate, simPrice, {
    finePercentPerDay: finePercent,
    minFinePerDay: minFineDaily,
    maxFineCapPercent: maxCapPercent,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Laporan Bulanan PDF & Aturan Denda Berbasis Harga Buku
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tarif denda keterlambatan disesuaikan otomatis dengan harga tiap buku (proporsional & adil)
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <FileDown className="w-4 h-4" /> Unduh Laporan PDF Resmi
        </button>
      </div>

      {reportGeneratedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reportGeneratedNotice}</span>
        </div>
      )}

      {/* Dynamic Rule Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-500/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Otomasi Aturan Tarif Denda Berbasis Nilai Aset
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Sistem Denda Proporsional Otomatis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Buku yang lebih berharga / tebal (seperti literatur referensi Rp 140.000) dikenakan tarif denda lebih tinggi dibanding buku standar (Rp 85.000), menjaga tanggung jawab peminjam secara berkeadilan.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2 text-xs min-w-[260px]">
            <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
              Rumus Otomatis Aktif
            </span>
            <div className="font-mono text-sm font-bold text-white">
              Tarif/Hari = {finePercent}% × Harga Buku
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <p>• Batas Bawah: Rp {minFineDaily.toLocaleString('id-ID')}/hari</p>
              <p>• Batas Atas Denda: Maks. {maxCapPercent}% dari harga buku</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: PDF Configurator & Dynamic Rule Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Generator Card (2 Cols) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Konfigurasi Ekspor Laporan PDF</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">Format: Standar A4 Resmi (Kop + Tabel Harga)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Pilih Bulan Laporan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Pilih Tahun</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Report Preview Highlights */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Pratinjau Data Laporan ({months[selectedMonth]} {selectedYear})
              </h4>
              <span className="text-[11px] text-indigo-700 font-semibold">
                Nilai Buku Dipinjam: Rp {activeLoansValue.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">TOTAL SIRKULASI</span>
                <span className="font-bold text-base text-slate-800">{loans.length} Transaksi</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">SEDANG DIPINJAM</span>
                <span className="font-bold text-base text-indigo-600">
                  {loans.filter((l) => l.status === 'Dipinjam').length} Buku
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">LEWAT TENGGAT</span>
                <span className="font-bold text-base text-rose-600">
                  {loans.filter((l) => l.status === 'Terlambat').length} Kasus
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">DENDA TERBAYAR</span>
                <span className="font-bold text-base text-emerald-600">
                  Rp {totalFineRevenue.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
              Dokumen PDF mencantumkan rincian harga tiap buku, tarif denda per hari, dan total denda keterlambatan.
            </span>
            <button
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm shrink-0"
            >
              <FileDown className="w-4 h-4 text-indigo-400" /> Unduh Dokumen PDF
            </button>
          </div>
        </div>

        {/* Dynamic Fine Rule Settings Card (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Percent className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">Aturan Tarif Denda Otomatis</h3>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Persentase Tarif Harian (%)</span>
                  <span className="text-indigo-600 font-bold">{finePercent}% / hari</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={finePercent}
                    onChange={(e) => setFinePercent(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Contoh: 1% dari buku seharga Rp 125.000 = Rp 1.300/hari.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Tarif Batas Bawah Minimal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                  <input
                    type="number"
                    step="500"
                    min="500"
                    value={minFineDaily}
                    onChange={(e) => setMinFineDaily(parseInt(e.target.value) || 1000)}
                    className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Denda tidak boleh lebih rendah dari batas minimum ini per hari.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Batas Maksimal Denda (Cap %)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="150"
                    value={maxCapPercent}
                    onChange={(e) => setMaxCapPercent(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-semibold">%</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Batas atas denda relatif thd harga buku (default: 100% harga buku).
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isSavingSettings ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                {isSavingSettings ? 'Aturan Disimpan!' : 'Simpan Aturan Denda'}
              </button>
            </form>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
              <span className="font-bold block">Status Tagihan Denda Berjalan:</span>
              <div className="flex justify-between">
                <span>Total Belum Dibayar:</span>
                <span className="font-bold text-rose-600">Rp {totalFinePending.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Telah Dilunasi:</span>
                <span className="font-bold text-emerald-700">Rp {totalFineRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Fine Simulator Based on Book Price */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Kalkulator Simulasi Denda Otomatis Berdasarkan Harga Buku
            </h3>
          </div>
          <span className="text-xs text-slate-500">Uji coba simulasi perhitungan tarif</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Pilih Contoh Buku</label>
            <select
              value={simulatedBookId}
              onChange={(e) => setSimulatedBookId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (Harga: Rp {(b.price || 85000).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Simulasi Jumlah Hari Terlambat</label>
            <input
              type="number"
              min="1"
              max="60"
              value={simulatedDaysLate}
              onChange={(e) => setSimulatedDaysLate(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>

          {/* Result Highlight */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                Hasil Perhitungan Otomatis
              </span>
              <p className="font-mono text-xs text-slate-600">
                Tarif: <b className="text-slate-900">Rp {simDailyRate.toLocaleString('id-ID')}</b> / hari
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Total Denda ({simulatedDaysLate} Hari):</span>
              <span className="text-base font-black text-rose-600">
                Rp {simTotalFine.finalTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Fine Records Table with Book Price & Daily Rate Columns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Rekapitulasi Denda Berdasarkan Harga Buku
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar denda pemustaka dihitung otomatis proporsional dengan harga tiap buku yang dipinjam
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {allFinedLoans.length} Catatan Denda
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID Transaksi</th>
                <th className="px-4 py-3">Peminjam</th>
                <th className="px-4 py-3">Buku Terkait</th>
                <th className="px-4 py-3">Harga Buku</th>
                <th className="px-4 py-3">Tarif Denda Otomatis</th>
                <th className="px-4 py-3">Hari Telat</th>
                <th className="px-4 py-3">Total Denda</th>
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allFinedLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Tidak ada catatan denda keterlambatan saat ini.
                  </td>
                </tr>
              ) : (
                allFinedLoans.map((loan) => {
                  const bookPrice = loan.bookPrice || books.find((b) => b.id === loan.bookId)?.price || 85000;
                  const dailyRate = loan.fineRatePerDay || calculateBookDailyFine(bookPrice, settings);

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-600">{loan.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{loan.memberName}</td>
                      <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate">{loan.bookTitle}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        Rp {bookPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-700 font-mono">
                        Rp {dailyRate.toLocaleString('id-ID')}/hari
                        <span className="block text-[10px] text-slate-400 font-sans">
                          ({settings.finePercentPerDay}% harga buku)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600">{loan.daysLate} hari</td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        Rp {loan.fineAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.finePaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {loan.finePaid ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!loan.finePaid ? (
                          <button
                            onClick={() => payFine(loan.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Tandai Lunas
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium flex items-center justify-end gap-1">
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
    </div>
  );
};
