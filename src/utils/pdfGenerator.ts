import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loan, LibrarySettings } from '../types/library';

export interface MonthlyReportData {
  monthName: string;
  year: number;
  loans: Loan[];
  settings: LibrarySettings;
  generatedBy: string;
}

export function generateMonthlyReportPdf(data: MonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { monthName, year, loans, settings, generatedBy } = data;

  const totalCirculation = loans.length;
  const returnedOnTime = loans.filter((l) => l.status === 'Dikembalikan' && l.daysLate === 0).length;
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam').length;
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat').length;
  const totalFineCollected = loans
    .filter((l) => l.finePaid && l.fineAmount > 0)
    .reduce((sum, l) => sum + l.fineAmount, 0);
  const totalFineUnpaid = loans
    .filter((l) => !l.finePaid && l.fineAmount > 0)
    .reduce((sum, l) => sum + l.fineAmount, 0);

  // 1. KOP PERPUSTAKAAN RESMI
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.libraryName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${settings.address} | Sistem Manajemen & Sirkulasi Otomatis`, 14, 17);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} WIB`,
    14,
    23
  );

  // 2. JUDUL LAPORAN & ATURAN TARIF DENDA OTOMATIS
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`LAPORAN BULANAN SIRKULASI & DENDA PROPORSI HARGA BUKU`, 14, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${monthName} ${year}`, 14, 42);

  // Kebijakan Denda Otomatis Note
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 45, 182, 9, 1.5, 1.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Aturan Tarif Denda: Dihitung Otomatis ${settings.finePercentPerDay || 1}% dari Harga Buku per Hari Terlambat (Batas Bawah: Rp ${(
      settings.minFinePerDay || 1000
    ).toLocaleString('id-ID')}/hari | Maksimal Cap: ${settings.maxFineCapPercent || 100}% Harga Buku).`,
    16,
    51
  );

  // 3. STATISTIK KOTAK RINGKASAN
  const boxY = 57;
  const boxWidth = 43;
  const boxHeight = 19;

  // Box 1: Total Sirkulasi
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL SIRKULASI', 17, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalCirculation} Transaksi`, 17, boxY + 14);

  // Box 2: Peminjaman Aktif
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(60, boxY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(99, 102, 241);
  doc.text('PEMINJAMAN AKTIF', 63, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${activeLoans} Buku`, 63, boxY + 14);

  // Box 3: Kasus Terlambat
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(106, boxY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 38, 38);
  doc.text('KASUS TERLAMBAT', 109, boxY + 6);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overdueLoans} Kasus`, 109, boxY + 14);

  // Box 4: Total Denda Terkumpul
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(152, boxY, boxWidth, boxHeight, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text('DENDA TERBAYAR', 155, boxY + 6);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${totalFineCollected.toLocaleString('id-ID')}`, 155, boxY + 14);

  // 4. TABEL DATA PEMINJAMAN DENGAN HARGA BUKU & TARIF DENDA OTOMATIS
  const tableData = loans.map((loan, index) => {
    const bookPrice = loan.bookPrice || 85000;
    const dailyRate = loan.fineRatePerDay || Math.max(1000, Math.round((bookPrice * 0.01) / 100) * 100);

    return [
      (index + 1).toString(),
      loan.id,
      loan.memberName,
      loan.bookTitle.length > 25 ? loan.bookTitle.substring(0, 23) + '...' : loan.bookTitle,
      `Rp ${bookPrice.toLocaleString('id-ID')}`,
      loan.borrowDate,
      loan.dueDate,
      loan.status,
      loan.daysLate > 0 ? `${loan.daysLate} hr` : '-',
      loan.daysLate > 0 ? `Rp ${dailyRate.toLocaleString('id-ID')}` : '-',
      loan.fineAmount > 0
        ? `Rp ${loan.fineAmount.toLocaleString('id-ID')} (${loan.finePaid ? 'Lunas' : 'Belum'})`
        : 'Rp 0',
    ];
  });

  autoTable(doc, {
    startY: 80,
    head: [
      [
        'No',
        'ID Transaksi',
        'Peminjam',
        'Judul Buku',
        'Harga Buku',
        'Pinjam',
        'Tempo',
        'Status',
        'Telat',
        'Tarif/Hari',
        'Total Denda',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 7 },
      1: { cellWidth: 20 },
      2: { cellWidth: 24 },
      3: { cellWidth: 34 },
      4: { cellWidth: 18 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 17 },
      8: { cellWidth: 10 },
      9: { cellWidth: 16 },
      10: { cellWidth: 22 },
    },
  });

  // 5. TANDA TANGAN
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = (doc.lastAutoTable?.finalY || 180) + 10;

  if (finalY < 245) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const signX = 138;
    doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, finalY);
    doc.text('Mengetahui / Penanggung Jawab,', signX, finalY + 4.5);
    doc.text('Kepala Perpustakaan Digital', signX, finalY + 9);

    doc.setFont('helvetica', 'bold');
    doc.text(generatedBy || 'Dra. Hj. Siti Rahmawati, M.Pd.', signX, finalY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text('NIP. 197405101999032001', signX, finalY + 32.5);
  }

  // Save the PDF
  const filename = `Laporan_Perpustakaan_${monthName}_${year}.pdf`;
  doc.save(filename);
}
