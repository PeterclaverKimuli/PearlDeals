import type { CategoryItem, RawDeal } from "./types";

export function makeSvgDataUri(label: string, bg: string, fg = "#111827") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="${bg}" />
      <circle cx="400" cy="230" r="110" fill="rgba(255,255,255,0.35)" />
      <rect x="240" y="330" rx="22" ry="22" width="320" height="90" fill="rgba(255,255,255,0.55)" />
      <text x="400" y="215" text-anchor="middle" font-size="34" font-family="Arial, Helvetica, sans-serif" fill="${fg}" font-weight="700">
        ${label}
      </text>
      <text x="400" y="382" text-anchor="middle" font-size="20" font-family="Arial, Helvetica, sans-serif" fill="${fg}" opacity="0.75">
        Sample product image
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const imageFallback = makeSvgDataUri(
  "Image unavailable",
  "#e5e7eb",
  "#6b7280",
);

export const categoryIcons: Record<string, string> = {
  Phones: "ðŸ“±",
  Computers: "ðŸ’»",
  Monitors: "ðŸ–¥ï¸",
  Accessories: "ðŸ”Œ",
  TVs: "ðŸ“º",
  Appliances: "ðŸ§Š",
  Kitchen: "ðŸ³",
};

export const behavioralCategories: CategoryItem[] = [
  {
    name: "Popular Deals",
    description: "What people are buying right now",
    icon: "\u{1F525}",
    kind: "behavioral",
    productIds: [11, 1, 2, 9, 13, 15, 17, 20, 24, 30],
  },
  {
    name: "Budget Deals",
    description: "Under UGX 500,000",
    icon: "\u{1F4B0}",
    kind: "behavioral",
    productIds: [11, 10, 2, 15, 9, 17, 18, 19, 20, 30],
  },
  {
    name: "Limited Time Deals",
    description: "Offers that won't last long",
    icon: "\u23F3",
    kind: "behavioral",
    productIds: [13, 14, 15, 4, 9, 24, 25, 26, 30, 33],
  },
  {
    name: "Everyday Essentials",
    description: "Things you use every day",
    icon: "\u{1F6CD}\uFE0F",
    kind: "behavioral",
    productIds: [1, 2, 3, 8, 10, 11, 9, 13, 15, 16, 17, 18, 19, 30, 28],
  },
];

export const rawDeals: RawDeal[] = [
  {
    id: 1,
    title: 'Samsung Galaxy A15 - 6.5" 8GB RAM 256GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/33/0447502/1.jpg?7986",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 950000,
        original: 1200000,
        url: "https://www.jumia.ug/samsung-galaxy-a15-6.5-8gb-ram-256gb-rom-50mp-5000mah-blue-black-205744033.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 620000,
        original: 620000,
        url: "https://jiji.ug/central-division/mobile-phones/new-samsung-galaxy-a15-128-gb-blue-s4GAHGWXDw4HfbGfYKqITQaH.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 670000,
        original: 850000,
        url: "https://kanta.ug/product/samsung-galaxy-a15-5g-phone/",
        status: "New",
      },
      {
        site: "Sefbuy",
        price: 720000,
        original: 900000,
        url: "https://sefbuy.com/product/samsung-galaxy-a15-6-5-8gb-ram-256gb-rom-50mp-5000mah-yellow/",
        status: "New",
      },
    ],
  },
  {
    id: 2,
    title: 'Infinix Hot 60i - 6.7" 8GB RAM 128GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/56/4937952/1.jpg?9917",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 486000,
        original: 600000,
        url: "https://www.jumia.ug/infinix-hot-60i-6.7-8gb-ram-128gb-rom-50mp-5160mah-259739465.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 427000,
        original: 450000,
        url: "https://jiji.ug/central-division/mobile-phones/new-infinix-hot-60i-128-gb-black-dYhaQhIo1ffYVW3zsEVPv3nS.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 427000,
        original: 450000,
        url: "https://kanta.ug/product/infinix-hot-60i-8gb-128gb/",
        status: "New",
      },
      {
        site: "Duuka",
        price: 497000,
        original: 500000,
        url: "https://www.duuka.ug/products/infinix-hot-60i-128gb-rom-4gb-ram-67-hd-120hz-display-helio-g81-50mp-camera-5160mah-battery-android-15",
        status: "New",
      },
    ],
  },
  {
    id: 3,
    title: 'Samsung Galaxy A25 5G 6.5" 6GB RAM 128GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/02/8261342/1.jpg?3243",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 859000,
        original: 900000,
        url: "https://www.jumia.ug/samsung-galaxy-a25-5g-6.5-6gb-ram-128gb-rom-50mp-5000mah-blueblack-243162820.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 950000,
        original: 950000,
        url: "https://jiji.ug/central-division/mobile-phones/new-samsung-galaxy-a25-256-gb-black-g4wSmq3bDJXUI37UfhNh9KSF.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 840000,
        original: 840000,
        url: "https://www.tilyexpress.ug/product/samsung-galaxy-a25-5g-6-5-8gb-ram-128gb-rom-50mp-5000mah-black-2/",
        status: "New",
      },
      {
        site: "Kanta",
        price: 990000,
        original: 1100000,
        url: "https://kanta.ug/product/samsung-galaxy-a25-5g/",
        status: "Refurbished",
      },
    ],
  },
  {
    id: 4,
    title: 'Apple iPhone 15 Pro Max 6.7" 8GB RAM 256GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/93/3127332/1.jpg?9442",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 3080000,
        original: 5000000,
        url: "https://www.jumia.ug/apple-iphone-15-pro-max-6.7-single-sim-8gb-ram-256gb-rom-48mp-4441mah-natural-titanium-233721339.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 4650000,
        original: 5400000,
        url: "https://kanta.ug/product/apple-iphone-15-pro-max-256gb-blue-natural-titanium/",
        status: "New",
      },
      {
        site: "Mtunda",
        price: 4481000,
        original: 5100000,
        url: "https://mtunda.ug/products/apple-iphone-15-pro-max",
        status: "New",
      },
    ],
  },
  {
    id: 5,
    title: 'Apple iPhone 12 Pro 6.1" 6GB RAM 128GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/93/3127332/1.jpg?9442",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 1550000,
        original: 2000000,
        url: "https://www.jumia.ug/apple-iphone-12-pro-6.1-6gb-ram-128gb-rom-12mp-2815mah-graphite-153949821.html",
        status: "Used",
      },
      {
        site: "Dombelo",
        price: 6590000,
        original: 7000000,
        url: "https://www.dombelo.com/product/iphone-12-pro-128gb/",
        status: "Used",
      },
      {
        site: "Jiji",
        price: 1120000,
        original: 1120000,
        url: "https://jiji.ug/central-division/mobile-phones/apple-iphone-12-pro-128-gb-blue-3OYzH03uvY7egWBsHcXu3kxQ.html",
        status: "Used",
      },
    ],
  },
  {
    id: 6,
    title: 'Samsung Galaxy S23 Ultra 6.8" 12GB RAM 256GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/79/0330952/1.jpg?8935",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 2220000,
        original: 3000000,
        url: "https://www.jumia.ug/samsung-galaxy-s23-ultra-6.8-12gb-ram-256gb-rom-200mp-black-259033097.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3350000,
        original: 3950000,
        url: "https://kanta.ug/product/samsung-galaxy-s23-ultra-5g-256gb-black-green/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 1950000,
        original: 1950000,
        url: "https://jiji.ug/central-division/mobile-phones/samsung-galaxy-s23-ultra-256-gb-black-1pNHPDm3fCmlq7HCGHqfyI2K.html",
        status: "Used",
      },
      {
        site: "Sefbuy",
        price: 2890000,
        original: 3500000,
        url: "https://sefbuy.com/product/samsung-galaxy-s23-ultra-6-8-12gb-ram-256gb-rom-200mp-black/",
        status: "New",
      },
    ],
  },
  {
    id: 7,
    title: 'Samsung Galaxy Z Fold 7 - 8.0" 12GB RAM 512GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/90/3407952/1.jpg?3398",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 6000000,
        original: 6400000,
        url: "https://www.jumia.ug/galaxy-z-fold-7-8.0-12gb-ram-512gb-rom-200mp-4400mah-silver-samsung-mpg7009639.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 5200000,
        original: 5200000,
        url: "https://jiji.ug/central-division/mobile-phones/new-samsung-galaxy-z-fold7-256-gb-black-86BQIFfn175w0VissQe8TTSk.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 4690000,
        original: 5500000,
        url: "https://kanta.ug/product/samsung-galaxy-z-fold-smartphone-6-256gb/",
        status: "New",
      },
      {
        site: "Mtunda",
        price: 5913000,
        original: 5913000,
        url: "https://mtunda.ug/products/samsung-galaxy-z-fold-7",
        status: "New",
      },
    ],
  },
  {
    id: 8,
    title: 'Tecno Camon 40 Pro - 6.78" 16GB RAM 256GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/55/9570742/1.jpg?5519",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 980000,
        original: 1050000,
        url: "https://www.jumia.ug/tecno-camon-40-pro-6.78-1688gb-ram-256gb-rom-50mp-5200mah-ai-powered-blackgreen-247075955.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 855000,
        original: 855000,
        url: "https://jiji.ug/central-division/mobile-phones/new-tecno-camon-40-256-gb-gray-yXd8JUwFo6dYgcLdKfuEbVoV.html",
        status: "New",
      },
      {
        site: "Duuka",
        price: 889000,
        original: 985000,
        url: "https://www.duuka.ug/products/tecno-camon-40-8gb-ram-256gb-storage-50mp-camera-678-amoled-display-5200mah-battery",
        status: "New",
      },
    ],
  },
  {
    id: 9,
    title: 'Samsung Galaxy Tab A9 - 8.7" 4GB RAM 64GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/65/2877011/1.jpg?6006",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 570000,
        original: 900000,
        url: "https://www.jumia.ug/samsung-galaxy-tab-a9-8.7-4gb-ram-64gb-rom-8mp-5100mah-graphite-110778256.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 500000,
        original: 500000,
        url: "https://jiji.ug/central-division/tablets/new-samsung-galaxy-tab-a9-64-gb-black-BYbXisGA9VTPJdC806yYn8lD.html",
        status: "New",
      },
      {
        site: "Mtunda",
        price: 664000,
        original: 1250000,
        url: "https://mtunda.ug/products/samsung-galaxy-a9-plus-5g",
        status: "New",
      },
      {
        site: "Duuka",
        price: 664000,
        original: 1250000,
        url: "https://www.duuka.ug/products/samsung-galaxy-tab-a9-87-wi-fi-tablet-64gb-compact-powerful",
        status: "New",
      },
    ],
  },
  {
    id: 10,
    title: 'Infinix Note 50 4G 6.78" 8GB RAM 256GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/24/3863952/1.jpg?9408",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 849990,
        original: 900000,
        url: "https://www.jumia.ug/infinix-note-50-4g-6.78-8gb-ram-256gb-rom-50mp-5200mah-259368342.html",
        status: "New",
      },
      {
        site: "Jiji",
        price: 410000,
        original: 410000,
        url: "https://jiji.ug/central-division/mobile-phones/new-infinix-note-50-pro-256-gb-silver-19oVUMoXjFHZtrmcQZB39xTW.html",
        status: "New",
      },
      {
        site: "Duuka",
        price: 1620000,
        original: 2000000,
        url: "https://www.duuka.ug/products/infinix-note-50-pro-256gb-rom-12gb-ram-144hz-5g",
        status: "New",
      },
    ],
  },
  {
    id: 11,
    title: "Tecno Spark 40 256GB Storage 8GB RAM",
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/50/9028952/1.jpg?9621",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 628000,
        original: 900000,
        url: "https://www.jumia.ug/tecno-spark-40-256gb-storage-8gb-ram-6.67-hole-screen-display-5200mah-black-1yr-wrnty-259820905.html",
        status: "New",
      },
      {
        site: "Duuka",
        price: 499000,
        original: 520000,
        url: "https://www.duuka.ug/products/tecno-spark-40-8gb-ram-256gb-storage",
        status: "New",
      },
      {
        site: "Jiji",
        price: 335000,
        original: 380000,
        url: "https://jiji.ug/central-division/mobile-phones/new-tecno-spark-40-256-gb-black-8RdKwZp8JcvrD5TeqrhcGqTf.html",
        status: "New",
      },
    ],
  },
  {
    id: 12,
    title: 'Samsung Galaxy S20 Ultra 5G 6.9" 12GB RAM 128GB ROM',
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/49/3777952/4.jpg?1378",
    category: "Phones",
    prices: [
      {
        site: "Jumia",
        price: 970000,
        original: 1250000,
        url: "https://www.jumia.ug/galaxy-s20-ultra-5g-6.9-12gb-ram-128gb-rom-108mp-white-samsung-mpg7044142.html",
        status: "Used",
      },
      {
        site: "Jiji",
        price: 950000,
        original: 950000,
        url: "https://jiji.ug/central-division/mobile-phones/samsung-galaxy-s20-ultra-128-gb-black-dEPaejwkd87gxqc5uDoCiWSS.html",
        status: "Used",
      },
      {
        site: "Dombelo",
        price: 3950000,
        original: 4500000,
        url: "https://www.dombelo.com/product/samsung-galaxy-s20-ultra/",
        status: "Used",
      },
    ],
  },
  {
    id: 13,
    title: "HP Elitebook 820 G3 Intel Core i5 8GB RAM 500GB HDD",
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/86/639354/1.jpg?1542",
    category: "Computers",
    prices: [
      {
        site: "Jumia",
        price: 579900,
        original: 1320017,
        url: "https://www.jumia.ug/renewed-elitebook-82012.5-inchcore-i58gb-ram500-gbrefurbished-free-mouse-bag-black-grade-a-45393668.html",
        status: "Refurbished",
      },
      {
        site: "Kwesi",
        price: 1880000,
        original: 2200000,
        url: "https://kwesistores.com/product/hp-refurbrished-hp-elitebook-820-g3-12-5-inch-core-i5-6th-gen-8gb-ddr4-ram-500gb-hdd-windows-10-pro-silver/",
        status: "Refurbished",
      },
      {
        site: "Jiji",
        price: 630000,
        original: 630000,
        url: "https://jiji.ug/central-division/computers-and-laptops/laptop-hp-elitebook-820-g2-8gb-intel-core-i5-ssd-500gb-2tYiELz4MyYCaJOps2Loq9yq.html",
        status: "Refurbished",
      },
    ],
  },
  {
    id: 14,
    title: 'HP ENVY x360 15 2-in-1 14" FHD TouchScreen Laptop',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/54/5202442/1.jpg?8307",
    category: "Computers",
    prices: [
      {
        site: "Jumia",
        price: 3300000,
        original: 5500000,
        url: "https://www.jumia.ug/envy-x360-15-2-in-1-14-fhd-touchscreen-laptop-13th-generation-core-i5-8gb-ram-512gb-ssd-silver-hp-mpg5549570.html",
        status: "Refurbished",
      },
      {
        site: "Jiji",
        price: 1700000,
        original: 1700000,
        url: "https://jiji.ug/central-division/computers-and-laptops/laptop-hp-envy-15-8gb-intel-core-i5-ssd-256gb-bam02dYnZL1WUvp7EBG2Qh4W.html",
        status: "Refurbished",
      },
    ],
  },
  {
    id: 15,
    title: 'HP ProBook X360 11.6" Touch Intel 4GB RAM 128GB SSD',
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/40/4302442/1.jpg?4427",
    category: "Computers",
    prices: [
      {
        site: "Jumia",
        price: 499000,
        original: 900000,
        url: "https://www.jumia.ug/refurbished-probook-x360-11-g1-ee-touchscreen-convertible-laptop-11.6-intel-4gb-ram-128gb-ssd-windows-10-mpg5736335.html",
        status: "Refurbished",
      },
      {
        site: "Kwesi",
        price: 659000,
        original: 850000,
        url: "https://kwesistores.com/product/hp-refurbished-probook-11-g5-x360-intel-celeron-4gb-ram-128gb-ssd-touch-screen/",
        status: "Used",
      },
      {
        site: "Jiji",
        price: 500000,
        original: 500000,
        url: "https://jiji.ug/central-division/computers-and-laptops/laptop-hp-probook-11-x360-g1-ee-4gb-intel-pentium-ssd-128gb-Bh5vjgbYYyXf1qfBx9lq4aDe.html",
        status: "Used",
      },
    ],
  },
  {
    id: 16,
    title: "Dell Latitude 5400 Core i5 8GB RAM 256GB SSD",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/97/902822/1.jpg?3576",
    category: "Computers",
    prices: [
      {
        site: "Jumia",
        price: 1200000,
        original: 2000000,
        url: "http://jumia.ug/refurbished-latitude-5400-14-inch-touch-screen-core-i5-8th-gen-8gb-ram-256gb-ssd-windows-11-black-dell-mpg931249.html",
        status: "Refurbished",
      },
      {
        site: "Jiji",
        price: 1700000,
        original: 1700000,
        url: "https://jiji.ug/central-division/computers-and-laptops/new-laptop-dell-latitude-5400-8gb-intel-core-i5-ssd-256gb-mfmw4Qa6BNOs1blcdvoO5QON.html",
        status: "Used",
      },
    ],
  },
  {
    id: 17,
    title: "Hisense 24 Inch Monitor | 24N3G-PRO | Full HD | 100Hz",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2024/10/b5dab3654e6e11ef841d00155db5ff28_2466f5ca532a11ef841d00155db5ff28-640x640-1.webp",
    category: "Monitors",
    prices: [
      {
        site: "Duuka",
        price: 375000,
        original: 475000,
        url: "https://www.duuka.ug/index.php/products/hisense-24n3g-pro-238-inch-ips-monitor-full-hd-1080p-100hz",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 800000,
        original: 800000,
        url: "https://www.dombelo.com/product/hisense-24-1080p-monitor-24n3g/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 420000,
        original: 750000,
        url: "https://www.tilyexpress.ug/product/hisense-24-inch-monitor-24n3g-pro/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 400000,
        original: 400000,
        url: "https://jiji.ug/central-division/computer-monitors/hisense-24-pro-monitor-q7DYmXa7LiBmVh4i1dHi7deN.html",
        status: "New",
      },
    ],
  },
  {
    id: 18,
    title: "Logitech MK220 Wireless Keyboard & Mouse Combo",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/77/903/1.jpg?2623",
    category: "Accessories",
    prices: [
      {
        site: "Jumia",
        price: 140000,
        original: 140000,
        url: "https://www.jumia.ug/logitech-mk220-logitech-wireless-combo-with-keyboard-and-mouse-black-30977.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 155000,
        original: 180000,
        url: "https://www.tilyexpress.ug/product/logitech-mk220-wireless-keyboard-mouse-combo-black/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 150000,
        original: 150000,
        url: "https://jiji.ug/central-division/computer-accessories/logitech-mk220-wireless-keyboard-mouse-combo-black-3sQnOt6cMc1mjvgY3CqqA1BX.html",
        status: "New",
      },
    ],
  },
  {
    id: 19,
    title: "Anker USB C Hub (7-in-1)",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/10/7564952/1.jpg?9911",
    category: "Accessories",
    prices: [
      {
        site: "Jumia",
        price: 178100,
        original: 200000,
        url: "https://www.jumia.ug/anker-usb-c-hub-7-in-1-multi-port-usb-adapter-for-laptops-259465701.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 250000,
        original: 350000,
        url: "https://www.tilyexpress.ug/product/anker-usb-c-hub-7-in-1-with-4k-hdmi/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 200000,
        original: 200000,
        url: "https://jiji.ug/central-division/computer-accessories/anker-portable-multi-function-usb-hub-7in1-hKFgVIGpGJYluhf5K1NsTaLC.html",
        status: "New",
      },
    ],
  },
  {
    id: 20,
    title: "JBL Tune 520BT Wireless",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/29/6408532/1.jpg?0100",
    category: "Accessories",
    prices: [
      {
        site: "Jumia",
        price: 178500,
        original: 300000,
        url: "https://www.jumia.ug/jbl-tune-520bt-wireless-on-ear-headphones-pure-bass-sound-black-235804692.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 220000,
        original: 350000,
        url: "https://kanta.ug/product/jbl-tune-520bt-wireless-on-ear-headphones/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 160000,
        original: 160000,
        url: "https://jiji.ug/central-division/headphones/new-jbl-tune-520bt-black-qB83Ate1Y5R6j3896zI2vXqD.html",
        status: "New",
      },
    ],
  },
  {
    id: 21,
    title: "Samsung 65 Inch CU8000 4K UHD Smart LED TV",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/51/0377952/1.jpg?7943",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 3150000,
        original: 4500000,
        url: "https://www.jumia.ug/samsung-65-inch-cu8000-4k-uhd-smart-led-tv-black-23377459.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3590000,
        original: 4980000,
        url: "https://kanta.ug/product/samsung-65-inch-crystal-4k-uhd-smart-led-tv-ua65cu8000/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 4250000,
        original: 7300000,
        url: "https://kwesistores.com/product/samsung-65-inch-cu8000-4k-uhd-smart-led-tv-black-2-yrs-wrnty/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 2830000,
        original: 2830000,
        url: "https://jiji.ug/central-division/tv-monitors/samsung-65-crystal-uhd-smart-led-tv-65cu8000-q0N8n9N8n9.html",
        status: "New",
      },
    ],
  },
  {
    id: 22,
    title: "LG 43 Inch Smart TV LM6370 Series",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/71/1408952/1.jpg?8361",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 1525000,
        original: 1750000,
        url: "https://www.jumia.ug/lg-43-inch-smart-tv-lm6370-series-black-212140871.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 1690000,
        original: 1990000,
        url: "https://kanta.ug/product/lg-43-inch-smart-tv-lm6370-series/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 1950000,
        original: 2250000,
        url: "https://kwesistores.com/product/lg-43-inch-smart-tv-lm6370-series-black/",
        status: "New",
      },
    ],
  },
  {
    id: 23,
    title: "TCL 55 inch Premium SQD-MINILED Google TV",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/70/1608952/1.jpg?0742",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 2450000,
        original: 3500000,
        url: "https://www.jumia.ug/tcl-55-inch-premium-sqd-miniled-google-tv-259806107.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 2990000,
        original: 3500000,
        url: "https://kanta.ug/product/tcl-55-inch-premium-sqd-miniled-google-tv/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 3350000,
        original: 4150000,
        url: "https://kwesistores.com/product/tcl-55-inch-premium-sqd-miniled-google-tv-black/",
        status: "New",
      },
    ],
  },
  {
    id: 24,
    title: "Skyworth 55Inch UHD 4K Smart Google LED TV",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2023/05/71GQRH99EkL._AC_SL1500_.webp",
    category: "TVs",
    prices: [
      {
        site: "Kanta",
        price: 1360000,
        original: 1890000,
        url: "https://kanta.ug/product/skyworth-55-inch-uhd-4k-smart-google-led-tv/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 1380000,
        original: 2511000,
        url: "https://www.tilyexpress.ug/product/skyworth-55inch-uhd-4k-smart-google-led-tv/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 1380000,
        original: 1800000,
        url: "https://www.dombelo.com/product/skyworth-55inch-uhd-4k-smart-google-led-tv/",
        status: "New",
      },
      {
        site: "Jumia",
        price: 1550000,
        original: 2100000,
        url: "https://www.jumia.ug/skyworth-55-inch-uhd-4k-smart-google-led-tv-black-212240812.html",
        status: "New",
      },
    ],
  },
  {
    id: 25,
    title: "TCL 65Inch Premium SQD Mini LED Google TV",
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/70/4847952/1.jpg?9425Kanta",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 4180000,
        original: 5500000,
        url: "https://www.jumia.ug/tcl-65-inch-premium-sqd-miniled-google-tv-black-212240812.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3790000,
        original: 4950000,
        url: "https://kanta.ug/product/tcl-65-inch-premium-sqd-miniled-google-tv/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 3130000,
        original: 5000000,
        url: "https://www.dombelo.com/product/tcl-65inch-premium-sqd-miniled-google-tv/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 3950000,
        original: 5350000,
        url: "https://kwesistores.com/product/tcl-65-inch-premium-sqd-miniled-google-tv-black/",
        status: "New",
      },
    ],
  },
  {
    id: 26,
    title: "Hisense 730L Frost Free Refrigerator",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/29/6666952/1.jpg?1285",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 5180000,
        original: 7000000,
        url: "https://www.jumia.ug/hisense-730l-frost-free-refrigerator-silver-212240812.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 4350000,
        original: 4950000,
        url: "https://kanta.ug/product/hisense-730l-frost-free-refrigerator/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 3670000,
        original: 5000000,
        url: "https://www.dombelo.com/product/hisense-730l-frost-free-refrigerator/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 4288000,
        original: 5300000,
        url: "https://kwesistores.com/product/hisense-730l-frost-free-refrigerator-silver/",
        status: "New",
      },
    ],
  },
  {
    id: 27,
    title: "ADH 235Liters Glass Door Display Fridge",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/38/5666952/1.jpg?1165",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 1285000,
        original: 1500000,
        url: "https://www.jumia.ug/adh-235liters-glass-door-display-fridge-white-212240812.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 1230000,
        original: 1450000,
        url: "https://kanta.ug/product/adh-235liters-glass-door-display-fridge/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 1050000,
        original: 1250000,
        url: "https://www.dombelo.com/product/adh-235liters-glass-door-display-fridge/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 1150000,
        original: 1350000,
        url: "https://kwesistores.com/product/adh-235liters-glass-door-display-fridge-white/",
        status: "New",
      },
    ],
  },
  {
    id: 28,
    title: "Hisense 180 Litres Chest Freezer",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/11/531977/1.jpg?7342",
    category: "Appliances",
    prices: [
      {
        site: "Kanta",
        price: 799000,
        original: 950000,
        url: "https://kanta.ug/product/hisense-180liter-chest-freezer-fc18dd4sa/?srsltid=AfmBOoqc7rTgUhtKZ8fY9jE4rtc0B1ywSL8JTICt_Jt7J49_8WACVbrk",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 750000,
        original: 950000,
        url: "https://www.tilyexpress.ug/product/hisense-180-litres-chest-freezer/",
        status: "New",
      },
    ],
  },
  {
    id: 29,
    title: "Hisense 750 Litre Refrigerator with Dispenser",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/95/5666952/1.jpg?1209",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 3199900,
        original: 3500000,
        url: "https://www.jumia.ug/hisense-750-litre-side-by-side-refrigerator-212240812.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3250000,
        original: 4250000,
        url: "https://kanta.ug/product/hisense-750-litre-side-by-side-refrigerator/",
        status: "New",
      },
      {
        site: "Duuka",
        price: 2850000,
        original: 3200000,
        url: "https://www.duuka.ug/products/hisense-750-litre-side-by-side-refrigerator",
        status: "New",
      },
    ],
  },
  {
    id: 30,
    title: "Hoffmans 6L Air Fryer",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/57/6475952/1.jpg?3269",
    category: "Kitchen",
    prices: [
      {
        site: "Jumia",
        price: 225000,
        original: 250000,
        url: "https://www.jumia.ug/generic-hoffmans-hoffman-6l-airfryer-259574675.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 199000,
        original: 250000,
        url: "https://kanta.ug/product/hoffmans-6ltr-touch-screen-digital-air-fryer-hm-6018/",
        status: "New",
      },
    ],
  },
  {
    id: 31,
    title:
      "Blueflame Rustic Cooker 4 Gas & 2 Electric 90cm X 60cm FP942ERF â€“ Black",
    image:
      "https://i0.wp.com/www.dombelo.com/wp-content/uploads/2022/07/Blueflame-rustic-cooker-FP942ERF-%E2%80%93-B-90cm-X-60-cm-black-in-color.webp?fit=1707%2C2560&ssl=1",
    category: "Kitchen",
    prices: [
      {
        site: "Dombelo",
        price: 2630000,
        original: 4000000,
        url: "https://www.dombelo.com/product/blueflame-rustic-cooker-4-gas-2-electric-90cm-x-60cm-fp942erf-black/?srsltid=AfmBOoqKJVJtG8fpFaidPWk9LorqYB7X1e3qS6FLO8oJuTcIdrPtGSXy",
        status: "New",
      },
      {
        site: "Kibuga",
        price: 2573900,
        original: 2573900,
        url: "https://kibuga.com/product/blueflame-cooker-f9p42erfb-9060-42-electric-oven-black-colour-easy-enamel-body-pool-system-chicken-roteserrie-2-turbo-fans-glass-top-cover-timer-auto-gas-ignition/9957",
        status: "New",
      },
    ],
  },
  {
    id: 32,
    title: "Commercial Electric Stone Deck Pizza Oven",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2023/10/1-Deck-1-Tray-Electric-Deck-Oven-1024x1024.png.webp",
    category: "Kitchen",
    prices: [
      {
        site: "Kwesi",
        price: 1550000,
        original: 1750000,
        url: "https://kwesistores.com/product/commercial-electric-stone-deck-pizza-oven/",
        status: "New",
      },
      {
        site: "Sefbuy",
        price: 1450000,
        original: 1650000,
        url: "https://sefbuy.com/product/commercial-electric-stone-deck-pizza-oven/",
        status: "New",
      },
    ],
  },
  {
    id: 33,
    title: "Hisense 36000 BTU Wall Split Air Conditioner",
    image:
      "https://i0.wp.com/www.dombelo.com/wp-content/uploads/2022/03/Hisense-36000-BTU-Wall-Split-Air-Conditioner.png?fit=455%2C455&ssl=1",
    category: "Appliances",
    prices: [
      {
        site: "Dombelo",
        price: 3780000,
        original: 5000000,
        url: "https://www.dombelo.com/product/hisense-36000-btu-wall-split-air-conditioner-a-c-as-36hr4sda/",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3980000,
        original: 4950000,
        url: "https://kanta.ug/product/hisense-36000-btu-wall-split-air-conditioner-a-c-as-36hr4sda/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 3950000,
        original: 7250000,
        url: "https://kwesistores.com/product/hisense-36000-btu-wall-split-air-conditioner-a-c-as-36hr4sda-black/",
        status: "New",
      },
    ],
  },
  {
    id: 34,
    title: "Transcend 2TB USB External Hard Drive",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/66/0414952/1.jpg?3969",
    category: "Accessories",
    prices: [
      {
        site: "Jumia",
        price: 440000,
        original: 450000,
        url: "https://www.jumia.ug/transcend-2tb-usb-3.portable-hard-drive-rugged-anti-shock-resistant-compact-and-lightweight-with-lightning-fast-speeds-one-touch-backup-button-multi-259414066.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 590000,
        original: 700000,
        url: "https://www.tilyexpress.ug/product/transcend-1tb-usb-3-1-military-drop-tested-external-hard-drive-with-3-layer-protection-blackgreen-copy/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 499000,
        original: 650000,
        url: "https://kwesistores.com/product/2tb-transcend-storejet-25m3-external-hard-drive-green/",
        status: "New",
      },
    ],
  },
  {
    id: 35,
    title: "Logitech M171 Wireless Optical Mouse",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/73/9096402/1.jpg?5608",
    category: "Accessories",
    prices: [
      {
        site: "Jumia",
        price: 55000,
        original: 80000,
        url: "https://www.jumia.ug/logitech-m171-wireless-optical-mouse-black-204690937.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 98000,
        original: 120000,
        url: "https://www.tilyexpress.ug/product/logitech-m171-wireless-optical-mouse-black/",
        status: "New",
      },
      {
        site: "SellConnect",
        price: 150000,
        original: 200000,
        url: "https://sellconnectug.com/shop/logitech-m171-wireless-mouse/",
        status: "New",
      },
    ],
  },
  {
    id: 36,
    title: "Hisense 50 Inch 4K Smart TV",
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/17/362834/1.jpg?8265",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 958000,
        original: 1850000,
        url: "https://www.jumia.ug/50-inch-led-4k-utra-hd-smart-tv-youtube-netflix-app-store-50a6hs-black-hisense-mpg115081.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 1130000,
        original: 1550000,
        url: "https://www.tilyexpress.ug/product/hisense-50%E2%80%B3-uhd-4k-tv-series-a7g-vidaa-smart-tv-50a7g-black/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 1199000,
        original: 1600000,
        url: "https://kwesistores.com/product/hisense-50-inch-led-4k-utra-hd-vidaa-smart-tv-50a6qs/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 1650000,
        original: 1650000,
        url: "https://jiji.ug/central-division/tv-dvd-equipment/hisense-50inch-7series-vida-smart-uhd-4k-frameless-tv-fCOcEQ2sR7vqWcGBeuCKwo9e.html",
        status: "New",
      },
    ],
  },
  {
    id: 37,
    title: "CHIQ 85 Inch QLED Android 4K UHD Smart TV",
    image:
      "https://kanta.ug/wp-content/uploads/2025/11/CHIQ-85-Qled-Andriod-4K-UHD-Smart-TV.png",
    category: "TVs",
    prices: [
      {
        site: "Kwesi",
        price: 4998000,
        original: 6500000,
        url: "https://kwesistores.com/product/chiq-85-inch-uhd-4k-google-tv-hdmi-2-1-hdr10-u85f8tg/",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3890000,
        original: 4500000,
        url: "https://kanta.ug/product/chiq-85-qled-andriod-4k-uhd-smart-tv-with-bluetooth-flameless/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 4750000,
        original: 5500000,
        url: "https://www.tilyexpress.ug/product/chiq-85-inch-qled-tv-qm9s/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 5285000,
        original: 7000000,
        url: "https://www.dombelo.com/product/chiq-85-inch-uhd-4k-google-tv-120hz-hdmi-2-1-hdr10-u85f8tg/",
        status: "New",
      },
    ],
  },
  {
    id: 38,
    title: "LG OLED 55-Inch C2 Series 4K Ultra HD Smart TV",
    image:
      "https://i0.wp.com/www.dombelo.com/wp-content/uploads/2024/08/LG-OLED-55-Inch-C2-Series-4K-Ultra-HD-Smart-TV.webp?fit=800%2C800&ssl=1",
    category: "TVs",
    prices: [
      {
        site: "Kwesi",
        price: 6900000,
        original: 8500000,
        url: "https://kwesistores.com/product/lg-oled-55-inch-c2-series-4k-ultra-hd-smart-tv-webos-built-in-wi-fi-hdr-bluetooth-chromecast-dolby-atmos-free-to-air-decoder/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 5630000,
        original: 5630000,
        url: "https://jiji.ug/central-division/tv-dvd-equipment/lg-oled-55-inch-c2-series-ultra-hd-smart-tvs-yR2dJi4W00nLbHqC2xOZrrkp.html",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 7395000,
        original: 9000000,
        url: "https://www.dombelo.com/product/lg-oled-55-inch-c2-series-4k-ultra-hd-smart-tv-cu55/",
        status: "New",
      },
    ],
  },
  {
    id: 39,
    title: "Hisense 75 Inch QLED Smart TV 4K VIDAA 75Q6Q",
    image:
      "https://ug.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/75/4434952/1.jpg?1159",
    category: "TVs",
    prices: [
      {
        site: "Jumia",
        price: 3379000,
        original: 4000000,
        url: "https://www.jumia.ug/hisense-75-inch-qled-uhd-4k-smart-tv-smart-tv-black-3yr-wrnty-259434457.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 3490000,
        original: 3980000,
        url: "https://kanta.ug/product/hisense-75-inches-qled-smart-tv-4k-vidaa-75q6q/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 3550000,
        original: 3900000,
        url: "https://www.tilyexpress.ug/product/hisense-75-inch-qled-tv-75q6q/",
        status: "New",
      },
    ],
  },
  {
    id: 40,
    title: "Roch 175 Liters Double Door Fridge",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/25/9035912/1.jpg?0666",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 650000,
        original: 1200000,
        url: "https://www.jumia.ug/roch-175-liters-double-door-top-freezer-defrost-fridge-inox2yrs-wrty-219530952.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 590000,
        original: 650000,
        url: "https://kanta.ug/product/roch-145-liters-defrost-double-door-bottom-freezer-fridge/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 760000,
        original: 760000,
        url: "https://jiji.ug/central-division/kitchen-appliances/roch-double-door-175-liters-fridge-zQ4xJCHEZf3aH7Rm2uOpAI72.html",
        status: "New",
      },
    ],
  },
  {
    id: 41,
    title: "Hisense 229 Liters Single Door Fridge with Dispenser",
    image:
      "https://i0.wp.com/www.dombelo.com/wp-content/uploads/2023/02/Hisense-229L-Single-Door-Fridge-with-Water-Dispenser.jpg?w=350&ssl=1",
    category: "Appliances",
    prices: [
      {
        site: "Tilyexpress",
        price: 870000,
        original: 1050000,
        url: "https://www.tilyexpress.ug/product/hisense-229-litres-single-door-rr229d4wgu-refrigerator-silver/",
        status: "New",
      },
      {
        site: "Kanta",
        price: 869000,
        original: 1100000,
        url: "https://kanta.ug/product/hisense-229-liter-fridge-single-door-with-water-dispenser-rr229d4wgu/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 840000,
        original: 840000,
        url: "https://www.dombelo.com/product/hisense-229l-single-door-fridge-with-water-dispenser/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 850000,
        original: 850000,
        url: "https://jiji.ug/central-division/kitchen-appliances/hisense-229litres-single-door-fridge-with-water-dispenser-7xwTsScT66vtyW5Ht8vFUlQz.html",
        status: "New",
      },
      {
        site: "Jumia",
        price: 824200,
        original: 1150000,
        url: "https://www.jumia.ug/hisense-229-litres-single-door-refrigerator-with-water-dispenser-red-hisense-mpg47332.html",
        status: "New",
      },
    ],
  },
  {
    id: 42,
    title: "LG 200 Liters Double Door Fridge",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/33/8850941/1.jpg?9893",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 1630000,
        original: 2050000,
        url: "https://www.jumia.ug/lg-gl-c252slbb.234l-top-freezer-refrigerator-smart-inverter-compressor-multi-air-flow-silver-1yr-wrty-149058833.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 1490000,
        original: 1700000,
        url: "https://www.dombelo.com/product/lg-225l-double-door-refrigerator-gn-c262rl-silver/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 2140000,
        original: 4000000,
        url: "https://www.dombelo.com/product/lg-225l-double-door-refrigerator-gn-c262rl-silver/",
        status: "New",
      },
    ],
  },
  {
    id: 43,
    title: "CHiQ 150 Litre Double Door Top Freezer Fridge",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/83/7898441/1.jpg?6637",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 591000,
        original: 750000,
        url: "https://www.jumia.ug/150-liters-double-door-top-freezer-refrigerator-black-3-years-warranty-chiq-mpg5685032.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 720000,
        original: 850000,
        url: "https://kanta.ug/product/chiq-150-litre-double-door-top-freezer-fridge-ctm150/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 615000,
        original: 750000,
        url: "https://www.dombelo.com/product/chiq-150l-net-112l-2-door-top-freezer-refrigerator-ctm150dbik3/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 650000,
        original: 700000,
        url: "https://www.tilyexpress.ug/product/chiq-150l-refrigerator/",
        status: "New",
      },
    ],
  },
  {
    id: 44,
    title: "ADH 120L Single Door Refrigerator",
    image:
      "https://i0.wp.com/www.dombelo.com/wp-content/uploads/2020/08/ADH-120-Liters-Single-Door-Refrigerator.webp?fit=1032%2C1032&ssl=1",
    category: "Appliances",
    prices: [
      {
        site: "Jiji",
        price: 450000,
        original: 450000,
        url: "https://jiji.ug/central-division/kitchen-appliances/adh-fridge-refrigerator-120l-fridge-adh-refrigerator-fpUByTVJa4iRgjaaL5MMF9U3.html",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 475000,
        original: 600000,
        url: "https://www.dombelo.com/product/adh-120l-single-door-refrigerator-silver/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 420000,
        original: 650000,
        url: "https://www.tilyexpress.ug/product/adh-bcd-90-90l-single-door-fridge-silver/",
        status: "New",
      },
    ],
  },
  {
    id: 45,
    title: "Hisense 120 Litre Single Door Bar Refrigerator",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/11/531977/1.jpg?7342",
    category: "Appliances",
    prices: [
      {
        site: "Jumia",
        price: 405000,
        original: 549990,
        url: "https://www.jumia.ug/120-litres-rr120dags-single-door-refrigerator-silver-hisense-mpg1123621.html",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 499000,
        original: 680000,
        url: "https://kwesistores.com/product/hisense-rr120dags-120-liters-mini-single-door-bar-refrigerator-silver/",
        status: "New",
      },
      {
        site: "Dombelo",
        price: 497000,
        original: 850000,
        url: "https://www.dombelo.com/product/hisense-120l-single-door-fridge-rr120dags/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 465000,
        original: 600000,
        url: "https://www.tilyexpress.ug/product/hisense-120-liters-single-door-bar-fridge-silver/",
        status: "New",
      },
    ],
  },
  {
    id: 46,
    title: "LG Microwave Oven 20L",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/43/091561/1.jpg?3991",
    category: "Kitchen",
    prices: [
      {
        site: "Jumia",
        price: 430000,
        original: 549990,
        url: "https://www.jumia.ug/lg-20-litres-solo-microwave-ovenwith-glass-door-black-16519034.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 435000,
        original: 550000,
        url: "https://kanta.ug/product/lg-20-l-solo-microwave-oven-ms2042db/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 630000,
        original: 750000,
        url: "https://kwesistores.com/product/lg-20-liters-microwave-solo-with-glass-door-ms2042db-black/",
        status: "New",
      },
      {
        site: "Jiji",
        price: 450000,
        original: 450000,
        url: "https://jiji.ug/central-division/kitchen-appliances/lg-microwave-oven-lg-microwave-20l-microwave-oven-20l-5hOgNBEO0zGHDqSt3yvLmArA.html",
        status: "New",
      },
    ],
  },
  {
    id: 47,
    title: "Geepas GCM41520 1.8L 20Bar Espresso Coffee Maker",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/80/3506952/1.jpg?1175",
    category: "Kitchen",
    prices: [
      {
        site: "Jumia",
        price: 580000,
        original: 600000,
        url: "https://www.jumia.ug/generic-geepas-20bar-espresso-coffee-maker-gcm-41520-silver-259605308.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 530000,
        original: 650000,
        url: "https://kanta.ug/product/geepas-gcm41520-1-8l-20bar-s-steel-espresso-coffee-maker/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 685000,
        original: 890000,
        url: "https://www.tilyexpress.ug/product/geepas-gcm41520-20bar-power-cappuccino-maker-with-a-powerful-1140-watt-motor-and-20-bar-power-pressure2-year-warranty/",
        status: "New",
      },
    ],
  },
  {
    id: 48,
    title: "Geepas 10L Stand Mixer 2000W GSM43041",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2025/11/7161l8P2w5S._AC_SL1500_-1-1024x1024.webp",
    category: "Kitchen",
    prices: [
      {
        site: "Kwesi",
        price: 700000,
        original: 750000,
        url: "https://kwesistores.com/product/geepas-gsm43041-kitchen-machine-10l-capacity/",
        status: "New",
      },
      {
        site: "Kanta",
        price: 695000,
        original: 750000,
        url: "https://kanta.ug/product/geepas-10l-stand-mixer-2000w-gsm43041/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 785000,
        original: 980000,
        url: "https://www.tilyexpress.ug/product/geepas-10l-stand-mixer-stainless-steel-2000w-mixing-bowl-for-bread-dough-tiltup-head-6-speed-with-pulse-power-indicator-2-year-warranty-multicolor-gsm43041/",
        status: "New",
      },
    ],
  },
  {
    id: 49,
    title: "Blue Flame P9042ERF 90cm x 60cm 4 Gas 2 Electric Cooker",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2023/10/1-18-scaled-1.webp",
    category: "Kitchen",
    prices: [
      {
        site: "Kanta",
        price: 2250000,
        original: 2550000,
        url: "https://kanta.ug/product/blue-flame-p9042erf-90cm-x-60cm-4-gas-2-electric-cookers/",
        status: "New",
      },
      {
        site: "Jumia",
        price: 1770300,
        original: 2500000,
        url: "https://www.jumia.ug/blueflame-90cm60cm-p9042erf-i-diamond-cooker-4-gas-burners-and-2-electric-burners-stainless-steelinox-259650199.html",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 2490000,
        original: 2600000,
        url: "https://www.tilyexpress.ug/product/blueflame-diamond-cooker-e9042erf-90x60cm-inox-stainless-steel/",
        status: "New",
      },
    ],
  },
  {
    id: 50,
    title: "Hisense 2-in-1 12kg Washer and 8kg Dryer Washing Machine",
    image:
      "https://www.tilyexpress.ug/wp-content/uploads/2026/01/61xlWSwz8RL._AC_SL1500_.webp",
    category: "Appliances",
    prices: [
      {
        site: "Jiji",
        price: 2500000,
        original: 2500000,
        url: "https://jiji.ug/central-division/home-appliances/hisense-2-in-1-12kg-washer-8kg-dryer-front-loader-machine-7qBO9V5SclYa8P7oLPKdvGEt.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 2690000,
        original: 2950000,
        url: "https://kanta.ug/product/hisense-2in1-12kg-washer-and-8kg-dryer-washing-machine/",
        status: "New",
      },
      {
        site: "Tilyexpress",
        price: 2400000,
        original: 2900000,
        url: "https://www.tilyexpress.ug/product/hisense-12kg-washer-dryer/",
        status: "New",
      },
    ],
  },
  {
    id: 51,
    title: "Geepas 16 Inch Mist Fan with Remote Control",
    image:
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/00/8560442/1.jpg?4772",
    category: "Appliances",
    prices: [
      {
        site: "Jiji",
        price: 420000,
        original: 420000,
        url: "https://jiji.ug/central-division/home-appliances/geepas-16-mist-fan-with-remote-control-gf21160-nsGfMoJxVCBDzwfaZWYuZIJx.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 470000,
        original: 550000,
        url: "https://kanta.ug/product/geepas-16-mist-fan-with-remote-control-gf21160/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 550000,
        original: 750000,
        url: "https://kwesistores.com/product/geepas-gf-21161-mist-fan-with-remote-control-black/",
        status: "New",
      },
      {
        site: "Jumia",
        price: 520000,
        original: 550000,
        url: "https://www.jumia.ug/generic-16-mist-fan-with-remote-control-3-speed-setting-oscillation-tilt-function-transparent-water-tank-lcd-display-black-244065800.html",
        status: "New",
      },
    ],
  },
];
