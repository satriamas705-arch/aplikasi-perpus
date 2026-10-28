import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User as UserIcon,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Member } from '../types/library';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook?: (book: Book) => void;
  onSelectMember?: (member: Member) => void;
  initialMode?: 'general' | 'borrow' | 'return';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectBook,
  onSelectMember,
  initialMode = 'general',
}) => {
  const { books, members, loans, returnBook, processBarcodeScan } = useLibrary();
  const [manualCode, setManualCode] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<{
    type: 'book' | 'member' | 'unknown';
    item?: Book | Member;
    message: string;
  } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Play pleasant digital beep sound using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz (A5)
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // AudioContext not allowed or not supported, ignore gracefully
    }
  };

  // Hardware barcode scanner listener (rapid keystrokes followed by Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on the manual text input, let them type normally
      if (document.activeElement?.tagName === 'INPUT') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 100) {
        bufferRef.current = '';
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          handleExecuteScan(bufferRef.current);
          bufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle Camera stream start/stop
  useEffect(() => {
    if (!isOpen || !useCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    async function startCamera() {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: unknown) {
        if (!isSubscribed) return;
        setCameraError(
          'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser atau gunakan input manual/barcode contoh.'
        );
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, useCamera]);

  if (!isOpen) return null;

  const handleExecuteScan = (rawCode: string) => {
    playBeep();
    setActionNotice(null);
    const result = processBarcodeScan(rawCode);
    setScannedResult(result);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleExecuteScan(manualCode);
  };

  const handleQuickReturn = (bookId: string) => {
    const activeLoan = loans.find(
      (l) => l.bookId === bookId && (l.status === 'Dipinjam' || l.status === 'Terlambat')
    );
    if (!activeLoan) {
      setActionNotice('Buku ini sedang tidak dalam status dipinjam.');
      return;
    }

    const res = returnBook(activeLoan.id, true);
    playBeep();
    setActionNotice(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Pemindai Barcode / ISBN</h3>
              <p className="text-xs text-slate-300">
                Pindai barcode buku atau kartu anggota dengan cepat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Action notices */}
          {actionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Mode switch: Camera vs Scanner input */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setUseCamera(false)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                !useCamera ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Barcode className="w-4 h-4" /> Input Barcode & Contoh
            </button>
            <button
              onClick={() => setUseCamera(true)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                useCamera ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" /> Kamera Barcode Langsung
            </button>
          </div>

          {/* Camera View */}
          {useCamera && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex flex-col items-center justify-center border border-slate-300">
              {cameraError ? (
                <div className="p-6 text-center text-slate-300 space-y-2">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-sm">{cameraError}</p>
                  <button
                    onClick={() => setUseCamera(false)}
                    className="mt-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs"
                  >
                    Beralih ke Input Barcode
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scanner overlay target box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-3/4 h-32 border-2 border-indigo-400 rounded-lg relative bg-indigo-500/10">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
                      <div className="absolute bottom-2 inset-x-0 text-center text-xs text-white/90 font-medium drop-shadow">
                        Arahkan garis merah ke barcode buku / kartu
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Input Barcode Form */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Scan atau Masukkan Barcode / ISBN / ID Anggota
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ketik ISBN (cth: 978-602-06-3317-4) atau ID Anggota..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono text-slate-900"
                  autoFocus
                />
                <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2 shrink-0 shadow-sm"
              >
                <Search className="w-4 h-4" /> Pindai
              </button>
            </div>
          </form>

          {/* Quick Simulation Barcode Buttons */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Contoh Barcode Cepat (Klik untuk Simulasi Scan)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {books.slice(0, 4).map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleExecuteScan(b.isbn)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-colors group flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                      {b.title}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{b.isbn}</p>
                  </div>
                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono shrink-0">
                    Buku
                  </span>
                </button>
              ))}
              {members.slice(0, 2).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleExecuteScan(m.id)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors group flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                      {m.name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{m.id}</p>
                  </div>
                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono shrink-0">
                    Anggota
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Scanned Result Card */}
          {scannedResult && (
            <div className="mt-4 p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50 border-slate-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {scannedResult.type === 'book' && scannedResult.item && (
                    <>
                      <div className="w-16 h-22 rounded-lg bg-gradient-to-br from-indigo-700 to-slate-900 border border-slate-300 shadow-sm flex flex-col items-center justify-center p-2 text-white shrink-0 text-center">
                        <BookOpen className="w-6 h-6 text-indigo-300 mb-1" />
                        <span className="text-[9px] font-bold line-clamp-1">{(scannedResult.item as Book).category.split(' ')[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                            Buku Terdeteksi
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Rp {((scannedResult.item as Book).price || 0).toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {(scannedResult.item as Book).isbn}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {(scannedResult.item as Book).title}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Penulis: {(scannedResult.item as Book).author} | Lokasi: {(scannedResult.item as Book).shelfLocation}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 mt-1">
                          Tersedia: {(scannedResult.item as Book).availableCopies} dari {(scannedResult.item as Book).totalCopies} eksemplar
                        </p>
                      </div>
                    </>
                  )}

                  {scannedResult.type === 'member' && scannedResult.item && (
                    <>
                      <img
                        src={(scannedResult.item as Member).avatarUrl}
                        alt={(scannedResult.item as Member).name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                            Anggota Terdeteksi
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {(scannedResult.item as Member).id}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {(scannedResult.item as Member).name}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Tipe: {(scannedResult.item as Member).type} | {(scannedResult.item as Member).email}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          No. Identitas: {(scannedResult.item as Member).identityNumber}
                        </p>
                      </div>
                    </>
                  )}

                  {scannedResult.type === 'unknown' && (
                    <div className="flex items-center gap-3 text-amber-700">
                      <AlertCircle className="w-8 h-8 shrink-0 text-amber-600" />
                      <div>
                        <h5 className="font-bold text-sm">Tidak Ditemukan</h5>
                        <p className="text-xs text-slate-600">{scannedResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Scanned Item */}
              {scannedResult.type === 'book' && scannedResult.item && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                  {onSelectBook && (
                    <button
                      onClick={() => {
                        onSelectBook(scannedResult.item as Book);
                        onClose();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Pilih untuk Form Transaksi
                    </button>
                  )}
                  <button
                    onClick={() => handleQuickReturn((scannedResult.item as Book).id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Proses Cepat Pengembalian
                  </button>
                </div>
              )}

              {scannedResult.type === 'member' && scannedResult.item && onSelectMember && (
                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectMember(scannedResult.item as Member);
                      onClose();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" /> Pilih Anggota Ini <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Scanner USB / Keyboard siap menerima input otomatis
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
