export type UserRole = 'admin' | 'librarian' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  memberId?: string; // Links to Member record if role === 'member'
}

export type BookCategory =
  | 'Semua Kategori'
  | 'Fiksi & Sastra'
  | 'Sains & Teknologi'
  | 'Komputer & IT'
  | 'Pendidikan & Pelajaran'
  | 'Sejarah & Budaya'
  | 'Bisnis & Ekonomi'
  | 'Agama & Filsafat'
  | 'Pengembangan Diri'
  | 'Kamus & Referensi';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  category: BookCategory;
  publisher: string;
  year: number;
  price: number; // in IDR (Rp)
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string; // e.g., 'Rak A-03'
  synopsis: string;
  coverUrl?: string;
  rating?: number;
  createdAt: string;
}

export type MemberType = 'Siswa' | 'Guru' | 'Mahasiswa' | 'Umum';
export type MemberStatus = 'Aktif' | 'Nonaktif' | 'Ditangguhkan';

export interface Member {
  id: string; // e.g. 'LIB-2026-001'
  name: string;
  email: string;
  phone: string;
  type: MemberType;
  identityNumber: string; // NISN or NIP or KTP
  address: string;
  joinDate: string;
  status: MemberStatus;
  maxBorrowLimit: number;
  avatarUrl: string;
}

export type LoanStatus = 'Dipinjam' | 'Dikembalikan' | 'Terlambat';

export interface Loan {
  id: string; // e.g. 'TRX-202610-001'
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  bookPrice: number; // Price of the book for dynamic fine calculation
  bookCoverUrl: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  returnDate?: string;// YYYY-MM-DD
  status: LoanStatus;
  daysLate: number;
  fineRatePerDay: number; // Fine rate calculated automatically based on book price
  fineAmount: number; // in IDR (Rp)
  finePaid: boolean;
  notes?: string;
}

export interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  bookTitle: string;
  loanId: string;
  type: 'Pengingat H-2' | 'Pengingat Jatuh Tempo' | 'Pemberitahuan Terlambat' | 'Konfirmasi Pengembalian';
  sentAt: string;
  status: 'Terkirim' | 'Gagal';
  previewHtml: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'pinjam' | 'kembali' | 'buku_baru' | 'anggota_baru' | 'denda_lunas' | 'email_sent';
  title: string;
  description: string;
  user: string;
}

export type FineRuleMode = 'percentage_of_price' | 'bracket_by_price';

export interface LibrarySettings {
  libraryName: string;
  address: string;
  fineRuleMode: FineRuleMode;
  finePercentPerDay: number; // Persentase denda per hari (e.g. 1%)
  minFinePerDay: number; // Batas minimum denda harian (e.g. Rp 1.000)
  maxFineCapPercent: number; // Batas maksimal denda relatif thd harga buku (e.g. 100%)
  borrowDurationDays: number; // e.g. 7 days
  maxBooksPerMember: number;
  autoEmailReminder: boolean;
}
