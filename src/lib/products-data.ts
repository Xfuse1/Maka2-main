export interface ProductColor {
  name: string
  hex: string
  images: string[]
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  materials: string
  colors: ProductColor[]
  sizes: string[]
  rating: number
  reviews: number
  featured: boolean
  customSizesAvailable: boolean
}

export const products: Product[] = [
  // Abayas
  {
    id: "abaya-1",
    name: "عباية كلاسيكية سوداء",
    category: "عبايات",
    price: 450,
    description: "عباية أنيقة بتصميم كلاسيكي، مثالية للمناسبات الرسمية والاستخدام اليومي",
    materials: "قماش كريب فاخر (95% بوليستر، 5% إيلاستين) - قماش ناعم ومريح مع مرونة خفيفة للحركة السلسة",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/elegant-black-abaya-front-view.jpg?height=800&width=600&query=elegant black abaya front view modest fashion",
          "/elegant-black-abaya-side-view.jpg?height=800&width=600&query=elegant black abaya side view flowing fabric",
          "/elegant-black-abaya-back-view.jpg?height=800&width=600&query=elegant black abaya back view detailed design",
        ],
      },
      {
        name: "كحلي",
        hex: "#1e3a5f",
        images: [
          "/elegant-navy-blue-abaya-front-view-modest-fashion.jpg",
          "/elegant-navy-blue-abaya-side-view-flowing-fabric.jpg",
          "/elegant-navy-blue-abaya-back-view-detailed-design.jpg",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.8,
    reviews: 124,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "abaya-2",
    name: "عباية مطرزة فاخرة",
    category: "عبايات",
    price: 650,
    description: "عباية فاخرة مع تطريز يدوي راقي على الأكمام والياقة",
    materials:
      "قماش نيدا الفاخر (100% بوليستر) مع تطريز خيوط ذهبية (20% حرير، 80% بوليستر معدني) - قماش فاخر مقاوم للتجعد",
    colors: [
      {
        name: "أسود مع ذهبي",
        hex: "#1a1a1a",
        images: [
          "/luxury-embroidered-black-abaya-with-gold-details.jpg?height=800&width=600&query=luxury black abaya with gold embroidery details",
          "/embroidered-abaya-close-up-details.jpg?height=800&width=600&query=close up gold embroidery on black abaya sleeves",
          "/luxury-abaya-full-length.jpg?height=800&width=600&query=full length luxury embroidered black abaya",
        ],
      },
      {
        name: "كحلي",
        hex: "#1e3a5f",
        images: [
          "/navy-blue-embroidered-abaya.jpg?height=800&width=600&query=navy blue abaya with gold embroidery elegant",
          "/navy-abaya-side-view.jpg?height=800&width=600&query=navy blue embroidered abaya side view",
          "/navy-abaya-details.jpg?height=800&width=600&query=navy blue abaya embroidery details close up",
        ],
      },
      {
        name: "عنابي",
        hex: "#800020",
        images: [
          "/burgundy-abaya-with-gold-embroidery-luxury-modest-.jpg",
          "/burgundy-embroidered-abaya-side-view-elegant.jpg",
          "/burgundy-abaya-gold-embroidery-details-close-up.jpg",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.9,
    reviews: 89,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "abaya-3",
    name: "عباية كاجوال عصرية",
    category: "عبايات",
    price: 380,
    description: "عباية عملية بتصميم عصري مناسبة للاستخدام اليومي",
    materials: "قماش جيرسي قطني (70% قطن، 30% بوليستر) - قماش مريح وقابل للتنفس مثالي للاستخدام اليومي",
    colors: [
      {
        name: "رمادي",
        hex: "#808080",
        images: [
          "/modern-grey-casual-abaya.jpg?height=800&width=600&query=modern grey casual abaya everyday wear",
          "/grey-abaya-casual-style.jpg?height=800&width=600&query=grey abaya casual style comfortable",
          "/casual-abaya-everyday-wear.jpg?height=800&width=600&query=casual grey abaya everyday modest fashion",
        ],
      },
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/beige-casual-abaya-modern.jpg?height=800&width=600&query=beige casual abaya modern design comfortable",
          "/beige-abaya-front-view.jpg?height=800&width=600&query=beige abaya front view casual elegant",
          "/beige-abaya-details.jpg?height=800&width=600&query=beige abaya details modern casual",
        ],
      },
      {
        name: "زيتي",
        hex: "#556B2F",
        images: [
          "/olive-green-casual-abaya-modern-comfortable.jpg",
          "/olive-green-abaya-side-view-casual-style.jpg",
          "/olive-green-abaya-details-modern-design.jpg",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.6,
    reviews: 156,
    featured: false,
    customSizesAvailable: true,
  },
  {
    id: "abaya-4",
    name: "عباية شيفون أنيقة",
    category: "عبايات",
    price: 520,
    description: "عباية من الشيفون الفاخر بتصميم انسيابي راقي",
    materials: "قماش شيفون فاخر (100% بوليستر) - قماش خفيف وانسيابي",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.7,
    reviews: 65,
    featured: false,
    customSizesAvailable: true,
  },

  // Cardigans
  {
    id: "cardigan-1",
    name: "كارديجان وردي ناعم",
    category: "كارديجان",
    price: 320,
    description: "كارديجان أنيق بلون وردي ناعم، مثالي لإطلالة عصرية ومريحة",
    materials: "قماش تريكو ناعم (60% قطن، 35% بوليستر، 5% إيلاستين) - قماش مرن ومريح مع ملمس ناعم",
    colors: [
      {
        name: "وردي فاتح",
        hex: "#FFB6C1",
        images: [
          "/elegant-pink-cardigan-on-model.jpg?height=800&width=600&query=elegant light pink cardigan on model modern fashion",
          "/light-pink-cardigan-side-view.jpg?height=800&width=600&query=light pink cardigan side view soft fabric",
          "/pink-cardigan-details.jpg?height=800&width=600&query=pink cardigan details buttons and texture",
        ],
      },
      {
        name: "وردي غامق",
        hex: "#FF69B4",
        images: [
          "/hot-pink-cardigan-elegant-modern-style.jpg",
          "/hot-pink-cardigan-side-view-flowing.jpg",
          "/hot-pink-cardigan-details-close-up.jpg",
        ],
      },
      {
        name: "كريمي",
        hex: "#FFFDD0",
        images: [
          "/cream-colored-cardigan-elegant-soft.jpg",
          "/cream-cardigan-side-view-comfortable.jpg",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 98,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "cardigan-2",
    name: "كارديجان طويل كلاسيكي",
    category: "كارديجان",
    price: 420,
    description: "كارديجان طويل بتصميم كلاسيكي أنيق يناسب جميع المناسبات",
    materials: "قماش فيسكوز فاخر (80% فيسكوز، 20% نايلون) - قماش انسيابي وأنيق مع لمعة طبيعية",
    colors: [
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "رمادي",
        hex: "#808080",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "جملي",
        hex: "#C19A6B",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 76,
    featured: false,
    customSizesAvailable: false,
  },
  {
    id: "cardigan-3",
    name: "كارديجان صوف فاخر",
    category: "كارديجان",
    price: 550,
    description: "كارديجان من الصوف الفاخر، دافئ وأنيق للأيام الباردة",
    materials: "صوف مرينو فاخر (50% صوف مرينو، 30% أكريليك، 20% نايلون) - صوف طبيعي دافئ وناعم مع مقاومة للوبر",
    colors: [
      {
        name: "كريمي",
        hex: "#FFFDD0",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "كاكاو",
        hex: "#8B4513",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "وردي داكن",
        hex: "#C08081",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 54,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "cardigan-4",
    name: "كارديجان قطني خفيف",
    category: "كارديجان",
    price: 280,
    description: "كارديجان قطني خفيف مثالي للأجواء المعتدلة",
    materials: "قطن 100% - قماش طبيعي قابل للتنفس",
    colors: [
      {
        name: "أبيض",
        hex: "#FFFFFF",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 82,
    featured: false,
    customSizesAvailable: false,
  },

  // Jackets
  {
    id: "jacket-1",
    name: "جاكيت جينز عصري",
    category: "جواكت",
    price: 480,
    description: "جاكيت جينز بتصميم عصري وأنيق",
    materials: "قماش دنيم (98% قطن، 2% إيلاستين) - جينز مريح مع مرونة خفيفة",
    colors: [
      {
        name: "أزرق فاتح",
        hex: "#ADD8E6",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أزرق غامق",
        hex: "#00008B",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 94,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "jacket-2",
    name: "جاكيت جلد فاخر",
    category: "جواكت",
    price: 890,
    description: "جاكيت من الجلد الصناعي الفاخر بتصميم راقي",
    materials: "جلد صناعي فاخر (100% بولي يوريثان) - جلد صناعي عالي الجودة",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "بني",
        hex: "#8B4513",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 67,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "jacket-3",
    name: "جاكيت رياضي أنيق",
    category: "جواكت",
    price: 380,
    description: "جاكيت رياضي عملي بتصميم عصري",
    materials: "قماش بوليستر رياضي (100% بوليستر) - قماش خفيف ومقاوم للماء",
    colors: [
      {
        name: "رمادي",
        hex: "#808080",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 103,
    featured: false,
    customSizesAvailable: false,
  },

  // Sweatshirts
  {
    id: "sweatshirt-1",
    name: "سويت شيرت قطني مريح",
    category: "سويت شيرت",
    price: 320,
    description: "سويت شيرت قطني مريح للاستخدام اليومي",
    materials: "قطن فرنش تيري (80% قطن، 20% بوليستر) - قماش قطني سميك ودافئ",
    colors: [
      {
        name: "رمادي",
        hex: "#808080",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 128,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "sweatshirt-2",
    name: "سويت شيرت بقلنسوة",
    category: "سويت شيرت",
    price: 380,
    description: "سويت شيرت عصري مع قلنسوة للأجواء الباردة",
    materials: "قطن فرنش تيري (85% قطن، 15% بوليستر) - قماش قطني دافئ مع بطانة ناعمة",
    colors: [
      {
        name: "كحلي",
        hex: "#1e3a5f",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "وردي",
        hex: "#FFB6C1",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 95,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "sweatshirt-3",
    name: "سويت شيرت أوفرسايز",
    category: "سويت شيرت",
    price: 350,
    description: "سويت شيرت بقصة أوفرسايز عصرية ومريحة",
    materials: "قطن مخلوط (70% قطن، 30% بوليستر) - قماش مريح وعملي",
    colors: [
      {
        name: "أبيض",
        hex: "#FFFFFF",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 87,
    featured: false,
    customSizesAvailable: false,
  },

  // Blouses
  {
    id: "blouse-1",
    name: "بلوزة حريرية أنيقة",
    category: "بلوزات",
    price: 420,
    description: "بلوزة من الحرير الصناعي بتصميم راقي",
    materials: "حرير صناعي (100% بوليستر) - قماش ناعم ولامع",
    colors: [
      {
        name: "أبيض",
        hex: "#FFFFFF",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "وردي فاتح",
        hex: "#FFB6C1",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أزرق سماوي",
        hex: "#87CEEB",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 76,
    featured: true,
    customSizesAvailable: false,
  },
  {
    id: "blouse-2",
    name: "بلوزة قطنية كاجوال",
    category: "بلوزات",
    price: 280,
    description: "بلوزة قطنية مريحة للاستخدام اليومي",
    materials: "قطن 100% - قماش طبيعي قابل للتنفس",
    colors: [
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 112,
    featured: false,
    customSizesAvailable: false,
  },
  {
    id: "blouse-3",
    name: "بلوزة شيفون مطرزة",
    category: "بلوزات",
    price: 480,
    description: "بلوزة شيفون فاخرة مع تطريز راقي",
    materials: "شيفون مطرز (100% بوليستر) - قماش شفاف أنيق مع تطريز",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 58,
    featured: true,
    customSizesAvailable: false,
  },

  // Jumpsuits
  {
    id: "jumpsuit-1",
    name: "سلوبيت أنيق للمناسبات",
    category: "سلوبيتات",
    price: 680,
    description: "سلوبيت راقي بتصميم عصري للمناسبات الخاصة",
    materials: "قماش كريب فاخر (95% بوليستر، 5% إيلاستين) - قماش انسيابي مع مرونة",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "كحلي",
        hex: "#1e3a5f",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 72,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "jumpsuit-2",
    name: "سلوبيت كاجوال مريح",
    category: "سلوبيتات",
    price: 450,
    description: "سلوبيت عملي ومريح للاستخدام اليومي",
    materials: "قطن مخلوط (70% قطن، 30% بوليستر) - قماش مريح وعملي",
    colors: [
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 89,
    featured: false,
    customSizesAvailable: false,
  },
  {
    id: "jumpsuit-3",
    name: "سلوبيت واسع عصري",
    category: "سلوبيتات",
    price: 520,
    description: "سلوبيت بقصة واسعة عصرية وأنيقة",
    materials: "لينن مخلوط (60% لينن، 40% فيسكوز) - قماش طبيعي قابل للتنفس",
    colors: [
      {
        name: "أبيض",
        hex: "#FFFFFF",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 64,
    featured: false,
    customSizesAvailable: true,
  },

  // Suits
  {
    id: "suit-1",
    name: "بدلة رسمية أنيقة",
    category: "بدل",
    price: 850,
    description: "بدلة رسمية راقية مثالية للمناسبات الخاصة والاجتماعات المهمة",
    materials: "قماش تويل فاخر (65% بوليستر، 32% فيسكوز، 3% إيلاستين) - قماش محكم ومقاوم للتجعد مع مرونة خفيفة",
    colors: [
      {
        name: "أسود",
        hex: "#000000",
        images: [
          "/elegant-women-suit-modest-fashion.jpg?height=800&width=600&query=elegant black women suit modest formal fashion",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "كحلي",
        hex: "#1e3a5f",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "رمادي غامق",
        hex: "#36454F",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 67,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "suit-2",
    name: "بدلة كاجوال عصرية",
    category: "بدل",
    price: 680,
    description: "بدلة عصرية بتصميم كاجوال أنيق للاستخدام اليومي",
    materials: "قماش لينن مخلوط (55% لينن، 45% قطن) - قماش طبيعي قابل للتنفس ومريح للاستخدام اليومي",
    colors: [
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "رمادي فاتح",
        hex: "#D3D3D3",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أزرق فاتح",
        hex: "#B0E0E6",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 92,
    featured: false,
    customSizesAvailable: true,
  },
  {
    id: "suit-3",
    name: "بدلة تويد فاخرة",
    category: "بدل",
    price: 950,
    description: "بدلة تويد فاخرة بتصميم راقي وعصري",
    materials: "قماش تويد فاخر (40% صوف، 35% بوليستر، 20% أكريليك، 5% ألياف معدنية) - قماش منسوج فاخر مع لمسات معدنية",
    colors: [
      {
        name: "وردي وأبيض",
        hex: "#FFB6C1",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "كريمي وذهبي",
        hex: "#FFFACD",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 5.0,
    reviews: 43,
    featured: true,
    customSizesAvailable: true,
  },

  // Dresses
  {
    id: "dress-1",
    name: "فستان سهرة راقي",
    category: "فساتين",
    price: 780,
    description: "فستان سهرة أنيق بتصميم محتشم وراقي للمناسبات الخاصة",
    materials:
      "قماش شيفون حريري (100% بوليستر) مع بطانة ساتان (97% بوليستر، 3% إيلاستين) - قماش شفاف أنيق مع بطانة ناعمة",
    colors: [
      {
        name: "بنفسجي",
        hex: "#8B008B",
        images: [
          "/elegant-modest-dress-evening-wear.jpg?height=800&width=600&query=elegant purple evening dress modest formal",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أزرق ملكي",
        hex: "#4169E1",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أخضر زمردي",
        hex: "#50C878",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 112,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "dress-2",
    name: "فستان يومي مريح",
    category: "فساتين",
    price: 420,
    description: "فستان عملي ومريح للاستخدام اليومي بتصميم عصري",
    materials: "قماش قطن مخلوط (75% قطن، 22% بوليستر، 3% إيلاستين) - قماش قطني مريح مع مرونة خفيفة",
    colors: [
      {
        name: "وردي فاتح",
        hex: "#FFB6C1",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "بيج",
        hex: "#d4c5b9",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "أخضر نعناعي",
        hex: "#98FF98",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 145,
    featured: false,
    customSizesAvailable: false,
  },
  {
    id: "dress-3",
    name: "فستان مناسبات فاخر",
    category: "فساتين",
    price: 920,
    description: "فستان فاخر للمناسبات الخاصة مع تفاصيل راقية",
    materials:
      "قماش ساتان دوشيس فاخر (100% بوليستر) مع تطريز خرز وترتر (خرز زجاجي وترتر معدني) - قماش فاخر لامع مع تفاصيل مطرزة",
    colors: [
      {
        name: "ذهبي",
        hex: "#FFD700",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "فضي",
        hex: "#C0C0C0",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
      {
        name: "ذهبي وردي",
        hex: "#B76E79",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 5.0,
    reviews: 78,
    featured: true,
    customSizesAvailable: true,
  },
  {
    id: "dress-4",
    name: "فستان ماكسي أنيق",
    category: "فساتين",
    price: 580,
    description: "فستان ماكسي طويل بتصميم محتشم وأنيق",
    materials: "جيرسي قطني (95% قطن، 5% إيلاستين) - قماش مريح ومرن",
    colors: [
      {
        name: "رمادي",
        hex: "#808080",
        images: [
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
          "/placeholder.svg?height=800&width=600",
        ],
      },
    ],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 96,
    featured: false,
    customSizesAvailable: true,
  },
]

export function getAllProducts(): Product[] {
  return products
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured)
}
