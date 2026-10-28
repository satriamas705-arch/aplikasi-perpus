import { LibrarySettings } from '../types/library';

/**
 * Menghitung tarif denda harian otomatis berdasarkan harga buku.
 * Aturan:
 * - Persentase default: 1% dari harga buku per hari terlambat
 * - Dibulatkan ke kelipatan Rp 100 terdekat
 * - Dibatasi dengan batas minimum harian (default Rp 1.000 / hari)
 */
export function calculateBookDailyFine(
  bookPrice: number,
  settings: Partial<LibrarySettings>
): number {
  const price = Math.max(0, bookPrice || 0);
  const percent = settings.finePercentPerDay ?? 1; // 1%
  const minFine = settings.minFinePerDay ?? 1000;  // Rp 1.000

  // 1% x Harga Buku
  const rawRate = (price * percent) / 100;
  // Pembulatan ke kelipatan Rp 100
  const rounded = Math.round(rawRate / 100) * 100;

  // Nilai tidak boleh di bawah batas minimal
  return Math.max(minFine, rounded);
}

/**
 * Menghitung total akumulasi denda keterlambatan dengan batas maksimal (cap).
 * Default batas maksimal denda: 100% dari harga buku (agar denda tidak melebihi harga penggantian buku).
 */
export function calculateTotalFine(
  daysLate: number,
  bookPrice: number,
  settings: Partial<LibrarySettings>
): {
  dailyRate: number;
  rawTotal: number;
  finalTotal: number;
  isCapped: boolean;
  capAmount: number;
} {
  if (daysLate <= 0) {
    const dailyRate = calculateBookDailyFine(bookPrice, settings);
    return {
      dailyRate,
      rawTotal: 0,
      finalTotal: 0,
      isCapped: false,
      capAmount: bookPrice,
    };
  }

  const dailyRate = calculateBookDailyFine(bookPrice, settings);
  const rawTotal = daysLate * dailyRate;

  // Batas atas denda (cap)
  const capPercent = settings.maxFineCapPercent ?? 100;
  const capAmount = Math.round((bookPrice * capPercent) / 100);

  const isCapped = rawTotal > capAmount;
  const finalTotal = isCapped ? capAmount : rawTotal;

  return {
    dailyRate,
    rawTotal,
    finalTotal,
    isCapped,
    capAmount,
  };
}
