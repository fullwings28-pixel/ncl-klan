// lib/economy.ts

// Float değerine göre aşınma (Wear) hesaplama
export function getWear(float: number) {
  if (float < 0.07) return "Factory New";
  if (float < 0.15) return "Minimal Wear";
  if (float < 0.38) return "Field-Tested";
  if (float < 0.45) return "Well-Worn";
  return "Battle-Scarred";
}

// Float değerine göre fiyat çarpanı
export function getFloatMultiplier(float: number) {
  return 1.4 - (float * 0.8);
}

// CS2 API'sinden gelen nadirlik isimlerine göre baz fiyatlar
export const RARITY_BASE_PRICES: Record<string, number> = {
  "Consumer Grade": 0.05,
  "Industrial Grade": 0.15,
  "Mil-Spec Grade": 0.80,
  "Restricted": 3.50,
  "Classified": 15.00,
  "Covert": 60.00,
  "Rare Special": 300.00,
};

// SKİN İSMİNE GÖRE POPÜLERLİK VE FİYAT ÇARPANI
export function getSkinMultiplier(skinName: string) {
  const name = skinName.toLowerCase();
  
  if (name.includes("dragon lore") || name.includes("printstream") || name.includes("fade") || name.includes("doppler") || name.includes("case hardened") || name.includes("gamma doppler")) {
    return 5.0;
  }
  
  if (name.includes("asiimov") || name.includes("neon rider") || name.includes("kill confirmed") || name.includes("vulcan") || name.includes("hyper beast") || name.includes("neo-noir") || name.includes("mecha industries")) {
    return 2.5;
  }

  if (name.includes("water elemental") || name.includes("conspiracy") || name.includes("cyrex") || name.includes("guardian") || name.includes("atomic alloy")) {
    return 1.5;
  }

  if (name.includes("sand dune") || name.includes("forest ddpat") || name.includes("safari mesh") || name.includes("boreal forest") || name.includes("predator") || name.includes("scorched") || name.includes("contractor")) {
    return 0.3;
  }

  return 1.0;
}

// FİYAT HESAPLAMA (Önce CS2Cap API'sini dener, başarısız olursa tahmini fiyata döner)
export async function getEstimatedPrice(skin: any) {
  try {
    // CS2Cap API'sinden gerçek zamanlı fiyatı çek
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/price?market_hash_name=${encodeURIComponent(skin.name)}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.price) {
        return Number(data.price.toFixed(2));
      }
    }
  } catch (error) {
    console.error("Failed to fetch price from CS2Cap:", error);
  }

  // Fallback: Tahmini fiyat hesaplama
  const rarity = skin.rarity?.name || "Mil-Spec Grade";
  const basePrice = RARITY_BASE_PRICES[rarity] || 1.00;
  const multiplier = getSkinMultiplier(skin.name);
  return Number((basePrice * multiplier).toFixed(2));
}

// Kasa Fiyatı
export const CASE_PRICE = 2.50;