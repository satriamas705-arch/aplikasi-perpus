import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  X,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  GraduationCap,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { UserRole } from '../types/library';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, setCurrentUser } = useLibrary();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      setErrorMessage('Alamat email belum terdaftar di sistem.');
      return;
    }

    // Accept standard demo passwords
    if (password.length < 3) {
      setErrorMessage('Kata sandi minimal 3 karakter.');
      return;
    }

    setCurrentUser(user);
    onClose();
  };

  const handleQuickLoginAs = (targetEmail: string) => {
    const user = users.find((u) => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (user) {
      setCurrentUser(user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg">Otentikasi Berbasis Peran</h3>
              <p className="text-xs text-slate-300">PustakaDigital Access Control</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Switcher Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              1-Klik Login Cepat Akun Demo:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLoginAs('admin@perpustakaan.id')}
                className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                  <Shield className="w-3.5 h-3.5 text-rose-600" />
                  <span>Admin Kepala</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">admin@perpustakaan.id</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAs('pustakawan@perpustakaan.id')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pustakawan</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">pustakawan@perpustakaan.id</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAs('budi.santoso@siswa.sch.id')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Siswa (Budi)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">budi.santoso@siswa.sch.id</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLoginAs('anisa.maharani@gmail.com')}
                className="p-2.5 rounded-xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-1.5 text-teal-800 font-bold">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Mahasiswa (Anisa)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">anisa.maharani@gmail.com</p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-semibold">
              atau masuk dengan form
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Akun</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perpustakaan.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kata Sandi (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all"
            >
              Masuk ke Sistem
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
