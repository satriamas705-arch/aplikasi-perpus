import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Barcode,
  LayoutGrid,
  List,
  Check,
  X,
  Star,
  MapPin,
  Calendar,
  Sparkles,
  Tag,
  DollarSign,
  Coins,
  ArrowUpDown,
  Library,
  Layers,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, BookCategory } from '../types/library';

const CATEGORIES: BookCategory[] = [
  'Semua Kategori',
  'Fiksi & Sastra',
  'Sains & Teknologi',
  'Komputer & IT',
  'Pendidikan & Pelajaran',
  'Sejarah & Budaya',
  'Bisnis & Ekonomi',
  'Agama & Filsafat',
  'Pengembangan Diri',
  'Kamus & Referensi',
];

const CATEGORY_THEMES: Record<string, { bg: string; gradient: string; accent: string }> = {
  'Fiksi & Sastra': {
    bg: 'bg-rose-50 text-rose-700',
    gradient: 'from-rose-600 via-rose-700 to-pink-800',
    accent: 'border-rose-300',
  },
  'Sains & Teknologi': {
    bg: 'bg-blue-50 text-blue-700',
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
    accent: 'border-blue-300',
  },
  'Komputer & IT': {
    bg: 'bg-indigo-50 text-indigo-700',
    gradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    accent: 'border-indigo-300',
  },
  'Pendidikan & Pelajaran': {
    bg: 'bg-amber-50 text-amber-700',
    gradient: 'from-amber-600 via-orange-600 to-amber-800',
    accent: 'border-amber-300',
  },
  'Sejarah & Budaya': {
    bg: 'bg-stone-50 text-stone-700',
    gradient: 'from-stone-700 via-stone-800 to-amber-950',
    accent: 'border-stone-300',
  },
  'Bisnis & Ekonomi': {
    bg: 'bg-emerald-50 text-emerald-700',
    gradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    accent: 'border-emerald-300',
  },
  'Agama & Filsafat': {
    bg: 'bg-purple-50 text-purple-700',
    gradient: 'from-purple-700 via-violet-800 to-indigo-950',
    accent: 'border-purple-300',
  },
  'Pengembangan Diri': {
    bg: 'bg-teal-50 text-teal-700',
    gradient: 'from-teal-600 via-teal-700 to-emerald-800',
    accent: 'border-teal-300',
  },
  'Kamus & Referensi': {
    bg: 'bg-slate-50 text-slate-700',
    gradient: 'from-slate-700 via-slate-800 to-zinc-900',
    accent: 'border-slate-300',
  },
};

interface BookManagementProps {
  onBorrowBookRequested?: (book: Book) => void;
  onOpenScanner: () => void;
}

export const BookManagement: React.FC<BookManagementProps> = ({
  onBorrowBookRequested,
  onOpenScanner,
}) => {
  const { books, addBook, updateBook, deleteBook, currentUser } = useLibrary();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('Semua Kategori');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('Semua Penulis');
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'price-asc' | 'price-desc'>('title');
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state: Note NO coverUrl field (hilangkan url gambar sampul)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiksi & Sastra' as BookCategory,
    publisher: '',
    year: new Date().getFullYear(),
    price: 85000,
    totalCopies: 5,
    shelfLocation: 'Rak A-01',
    synopsis: '',
  });

  // Calculate inventory value stats
  const totalCatalogValue = useMemo(() => {
    return books.reduce((sum, b) => sum + (b.price || 0) * b.totalCopies, 0);
  }, [books]);

  const totalCopiesCount = useMemo(() => {
    return books.reduce((sum, b) => sum + b.totalCopies, 0);
  }, [books]);

  // Extract unique authors and years for filter dropdowns
  const authorsList = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.author));
    return ['Semua Penulis', ...Array.from(set)];
  }, [books]);

  const yearsList = useMemo(() => {
    const set = new Set<number>();
    books.forEach((b) => set.add(b.year));
    return ['Semua', ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [books]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    const result = books.filter((book) => {
      // 1. Keyword search (title, author, isbn, synopsis, publisher)
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.isbn.toLowerCase().includes(term) ||
        book.publisher.toLowerCase().includes(term) ||
        book.synopsis.toLowerCase().includes(term);

      // 2. Category filter
      const matchesCategory =
        selectedCategory === 'Semua Kategori' || book.category === selectedCategory;

      // 3. Author filter
      const matchesAuthor =
        selectedAuthor === 'Semua Penulis' || book.author === selectedAuthor;

      // 4. Year filter
      const matchesYear =
        selectedYear === 'Semua' || book.year.toString() === selectedYear;

      // 5. Availability
      const matchesAvailability = !availabilityOnly || book.availableCopies > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAuthor &&
        matchesYear &&
        matchesAvailability
      );
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'year') return b.year - a.year;
      return a.title.localeCompare(b.title);
    });
  }, [books, searchTerm, selectedCategory, selectedAuthor, selectedYear, availabilityOnly, sortBy]);

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: `978-602-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1 + Math.random() * 9)}`,
      category: 'Fiksi & Sastra',
      publisher: 'Gramedia Pustaka Utama',
      year: new Date().getFullYear(),
      price: 85000,
      totalCopies: 5,
      shelfLocation: 'Rak A-01',
      synopsis: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      publisher: book.publisher,
      year: book.year,
      price: book.price || 75000,
      totalCopies: book.totalCopies,
      shelfLocation: book.shelfLocation,
      synopsis: book.synopsis,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim()) {
      return;
    }

    if (editingBook) {
      updateBook(editingBook.id, {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        publisher: formData.publisher,
        year: formData.year,
        price: Number(formData.price) || 0,
        totalCopies: formData.totalCopies,
        shelfLocation: formData.shelfLocation,
        synopsis: formData.synopsis,
      });
    } else {
      addBook({
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        category: formData.category,
        publisher: formData.publisher,
        year: formData.year,
        price: Number(formData.price) || 0,
        totalCopies: formData.totalCopies,
        shelfLocation: formData.shelfLocation,
        synopsis: formData.synopsis,
      });
    }
    setIsModalOpen(false);
  };

  const canManage = currentUser.role === 'admin' || currentUser.role === 'librarian';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar with Catalog & Inventory Value Summary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Katalog & Manajemen Koleksi Buku
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Kelola data buku, penetapan harga tiap buku, dan inventaris perpustakaan
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Barcode className="w-4 h-4 text-indigo-600" /> Scan Barcode
            </button>

            {canManage && (
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Tambah Buku Baru
              </button>
            )}
          </div>
        </div>

        {/* Quick Inventory Financial Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Koleksi
              </span>
              <span className="font-extrabold text-slate-900 text-sm">
                {books.length} Judul ({totalCopiesCount} Eksemplar)
              </span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                Total Nilai Inventaris Buku
              </span>
              <span className="font-extrabold text-emerald-800 text-sm">
                Rp {totalCatalogValue.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                Rata-Rata Harga Buku
              </span>
              <span className="font-extrabold text-amber-900 text-sm">
                Rp {books.length > 0 ? Math.round(totalCatalogValue / totalCopiesCount).toLocaleString('id-ID') : 0} / eksemplar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Price Sorting & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Row 1: Search Input & View Toggle */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari berdasarkan judul, penulis, ISBN barcode, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAvailabilityOnly(!availabilityOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                availabilityOnly
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${availabilityOnly ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Hanya Stok Tersedia
            </button>

            {/* View Mode Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Grid Card"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category, Author, Year & Price Sorting Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as BookCategory)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Author Dropdown */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {authorsList.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {yearsList.map((year) => (
              <option key={year} value={year}>
                {year === 'Semua' ? 'Semua Tahun Terbit' : `Tahun ${year}`}
              </option>
            ))}
          </select>

          {/* Sort By (including Price) */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="title">Judul (A-Z)</option>
              <option value="year">Tahun Terbaru</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
            </select>
          </div>

          {(selectedCategory !== 'Semua Kategori' ||
            selectedAuthor !== 'Semua Penulis' ||
            selectedYear !== 'Semua' ||
            searchTerm ||
            availabilityOnly) && (
            <button
              onClick={() => {
                setSelectedCategory('Semua Kategori');
                setSelectedAuthor('Semua Penulis');
                setSelectedYear('Semua');
                setSearchTerm('');
                setAvailabilityOnly(false);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Book Results Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <b className="text-slate-800">{filteredBooks.length}</b> dari {books.length} buku
        </span>
      </div>

      {/* Books Display */}
      {filteredBooks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">Tidak ada buku yang sesuai</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau sesuaikan filter kategori, penulis, dan tahun terbit.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode: Styled Book Cover with Prominent Price & without requiring Cover URLs */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            const theme = CATEGORY_THEMES[book.category] || CATEGORY_THEMES['Kamus & Referensi'];

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Clean Visual Book Cover Presentation (Category Gradient + Spine + Price Badge) */}
                  <div
                    className={`h-48 relative overflow-hidden bg-gradient-to-br ${theme.gradient} p-4 text-white flex flex-col justify-between shadow-inner`}
                  >
                    {/* Simulated Book Spine Emboss */}
                    <div className="absolute top-0 bottom-0 left-0 w-3 bg-black/25 border-r border-white/10" />

                    {/* Top Row: Category Pill & Availability */}
                    <div className="pl-2 flex items-start justify-between gap-2 z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-white border border-white/20">
                        {book.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs ${
                          isAvailable
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-rose-500/90 text-white'
                        }`}
                      >
                        {isAvailable ? `${book.availableCopies} Tersedia` : 'Stok Habis'}
                      </span>
                    </div>

                    {/* Center: Title & Author Titleplate */}
                    <div className="pl-2 z-10 space-y-1 my-auto">
                      <h4 className="font-black text-sm text-white line-clamp-2 leading-snug drop-shadow-sm group-hover:underline">
                        {book.title}
                      </h4>
                      <p className="text-xs text-white/80 line-clamp-1 font-medium">
                        {book.author}
                      </p>
                    </div>

                    {/* Bottom Row: Prominent Price Badge & Shelf Location */}
                    <div className="pl-2 flex items-center justify-between z-10 pt-2 border-t border-white/15">
                      <div className="flex items-center gap-1 bg-white text-slate-900 px-2.5 py-1 rounded-lg font-black text-xs shadow-md">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>Rp {(book.price || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white/90 font-mono">
                        {book.shelfLocation}
                      </span>
                    </div>

                    {/* Decorative subtle background watermark */}
                    <BookOpen className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4 pointer-events-none rotate-12" />
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    {/* Price and Publisher Row */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Harga: Rp {(book.price || 0).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {book.publisher} • {book.year}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {book.synopsis || 'Buku koleksi perpustakaan terverifikasi dan siap dipinjam.'}
                    </p>

                    {/* ISBN Barcode Badge */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5 text-slate-400" /> {book.isbn}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Total {book.totalCopies} eks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  {onBorrowBookRequested && isAvailable && (
                    <button
                      onClick={() => onBorrowBookRequested(book)}
                      className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Pinjam
                    </button>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(book)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Edit Data & Harga Buku"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(book.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Hapus Buku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode with Explicit Price Column */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Judul & Penulis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Harga Buku (Rp)</th>
                  <th className="px-4 py-3">ISBN / Barcode</th>
                  <th className="px-4 py-3">Penerbit & Tahun</th>
                  <th className="px-4 py-3">Lokasi Rak</th>
                  <th className="px-4 py-3">Ketersediaan</th>
                  {canManage && <th className="px-4 py-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-10 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{book.title}</p>
                            <p className="text-slate-500">{book.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-indigo-700">
                        {book.category}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        Rp {(book.price || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {book.isbn}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {book.publisher} ({book.year})
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {book.shelfLocation}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {book.availableCopies} / {book.totalCopies} Ready
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right space-x-1">
                          {onBorrowBookRequested && isAvailable && (
                            <button
                              onClick={() => onBorrowBookRequested(book)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium mr-1"
                            >
                              Pinjam
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(book)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(book.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                            title="Hapus Buku"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Hapus Buku Ini?</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus buku ini dari katalog perpustakaan? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteBook(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Ya, Hapus Buku
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal (With Price field and NO coverUrl field) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                {editingBook ? 'Edit Data & Harga Buku' : 'Tambah Buku Baru ke Katalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Judul Buku *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Laskar Pelangi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Penulis *</label>
                  <input
                    type="text"
                    required
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Contoh: Andrea Hirata"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">ISBN / Barcode *</label>
                  <input
                    type="text"
                    required
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-602-03-8591-2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Price & Publisher Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 flex items-center justify-between">
                    <span>Harga Buku (Rp) *</span>
                    <span className="text-emerald-600 font-bold">
                      Rp {Number(formData.price || 0).toLocaleString('id-ID')}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-semibold">Rp</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      placeholder="85000"
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Penerbit</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Gramedia, Mizan, Erlangga..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as BookCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua Kategori').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lokasi Rak</label>
                  <input
                    type="text"
                    value={formData.shelfLocation}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    placeholder="Rak A-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Total Stok (Eksemplar)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Sinopsis Singkat</label>
                <textarea
                  rows={3}
                  value={formData.synopsis}
                  onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                  placeholder="Ringkasan isi buku atau deskripsi konten..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  {editingBook ? 'Simpan Perubahan' : 'Tambahkan Buku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
