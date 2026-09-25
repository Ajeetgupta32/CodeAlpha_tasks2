import { query } from '../config/db.js';

// Executive Dashboard Analytics
const getDashboardStats = async (req, res) => {
  try {
    const revenueRes = await query(`
      SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(*) as total_orders
      FROM orders
      WHERE status != 'Cancelled'
    `);

    const orderStatusRes = await query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    const productsCountRes = await query(`
      SELECT COUNT(*) as total_products,
             COALESCE(SUM(CASE WHEN stock <= 10 THEN 1 ELSE 0 END), 0) as low_stock_count
      FROM products
    `);

    const usersCountRes = await query(`
      SELECT COUNT(*) as total_users FROM users
    `);

    const recentOrdersRes = await query(`
      SELECT id, "userId", amount, status, "paymentMethod", payment, date
      FROM orders
      ORDER BY id DESC
      LIMIT 6
    `);

    const topProductsRes = await query(`
      SELECT id, name, price, category, bestseller, stock
      FROM products
      ORDER BY (CASE WHEN bestseller THEN 1 ELSE 2 END), id DESC
      LIMIT 5
    `);

    // 7-day revenue trend data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toISOString().slice(0, 10);
      last7Days.push({ day: dayLabel, date: dateStr, revenue: 0, orders: 0 });
    }

    try {
      const orders7Days = await query(`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day, COALESCE(SUM(amount), 0) as daily_rev, COUNT(*) as daily_orders
        FROM orders
        WHERE status != 'Cancelled'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      `);

      orders7Days.rows.forEach(row => {
        const match = last7Days.find(d => d.date === row.day);
        if (match) {
          match.revenue = Number(row.daily_rev);
          match.orders = Number(row.daily_orders);
        }
      });
    } catch (e) {
      console.warn("7-day orders query:", e.message);
    }

    // Category breakdown
    let categoryBreakdown = [];
    try {
      const catRes = await query(`
        SELECT category, COUNT(*) as count, COALESCE(AVG(price), 0)::numeric(10,2) as avg_price
        FROM products
        GROUP BY category
      `);
      categoryBreakdown = catRes.rows.map(r => ({
        category: r.category,
        count: Number(r.count),
        avgPrice: Number(r.avg_price)
      }));
    } catch (e) {
      console.warn("Category query:", e.message);
    }

    const totalRev = Number(revenueRes.rows[0]?.total_revenue || 0);
    const totalOrd = Number(revenueRes.rows[0]?.total_orders || 0);

    const stats = {
      totalRevenue: totalRev,
      totalOrders: totalOrd,
      aov: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0,
      totalProducts: Number(productsCountRes.rows[0]?.total_products || 0),
      lowStockCount: Number(productsCountRes.rows[0]?.low_stock_count || 0),
      totalUsers: Number(usersCountRes.rows[0]?.total_users || 0),
      orderStatuses: orderStatusRes.rows,
      recentOrders: recentOrdersRes.rows,
      topProducts: topProductsRes.rows,
      salesTrends: last7Days,
      categoryBreakdown
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Coupons Management
const getCoupons = async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY id DESC');
    res.json({ success: true, coupons: result.rows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const getActiveCoupons = async (req, res) => {
  try {
    const result = await query('SELECT * FROM coupons WHERE "isActive" = true ORDER BY id DESC');
    res.json({ success: true, coupons: result.rows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const addCoupon = async (req, res) => {
  try {
    const { code, type, value, description, minOrder } = req.body;
    if (!code || !value) {
      return res.json({ success: false, message: "Code and discount value required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const result = await query(
      `INSERT INTO coupons (code, type, value, description, "minOrder", "isActive")
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING *`,
      [cleanCode, type || 'percent', Number(value), description || '', Number(minOrder || 0)]
    );

    res.json({ success: true, coupon: result.rows[0], message: "Coupon created successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.body;
    await query('DELETE FROM coupons WHERE id = $1', [id]);
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const toggleCoupon = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await query(
      'UPDATE coupons SET "isActive" = NOT "isActive" WHERE id = $1 RETURNING *',
      [id]
    );
    res.json({ success: true, coupon: result.rows[0], message: "Coupon status updated" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Inventory & Stock Management
const updateProductStock = async (req, res) => {
  try {
    const { id, stock, price, bestseller, inStock } = req.body;
    const sets = [];
    const values = [id];

    if (stock !== undefined) {
      values.push(Number(stock));
      sets.push(`stock = $${values.length}`);
    }
    if (price !== undefined) {
      values.push(Number(price));
      sets.push(`price = $${values.length}`);
    }
    if (bestseller !== undefined) {
      values.push(Boolean(bestseller));
      sets.push(`bestseller = $${values.length}`);
    }
    if (inStock !== undefined) {
      values.push(Boolean(inStock));
      sets.push(`"inStock" = $${values.length}`);
    }

    if (sets.length > 0) {
      const result = await query(
        `UPDATE products SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        values
      );
      return res.json({ success: true, product: result.rows[0], message: "Inventory updated" });
    }

    res.json({ success: false, message: "No updates provided" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Customer Accounts Management
const getAllUsers = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u."rewardPoints",
             jsonb_array_length(COALESCE(u.addresses, '[]'::jsonb)) as address_count,
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.amount), 0) as total_spent,
             u.created_at
      FROM users u
      LEFT JOIN orders o ON o."userId"::text = u.id::text
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getDashboardStats,
  getCoupons,
  getActiveCoupons,
  addCoupon,
  deleteCoupon,
  toggleCoupon,
  updateProductStock,
  getAllUsers
};
