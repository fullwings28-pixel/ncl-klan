// lib/cs2cap.ts
export async function getPriceFromCS2Cap(marketHashName: string) {
  const apiKey = process.env.CS2C_API_KEY;
  if (!apiKey) {
    console.error("CS2C_API_KEY is not set");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.cs2c.app/v1/prices?market_hash_name=${encodeURIComponent(marketHashName)}&providers=steam&currency=USD`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        // 1 saatlik önbellek (rate limiti korumak için)
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error("CS2Cap API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      // Fiyat "minor units" (kuruş) olarak geliyor, 100'e bölüyoruz
      const priceInCents = data.items[0].lowest_ask;
      return priceInCents / 100;
    }
    return null;
  } catch (error) {
    console.error("CS2Cap fetch error:", error);
    return null;
  }
}