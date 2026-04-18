import type { RawDeal } from "./types";

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
      "https://ug.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/09/5666952/1.jpg?1119",
    category: "Kitchen",
    prices: [
      {
        site: "Jumia",
        price: 145000,
        original: 200000,
        url: "https://www.jumia.ug/hoffmans-6l-air-fryer-black-212240812.html",
        status: "New",
      },
      {
        site: "Kanta",
        price: 165000,
        original: 250000,
        url: "https://kanta.ug/product/hoffmans-6l-air-fryer/",
        status: "New",
      },
      {
        site: "Kwesi",
        price: 195000,
        original: 285000,
        url: "https://kwesistores.com/product/hoffmans-6l-air-fryer-black/",
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
];
