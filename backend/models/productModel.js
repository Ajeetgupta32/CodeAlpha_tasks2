import { query } from '../config/db.js';

class ProductModel {
  constructor(data = {}) {
    this.name = data.name;
    this.description = data.description;
    this.price = Number(data.price);
    this.category = data.category;
    this.subCategory = data.subCategory;
    this.bestseller = Boolean(data.bestseller);
    this.sizes = Array.isArray(data.sizes) ? data.sizes : [];
    this.image = Array.isArray(data.image) ? data.image : [];
    this.date = data.date ? Number(data.date) : Date.now();
    if (data.id || data._id) {
      this.id = data.id || data._id;
      this._id = (data.id || data._id).toString();
    }
  }

  async save() {
    const res = await query(
      `INSERT INTO products (name, description, price, image, category, "subCategory", sizes, bestseller, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        this.name,
        this.description,
        this.price,
        JSON.stringify(this.image),
        this.category,
        this.subCategory,
        JSON.stringify(this.sizes),
        this.bestseller,
        this.date
      ]
    );
    const row = res.rows[0];
    return ProductModel.formatProduct(row);
  }

  static formatProduct(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id.toString(),
      name: row.name,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      subCategory: row.subCategory,
      bestseller: Boolean(row.bestseller),
      sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : (row.sizes || []),
      image: typeof row.image === 'string' ? JSON.parse(row.image) : (row.image || []),
      date: Number(row.date)
    };
  }

  static async find(filter = {}) {
    const res = await query('SELECT * FROM products ORDER BY id DESC');
    return res.rows.map(row => this.formatProduct(row));
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query('SELECT * FROM products WHERE id::text = $1::text LIMIT 1', [id.toString()]);
    return this.formatProduct(res.rows[0]);
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    const res = await query('DELETE FROM products WHERE id::text = $1::text RETURNING *', [id.toString()]);
    return this.formatProduct(res.rows[0]);
  }

  static async searchProducts({
    search = '',
    category,
    subCategory,
    minPrice,
    maxPrice,
    sizes,
    bestseller,
    sort = 'relevant',
    page = 1,
    limit = 50
  } = {}) {
    const whereClauses = [];
    const values = [];

    // Search query on name or description
    if (search && search.trim() !== '') {
      values.push(`%${search.trim()}%`);
      whereClauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    // Category filter
    if (category) {
      const catList = Array.isArray(category)
        ? category
        : category.split(',').map(c => c.trim()).filter(Boolean);
      if (catList.length > 0) {
        values.push(catList);
        whereClauses.push(`category = ANY($${values.length})`);
      }
    }

    // SubCategory filter
    if (subCategory) {
      const subList = Array.isArray(subCategory)
        ? subCategory
        : subCategory.split(',').map(s => s.trim()).filter(Boolean);
      if (subList.length > 0) {
        values.push(subList);
        whereClauses.push(`"subCategory" = ANY($${values.length})`);
      }
    }

    // Min Price
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      values.push(Number(minPrice));
      whereClauses.push(`price >= $${values.length}`);
    }

    // Max Price
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      values.push(Number(maxPrice));
      whereClauses.push(`price <= $${values.length}`);
    }

    // Bestseller
    if (bestseller === true || bestseller === 'true') {
      whereClauses.push(`bestseller = true`);
    }

    // Sizes filter (PostgreSQL JSONB array intersection)
    if (sizes) {
      const sizeList = Array.isArray(sizes)
        ? sizes
        : sizes.split(',').map(s => s.trim()).filter(Boolean);
      if (sizeList.length > 0) {
        values.push(sizeList);
        whereClauses.push(`
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(
              CASE 
                WHEN jsonb_typeof(CASE WHEN sizes IS NULL THEN '[]'::jsonb ELSE sizes::jsonb END) = 'array'
                THEN sizes::jsonb
                ELSE '[]'::jsonb
              END
            ) AS elem
            WHERE elem = ANY($${values.length})
          )
        `);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Sort mapping
    let orderSql = 'id DESC';
    if (sort === 'low-high') {
      orderSql = 'price ASC, id DESC';
    } else if (sort === 'high-low') {
      orderSql = 'price DESC, id DESC';
    } else if (sort === 'newest') {
      orderSql = 'date DESC, id DESC';
    } else if (sort === 'relevant') {
      orderSql = '(CASE WHEN bestseller THEN 0 ELSE 1 END), id DESC';
    }

    // Pagination
    const numLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    const numPage = Math.max(1, Number(page) || 1);
    const offset = (numPage - 1) * numLimit;

    // Run products query & total count
    const countRes = await query(`SELECT COUNT(*) as count FROM products ${whereSql}`, values);
    const total = parseInt(countRes.rows[0]?.count || 0, 10);

    const productsSql = `SELECT * FROM products ${whereSql} ORDER BY ${orderSql} LIMIT ${numLimit} OFFSET ${offset}`;
    const productsRes = await query(productsSql, values);
    const products = productsRes.rows.map(row => this.formatProduct(row));

    // Get catalog price range & available options for facets
    const facetRes = await query(`
      SELECT 
        MIN(price) as min_price, 
        MAX(price) as max_price,
        COUNT(*) as total_catalog
      FROM products
    `);

    const facets = {
      minCatalogPrice: Number(facetRes.rows[0]?.min_price || 0),
      maxCatalogPrice: Number(facetRes.rows[0]?.max_price || 500),
      totalCatalog: parseInt(facetRes.rows[0]?.total_catalog || 0, 10)
    };

    return {
      products,
      total,
      page: numPage,
      totalPages: Math.ceil(total / numLimit),
      facets
    };
  }
}

export default ProductModel;