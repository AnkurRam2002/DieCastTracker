const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Brand = require('../models/Brand');

class SeriesService {
  // Brand Management
  static async getAllBrands(userId) {
    const query = userId ? { user: userId } : {};
    return await Brand.find(query).sort({ name: 1 }).lean();
  }

  static async addBrand(name, userId) {
    const existing = await Brand.findOne({ name: name.trim(), user: userId });
    if (existing) throw new Error(`Brand '${name}' already exists`);
    const newBrand = new Brand({ name: name.trim(), user: userId });
    await newBrand.save();
    return newBrand;
  }

  static async updateBrand(id, name, userId) {
    const existing = await Brand.findOne({ name: name.trim(), user: userId, _id: { $ne: id } });
    if (existing) throw new Error(`Brand '${name}' already exists`);
    return await Brand.findOneAndUpdate({ _id: id, user: userId }, { name: name.trim() }, { new: true });
  }

  // Series Management
  static async getSeriesConfig(userId) {
    const query = userId ? { user: userId } : {};
    const brands = await Brand.find(query).lean();
    const seriesList = await Series.find(query).populate('brand').lean();
    
    // Result structure: brand_series_options[brandName][seriesName] = [sub1, sub2, ...]
    const brand_series_options = {};
    const brand_series_metadata = {};

    // Initialize with all brands to ensure they exist even if empty
    for (const b of brands) {
      brand_series_options[b.name] = {};
      brand_series_metadata[b.name] = {};
    }

    for (const s of seriesList) {
      const bName = s.brand ? s.brand.name : "Unknown";
      if (!brand_series_options[bName]) brand_series_options[bName] = {};
      
      const subs = await Subseries.find({ series: s._id }).lean();
      brand_series_options[bName][s.name] = subs.map(sub => sub.name).sort((a, b) => a.localeCompare(b));
    }

    return {
      series_options: brand_series_options,
      // Metadata can be kept for backward compatibility or future use
      series_metadata: brand_series_metadata 
    };
  }

  static async getAllSeries(userId) {
    const query = userId ? { user: userId } : {};
    const series = await Series.find(query).populate('brand').lean();
    return series.sort((a, b) => {
      const brandA = a.brand ? a.brand.name : "Unknown";
      const brandB = b.brand ? b.brand.name : "Unknown";
      
      if (brandA !== brandB) return brandA.localeCompare(brandB);
      return a.name.localeCompare(b.name);
    });
  }

  static async addSeries(name, brandId, userId) {
    const existing = await Series.findOne({ name: name.trim(), brand: brandId, user: userId });
    if (existing) throw new Error(`Series '${name}' already exists for this brand`);

    const newSeries = new Series({
      name: name.trim(),
      brand: brandId,
      user: userId
    });
    await newSeries.save();
    return newSeries;
  }

  static async updateSeries(id, updates, userId) {
    const { name, brandId } = updates;
    const series = await Series.findOne({ _id: id, user: userId });
    if (!series) throw new Error('Series not found');

    if (name || brandId) {
      const checkName = name ? name.trim() : series.name;
      const checkBrand = brandId || series.brand;
      
      const collision = await Series.findOne({ 
        _id: { $ne: id }, 
        name: checkName, 
        brand: checkBrand,
        user: userId
      });
      
      if (collision) throw new Error(`Series '${checkName}' already exists for this brand`);
      
      if (name) series.name = checkName;
      if (brandId) series.brand = checkBrand;
    }

    await series.save();
    return series;
  }

  // Subseries Management
  static async getAllSubseries(userId) {
    const query = userId ? { user: userId } : {};
    const subseries = await Subseries.find(query).populate({
      path: 'series',
      populate: { path: 'brand' }
    }).lean();

    return subseries.sort((a, b) => {
      const brandA = a.series?.brand ? a.series.brand.name : "Unknown";
      const brandB = b.series?.brand ? b.series.brand.name : "Unknown";
      if (brandA !== brandB) return brandA.localeCompare(brandB);

      const sA = a.series ? a.series.name : "Unknown";
      const sB = b.series ? b.series.name : "Unknown";
      if (sA !== sB) return sA.localeCompare(sB);

      return a.name.localeCompare(b.name);
    });
  }

  static async addSubseries(seriesId, name, userId) {
    const existing = await Subseries.findOne({ name: name.trim(), series: seriesId, user: userId });
    if (existing) throw new Error(`Subseries '${name}' already exists in this series`);

    const newSub = new Subseries({
      name: name.trim(),
      series: seriesId,
      user: userId
    });
    await newSub.save();
    return newSub;
  }

  static async updateSubseries(id, updates, userId) {
    const { name, seriesId } = updates;
    const sub = await Subseries.findOne({ _id: id, user: userId });
    if (!sub) throw new Error('Subseries not found');

    if (name) {
      const existing = await Subseries.findOne({ name: name.trim(), series: seriesId || sub.series, user: userId, _id: { $ne: id } });
      if (existing) throw new Error(`Subseries '${name}' already exists in this series`);
      sub.name = name.trim();
    }
    if (seriesId) sub.series = seriesId;

    await sub.save();
    return sub;
  }
}

module.exports = SeriesService;
