export type Background = {
  id: string;
  name: string;
  url: string;
  price: number;
};

export const BACKGROUNDS: Background[] = [
  { id: 'bg1', name: 'Neon Şehir', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1000&auto=format&fit=crop', price: 500 },
  { id: 'bg2', name: 'Uzay Boşluğu', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1000&auto=format&fit=crop', price: 500 },
  { id: 'bg3', name: 'Siberpunk', url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1000&auto=format&fit=crop', price: 800 },
  { id: 'bg4', name: 'Karanlık Orman', url: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1000&auto=format&fit=crop', price: 300 },
  { id: 'bg5', name: 'Altın Çağ', url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=1000&auto=format&fit=crop', price: 1000 },
];