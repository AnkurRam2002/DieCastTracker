const Model = require('../models/Model');
const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Brand = require('../models/Brand');

class ModelService {
  static async getAllModels(userId, options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      brandFilter = '',
      mainSeriesFilter = '',
      seriesFilter = '', // This maps to subseries on frontend
      sortOrder = 'asc',
      tab = 'hotwheels'
    } = options;

    const query = userId ? { user: userId } : {};

    // Base Brand references
    const hwBrand = await Brand.findOne({ name: 'Hot Wheels', ...query });

    // 1. Exact Filters
    if (tab === 'hotwheels') {
      if (hwBrand) query['metadata.brand'] = hwBrand._id;
    } else if (tab === 'others') {
      if (hwBrand) query['metadata.brand'] = { $ne: hwBrand._id };
      if (brandFilter) {
        const tgtBrand = await Brand.findOne({ name: brandFilter, ...query });
        if (tgtBrand) query['metadata.brand'] = tgtBrand._id;
      }
    }

    if (mainSeriesFilter) {
      const tgtSeries = await Series.findOne({ name: mainSeriesFilter, ...query });
      if (tgtSeries) query['metadata.series'] = tgtSeries._id;
    }

    if (seriesFilter) {
      const tgtSub = await Subseries.findOne({ name: seriesFilter, ...query });
      if (tgtSub) query['metadata.subseries'] = tgtSub._id;
    }

    // 2. Search Logic
    if (search) {
      const rx = new RegExp(search, 'i');
      const [b, s, sub] = await Promise.all([
        Brand.find({ name: rx, ...query }, '_id').lean(),
        Series.find({ name: rx, ...query }, '_id').lean(),
        Subseries.find({ name: rx, ...query }, '_id').lean()
      ]);
      const orConditions = [{ model_name: { $regex: rx } }];
      if (b.length > 0) orConditions.push({ 'metadata.brand': { $in: b.map(x => x._id) } });
      if (s.length > 0) orConditions.push({ 'metadata.series': { $in: s.map(x => x._id) } });
      if (sub.length > 0) orConditions.push({ 'metadata.subseries': { $in: sub.map(x => x._id) } });
      query.$or = orConditions;
    }

    // 3. Execution
    const sort = { serial_number: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    let data;
    let total;

    if (tab === 'others') {
      const pipeline = [
        { $match: query },
        { $lookup: { from: 'brands', localField: 'metadata.brand', foreignField: '_id', as: 'brandDoc' } },
        { $unwind: { path: '$brandDoc', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'series', localField: 'metadata.series', foreignField: '_id', as: 'seriesDoc' } },
        { $unwind: { path: '$seriesDoc', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'subseries', localField: 'metadata.subseries', foreignField: '_id', as: 'subseriesDoc' } },
        { $unwind: { path: '$subseriesDoc', preserveNullAndEmptyArrays: true } },
        { $sort: { 
            'brandDoc.name': 1, 
            'seriesDoc.name': 1, 
            'subseriesDoc.name': 1, 
            'serial_number': sortOrder === 'desc' ? -1 : 1 
          } 
        },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            paginatedData: [
              { $skip: skip },
              { $limit: limit },
              { $addFields: {
                  'metadata.brand': '$brandDoc',
                  'metadata.series': '$seriesDoc',
                  'metadata.subseries': '$subseriesDoc'
              }},
              { $project: { brandDoc: 0, seriesDoc: 0, subseriesDoc: 0 } }
            ]
          }
        }
      ];

      const result = await Model.aggregate(pipeline);
      data = result[0].paginatedData;
      total = result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
    } else {
      [data, total] = await Promise.all([
        Model.find(query)
          .populate('metadata.brand')
          .populate('metadata.series')
          .populate('metadata.subseries')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Model.countDocuments(query)
      ]);
    }

    return {
      data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  static async addModel(modelName, seriesName, subseriesName, brandName = "Hot Wheels", modelNo = "", userId) {
    const query = userId ? { user: userId } : {};

    // 1. Determine next serial number logic per user
    const lastModel = await Model.findOne(query).sort({ serial_number: -1 }).lean();
    const serialNumber = lastModel ? lastModel.serial_number + 1 : 1;

    // 2. Find or create brand
    let brand = await Brand.findOne({ name: brandName.trim(), ...query });
    if (!brand) {
      brand = new Brand({ name: brandName.trim(), user: userId });
      await brand.save();
    }

    // 3. Find or create series
    let series = null;
    if (seriesName && seriesName.trim()) {
      series = await Series.findOne({ name: seriesName.trim(), brand: brand._id, ...query });
      if (!series) {
        series = new Series({ 
          name: seriesName.trim(),
          brand: brand._id,
          user: userId
        });
        await series.save();
      }
    }

    // 4. Find or create subseries
    let subseries = null;
    if (series && subseriesName && subseriesName.trim()) {
      subseries = await Subseries.findOne({
        name: subseriesName.trim(),
        series: series._id,
        ...query
      });
      if (!subseries) {
        subseries = new Subseries({
          name: subseriesName.trim(),
          series: series._id,
          user: userId
        });
        await subseries.save();
      }
    }

    // 5. Create model
    const newModel = new Model({
      serial_number: serialNumber,
      model_name: modelName.trim(),
      user: userId,
      metadata: {
        brand: brand._id,
        series: series ? series._id : null,
        subseries: subseries ? subseries._id : null,
        model_no: modelNo ? String(modelNo).trim() : ""
      }
    });
    await newModel.save();
    return await Model.findById(newModel._id).populate('metadata.brand metadata.series metadata.subseries');
  }

  static async updateModel(serialNumber, updates, userId) {
    const query = userId ? { user: userId } : {};
    const modelObj = await Model.findOne({ serial_number: serialNumber, ...query });
    if (!modelObj) {
      throw new Error(`Model with S.No ${serialNumber} not found`);
    }

    if (updates["Model Name"]) {
      modelObj.model_name = String(updates["Model Name"]).trim();
    }

    if (Object.prototype.hasOwnProperty.call(updates, "Model No")) {
      modelObj.metadata.model_no = updates["Model No"] ? String(updates["Model No"]).trim() : "";
    }

    if (updates["Series"] || updates["Subseries"] || updates["brand"] || updates["Brand"]) {
      const brandName = (updates["brand"] || updates["Brand"] || (modelObj.metadata.brand ? (await Brand.findById(modelObj.metadata.brand)).name : "Hot Wheels")).trim();
      const seriesName = (updates["Series"] || (modelObj.metadata.series ? (await Series.findById(modelObj.metadata.series)).name : "")).trim();
      const subseriesName = (updates["Subseries"] || (modelObj.metadata.subseries ? (await Subseries.findById(modelObj.metadata.subseries)).name : "")).trim();

      // 1. Find or create brand
      let brand = await Brand.findOne({ name: brandName, ...query });
      if (!brand) {
        brand = new Brand({ name: brandName, user: userId });
        await brand.save();
      }
      modelObj.metadata.brand = brand._id;

      // 2. Find or create series
      let series = null;
      if (seriesName && seriesName.trim()) {
        series = await Series.findOne({ name: seriesName.trim(), brand: brand._id, ...query });
        if (!series) {
          series = new Series({ name: seriesName.trim(), brand: brand._id, user: userId });
          await series.save();
        }
      }
      modelObj.metadata.series = series ? series._id : null;

      // 3. Find or create subseries
      let subseries = null;
      if (series && subseriesName && subseriesName.trim()) {
        subseries = await Subseries.findOne({ name: subseriesName.trim(), series: series._id, ...query });
        if (!subseries) {
          subseries = new Subseries({ name: subseriesName.trim(), series: series._id, user: userId });
          await subseries.save();
        }
      }
      modelObj.metadata.subseries = subseries ? subseries._id : null;
    }

    await modelObj.save();
    return await Model.findById(modelObj._id).populate('metadata.brand metadata.series metadata.subseries');
  }

  static async deleteModel(serialNumber, userId) {
    const query = userId ? { user: userId } : {};
    const modelObj = await Model.findOne({ serial_number: serialNumber, ...query });
    if (!modelObj) {
      throw new Error(`Model with S.No ${serialNumber} not found`);
    }

    await Model.deleteOne({ _id: modelObj._id });

    // Re-sync serial numbers for this user specifically
    const allModels = await Model.find(query).sort({ serial_number: 1 });
    for (let i = 0; i < allModels.length; i++) {
      const targetSerial = i + 1;
      if (allModels[i].serial_number !== targetSerial) {
        allModels[i].serial_number = targetSerial;
        await allModels[i].save();
      }
    }

    return true;
  }
}

module.exports = ModelService;
