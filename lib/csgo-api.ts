const BASE_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/";

export type Rarity = {
  id: string;
  name: string;
  color: string;
};

export type Skin = {
  id: string;
  name: string;
  weapon: { name: string };
  rarity: Rarity;
  image: string;
};

export type Crate = {
  id: string;
  name: string;
  image: string;
  contains: Skin[];
  contains_rare: Skin[];
};

let cachedSkins: Skin[] | null = null;
let cachedCrates: Crate[] | null = null;

export async function fetchSkins(): Promise<Skin[]> {
  if (cachedSkins) return cachedSkins;
  const res = await fetch(`${BASE_URL}skins.json`);
  const data = await res.json();
  cachedSkins = data;
  return data;
}

export async function fetchCrates(): Promise<Crate[]> {
  if (cachedCrates) return cachedCrates;
  const res = await fetch(`${BASE_URL}crates.json`);
  const data = await res.json();
  // Sadece "Case" tipindekileri filtreleyelim (diğerleri kapsül, grafiti kutusu vb.)
  const cases = data.filter((c: any) => c.type === "Case");
  cachedCrates = cases;
  return cases;
}