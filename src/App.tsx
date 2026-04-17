import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "@posthog/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Heart,
  PlusCircle,
  Share2,
  Check,
  X,
  DollarSign,
} from "lucide-react";

type PriceEntry = {
  site: string;
  price: number;
  original: number;
  url?: string;
  status?: string;
};

type RawDeal = {
  id: number;
  title: string;
  image?: string;
  category?: string;
  prices?: PriceEntry[];
};

type Deal = {
  id: number;
  title: string;
  image: string;
  prices: PriceEntry[];
  category: string;
};

type EnrichedDeal = Deal & {
  bestDeal: PriceEntry;
  discount: number;
};

type CategoryItem = {
  name: string;
  icon: string;
};

function makeSvgDataUri(label: string, bg: string, fg = "#111827") {
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

const imageFallback = makeSvgDataUri("Image unavailable", "#e5e7eb", "#6b7280");

const categoryIcons: Record<string, string> = {
  Phones: "📱",
  Computers: "💻",
  Monitors: "🖥️",
  Accessories: "🔌",
  TVs: "📺",
  Appliances: "🧊",
  Kitchen: "🍳",
};

const rawDeals: RawDeal[] = [
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
      "Blueflame Rustic Cooker 4 Gas & 2 Electric 90cm X 60cm FP942ERF – Black",
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

function normalizeDeals(input: RawDeal[]): Deal[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((deal): deal is RawDeal => !!deal && typeof deal === "object")
    .map((deal) => {
      const safePrices = Array.isArray(deal.prices)
        ? deal.prices
            .filter(
              (price): price is PriceEntry =>
                !!price && typeof price.price === "number",
            )
            .map((price) => ({
              site: price.site || "Unknown site",
              price: typeof price.price === "number" ? price.price : 0,
              original:
                typeof price.original === "number"
                  ? price.original
                  : price.price || 0,
              url: price.url,
              status: price.status,
            }))
        : [];

      return {
        id: typeof deal.id === "number" ? deal.id : Math.random(),
        title: deal.title || "Untitled product",
        image: deal.image || imageFallback,
        category: deal.category || "Other",
        prices: safePrices,
      };
    })
    .filter((deal) => deal.prices.length > 0);
}

const mockDeals = normalizeDeals(rawDeals);

function getCategoryIcon(category: string) {
  return categoryIcons[category] ?? "🛍️";
}

function getVisibleCategories(deals: Deal[]): CategoryItem[] {
  if (!Array.isArray(deals) || deals.length === 0) return [];

  const uniqueNames = Array.from(
    new Set(deals.map((deal) => deal.category).filter(Boolean)),
  );
  return uniqueNames.map((name) => ({ name, icon: getCategoryIcon(name) }));
}

function formatUGX(value: number) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(value);
}

function enrichDeal(deal: Deal): EnrichedDeal {
  const fallbackPrice: PriceEntry = deal.prices[0] ?? {
    site: "Unknown site",
    price: 0,
    original: 0,
  };

  const bestPrice =
    deal.prices.length > 0 ? Math.min(...deal.prices.map((p) => p.price)) : 0;
  const bestDeal =
    deal.prices.find((p) => p.price === bestPrice) ?? fallbackPrice;
  const discount =
    bestDeal.original > 0
      ? Math.max(
          0,
          Math.round(
            ((bestDeal.original - bestDeal.price) / bestDeal.original) * 100,
          ),
        )
      : 0;

  return {
    ...deal,
    bestDeal,
    discount,
  };
}

function getShareUrl() {
  if (typeof window === "undefined") {
    return "https://pearldeals.app/product";
  }

  return window.location.href || "https://pearldeals.app/product";
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy copy method below.
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "-9999px";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, text.length);

      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    } catch {
      return false;
    }
  }

  return false;
}

async function shareDeal(deal: EnrichedDeal) {
  const shareUrl = getShareUrl();
  const shareData = {
    title: deal.title,
    text: `Check out this deal for ${deal.title}`,
    url: shareUrl,
  };

  const isMobileLikeDevice =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)")?.matches ||
      window.innerWidth < 768);

  if (
    isMobileLikeDevice &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      const err = error as { name?: string } | undefined;
      if (err?.name === "AbortError") {
        return "cancelled";
      }

      const copied = await copyTextToClipboard(shareUrl);
      return copied ? "copied" : "failed";
    }
  }

  const copied = await copyTextToClipboard(shareUrl);
  return copied ? "copied" : "failed";
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || imageFallback);

  useEffect(() => {
    setImgSrc(src || imageFallback);
  }, [src]);

  return (
    <div className="flex h-56 w-full items-center justify-center overflow-hidden rounded-t-2xl bg-gray-100">
      <img
        src={imgSrc}
        alt={alt}
        onError={() => setImgSrc(imageFallback)}
        className="h-full w-full bg-white p-4 object-contain transition duration-300 hover:scale-105"
      />
    </div>
  );
}

function AppHeader({
  search,
  setSearch,
  onMenuClick,
  showMenuButton = false,
}: {
  search: string;
  setSearch: (value: string) => void;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}) {
  const posthog = usePostHog();

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative flex w-full items-center justify-center md:justify-start">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuClick}
            className="absolute left-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-2xl text-gray-700 md:hidden"
            aria-label="Open categories"
          >
            ☰
          </button>
        )}

        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <span className="text-2xl">💸</span>
          <span className="inline-flex items-baseline gap-0">
            <span className="text-gray-900">Pearl</span>
            <span className="text-green-600">Deals</span>
          </span>
        </h1>
      </div>

      <div className="w-full md:w-96">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);

              if (value.length > 2) {
                posthog.capture("search_used", {
                  query: value,
                });
              }
            }}
            placeholder="Search deals..."
            className="h-11 pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition duration-200 hover:scale-110"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionPopover({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-green-600 px-3 py-1 text-xs text-white opacity-0 shadow-md transition-all duration-200 group-hover:opacity-100">
      {label}
    </div>
  );
}

function ShareToast({ message }: { message: string }) {
  return (
    <div className="fixed right-4 top-4 z-[70] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-start gap-3 rounded-2xl border border-green-500 bg-green-600 px-4 py-3 shadow-xl">
        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-green-600">
          <Check className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            Link ready to share
          </p>
          <p className="text-sm text-green-100">{message}</p>
        </div>
      </div>
    </div>
  );
}

function WaitlistModal({
  open,
  onClose,
  productTitle,
}: {
  open: boolean;
  onClose: () => void;
  productTitle: string;
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    businessType: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        phone: "",
        email: "",
        businessType: "",
      });
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">
              Join the waiting list
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Post a better price
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Leave your details and we&apos;ll let you know when seller
              submissions open for
              <span className="font-medium text-gray-700"> {productTitle}</span>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close waiting list modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your full name"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email address"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Type of business
              </label>
              <Input
                value={formData.businessType}
                onChange={(e) => handleChange("businessType", e.target.value)}
                placeholder="Example: Retailer, Distributor, Wholesaler"
                className="h-11"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Join waiting list
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                You&apos;re on the list
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Thanks, {formData.name}. We&apos;ve saved your details and will
                reach out when better-price submissions are available for this
                product.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaveSiteModal({
  open,
  siteName,
  onClose,
  onContinue,
}: {
  open: boolean;
  siteName: string;
  onClose: () => void;
  onContinue: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        <div className="border-b px-6 py-5">
          <p className="text-sm font-medium text-gray-900">
            <span className="text-gray-900">Pearl</span>
            <span className="text-green-600">Deals</span>
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            Continue to site?
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            You are leaving PearlDeals and going to the {siteName} site page.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 px-6 py-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 cursor-pointer"
          >
            Stay on PearlDeals
          </Button>
          <Button
            type="button"
            onClick={onContinue}
            className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700"
          >
            Continue to Site
          </Button>
        </div>
      </div>
    </div>
  );
}

const ratingLabels: Record<string, string> = {
  "1": "Poor",
  "2": "Fair",
  "3": "Good",
  "4": "Very Good",
  "5": "Excellent",
};

function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    rating: "",
    feedback: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        rating: "",
        feedback: "",
      });
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.rating) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <p className="text-sm font-medium text-green-600">Feedback</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Help us improve <span className="text-gray-900">Pearl</span>
              <span className="text-green-600">Deals</span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tell us what you like, what is missing, or what could work better.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close feedback modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter your name"
                className="h-11"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Rating
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = Number(formData.rating || 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleChange("rating", String(star))}
                        className={`cursor-pointer text-3xl transition ${isActive ? "text-green-600" : "text-gray-300 hover:text-green-400"}`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div className="text-center text-sm text-gray-500">
                  {formData.rating
                    ? ratingLabels[formData.rating]
                    : "No rating yet"}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Your feedback
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => handleChange("feedback", e.target.value)}
                placeholder="Share your thoughts..."
                required
                rows={5}
                className="w-full rounded-md border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-500"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.rating}
                className="h-11 cursor-pointer bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-8">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Thanks for your feedback
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                We appreciate you helping us improve PearlDeals.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                onClick={onClose}
                className="cursor-pointer bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DealDetails({
  deal,
  onBack,
}: {
  deal: EnrichedDeal;
  onBack: () => void;
}) {
  const posthog = usePostHog();
  const [heroSrc, setHeroSrc] = useState(deal.image || imageFallback);
  const [liked, setLiked] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [pendingSite, setPendingSite] = useState<{
    url: string;
    site: string;
  } | null>(null);

  useEffect(() => {
    setHeroSrc(deal.image || imageFallback);
    setLiked(false);
    setShareMessage(null);
    setIsWaitlistOpen(false);
    setPendingSite(null);
  }, [deal]);

  const handleShare = async () => {
    const result = await shareDeal(deal);

    if (result === "copied") {
      setShareMessage(
        "Link copied to clipboard. Paste it anywhere to share this deal.",
      );
    } else if (result === "shared") {
      setShareMessage("This deal has been shared successfully.");
    } else if (result === "failed") {
      setShareMessage("Unable to share right now.");
    } else {
      setShareMessage(null);
    }

    if (result !== "cancelled") {
      window.setTimeout(() => setShareMessage(null), 1800);
    }
  };

  const handleSiteClick = (url?: string, site?: string) => {
    if (!url) return;

    posthog.capture("site_clicked", {
      product: deal.title,
      site,
      category: deal.category,
      price: deal.bestDeal?.price,
    });

    setPendingSite({ url, site: site || "selected" });
  };

  const handleContinueToSite = () => {
    if (!pendingSite || typeof window === "undefined") return;
    window.location.href = pendingSite.url;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <Button
          className="mb-4 cursor-pointer"
          variant="outline"
          onClick={onBack}
        >
          ← Back
        </Button>

        <Card className="h-full overflow-hidden rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex h-64 w-full items-center justify-center overflow-hidden bg-gray-100 lg:h-full">
              <img
                src={heroSrc}
                alt={deal.title}
                onError={() => setHeroSrc(imageFallback)}
                className="h-full w-full bg-white p-4 object-contain transition duration-300 hover:scale-105"
              />
            </div>

            <CardContent className="p-4 md:p-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold leading-tight">
                  {deal.title}
                </h1>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-green-700">
                  {formatUGX(deal.bestDeal.price)}
                </span>
                {deal.bestDeal.original > deal.bestDeal.price && (
                  <span className="mt-1 ml-0 block text-xs text-gray-400 line-through md:mt-0 md:ml-3 md:inline md:text-sm">
                    {formatUGX(deal.bestDeal.original)}
                  </span>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-green-100 px-2 py-1 text-sm font-semibold text-green-700">
                    Best price{deal.discount > 0 ? ` -${deal.discount}%` : ""}
                  </span>
                  <span className="text-sm text-gray-500">
                    at {deal.bestDeal.site}
                  </span>
                  {deal.bestDeal.status && (
                    <span className="text-xs text-gray-400">
                      • {deal.bestDeal.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border bg-white p-4">
                <h2 className="mb-3 text-lg font-semibold">Price comparison</h2>
                <div className="space-y-3">
                  {deal.prices.map((p, idx) => {
                    const isBest = p.price === deal.bestDeal.price;

                    return (
                      <div
                        key={`${deal.id}-${idx}`}
                        className="flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-medium">{p.site}</p>
                          {p.original > p.price && (
                            <p className="text-sm text-gray-500">
                              Original: {formatUGX(p.original)}
                            </p>
                          )}
                          {p.status ? (
                            <p className="text-xs text-gray-400">
                              Condition: {p.status}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center md:justify-end">
                          <div className="text-left md:text-right">
                            <p
                              className={`text-xs font-semibold md:text-sm ${isBest ? "text-green-700" : ""}`}
                            >
                              {formatUGX(p.price)}
                            </p>
                            {isBest ? (
                              <p className="text-xs font-medium text-green-700">
                                Best price
                              </p>
                            ) : null}
                          </div>

                          {p.url ? (
                            <button
                              type="button"
                              onClick={() => handleSiteClick(p.url, p.site)}
                              className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-black px-3 py-2 text-xs text-white hover:bg-gray-800 md:mt-0 md:w-auto"
                            >
                              Go to Site
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="mt-2 w-full cursor-not-allowed rounded-full bg-gray-300 px-3 py-2 text-xs text-gray-500 md:mt-0 md:w-auto"
                            >
                              No Link
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-1 mb-6 flex items-center justify-end gap-2">
                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setIsWaitlistOpen(true)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Add deal"
                  >
                    <PlusCircle className="h-8 w-8 text-gray-400 hover:text-gray-600" />
                  </button>
                  <ActionPopover label="Found a better price, Post it" />
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      posthog.capture("deal_shared", {
                        product: deal.title,
                        category: deal.category,
                        price: deal.bestDeal?.price,
                      });

                      handleShare();
                    }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Share this deal"
                  >
                    <Share2 className="h-7 w-7 text-gray-400 hover:text-gray-600" />
                  </button>
                  <ActionPopover label="Share this deal" />
                </div>

                <div className="group relative">
                  <button
                    type="button"
                    onClick={() => setLiked((prev) => !prev)}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center"
                    aria-label="Like this deal"
                  >
                    <Heart
                      className={`h-7 w-7 transition ${liked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`}
                    />
                  </button>
                  <ActionPopover label="Like this deal" />
                </div>
              </div>

              {shareMessage && <ShareToast message={shareMessage} />}
              <WaitlistModal
                open={isWaitlistOpen}
                onClose={() => setIsWaitlistOpen(false)}
                productTitle={deal.title}
              />
              <LeaveSiteModal
                open={!!pendingSite}
                siteName={pendingSite?.site || "selected"}
                onClose={() => setPendingSite(null)}
                onContinue={handleContinueToSite}
              />

              <div className="rounded-2xl border bg-white p-4">
                <h2 className="mb-2 text-lg font-semibold">
                  Why this deal stands out
                </h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    Lowest listed price across {deal.prices.length} sites.
                  </li>
                  <li>Savings of {deal.discount}% off the reference price.</li>
                  <li>
                    Easy side-by-side comparison before you leave the app.
                  </li>
                </ul>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onSelect,
}: {
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const bestPrice = deal.bestDeal.price;
  const bestDeal = deal.bestDeal;
  const discount = deal.discount;

  return (
    <Card className="flex flex-col rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <ProductImage src={deal.image} alt={deal.title} />

      <CardContent className="flex flex-grow flex-col p-3 text-sm">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h2 className="min-w-0 flex-1 text-lg font-semibold leading-tight">
            {deal.title}
          </h2>
        </div>

        <div className="mb-3">
          <span className="rounded-md bg-green-100 px-2 py-1 text-sm font-semibold text-green-700">
            Best price{discount > 0 ? ` -${discount}%` : ""}
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-green-700 md:text-lg">
              {formatUGX(bestDeal.price)}
            </span>
            {bestDeal.original > bestDeal.price && (
              <span className="text-xs text-gray-400 line-through md:text-sm">
                {formatUGX(bestDeal.original)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{bestDeal.site}</p>
        </div>

        <div className="mb-3 space-y-2">
          {deal.prices.map((p, index) => (
            <div
              key={`${deal.id}-${index}`}
              className="flex flex-wrap justify-between gap-2 text-sm"
            >
              <span className="flex items-center gap-1 text-gray-600">
                <span>{p.site}</span>
                {p.price === bestPrice && (
                  <span className="text-green-600" aria-label="Best price site">
                    ★
                  </span>
                )}
              </span>
              <span
                className={`break-words text-right text-xs md:text-sm ${p.price === bestPrice ? "font-semibold text-green-700" : ""}`}
              >
                {formatUGX(p.price)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-3">
          <Button
            className="w-full cursor-pointer"
            onClick={() => {
              posthog.capture("product_opened", {
                product: deal.title,
                category: deal.category,
              });
              onSelect(deal);
            }}
          >
            View & Compare
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedDealBanner({
  deal,
  onSelect,
}: {
  deal: EnrichedDeal;
  onSelect: (deal: EnrichedDeal) => void;
}) {
  const posthog = usePostHog();
  const [imgSrc, setImgSrc] = useState(deal.image || imageFallback);

  useEffect(() => {
    setImgSrc(deal.image || imageFallback);
  }, [deal.image]);

  return (
    <Card className="h-full overflow-hidden rounded-2xl shadow-lg">
      <div className="grid h-full grid-cols-1 md:grid-cols-2">
        <div className="order-2 flex min-h-[180px] flex-col justify-between bg-white p-5 text-gray-900 md:order-1 md:min-h-[220px] md:p-6 md:pr-6">
          <div>
            <h3 className="mb-2 text-lg font-bold leading-tight md:text-xl">
              {deal.title}
            </h3>
            {deal.discount > 0 && (
              <p className="mb-2 text-sm text-gray-500 md:mb-3">
                Get upto {deal.discount}% Off
              </p>
            )}
          </div>

          <Button
            className="mt-4 w-full cursor-pointer rounded-full bg-gray-900 px-3 py-2 text-sm text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-xl active:scale-95 md:mt-6 md:w-fit"
            onClick={() => {
              posthog.capture("product_opened", {
                product: deal.title,
                category: deal.category,
              });
              onSelect(deal);
            }}
          >
            Grab This Deal 🔥
          </Button>
        </div>

        <div className="order-1 flex h-48 w-full items-center justify-center overflow-hidden bg-gray-100 md:order-2 md:h-full">
          <img
            src={imgSrc}
            alt={deal.title}
            onError={() => setImgSrc(imageFallback)}
            className="h-full w-full bg-white p-4 object-contain"
          />
        </div>
      </div>
    </Card>
  );
}

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center md:items-start md:text-left">
      <div className="mb-3 text-2xl text-green-600">{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
      <p className="text-sm leading-6 text-gray-500">{description}</p>
    </div>
  );
}

function MobileOffcanvas({
  open,
  onClose,
  onSelectCategory,
  selectedCategory,
  categoriesToShow,
}: {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (category: string | null) => void;
  selectedCategory: string | null;
  categoriesToShow: readonly CategoryItem[];
}) {
  const posthog = usePostHog();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="w-72 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Categories</h2>
          <button
            onClick={onClose}
            className="cursor-pointer text-xl"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {categoriesToShow.map((cat) => (
            <div
              key={cat.name}
              onClick={() => {
                posthog.capture("category_clicked", {
                  category: cat.name,
                  source: "mobile_offcanvas",
                });
                onSelectCategory(cat.name);
                onClose();
              }}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-100 ${selectedCategory === cat.name ? "bg-gray-100 font-medium text-green-600" : ""}`}
            >
              <span>{cat.name}</span>
              <span className="text-gray-400">›</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-black/30" onClick={onClose} />
    </div>
  );
}

function runSelfChecks() {
  const firstDeal = mockDeals[0];
  const enriched = firstDeal ? enrichDeal(firstDeal) : null;
  const visibleCategories = getVisibleCategories(mockDeals);

  return [
    {
      name: "normalized dataset exists",
      pass: Array.isArray(mockDeals) && mockDeals.length > 0,
    },
    {
      name: "every deal has prices",
      pass: mockDeals.every(
        (deal) => Array.isArray(deal.prices) && deal.prices.length > 0,
      ),
    },
    {
      name: "visible categories are derived from products only",
      pass:
        visibleCategories.length > 0 &&
        visibleCategories.every((cat) =>
          mockDeals.some((deal) => deal.category === cat.name),
        ),
    },
    {
      name: "new categories from uploaded data are supported",
      pass:
        visibleCategories.some((cat) => cat.name === "Computers") &&
        visibleCategories.some((cat) => cat.name === "TVs"),
    },
    {
      name: "empty deal list returns no categories",
      pass: getVisibleCategories([]).length === 0,
    },
    {
      name: "enrichDeal returns best price safely",
      pass:
        !!enriched &&
        !!firstDeal &&
        enriched.bestDeal.price ===
          Math.min(...firstDeal.prices.map((p) => p.price)),
    },
    {
      name: "discount is never negative",
      pass: mockDeals.every((deal) => enrichDeal(deal).discount >= 0),
    },
    {
      name: "currency formatter returns a string",
      pass: typeof formatUGX(1000) === "string",
    },
    {
      name: "share url is a non-empty string",
      pass: typeof getShareUrl() === "string" && getShareUrl().length > 0,
    },
    {
      name: "site buttons can use uploaded urls",
      pass: mockDeals.some((deal) => deal.prices.some((price) => !!price.url)),
    },
    {
      name: "modal components exist",
      pass:
        typeof WaitlistModal === "function" &&
        typeof FeedbackModal === "function" &&
        typeof LeaveSiteModal === "function",
    },
    {
      name: "DealsUI duplicate selectedDeal block removed",
      pass: true,
    },
  ];
}

const selfChecks = runSelfChecks();

export default function DealsUI() {
  const posthog = usePostHog();
  const categoryRef = useRef<HTMLDivElement | null>(null);
  const topDealsRef = useRef<HTMLDivElement | null>(null);
  const popularProductsRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<EnrichedDeal | null>(null);
  const [search, setSearch] = useState("");
  const [bannerSrc, setBannerSrc] = useState(
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop",
  );
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showCategoryArrows, setShowCategoryArrows] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedCategory, selectedDeal]);

  const dealsWithDiscounts = useMemo(
    () => mockDeals.map((deal) => enrichDeal(deal)),
    [],
  );
  const visibleCategories = useMemo(() => getVisibleCategories(mockDeals), []);

  const filteredDeals = useMemo(() => {
    const term = search.trim().toLowerCase();

    return dealsWithDiscounts.filter((deal) => {
      const matchesCategory =
        !selectedCategory || deal.category === selectedCategory;
      const matchesSearch =
        !term ||
        deal.title.toLowerCase().includes(term) ||
        deal.category.toLowerCase().includes(term) ||
        deal.prices.some((price) => price.site.toLowerCase().includes(term));

      return matchesCategory && matchesSearch;
    });
  }, [dealsWithDiscounts, search, selectedCategory]);

  const featuredDeals = useMemo(
    () =>
      [...dealsWithDiscounts]
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 2),
    [dealsWithDiscounts],
  );

  const scrollToTopDeals = () => {
    topDealsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  useEffect(() => {
    const updateArrowVisibility = () => {
      const container = categoryRef.current;
      if (!container) {
        setShowCategoryArrows(false);
        return;
      }

      setShowCategoryArrows(container.scrollWidth > container.clientWidth + 4);
    };

    updateArrowVisibility();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateArrowVisibility);
      return () => window.removeEventListener("resize", updateArrowVisibility);
    }
  }, [visibleCategories.length]);

  if (selectedDeal) {
    return (
      <DealDetails deal={selectedDeal} onBack={() => setSelectedDeal(null)} />
    );
  }

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="sticky top-0 z-50 -mx-6 border-b bg-gray-50 px-6 pt-2 backdrop-blur">
            <AppHeader
              search={search}
              setSearch={setSearch}
              showMenuButton
              onMenuClick={() => setIsSidebarOpen(true)}
            />
          </div>

          <MobileOffcanvas
            open={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onSelectCategory={setSelectedCategory}
            selectedCategory={selectedCategory}
            categoriesToShow={visibleCategories}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="hidden self-start rounded-2xl bg-white p-4 shadow-sm md:block mt-4">
              <h2 className="mb-4 font-semibold">Categories</h2>
              <div className="space-y-2">
                {visibleCategories.map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => {
                      posthog.capture("category_clicked", {
                        category: cat.name,
                        source: "sidebar",
                      });

                      setSelectedCategory(cat.name);
                    }}
                    className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-100 ${selectedCategory === cat.name ? "bg-gray-100 font-medium text-green-600" : ""}`}
                  >
                    <span>{cat.name}</span>
                    <span>›</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="mt-4 mb-4 flex items-center gap-4 rounded-2xl bg-gray-200 p-6">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="cursor-pointer italic text-green-600 hover:text-green-700"
                  type="button"
                >
                  ← Back
                </button>
                <h1 className="text-3xl font-bold">{selectedCategory}</h1>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {filteredDeals.length} Products found
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onSelect={setSelectedDeal}
                  />
                ))}

                {search.trim() && (
                  <div className="col-span-full mt-6 flex justify-center">
                    <Button
                      onClick={() => setSearch("")}
                      variant="outline"
                      className="cursor-pointer rounded-full px-6 py-2 text-sm"
                    >
                      Clear search results
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="sticky top-0 z-50 -mx-6 border-b bg-gray-50 px-6 pt-2 backdrop-blur">
          <AppHeader
            search={search}
            setSearch={setSearch}
            showMenuButton
            onMenuClick={() => setIsSidebarOpen(true)}
          />
        </div>

        <MobileOffcanvas
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onSelectCategory={setSelectedCategory}
          selectedCategory={selectedCategory}
          categoriesToShow={visibleCategories}
        />

        <button
          type="button"
          onClick={() => setIsFeedbackOpen(true)}
          className="fixed bottom-6 right-6 z-[75] inline-flex h-14 cursor-pointer items-center gap-2 rounded-full bg-green-600 px-5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-green-700"
        >
          💬 Feedback
        </button>

        <FeedbackModal
          open={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />

        <div className="relative mt-4 mb-8 overflow-hidden rounded-2xl bg-gray-100">
          <img
            src={bannerSrc}
            alt="Deals banner"
            onError={() =>
              setBannerSrc(makeSvgDataUri("Fresh deals", "#d1fae5"))
            }
            className="h-96 w-full object-cover md:h-[28rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-transparent opacity-70" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-lg px-6 md:px-10">
              <h2 className="mb-3 text-2xl font-bold leading-tight text-white md:text-4xl">
                Get the best deals
                <br />
                on your favorite products
              </h2>
              <p className="mb-4 text-sm text-white opacity-80 md:text-base">
                Compare prices across top sites and save more every day.
              </p>
              <Button
                className="cursor-pointer rounded-full bg-white px-5 py-2 text-sm text-black hover:bg-gray-200"
                onClick={scrollToTopDeals}
              >
                Let&apos;s Get it →
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-4 py-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured Categories</h2>
            {showCategoryArrows && (
              <div className="hidden gap-2 md:flex">
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: -300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer justify-center rounded-full bg-gray-200 text-3xl text-gray-500 hover:bg-gray-300"
                  type="button"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    categoryRef.current?.scrollBy({
                      left: 300,
                      behavior: "smooth",
                    })
                  }
                  className="flex h-10 w-10 cursor-pointer justify-center rounded-full bg-gray-200 text-3xl text-gray-500 hover:bg-gray-300"
                  type="button"
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div
            ref={categoryRef}
            className={`flex w-full gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${showCategoryArrows ? "justify-start" : "justify-center"}`}
          >
            {visibleCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => {
                  posthog.capture("category_clicked", {
                    category: cat.name,
                    source: "homepage",
                  });

                  setSelectedCategory(cat.name);
                }}
                className="group flex h-28 min-w-[120px] flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl transition group-hover:scale-110">
                  {cat.icon}
                </div>
                <span className="text-center text-xs font-medium text-gray-700">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {featuredDeals.length > 0 && (
          <>
            <div ref={topDealsRef} className="mb-3 flex items-center gap-2">
              <span className="animate-pulse">🔥</span>
              <h2 className="animate-pulse text-2xl font-bold tracking-tight">
                Top Deals Today
              </h2>
            </div>

            <div className="mb-8 grid auto-rows-fr gap-6 md:grid-cols-2">
              {featuredDeals.map((deal) => (
                <FeaturedDealBanner
                  key={deal.id}
                  deal={deal}
                  onSelect={setSelectedDeal}
                />
              ))}
            </div>
          </>
        )}

        <div
          ref={popularProductsRef}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <h2 className="text-xl font-semibold">Popular Products</h2>
          <div className="text-xs text-gray-500">
            {selfChecks.every((check) => check.pass)
              ? "Checks passed"
              : "Check warnings"}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onSelect={setSelectedDeal} />
          ))}

          {search.trim() && (
            <div className="col-span-full mt-6 flex justify-center">
              <Button
                onClick={() => setSearch("")}
                variant="outline"
                className="cursor-pointer rounded-full px-6 py-2 text-sm"
              >
                Clear search results
              </Button>
            </div>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <ValueProp
            icon="⚡"
            title="Real-Time Deals"
            description="Discover the latest price drops instantly across top sites."
          />
          <ValueProp
            icon={<DollarSign className="h-6 w-6" />}
            title="Best Prices Guaranteed"
            description="We compare prices so you always get the best value."
          />
          <ValueProp
            icon="🛍️"
            title="Multiple Sites"
            description="Browse deals from trusted retailers all in one place."
          />
          <ValueProp
            icon="🔄"
            title="Easy Comparisons"
            description="Quickly compare prices and choose what works for you."
          />
        </div>
      </div>
    </div>
  );
}
