const categoryDefaultImages = {
  food: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80",
  grocery: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
  stationery: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1000&q=80",
  library: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80"
};

const keywordImageRules = [
  {
    terms: ["burger", "sandwich", "wrap", "roll", "pizza", "fries", "momos", "bhature", "patty", "puff"],
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["dosa", "idli", "paratha", "poha", "upma", "maggi"],
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["rice", "pulao", "khichdi", "bowl"],
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db9c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["coffee", "tea", "lassi", "shake", "juice", "soda", "brew"],
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["salad", "fruit"],
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["milk", "curd", "yogurt", "cheese", "butter", "paneer"],
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["egg"],
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["banana", "apple", "orange", "spinach", "cucumber", "carrot", "capsicum", "broccoli", "onion", "potato", "tomato", "peas", "corn"],
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["rice", "dal", "oil", "salt", "sugar", "oats", "muesli", "cornflakes"],
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["toothpaste", "toothbrush", "shampoo", "detergent", "dishwash", "handwash", "tissue", "garbage"],
    image: "https://images.unsplash.com/photo-1583947582886-f40ec95dd752?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["notebook", "journal", "planner", "diary", "exam", "sketchbook", "drawing"],
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["pen", "pencil", "highlighter", "marker", "liner", "calligraphy", "refill"],
    image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["geometry", "ruler", "scissors", "stapler", "calculator", "folder", "clipboard", "organizer", "binder", "tape"],
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1000&q=80"
  },
  {
    terms: ["book", "guide", "handbook", "notes", "manual", "fundamentals", "programming", "mathematics", "physics", "literature", "science", "economics", "law"],
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1000&q=80"
  }
];

const normalizeProductName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+\d+$/, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const imageForName = (name, category) => {
  const normalized = normalizeProductName(name);
  for (const rule of keywordImageRules) {
    if (rule.terms.some((term) => normalized.includes(term))) {
      return rule.image;
    }
  }

  const categoryKey = String(category || "grocery").toLowerCase();
  return categoryDefaultImages[categoryKey] || categoryDefaultImages.grocery;
};

export const buildProductImageMap = (catalogNamesByCategory) => {
  const images = {};

  Object.entries(catalogNamesByCategory).forEach(([category, names]) => {
    names.forEach((name) => {
      images[name] = imageForName(name, category);
    });
  });

  return images;
};

export const resolveProductImage = (name, category, productImages = {}) => {
  return productImages[name] || imageForName(name, category);
};
