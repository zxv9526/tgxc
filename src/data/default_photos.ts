import { TelegramPhoto } from '../types';

// Helper to generate timestamps within past 25 hours
const now = Date.now();
const h = (hoursAgo: number) => now - hoursAgo * 3600 * 1000;

export const defaultPhotos: TelegramPhoto[] = [
  {
    id: "fallback-1",
    title: "雪野孤树",
    description: "📷 Hasselblad X2D 100C | XCD 38mm F2.5\n\n北海道美瑛町的冬日午后，天地间只有纯白一片。在这无尽的旷野之中，一株挺拔的红松孤独地站立在微波般起伏的雪地里。阳光刚好从云缝中洒下微弱的侧影，将大自然的静谧与孤高刻画得淋漓尽致。",
    url: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(1),
  },
  {
    id: "fallback-2",
    title: "暮色威尼斯",
    description: "📷 Leica M11 | Summilux 35mm F1.4 ASPH\n\n日落时分的叹息桥畔。贡多拉静静地停泊在波光粼粼的运河水道中，紫红色的暮色如轻纱般落在古老的石桥与文艺复兴时期的建筑外墙上。",
    url: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(3),
  },
  {
    id: "fallback-3",
    title: "极简旋梯",
    description: "📷 Sony Alpha 7R V | FE 12-24mm F2.8 GM\n\n螺旋向下的阶梯构成了绝对完美的几何圆弧。明暗交替的柔和光影，沿着大理石台阶的边缘如流水般流淌。",
    url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(6),
  },
  {
    id: "fallback-4",
    title: "京都绿意幽径",
    description: "📷 Fujifilm GFX 100S | GF 45-100mm F4\n\n清晨，漫步在京都嵯峨野的竹林深处，或是苔藓丛生的小道旁。阳光穿透密布的枫叶和翠竹，洒下斑驳的金黄光点。",
    url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(12),
  },
  {
    id: "fallback-5",
    title: "沙漠脊线",
    description: "📷 Canon EOS R5 | RF 70-200mm F2.8 L IS USM\n\n撒哈拉大沙漠深处，起伏的沙丘在侧光照耀下形成了一道凌厉而完美的明暗分割线。",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(18),
  },
  {
    id: "fallback-6",
    title: "迷雾松林",
    description: "📷 Fujifilm GFX 100S | GF 32-64mm F4\n\n清晨，阿尔卑斯山麓的针叶林完全被浓重而冷冽的白雾所吞噬。",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(22),
  },
  {
    id: "fallback-7",
    title: "东京街头霓虹",
    description: "📷 Leica Q3 | Summilux 28mm F1.7 ASPH\n\n深夜的涩谷小巷。突如其来的一场急雨洗刷了街道，将满街五彩斑斓的霓虹灯牌倒影在光滑的沥青路面上。",
    url: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop",
    date: new Date().toISOString().split('T')[0],
    timestamp: h(24),
  }
];
