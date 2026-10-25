export type Skin = {
  id: string;
  name: string;
  weapon: string;
  rarity: 'Consumer' | 'Industrial' | 'Mil-Spec' | 'Restricted' | 'Classified' | 'Covert' | 'Rare Special';
  color: string;
  price: number;
  image: string;
};

const BASE_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/";

export const SKINS: Skin[] = [
  // RARE SPECIAL (BIÇAKLAR)
  { id: '1', name: '★ Karambit | Doppler', weapon: 'Knife', rarity: 'Rare Special', color: 'text-yellow-400 border-yellow-400', price: 15000, image: BASE_URL + "knife_karambit_doppler_phase_2.png" },
  { id: '2', name: '★ Butterfly Knife | Fade', weapon: 'Knife', rarity: 'Rare Special', color: 'text-yellow-400 border-yellow-400', price: 12000, image: BASE_URL + "knife_butterfly_fade.png" },

  // COVERT (KIRMIZI)
  { id: '3', name: 'AWP | Dragon Lore', weapon: 'AWP', rarity: 'Covert', color: 'text-red-500 border-red-500', price: 8000, image: BASE_URL + "awp_dragon_lore.png" },
  { id: '4', name: 'AK-47 | Fire Serpent', weapon: 'AK-47', rarity: 'Covert', color: 'text-red-500 border-red-500', price: 4000, image: BASE_URL + "ak47_fire_serpent.png" },

  // CLASSIFIED ( PEMBE )
  { id: '5', name: 'M4A1-S | Printstream', weapon: 'M4A1-S', rarity: 'Classified', color: 'text-pink-500 border-pink-500', price: 1500, image: BASE_URL + "m4a1_s_printstream.png" },
  { id: '6', name: 'USP-S | Kill Confirmed', weapon: 'USP-S', rarity: 'Classified', color: 'text-pink-500 border-pink-500', price: 1200, image: BASE_URL + "usp_s_kill_confirmed.png" },

  // RESTRICTED (MOR)
  { id: '7', name: 'AK-47 | Neon Rider', weapon: 'AK-47', rarity: 'Restricted', color: 'text-purple-500 border-purple-500', price: 400, image: BASE_URL + "ak47_neon_rider.png" },
  { id: '8', name: 'AWP | Asiimov', weapon: 'AWP', rarity: 'Restricted', color: 'text-purple-500 border-purple-500', price: 350, image: BASE_URL + "awp_asiimov.png" },

  // MIL-SPEC (MAVİ)
  { id: '9', name: 'Glock-18 | Water Elemental', weapon: 'Glock-18', rarity: 'Mil-Spec', color: 'text-blue-400 border-blue-400', price: 150, image: BASE_URL + "glock_18_water_elemental.png" },
  { id: '10', name: 'Desert Eagle | Conspiracy', weapon: 'Desert Eagle', rarity: 'Mil-Spec', color: 'text-blue-400 border-blue-400', price: 100, image: BASE_URL + "desert_eagle_conspiracy.png" },
  
  // INDUSTRIAL (AÇIK MAVİ)
  { id: '11', name: 'P250 | Sand Dune', weapon: 'P250', rarity: 'Industrial', color: 'text-cyan-500 border-cyan-500', price: 50, image: BASE_URL + "p250_sand_dune.png" },
  { id: '12', name: 'MP9 | Sand Dashed', weapon: 'MP9', rarity: 'Industrial', color: 'text-cyan-500 border-cyan-500', price: 30, image: BASE_URL + "mp9_sand_dashed.png" },
  
  // CONSUMER (GRİ)
  { id: '13', name: 'Nova | Predator', weapon: 'Nova', rarity: 'Consumer', color: 'text-gray-400 border-gray-400', price: 10, image: BASE_URL + "nova_predator.png" },
  { id: '14', name: 'Sawed-Off | Forest DDPAT', weapon: 'Sawed-Off', rarity: 'Consumer', color: 'text-gray-400 border-gray-400', price: 5, image: BASE_URL + "sawed_off_forest_ddpat.png" },
];