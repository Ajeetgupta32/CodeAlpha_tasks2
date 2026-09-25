import { query } from '../config/db.js';

class OrderModel {
  constructor(data = {}) {
    this.userId = data.userId ? data.userId.toString() : '';
    this.items = Array.isArray(data.items) ? data.items : [];
    this.amount = Number(data.amount) || 0;
    this.address = data.address || {};
    this.status = data.status || 'Order Placed';
    this.paymentMethod = data.paymentMethod || 'COD';
    this.payment = Boolean(data.payment);
    this.date = data.date ? Number(data.date) : Date.now();
    if (data.id || data._id) {
      this.id = data.id || data._id;
      this._id = (data.id || data._id).toString();
    }
  }

  async save() {
    const res = await query(
      `INSERT INTO orders ("userId", items, amount, address, status, "paymentMethod", payment, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        this.userId,
        JSON.stringify(this.items),
        this.amount,
        JSON.stringify(this.address),
        this.status,
        this.paymentMethod,
        this.payment,
        this.date
      ]
    );
    const row = res.rows[0];
    const formatted = OrderModel.formatOrder(row);
    this.id = formatted.id;
    this._id = formatted._id;
    return formatted;
  }

  static formatOrder(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id.toString(),
      userId: row.userId,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
      amount: Number(row.amount),
      address: typeof row.address === 'string' ? JSON.parse(row.address) : (row.address || {}),
      status: row.status,
      paymentMethod: row.paymentMethod,
      payment: Boolean(row.payment),
      date: Number(row.date)
    };
  }

  static async find(filter = {}) {
    if (filter.userId) {
      const res = await query('SELECT * FROM orders WHERE "userId"::text = $1::text ORDER BY id DESC', [filter.userId.toString()]);
      return res.rows.map(row => this.formatOrder(row));
    }
    const res = await query('SELECT * FROM orders ORDER BY id DESC');
    return res.rows.map(row => this.formatOrder(row));
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query('SELECT * FROM orders WHERE id::text = $1::text LIMIT 1', [id.toString()]);
    return this.formatOrder(res.rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    if (!id) return null;

    const updates = [];
    const values = [];
    let idx = 1;

    if (update.payment !== undefined) {
      updates.push(`payment = $${idx++}`);
      values.push(Boolean(update.payment));
    }
    if (update.status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(update.status);
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id.toString());
    const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id::text = $${idx}::text RETURNING *`;
    const res = await query(sql, values);
    return this.formatOrder(res.rows[0]);
  }

  static async findByIdAndDelete(id) {
    if (!id) return null;
    const res = await query('DELETE FROM orders WHERE id::text = $1::text RETURNING *', [id.toString()]);
    return this.formatOrder(res.rows[0]);
  }
}

export default OrderModel;