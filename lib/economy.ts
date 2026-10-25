// Float değerine göre aşınma (Wear) hesaplama
export function getWear(float: number) {
  if (float < 0.07) return "Factory New";
  if (float < 0.15) return "Minimal Wear";
  if (float < 0.38) return "Field-Tested";
  if (float < 0.45) return "Well-Worn";
  return "Battle-Scarred";
}

// Float değerine göre fiyat çarpanı (0.00 = En pahalı, 1.00 = En ucuz)
export function getPriceMultiplier(float: number) {
  // Örn: 0.01 float -> 1.4x fiyat, 0.99 float -> 0.6x fiyat
  return 1.4 - (float * 0.8);
}

// Nadirliğe göre baz fiyatlar (Dolar)
export const RARITY_BASE_PRICES: Record<string, number> = {
  "Mil-Spec Grade": 1.50,
  "Restricted": 8.00,
  "Classified": 35.00,
  "Covert": 150.00,
  "Rare Special": 800.00,
};

// Kasa Fiyatları (Dolar)
export const CASE_PRICES: Record<string, number> = {
  // İstersen kasa isimlerine göre özel fiyat verebilirsin, yoksa hepsi sabit:
  "default": 2.50
};