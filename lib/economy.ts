// Float değerine göre aşınma (Wear) hesaplama
export function getWear(float: number) {
  if (float < 0.07) return "Factory New";
  if (float < 0.15) return "Minimal Wear";
  if (float < 0.38) return "Field-Tested";
  if (float < 0.45) return "Well-Worn";
  return "Battle-Scarred";
}

// Float değerine göre fiyat çarpanı (0.00 float = En pahalı, 1.00 float = En ucuz)
export function getFloatMultiplier(float: number) {
  return 1.4 - (float * 0.8);
}

// Nadirliğe göre baz fiyatlar (Steam Ortalamaları - Dolar)
export const RARITY_BASE_PRICES: Record<string, number> = {
  "Mil-Spec Grade": 1.20,
  "Restricted": 5.50,
  "Classified": 25.00,
  "Covert": 90.00,
  "Rare Special": 450.00,
};

// SKİN İSMİNE GÖRE POPÜLERLİK ÇARPANI
// Gerçek Steam fiyatlarına daha çok benzemesi için eklenmiştir.
export function getSkinMultiplier(skinName: string) {
  const name = skinName.toLowerCase();
  
  // Çok popüler ve pahalı skinler (Örn: Dragon Lore, Printstream, Asiimov, Fade)
  if (name.includes("dragon lore") || name.includes("printstream") || name.includes("fade") || name.includes("doppler") || name.includes("case hardened")) {
    return 3.5; // 3.5 kat daha pahalı
  }
  
  // Popüler ve orta-pahalı skinler
  if (name.includes("asiimov") || name.includes("neon rider") || name.includes("kill confirmed") || name.includes("vulcan") || name.includes("hyper beast")) {
    return 2.0;
  }

  // Koleksiyonluk / Orta fiyatlı skinler
  if (name.includes("water elemental") || name.includes("conspiracy") || name.includes("mecha industries") || name.includes("neo-noir")) {
    return 1.2;
  }

  // Çok sıradan ve ucuz skinler (Sand Dune, Forest DDPAT, Safari Mesh vb.)
  if (name.includes("sand dune") || name.includes("forest ddpat") || name.includes("safari mesh") || name.includes("boreal forest") || name.includes("predator")) {
    return 0.2; // Çok ucuz
  }

  // Varsayılan çarpan
  return 1.0;
}

// Kasa Fiyatı
export const CASE_PRICE = 2.50;