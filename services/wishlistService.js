const Wishlist = require('../models/Wishlist');

class WishlistService {
  async getAllItems(userId, { search = '', statusFilter = 'all', sortOrder = 'newest' } = {}) {
    const query = { user: userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { series: { $regex: search, $options: 'i' } },
        { subseries: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { link: { $regex: search, $options: 'i' } },
        { 'sellers.seller_name': { $regex: search, $options: 'i' } },
        { 'sellers.notes': { $regex: search, $options: 'i' } },
        { 'sellers.link': { $regex: search, $options: 'i' } }
      ];
    }

    if (statusFilter === 'pending') {
      query.purchased = false;
    } else if (statusFilter === 'purchased') {
      query.purchased = true;
    }

    let sort = {};
    if (sortOrder === 'price_asc') sort.price = 1;
    else if (sortOrder === 'price_desc') sort.price = -1;
    else if (sortOrder === 'oldest') sort.createdAt = 1;
    else sort.createdAt = -1; // default newest

    const items = await Wishlist.find(query).sort(sort);
    return items;
  }

  calculateLowestPrice(sellers, explicitPrice) {
    if (Array.isArray(sellers) && sellers.length > 0) {
      const validPrices = sellers.map(s => Number(s.price) || 0).filter(p => p > 0);
      if (validPrices.length > 0) {
        return Math.min(...validPrices);
      }
    }
    return explicitPrice ? Number(explicitPrice) : 0;
  }

  async addItem(userId, { name, brand, series, subseries, price, link, sellers, image, notes, purchased }) {
    const processedSellers = Array.isArray(sellers) ? sellers.map(s => ({
      seller_name: s.seller_name ? s.seller_name.trim() : '',
      price: s.price ? Number(s.price) : 0,
      link: s.link ? s.link.trim() : '',
      notes: s.notes ? s.notes.trim() : ''
    })) : [];

    const computedPrice = this.calculateLowestPrice(processedSellers, price);

    const newItem = new Wishlist({
      user: userId,
      name: name && name.trim() ? name.trim() : 'Untitled Collectible',
      brand: brand ? brand.trim() : '',
      series: series ? series.trim() : '',
      subseries: subseries ? subseries.trim() : '',
      price: computedPrice,
      link: link ? link.trim() : '',
      sellers: processedSellers,
      image: image || '',
      notes: notes ? notes.trim() : '',
      purchased: Boolean(purchased)
    });

    await newItem.save();
    return newItem;
  }

  async updateItem(userId, itemId, updateData) {
    const item = await Wishlist.findOne({ _id: itemId, user: userId });
    if (!item) {
      throw new Error('Wishlist item not found');
    }

    if (updateData.name !== undefined) item.name = updateData.name.trim() || 'Untitled Collectible';
    if (updateData.brand !== undefined) item.brand = updateData.brand.trim();
    if (updateData.series !== undefined) item.series = updateData.series.trim();
    if (updateData.subseries !== undefined) item.subseries = updateData.subseries.trim();

    if (Array.isArray(updateData.sellers)) {
      item.sellers = updateData.sellers.map(s => ({
        seller_name: s.seller_name ? s.seller_name.trim() : '',
        price: s.price ? Number(s.price) : 0,
        link: s.link ? s.link.trim() : '',
        notes: s.notes ? s.notes.trim() : ''
      }));
    }

    const computedPrice = this.calculateLowestPrice(item.sellers, updateData.price !== undefined ? updateData.price : item.price);
    item.price = computedPrice;

    if (updateData.link !== undefined) item.link = updateData.link.trim();
    if (updateData.image !== undefined) item.image = updateData.image;
    if (updateData.notes !== undefined) item.notes = updateData.notes.trim();
    if (updateData.purchased !== undefined) item.purchased = Boolean(updateData.purchased);

    await item.save();
    return item;
  }

  async deleteItem(userId, itemId) {
    const result = await Wishlist.deleteOne({ _id: itemId, user: userId });
    if (result.deletedCount === 0) {
      throw new Error('Wishlist item not found or unauthorized');
    }
    return true;
  }

  async getStats(userId) {
    const items = await Wishlist.find({ user: userId });

    const totalItems = items.length;
    const pendingItems = items.filter(i => !i.purchased);
    const purchasedItems = items.filter(i => i.purchased);

    const wishlistValue = pendingItems.reduce((acc, i) => acc + (i.price || 0), 0);
    const purchasedValue = purchasedItems.reduce((acc, i) => acc + (i.price || 0), 0);
    const totalValue = items.reduce((acc, i) => acc + (i.price || 0), 0);
    const itemsWithPrice = items.filter(i => Number(i.price) > 0);
    const avgPrice = itemsWithPrice.length > 0 ? totalValue / itemsWithPrice.length : 0;

    return {
      totalItems,
      pendingCount: pendingItems.length,
      purchasedCount: purchasedItems.length,
      wishlistValue,
      purchasedValue,
      totalValue,
      avgPrice
    };
  }
}

module.exports = new WishlistService();
