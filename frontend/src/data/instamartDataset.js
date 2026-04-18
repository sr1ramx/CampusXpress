import { buildProductImageMap, resolveProductImage } from "../utils/productImages";

const makeItems = (category, seeds, basePrice, step) =>
  Array.from({ length: 55 }, (_, index) => {
    const seed = seeds[index % seeds.length];
    return {
      id: `${category.toLowerCase().slice(0, 3)}-${index + 1}`,
      name: `${seed} ${Math.floor(index / seeds.length) + 1}`,
      price: basePrice + (index % 10) * step,
      category,
      image: getItemImage(category, seed, index),
      description: `${seed} delivered to your campus block in under 20 minutes.`
    };
  });

const foodSeeds = [
  "Paneer Roll",
  "Veg Burger",
  "Cheese Sandwich",
  "Masala Dosa",
  "Rice Bowl",
  "Pasta Box",
  "Protein Shake",
  "Momos",
  "Fries",
  "Noodles",
  "Pav Bhaji"
];

const grocerySeeds = [
  "Milk Pack",
  "Egg Tray",
  "Banana Bunch",
  "Bread Loaf",
  "Peanut Butter",
  "Rice Bag",
  "Dal Pack",
  "Cooking Oil",
  "Chocolate Bar",
  "Oats Jar",
  "Yogurt Cup"
];

const stationerySeeds = [
  "Notebook",
  "Pen Set",
  "Highlighter",
  "Sticky Notes",
  "Geometry Box",
  "Exam Pad",
  "Marker",
  "Calculator",
  "File Folder",
  "Desk Organizer",
  "Sketch Book"
];

const librarySeeds = [
  "Data Structures",
  "Operating Systems",
  "Database Systems",
  "Cloud Computing",
  "Software Engineering",
  "Machine Learning",
  "Cyber Security",
  "Economics",
  "Linear Algebra",
  "DevOps Handbook",
  "Placement Guide"
];

const productImages = buildProductImageMap({
  Food: foodSeeds,
  Grocery: grocerySeeds,
  Stationery: stationerySeeds,
  Library: librarySeeds
});

const getItemImage = (category, name) => resolveProductImage(name, category, productImages);

export const instamartDataset = {
  Food: makeItems("Food", foodSeeds, 70, 12),
  Grocery: makeItems("Grocery", grocerySeeds, 35, 8),
  Stationery: makeItems("Stationery", stationerySeeds, 25, 6),
  Library: makeItems("Library", librarySeeds, 0, 0)
};

export const categories = Object.keys(instamartDataset);
