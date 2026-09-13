const Preorder = require('../models/Preorder');

class PreorderService {
  static _buildQuery(userId, options = {}) {
    const {
      search = '',
      sellerFilter = '',
      statusFilter = '',
      timeFilter = ''
    } = options;

    const query = userId ? { user: userId } : {};

    if (sellerFilter) {
      query.seller = sellerFilter;
    }
    
    if (statusFilter) {
      query.delivery_status = statusFilter;
    }

    if (timeFilter) {
      if (timeFilter === 'upcoming_month') {
        const today = new Date();
        const currentMonthStr = today.toISOString().slice(0, 7);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthStr = nextMonth.toISOString().slice(0, 7);
        
        if (!statusFilter) {
          query.delivery_status = { $nin: ['Delivered', 'Cancelled'] };
        }
        query.eta = { $in: [currentMonthStr, nextMonthStr] };
      } else {
        if (!statusFilter) {
          query.delivery_status = { $nin: ['Delivered', 'Cancelled'] };
        }
        query.eta = { $lte: timeFilter };
      }
    }

    if (search) {
      const rx = new RegExp(search, 'i');
      query.$or = [
        { seller: { $regex: rx } },
        { models: { $regex: rx } }
      ];
    }

    return query;
  }

  static async getAllPreorders(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      sortOrder = 'desc'
    } = options;

    const query = PreorderService._buildQuery(userId, options);

    const sort = { serial_number: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Preorder.find(query).populate('seller_id').sort(sort).skip(skip).limit(limit).lean(),
      Preorder.countDocuments(query)
    ]);

    return {
      data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  static async addPreorder(seller, models, eta, totalPrice, poAmount, onArrivalAmount, deliveryStatus = "Pending", userId, sellerId = null, sellerLink = null) {
    const query = userId ? { user: userId } : {};

    // 1. Determine next serial number per user
    const lastPo = await Preorder.findOne(query).sort({ serial_number: -1 }).lean();
    const serialNumber = lastPo ? lastPo.serial_number + 1 : 1;
    const dateAdded = new Date().toISOString().split('T')[0];

    // 2. Create preorder
    const newPo = new Preorder({
      serial_number: serialNumber,
      seller: seller ? seller.trim() : '',
      seller_id: sellerId,
      seller_link: sellerLink ? sellerLink.trim() : '',
      models: models.trim(),
      eta,
      total_price: totalPrice,
      po_amount: poAmount,
      on_arrival_amount: onArrivalAmount,
      delivery_status: deliveryStatus,
      date_added: dateAdded,
      user: userId
    });
    await newPo.save();
    return newPo;
  }

  static async updatePreorder(serialNumber, updates, userId) {
    const query = userId ? { user: userId } : {};
    const po = await Preorder.findOne({ serial_number: serialNumber, ...query });
    if (!po) {
      throw new Error(`Preorder #${serialNumber} not found`);
    }

    const keyMap = {
      "Seller": "seller", "seller": "seller",
      "SellerId": "seller_id", "seller_id": "seller_id",
      "Seller Link": "seller_link", "seller_link": "seller_link",
      "Models": "models", "models": "models",
      "ETA": "eta", "eta": "eta",
      "Total Price": "total_price", "total_price": "total_price",
      "PO Amount": "po_amount", "po_amount": "po_amount",
      "On Arrival Amount": "on_arrival_amount", "on_arrival_amount": "on_arrival_amount",
      "Delivery Status": "delivery_status", "delivery_status": "delivery_status"
    };

    for (const [rawKey, value] of Object.entries(updates)) {
      const modelKey = keyMap[rawKey] || rawKey.toLowerCase().replace(/ /g, "_");
      if (po[modelKey] !== undefined) {
        if (['total_price', 'po_amount', 'on_arrival_amount'].includes(modelKey)) {
          let val = value;
          if (typeof value === 'string') {
            val = parseFloat(value.replace(/[₹,]/g, '').trim()) || 0.0;
          }
          po[modelKey] = val;
        } else if (modelKey === 'seller_id') {
          po[modelKey] = value;
        } else {
          po[modelKey] = String(value).trim();
        }
      }
    }

    await po.save();
    return po;
  }

  static async deletePreorder(serialNumber, userId) {
    const query = userId ? { user: userId } : {};
    const po = await Preorder.findOne({ serial_number: serialNumber, ...query });
    if (!po) {
      throw new Error(`Preorder #${serialNumber} not found`);
    }

    await Preorder.deleteOne({ _id: po._id });

    // Re-sync serial numbers
    const allPos = await Preorder.find(query).sort({ serial_number: 1 });
    for (let i = 0; i < allPos.length; i++) {
      const targetSerial = i + 1;
      if (allPos[i].serial_number !== targetSerial) {
        allPos[i].serial_number = targetSerial;
        await allPos[i].save();
      }
    }

    return true;
  }

  static async getSellers(userId) {
    const query = userId ? { user: userId } : {};
    return await Preorder.distinct("seller", query);
  }

  static async getStatistics(userId, options = {}) {
    const query = PreorderService._buildQuery(userId, options);
    const preorders = await Preorder.find(query).populate('seller_id').lean();
    if (!preorders || preorders.length === 0) {
      return {
        total_preorders: 0,
        total_value: 0,
        total_po_amount: 0,
        total_on_arrival: 0,
        active_paid: 0,
        active_remaining: 0,
        total_paid: 0,
        status_breakdown: {},
        upcoming_arrivals: []
      };
    }

    const totalPreorders = preorders.length;
    const totalPrice = preorders.reduce((sum, po) => sum + (po.total_price || 0), 0);
    const totalPoAmount = preorders.reduce((sum, po) => sum + (po.po_amount || 0), 0);
    const totalOnArrival = preorders.reduce((sum, po) => sum + (po.on_arrival_amount || 0), 0);

    const statusBreakdown = {};
    let activePaid = 0;
    let activeRemaining = 0;
    let totalPaid = 0;
    const upcomingArrivals = [];

    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 7);

    for (const po of preorders) {
      const status = po.delivery_status || "Pending";
      const statusLower = status.toLowerCase();
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

      if (statusLower === "delivered") {
        totalPaid += (po.total_price || 0);
      } else if (statusLower === "cancelled") {
        // For cancelled items, paid PO amount remains, but arrival amount liability is 0
        const poAmt = (po.po_amount || 0);
        activePaid += poAmt;
        totalPaid += poAmt;
      } else {
        // Active (non-delivered, non-cancelled) items
        const poAmt = (po.po_amount || 0);
        const arrivalAmt = (po.on_arrival_amount || 0);

        activePaid += poAmt;
        totalPaid += poAmt;

        if (["paid", "shipped"].includes(statusLower)) {
          activePaid += arrivalAmt;
          totalPaid += arrivalAmt;
        } else {
          activeRemaining += arrivalAmt;
        }
      }

      if (status !== "Delivered" && status !== "Cancelled" && po.eta) {
        const etaMonth = String(po.eta).slice(0, 7);
        if (etaMonth === currentMonthStr || etaMonth === nextMonthStr) {
          upcomingArrivals.push({
            serial: po.serial_number,
            models: po.models,
            eta: etaMonth,
            seller: po.seller_id ? po.seller_id.alias : po.seller,
            status: status
          });
        }
      }
    }

    return {
      total_preorders: totalPreorders,
      total_value: Number(totalPrice.toFixed(2)),
      total_po_amount: Number(totalPoAmount.toFixed(2)),
      total_on_arrival: Number(totalOnArrival.toFixed(2)),
      active_paid: Number(activePaid.toFixed(2)),
      active_remaining: Number(activeRemaining.toFixed(2)),
      total_paid: Number(totalPaid.toFixed(2)),
      status_breakdown: statusBreakdown,
      upcoming_arrivals: upcomingArrivals.sort((a, b) => a.eta.localeCompare(b.eta))
    };
  }
}

module.exports = PreorderService;
