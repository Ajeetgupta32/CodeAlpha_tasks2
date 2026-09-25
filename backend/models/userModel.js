import { query } from '../config/db.js';

class UserModel {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.cartData = data.cartData || {};
    this.wishlist = data.wishlist || [];
    this.recentlyViewed = data.recentlyViewed || [];
    this.savedForLater = data.savedForLater || [];
    this.addresses = data.addresses || [];
    this.phone = data.phone || '';
    this.rewardPoints = Number(data.rewardPoints || 100);
    this.role = data.role || 'customer';
    if (data.id || data._id) {
      this.id = data.id || data._id;
      this._id = (data.id || data._id).toString();
    }
  }

  async save() {
    const res = await query(
      `INSERT INTO users (name, email, password, "cartData", "wishlist", "recentlyViewed", "savedForLater", "addresses", phone, "rewardPoints", role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        this.name,
        this.email,
        this.password,
        JSON.stringify(this.cartData || {}),
        JSON.stringify(this.wishlist || []),
        JSON.stringify(this.recentlyViewed || []),
        JSON.stringify(this.savedForLater || []),
        JSON.stringify(this.addresses || []),
        this.phone || '',
        this.rewardPoints || 100,
        this.role || 'customer'
      ]
    );
    const row = res.rows[0];
    return UserModel.formatUser(row);
  }

  static formatUser(row) {
    if (!row) return null;
    const parseField = (f, def) => {
      if (f === undefined || f === null) return def;
      if (typeof f === 'string') {
        try { return JSON.parse(f); } catch { return def; }
      }
      return f;
    };

    return {
      id: row.id,
      _id: row.id.toString(),
      name: row.name,
      email: row.email,
      password: row.password,
      phone: row.phone || '',
      rewardPoints: Number(row.rewardPoints || 100),
      role: row.role || 'customer',
      cartData: parseField(row.cartData, {}),
      wishlist: parseField(row.wishlist, []),
      recentlyViewed: parseField(row.recentlyViewed, []),
      savedForLater: parseField(row.savedForLater, []),
      addresses: parseField(row.addresses, [])
    };
  }

  static async findOne(filter = {}) {
    if (filter.email) {
      const res = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [filter.email]);
      return this.formatUser(res.rows[0]);
    }
    if (filter._id || filter.id) {
      return this.findById(filter._id || filter.id);
    }
    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query('SELECT * FROM users WHERE id::text = $1::text LIMIT 1', [id.toString()]);
    return this.formatUser(res.rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    if (!id) return null;
    const sets = [];
    const values = [id.toString()];

    if (update.cartData !== undefined) {
      values.push(JSON.stringify(update.cartData || {}));
      sets.push(`"cartData" = $${values.length}`);
    }
    if (update.wishlist !== undefined) {
      values.push(JSON.stringify(update.wishlist || []));
      sets.push(`"wishlist" = $${values.length}`);
    }
    if (update.recentlyViewed !== undefined) {
      values.push(JSON.stringify(update.recentlyViewed || []));
      sets.push(`"recentlyViewed" = $${values.length}`);
    }
    if (update.savedForLater !== undefined) {
      values.push(JSON.stringify(update.savedForLater || []));
      sets.push(`"savedForLater" = $${values.length}`);
    }
    if (update.addresses !== undefined) {
      values.push(JSON.stringify(update.addresses || []));
      sets.push(`"addresses" = $${values.length}`);
    }
    if (update.name !== undefined) {
      values.push(update.name);
      sets.push(`name = $${values.length}`);
    }
    if (update.phone !== undefined) {
      values.push(update.phone);
      sets.push(`phone = $${values.length}`);
    }
    if (update.rewardPoints !== undefined) {
      values.push(Number(update.rewardPoints));
      sets.push(`"rewardPoints" = $${values.length}`);
    }

    if (sets.length === 0) return this.findById(id);

    const res = await query(
      `UPDATE users SET ${sets.join(', ')} WHERE id::text = $1 RETURNING *`,
      values
    );
    return this.formatUser(res.rows[0]);
  }
}

export default UserModel;