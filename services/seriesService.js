const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Brand = require('../models/Brand');

class SeriesService {
  // Brand Management
  static async getAllBrands() {
    return await Brand.find().sort({ name: 1 }).lean();
  }

  static async addBrand(name) {
    const existing = await Brand.findOne({ name: name.trim() });
    if (existing) throw new Error(`Brand '${name}' already exists`);
    const newBrand = new Brand({ name: name.trim() });
    await newBrand.save();
    return newBrand;
  }

  static async updateBrand(id, name) {
    return await Brand.findByIdAndUpdate(id, { name: name.trim() }, { new: true });
  }

  // Series Management
  static async getSeriesConfig() {
    const brands = await Brand.find().lean();
    const seriesList = await Series.find().populate('brand').lean();
    
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

  static async getAllSeries() {
    const series = await Series.find().populate('brand').lean();
    return series.sort((a, b) => {
      const brandA = a.brand ? a.brand.name : "Unknown";
      const brandB = b.brand ? b.brand.name : "Unknown";
      
      if (brandA !== brandB) return brandA.localeCompare(brandB);
      return a.name.localeCompare(b.name);
    });
  }

  static async addSeries(name, brandId) {
    const existing = await Series.findOne({ name: name.trim(), brand: brandId });
    if (existing) throw new Error(`Series '${name}' already exists for this brand`);

    const newSeries = new Series({
      name: name.trim(),
      brand: brandId
    });
    await newSeries.save();
    return newSeries;
  }

  static async updateSeries(id, updates) {
    const { name, brandId } = updates;
    const series = await Series.findById(id);
    if (!series) throw new Error('Series not found');

    if (name || brandId) {
      const checkName = name ? name.trim() : series.name;
      const checkBrand = brandId || series.brand;
      
      const collision = await Series.findOne({ 
        _id: { $ne: id }, 
        name: checkName, 
        brand: checkBrand 
      });
      
      if (collision) throw new Error(`Series '${checkName}' already exists for this brand`);
      
      if (name) series.name = checkName;
      if (brandId) series.brand = checkBrand;
    }

    await series.save();
    return series;
  }

  // Subseries Management
  static async getAllSubseries() {
    const subseries = await Subseries.find().populate({
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

  static async addSubseries(seriesId, name) {
    const existing = await Subseries.findOne({ name: name.trim(), series: seriesId });
    if (existing) throw new Error(`Subseries '${name}' already exists in this series`);

    const newSub = new Subseries({
      name: name.trim(),
      series: seriesId
    });
    await newSub.save();
    return newSub;
  }

  static async updateSubseries(id, updates) {
    const { name, seriesId } = updates;
    const sub = await Subseries.findById(id);
    if (!sub) throw new Error('Subseries not found');

    if (name) sub.name = name.trim();
    if (seriesId) sub.series = seriesId;

    await sub.save();
    return sub;
  }
}

module.exports = SeriesService;
