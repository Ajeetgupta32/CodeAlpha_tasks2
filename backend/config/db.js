import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const formatDatabaseUrl = (rawUrl) => {
  if (!rawUrl) return 'postgresql://postgres:Ajeetgupta@localhost:5432/Ecomerce?sslmode=disable';
  let cleanUrl = rawUrl.trim();
  // Auto-heal any short Render hostname (dpg-xxxx -> dpg-xxxx.oregon-postgres.render.com)
  cleanUrl = cleanUrl.replace(/@(dpg-[a-z0-9_-]+)([:\/?]|$)/gi, (match, host, suffix) => {
    if (host.includes('.')) return match;
    return '@' + host + '.oregon-postgres.render.com' + suffix;
  });
  return cleanUrl;
};

const finalConnectionString = formatDatabaseUrl(process.env.DATABASE_URL);

const isRemoteDb = Boolean(
  finalConnectionString &&
  !finalConnectionString.includes('localhost') &&
  !finalConnectionString.includes('127.0.0.1')
);

const pool = new Pool({
  connectionString: finalConnectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : false
});

export const query = (text, params) => pool.query(text, params);

export const initDB = async () => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully!');

    // Initialize users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "cartData" JSONB DEFAULT '{}'::jsonb,
        "wishlist" JSONB DEFAULT '[]'::jsonb,
        "recentlyViewed" JSONB DEFAULT '[]'::jsonb,
        "savedForLater" JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "wishlist" JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "recentlyViewed" JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "savedForLater" JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "addresses" JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "rewardPoints" INT DEFAULT 100;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        "productId" VARCHAR(255) NOT NULL,
        "userId" VARCHAR(255) NOT NULL,
        "userName" VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255),
        comment TEXT NOT NULL,
        "isVerified" BOOLEAN DEFAULT false,
        "helpfulCount" INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'order',
        "isRead" BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        image JSONB DEFAULT '[]'::jsonb,
        category VARCHAR(255) NOT NULL,
        "subCategory" VARCHAR(255) NOT NULL,
        sizes JSONB DEFAULT '[]'::jsonb,
        bestseller BOOLEAN DEFAULT false,
        date BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        "userId" VARCHAR(255) NOT NULL,
        items JSONB NOT NULL DEFAULT '[]'::jsonb,
        amount NUMERIC NOT NULL,
        address JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(255) NOT NULL DEFAULT 'Order Placed',
        "paymentMethod" VARCHAR(255) NOT NULL,
        payment BOOLEAN NOT NULL DEFAULT false,
        date BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Initialize coupons table & product stock columns
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'percent',
        value NUMERIC NOT NULL,
        description TEXT,
        "minOrder" NUMERIC DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INT DEFAULT 50;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS "inStock" BOOLEAN DEFAULT true;
    `);

    // Seed default coupons if empty
    const countCoupons = await client.query('SELECT COUNT(*) as count FROM coupons');
    if (parseInt(countCoupons.rows[0]?.count || 0, 10) === 0) {
      await client.query(`
        INSERT INTO coupons (code, type, value, description, "minOrder", "isActive") VALUES
        ('WELCOME10', 'percent', 10, '10% OFF on all orders', 0, true),
        ('SAVE20', 'percent', 20, '20% OFF on orders above $80', 80, true),
        ('FLAT50', 'flat', 50, '$50 Flat discount on orders above $100', 100, true),
        ('SUPER30', 'percent', 30, '30% Mega Flash Sale Discount', 120, true)
      `);
      console.log('Default promotional coupons seeded into PostgreSQL.');
    }

    // Seed default verified reviews if empty
    const countReviews = await client.query('SELECT COUNT(*) as count FROM reviews');
    if (parseInt(countReviews.rows[0]?.count || 0, 10) === 0) {
      const prods = await client.query('SELECT id, name FROM products LIMIT 15');
      for (const prod of prods.rows) {
        await client.query(`
          INSERT INTO reviews ("productId", "userId", "userName", rating, title, comment, "isVerified", "helpfulCount") VALUES
          ($1, '1', 'Alex Johnson', 5, 'Exceptional quality & perfect fit!', 'Fabric feels premium and breathable. Stitching is solid and size matches the guide accurately.', true, 14),
          ($1, '2', 'Priya Sharma', 4, 'Really stylish and comfortable', 'Loved the color and cut. Fast delivery too. Would definitely recommend for everyday wear.', true, 8),
          ($1, '3', 'David Miller', 5, 'Exceeded my expectations', 'Washed it several times, color stays vibrant and no shrinking. Worth every dollar!', true, 5)
        `, [prod.id.toString()]);
      }
      console.log('Sample verified customer reviews seeded into PostgreSQL.');
    }

    // Initialize product_qa table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_qa (
        id SERIAL PRIMARY KEY,
        "productId" VARCHAR(255) NOT NULL,
        "userId" VARCHAR(255) NOT NULL,
        "userName" VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        "answeredBy" VARCHAR(255),
        "isAnswered" BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default Q&A if empty
    const countQA = await client.query('SELECT COUNT(*) as count FROM product_qa');
    if (parseInt(countQA.rows[0]?.count || 0, 10) === 0) {
      const prods = await client.query('SELECT id, name FROM products LIMIT 15');
      for (const prod of prods.rows) {
        await client.query(`
          INSERT INTO product_qa ("productId", "userId", "userName", question, answer, "answeredBy", "isAnswered") VALUES
          ($1, '1', 'Rahul Sharma', 'Is the fabric 100% pure cotton and breathable for summer?', 'Yes, this garment is made of 100% premium combed cotton, extremely soft, breathable, and pre-shrunk for comfortable all-day wear.', 'Store Manager (Verified Seller)', true),
          ($1, '2', 'Sneha Patel', 'Does this run true to standard Indian / US sizing?', 'Yes, it fits true to regular tailored size. If you prefer an oversized or relaxed street look, we recommend sizing up by one size.', 'Customer Support', true)
        `, [prod.id.toString()]);
      }
      console.log('Sample customer Q&A seeded into PostgreSQL.');
    }

    // Auto-heal duplicate fallback placeholder products in PostgreSQL
    const placeholderProducts = await client.query(`
      SELECT id FROM products WHERE image::text LIKE '%photo-1521572267360-ee0c2909d518%' OR name LIKE '%Cotton Cotton%'
    `);

    if (placeholderProducts.rows.length > 0) {
      const sampleCatalogs = [
        {
          name: "Men Slim-Fit Vintage Denim Jacket",
          description: "Premium washed rugged denim trucker jacket with button-front closure, dual chest pockets, and comfortable all-season weight.",
          price: 68,
          category: "Men",
          subCategory: "Winterwear",
          sizes: ["S", "M", "L", "XL"],
          bestseller: true,
          image: ["https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=600&auto=format&fit=crop"]
        },
        {
          name: "Women Elegant Floral Summer Midi Dress",
          description: "Breathable airy chiffon fabric with subtle ruffle detailing, A-line silhouette, and comfortable elastic smocked bodice.",
          price: 54,
          category: "Women",
          subCategory: "Topwear",
          sizes: ["XS", "S", "M", "L"],
          bestseller: true,
          image: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop"]
        },
        {
          name: "Men Classic Oxford Cotton Button-Down Shirt",
          description: "100% pure combed cotton tailored shirt with button-down collar, wrinkle-resistant finish, and versatile casual-smart styling.",
          price: 42,
          category: "Men",
          subCategory: "Topwear",
          sizes: ["S", "M", "L", "XL", "XXL"],
          bestseller: false,
          image: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop"]
        },
        {
          name: "Women Urban Oversized Heavyweight Fleece Hoodie",
          description: "Ultra-cozy brushed fleece hoodie featuring dropped shoulders, kangaroo pocket, and double-layered ribbed cuffs.",
          price: 48,
          category: "Women",
          subCategory: "Winterwear",
          sizes: ["S", "M", "L"],
          bestseller: true,
          image: ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop"]
        },
        {
          name: "Men Relaxed Fit Tapered Cargo Pants",
          description: "Durable cotton twill utility cargo pants with 6 functional pockets, elastic drawstring waist, and reinforced knee stitching.",
          price: 52,
          category: "Men",
          subCategory: "Bottomwear",
          sizes: ["30", "32", "34", "36"],
          bestseller: false,
          image: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop"]
        },
        {
          name: "Women High-Rise Tailored Wide-Leg Trousers",
          description: "Flowing structured crepe trousers with front pleats, hidden side zip, and a lengthening high-waisted cut.",
          price: 58,
          category: "Women",
          subCategory: "Bottomwear",
          sizes: ["XS", "S", "M", "L"],
          bestseller: true,
          image: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop"]
        },
        {
          name: "Kids Colorful Organic Cotton Graphic Sweatshirt",
          description: "Super-soft organic fleece with playful modern print, ribbed crewneck, and tagless neckline for maximum comfort.",
          price: 32,
          category: "Kids",
          subCategory: "Topwear",
          sizes: ["4Y", "6Y", "8Y", "10Y"],
          bestseller: false,
          image: ["https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&auto=format&fit=crop"]
        },
        {
          name: "Men Heritage Wool Blend Winter Overcoat",
          description: "Structured single-breasted wool trench coat with notched lapels, deep welt pockets, and insulated satin lining.",
          price: 110,
          category: "Men",
          subCategory: "Winterwear",
          sizes: ["M", "L", "XL"],
          bestseller: true,
          image: ["https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop"]
        }
      ];

      for (let i = 0; i < placeholderProducts.rows.length; i++) {
        const prodId = placeholderProducts.rows[i].id;
        const sample = sampleCatalogs[i % sampleCatalogs.length];
        await client.query(`
          UPDATE products 
          SET name = $1, description = $2, price = $3, category = $4, "subCategory" = $5, sizes = $6, bestseller = $7, image = $8
          WHERE id = $9
        `, [
          sample.name,
          sample.description,
          sample.price,
          sample.category,
          sample.subCategory,
          JSON.stringify(sample.sizes),
          sample.bestseller,
          JSON.stringify(sample.image),
          prodId
        ]);
      }
      console.log(`Updated ${placeholderProducts.rows.length} placeholder products with diverse fashion catalog items.`);
    }

    client.release();
    console.log('PostgreSQL tables initialized successfully.');
  } catch (error) {
    console.error('Database connection / initialization failed:', error.message);
  }
};

export default pool;
