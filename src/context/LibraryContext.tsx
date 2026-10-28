import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Book,
  Member,
  Loan,
  EmailLog,
  ActivityLog,
  LibrarySettings,
  User,
  UserRole,
} from '../types/library';
import {
  INITIAL_BOOKS,
  INITIAL_MEMBERS,
  INITIAL_LOANS,
  INITIAL_EMAIL_LOGS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from '../data/initialData';
import { calculateBookDailyFine, calculateTotalFine } from '../utils/fineCalculator';

interface LibraryContextType {
  books: Book[];
  members: Member[];
  loans: Loan[];
  emailLogs: EmailLog[];
  activityLogs: ActivityLog[];
  settings: LibrarySettings;
  currentUser: User;
  users: User[];
  // User Authentication & Roles
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  login: (email: string, role?: UserRole) => boolean;
  logout: () => void;
  // Book CRUD
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => void;
  updateBook: (id: string, updated: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  // Member CRUD
  addMember: (member: Omit<Member, 'id' | 'joinDate'>) => void;
  updateMember: (id: string, updated: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  // Circulation
  borrowBook: (memberId: string, bookId: string, customDurationDays?: number, notes?: string) => { success: boolean; message: string };
  returnBook: (loanId: string, finePaidNow?: boolean, notes?: string) => { success: boolean; message: string; fine: number };
  payFine: (loanId: string) => void;
  // Settings
  updateSettings: (newSettings: Partial<LibrarySettings>) => void;
  // Automated notifications
  triggerAutomaticReminderCheck: () => { sentCount: number; messages: string[] };
  // Quick Barcode Action
  processBarcodeScan: (barcodeValue: string) => { type: 'book' | 'member' | 'unknown'; item?: Book | Member; message: string };
  // Reset Data
  resetToDefaultData: () => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEY = 'pustaka_digital_state_v1';

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or fallback
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_books`);
      if (saved) {
        const parsed: Book[] = JSON.parse(saved);
        return parsed.map((b, idx) => ({
          ...b,
          price: b.price || (INITIAL_BOOKS[idx]?.price || 85000),
        }));
      }
      return INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_members`);
      return saved ? JSON.parse(saved) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_loans`);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_emails`);
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_LOGS;
    } catch {
      return INITIAL_EMAIL_LOGS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activities`);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [settings, setSettings] = useState<LibrarySettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Admin by default
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_books`, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_members`, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_loans`, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_emails`, JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activities`, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  // Log activity helper
  const addActivity = (
    type: ActivityLog['type'],
    title: string,
    description: string
  ) => {
    const newAct: ActivityLog = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      type,
      title,
      description,
      user: currentUser.name,
    };
    setActivityLogs((prev) => [newAct, ...prev]);
  };

  // Helper date formatter
  const formatDateYMD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Background check on load to update loan statuses if overdue
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setLoans((prev) =>
      prev.map((loan) => {
        if (loan.status === 'Dikembalikan') return loan;

        const due = new Date(loan.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const bookPrice = loan.bookPrice || books.find((b) => b.id === loan.bookId)?.price || 85000;
        const { dailyRate, finalTotal } = calculateTotalFine(diffDays, bookPrice, settings);

        if (diffDays > 0) {
          return {
            ...loan,
            bookPrice,
            fineRatePerDay: dailyRate,
            status: 'Terlambat',
            daysLate: diffDays,
            fineAmount: finalTotal,
            finePaid: loan.fineAmount === 0 ? false : loan.finePaid,
          };
        }

        return {
          ...loan,
          bookPrice,
          fineRatePerDay: dailyRate,
        };
      })
    );
  }, [settings.finePercentPerDay, settings.minFinePerDay, settings.maxFineCapPercent, books]);

  // Role switching
  const switchRole = (role: UserRole) => {
    const match = users.find((u) => u.role === role);
    if (match) {
      setCurrentUser(match);
      addActivity('pinjam', 'Ganti Peran Pengguna', `Beralih ke akun ${match.name} (${role})`);
    }
  };

  const login = (email: string, targetRole?: UserRole) => {
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() ||
        (targetRole && u.role === targetRole)
    );
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(users[0]);
  };

  // Book CRUD
  const addBook = (data: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => {
    const newId = `BK-${String(books.length + 1).padStart(3, '0')}`;
    const newBook: Book = {
      ...data,
      id: newId,
      availableCopies: data.totalCopies,
      createdAt: formatDateYMD(new Date()),
      rating: 4.8,
    };
    setBooks((prev) => [newBook, ...prev]);
    addActivity('buku_baru', 'Penambahan Buku Baru', `Buku "${newBook.title}" berhasil ditambahkan ke katalog.`);
  };

  const updateBook = (id: string, updated: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const diffTotal = (updated.totalCopies ?? b.totalCopies) - b.totalCopies;
          const adjustedAvailable = Math.max(0, b.availableCopies + diffTotal);
          return { ...b, ...updated, availableCopies: updated.availableCopies ?? adjustedAvailable };
        }
        return b;
      })
    );
    addActivity('buku_baru', 'Pembaruan Data Buku', `Data buku ID ${id} telah diperbarui.`);
  };

  const deleteBook = (id: string) => {
    const target = books.find((b) => b.id === id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    if (target) {
      addActivity('buku_baru', 'Penghapusan Buku', `Buku "${target.title}" dihapus dari katalog.`);
    }
  };

  // Member CRUD
  const addMember = (data: Omit<Member, 'id' | 'joinDate'>) => {
    const newId = `LIB-${new Date().getFullYear()}-${String(members.length + 1).padStart(3, '0')}`;
    const newMember: Member = {
      ...data,
      id: newId,
      joinDate: formatDateYMD(new Date()),
    };
    setMembers((prev) => [newMember, ...prev]);
    addActivity('anggota_baru', 'Pendaftaran Anggota Baru', `Anggota ${newMember.name} (${newMember.type}) terdaftar.`);
  };

  const updateMember = (id: string, updated: Partial<Member>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    addActivity('anggota_baru', 'Pembaruan Data Anggota', `Data anggota ${id} diperbarui.`);
  };

  const deleteMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (target) {
      addActivity('anggota_baru', 'Penghapusan Anggota', `Anggota "${target.name}" dinonaktifkan/dihapus.`);
    }
  };

  // Circulation: Borrow
  const borrowBook = (
    memberId: string,
    bookId: string,
    customDurationDays?: number,
    notes?: string
  ): { success: boolean; message: string } => {
    const book = books.find((b) => b.id === bookId);
    const member = members.find((m) => m.id === memberId);

    if (!book) return { success: false, message: 'Buku tidak ditemukan di sistem.' };
    if (!member) return { success: false, message: 'Anggota tidak terdaftar.' };
    if (member.status !== 'Aktif') return { success: false, message: 'Status anggota nonaktif/ditangguhkan.' };
    if (book.availableCopies <= 0) return { success: false, message: 'Stok buku ini sedang habis dipinjam.' };

    // Check member's active borrow count
    const activeBorrowCount = loans.filter(
      (l) => l.memberId === memberId && (l.status === 'Dipinjam' || l.status === 'Terlambat')
    ).length;

    if (activeBorrowCount >= member.maxBorrowLimit) {
      return {
        success: false,
        message: `Batas maksimal pinjam anggota (${member.maxBorrowLimit} buku) telah tercapai.`,
      };
    }

    const duration = customDurationDays || settings.borrowDurationDays;
    const now = new Date();
    const borrowDateStr = formatDateYMD(now);

    const dueDateObj = new Date();
    dueDateObj.setDate(now.getDate() + duration);
    const dueDateStr = formatDateYMD(dueDateObj);

    const newLoanId = `TRX-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      loans.length + 1
    ).padStart(3, '0')}`;

    const bookPrice = book.price || 85000;
    const dailyRate = calculateBookDailyFine(bookPrice, settings);

    const newLoan: Loan = {
      id: newLoanId,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      bookPrice,
      bookCoverUrl: book.coverUrl || '',
      memberId: member.id,
      memberName: member.name,
      memberEmail: member.email,
      borrowDate: borrowDateStr,
      dueDate: dueDateStr,
      status: 'Dipinjam',
      daysLate: 0,
      fineRatePerDay: dailyRate,
      fineAmount: 0,
      finePaid: true,
      notes: notes || `Peminjaman durasi ${duration} hari. Tarif denda: Rp ${dailyRate.toLocaleString('id-ID')}/hari.`,
    };

    // Update state
    setLoans((prev) => [newLoan, ...prev]);
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    addActivity(
      'pinjam',
      'Peminjaman Berhasil',
      `${member.name} meminjam "${book.title}". Jatuh tempo: ${dueDateStr}.`
    );

    return {
      success: true,
      message: `Peminjaman "${book.title}" berhasil dicatat untuk ${member.name}. Jatuh tempo: ${dueDateStr}. Tarif denda jika telat: Rp ${dailyRate.toLocaleString('id-ID')}/hari (1% harga buku).`,
    };
  };

  // Circulation: Return
  const returnBook = (
    loanId: string,
    finePaidNow: boolean = true,
    notes?: string
  ): { success: boolean; message: string; fine: number } => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Transaksi peminjaman tidak ditemukan.', fine: 0 };
    if (loan.status === 'Dikembalikan') return { success: false, message: 'Buku ini sudah dikembalikan sebelumnya.', fine: 0 };

    const today = new Date();
    const returnDateStr = formatDateYMD(today);

    // Calculate late days
    const due = new Date(loan.dueDate);
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - due.getTime();
    const daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate fine automatically based on book price
    const bookPrice = loan.bookPrice || books.find((b) => b.id === loan.bookId)?.price || 85000;
    const { dailyRate, finalTotal } = calculateTotalFine(daysLate, bookPrice, settings);
    const fineAmount = finalTotal;

    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          return {
            ...l,
            bookPrice,
            fineRatePerDay: dailyRate,
            returnDate: returnDateStr,
            status: 'Dikembalikan',
            daysLate,
            fineAmount,
            finePaid: fineAmount === 0 ? true : finePaidNow,
            notes: notes ? `${l.notes || ''} [Pengembalian: ${notes}]` : l.notes,
          };
        }
        return l;
      })
    );

    // Return copy to available stock
    setBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b))
    );

    const fineMsg =
      fineAmount > 0
        ? ` Terlambat ${daysLate} hari (Tarif: Rp ${dailyRate.toLocaleString('id-ID')}/hari berdasarkan harga buku Rp ${bookPrice.toLocaleString('id-ID')} | Total Denda: Rp ${fineAmount.toLocaleString('id-ID')}${finePaidNow ? ' - Lunas' : ' - Tertunggak'}).`
        : ' Tepat waktu.';

    addActivity(
      'kembali',
      'Pengembalian Buku',
      `${loan.memberName} mengembalikan "${loan.bookTitle}".${fineMsg}`
    );

    return {
      success: true,
      message: `Buku "${loan.bookTitle}" berhasil dikembalikan.${fineMsg}`,
      fine: fineAmount,
    };
  };

  // Fine settlement
  const payFine = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, finePaid: true } : l))
    );
    const target = loans.find((l) => l.id === loanId);
    if (target) {
      addActivity(
        'denda_lunas',
        'Pelunasan Denda',
        `${target.memberName} telah melunasi denda sebesar Rp ${target.fineAmount.toLocaleString('id-ID')}.`
      );
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<LibrarySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Automated notification reminder check
  const triggerAutomaticReminderCheck = (): { sentCount: number; messages: string[] } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newEmails: EmailLog[] = [];
    const messages: string[] = [];

    loans.forEach((loan) => {
      if (loan.status === 'Dikembalikan') return;

      const due = new Date(loan.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let type: EmailLog['type'] | null = null;
      let emailText = '';

      if (daysRemaining < 0) {
        // Overdue
        const daysLate = Math.abs(daysRemaining);
        const bookPrice = loan.bookPrice || books.find((b) => b.id === loan.bookId)?.price || 85000;
        const { dailyRate, finalTotal } = calculateTotalFine(daysLate, bookPrice, settings);
        const estFine = finalTotal;
        type = 'Pemberitahuan Terlambat';
        emailText = `Halo <b>${loan.memberName}</b>,<br>Peminjaman buku <b>"${loan.bookTitle}"</b> (ID Transaksi: ${loan.id}) telah melewati batas waktu (${daysLate} hari terlambat). Denda berjalan saat ini adalah Rp ${estFine.toLocaleString('id-ID')} (Tarif: Rp ${dailyRate.toLocaleString('id-ID')}/hari dihitung otomatis 1% dari harga buku Rp ${bookPrice.toLocaleString('id-ID')}). Mohon segera kembalikan ke perpustakaan.`;
      } else if (daysRemaining === 0) {
        // Due today
        type = 'Pengingat Jatuh Tempo';
        emailText = `Halo <b>${loan.memberName}</b>,<br>Buku <b>"${loan.bookTitle}"</b> harus dikembalikan <b>HARI INI</b> (${loan.dueDate}). Hindari denda keterlambatan dengan mengembalikan sebelum jam 16.00 WIB.`;
      } else if (daysRemaining <= 2) {
        // Due soon (H-1 or H-2)
        type = 'Pengingat H-2';
        emailText = `Halo <b>${loan.memberName}</b>,<br>Pengingat ramah bahwa masa pinjam buku <b>"${loan.bookTitle}"</b> akan jatuh tempo dalam ${daysRemaining} hari lagi (${loan.dueDate}). Anda dapat memperpanjang atau mempersiapkan pengembalian buku.`;
      }

      if (type) {
        const logId = `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        newEmails.push({
          id: logId,
          recipientEmail: loan.memberEmail,
          recipientName: loan.memberName,
          bookTitle: loan.bookTitle,
          loanId: loan.id,
          type,
          sentAt: new Date().toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          status: 'Terkirim',
          previewHtml: emailText,
        });
        messages.push(`Email dikirim ke ${loan.memberName} (${loan.memberEmail}) - [${type}]`);
      }
    });

    if (newEmails.length > 0) {
      setEmailLogs((prev) => [...newEmails, ...prev]);
      addActivity(
        'email_sent',
        'Email Pengingat Terkirim Otomatis',
        `Berhasil mengirim ${newEmails.length} email pengingat tenggat waktu kepada peminjam.`
      );
    }

    return {
      sentCount: newEmails.length,
      messages,
    };
  };

  // Barcode scanner processor
  const processBarcodeScan = (barcodeValue: string) => {
    const clean = barcodeValue.trim();

    // 1. Try match book ISBN or ID
    const book = books.find(
      (b) =>
        b.isbn.replace(/-/g, '').toLowerCase() === clean.replace(/-/g, '').toLowerCase() ||
        b.id.toLowerCase() === clean.toLowerCase() ||
        b.isbn.toLowerCase() === clean.toLowerCase()
    );

    if (book) {
      return {
        type: 'book' as const,
        item: book,
        message: `Buku teridentifikasi: "${book.title}" oleh ${book.author} (Stok: ${book.availableCopies}/${book.totalCopies})`,
      };
    }

    // 2. Try match member ID
    const member = members.find(
      (m) =>
        m.id.toLowerCase() === clean.toLowerCase() ||
        m.identityNumber.toLowerCase() === clean.toLowerCase()
    );

    if (member) {
      return {
        type: 'member' as const,
        item: member,
        message: `Anggota teridentifikasi: ${member.name} (${member.type}) - ${member.id}`,
      };
    }

    return {
      type: 'unknown' as const,
      message: `Barcode / Kode "${clean}" tidak cocok dengan data buku atau anggota manapun.`,
    };
  };

  const resetToDefaultData = () => {
    setBooks(INITIAL_BOOKS);
    setMembers(INITIAL_MEMBERS);
    setLoans(INITIAL_LOANS);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setSettings(INITIAL_SETTINGS);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
  };

  return (
    <LibraryContext.Provider
      value={{
        books,
        members,
        loans,
        emailLogs,
        activityLogs,
        settings,
        currentUser,
        users,
        setCurrentUser,
        switchRole,
        login,
        logout,
        addBook,
        updateBook,
        deleteBook,
        addMember,
        updateMember,
        deleteMember,
        borrowBook,
        returnBook,
        payFine,
        updateSettings,
        triggerAutomaticReminderCheck,
        processBarcodeScan,
        resetToDefaultData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
