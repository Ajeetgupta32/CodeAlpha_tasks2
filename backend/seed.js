import 'dotenv/config';
import { query, initDB } from './config/db.js';

const initialProducts = [
  {
    name: "Women Round Neck Cotton Top",
    description: "A lightweight, usually knitted, pullover shirt, close-fitting and with a round neckline and short sleeves, worn as an undershirt or outer garment.",
    price: 100,
    image: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["S", "M", "L"],
    bestseller: true,
    date: Date.now() - 100000
  },
  {
    name: "Men Round Neck Pure Cotton T-shirt",
    description: "Premium pure cotton everyday t-shirt with classic crew neck and modern regular fit.",
    price: 200,
    image: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop"],
    category: "Men",
    subCategory: "Topwear",
    sizes: ["M", "L", "XL"],
    bestseller: true,
    date: Date.now() - 90000
  },
  {
    name: "Girls Round Neck Cotton Top",
    description: "Breathable and comfortable soft cotton top for daily wear and casual outings.",
    price: 220,
    image: ["https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop"],
    category: "Kids",
    subCategory: "Topwear",
    sizes: ["S", "L", "XL"],
    bestseller: true,
    date: Date.now() - 80000
  },
  {
    name: "Men Slim Fit Casual Denim Jacket",
    description: "Timeless trucker-style denim jacket crafted from rugged washed denim.",
    price: 350,
    image: ["https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop"],
    category: "Men",
    subCategory: "Winterwear",
    sizes: ["M", "L", "XL", "XXL"],
    bestseller: true,
    date: Date.now() - 70000
  },
  {
    name: "Women High-Rise Casual Chinos",
    description: "Tailored comfortable trousers with high-rise waist and stretch fabric.",
    price: 180,
    image: ["https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&auto=format&fit=crop"],
    category: "Women",
    subCategory: "Bottomwear",
    sizes: ["S", "M", "L"],
    bestseller: false,
    date: Date.now() - 60000
  },
  {
    name: "Kids Warm Winter Fleece Hoodie",
    description: "Plush interior fleece hoodie designed for cold weather play and comfort.",
    price: 150,
    image: ["https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&auto=format&fit=crop"],
    category: "Kids",
    subCategory: "Winterwear",
    sizes: ["S", "M", "L"],
    bestseller: true,
    date: Date.now() - 50000
  },
  {
    name: "Men Tapered Cargo Pants",
    description: "Multi-pocket tactical utility cargo pants with elastic tapered ankles.",
    price: 260,
    image: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop"],
    category: "Men",
    subCategory: "Bottomwear",
    sizes: ["M", "L", "XL"],
    bestseller: false,
    date: Date.now() - 40000
  },
  {
    name: "Women Floral Print Summer Dress",
    description: "Flowing lightweight floral dress perfect for spring and summer events.",
    price: 310,
    image: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop"],
    category: "Women",
    subCategory: "Topwear",
    sizes: ["S", "M", "L"],
    bestseller: true,
    date: Date.now() - 30000
  }
];

export async function seedDatabase() {
  await initDB();

  const countRes = await query('SELECT COUNT(*) FROM products');
  const count = parseInt(countRes.rows[0].count, 10);
  console.log(`Current products count in PostgreSQL: ${count}`);

  if (count === 0) {
    console.log('Seeding initial products into PostgreSQL...');
    for (const p of initialProducts) {
      await query(
        `INSERT INTO products (name, description, price, image, category, "subCategory", sizes, bestseller, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          p.name,
          p.description,
          p.price,
          JSON.stringify(p.image),
          p.category,
          p.subCategory,
          JSON.stringify(p.sizes),
          p.bestseller,
          p.date
        ]
      );
    }
    console.log(`Successfully seeded ${initialProducts.length} products!`);
  } else {
    console.log('Products already present, skipping seed.');
  }
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => process.exit(0)).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
