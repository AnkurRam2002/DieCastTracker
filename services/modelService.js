const Model = require('../models/Model');
const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Brand = require('../models/Brand');

class ModelService {
  static async getAllModels() {
    return await Model.find()
      .populate('metadata.brand')
      .populate('metadata.series')
      .populate('metadata.subseries')
      .sort({ serial_number: 1 })
      .lean();
  }

  static async addModel(modelName, seriesName, subseriesName, brandName = "Hot Wheels", modelNo = "") {
    // 1. Determine next serial number
    const lastModel = await Model.findOne().sort({ serial_number: -1 }).lean();
    const serialNumber = lastModel ? lastModel.serial_number + 1 : 1;

    // 2. Find or create brand
    let brand = await Brand.findOne({ name: brandName.trim() });
    if (!brand) {
      brand = new Brand({ name: brandName.trim() });
      await brand.save();
    }

    // 3. Find or create series
    let series = null;
    if (seriesName && seriesName.trim()) {
      series = await Series.findOne({ name: seriesName.trim(), brand: brand._id });
      if (!series) {
        series = new Series({ 
          name: seriesName.trim(),
          brand: brand._id
        });
        await series.save();
      }
    }

    // 4. Find or create subseries
    let subseries = null;
    if (series && subseriesName && subseriesName.trim()) {
      subseries = await Subseries.findOne({
        name: subseriesName.trim(),
        series: series._id
      });
      if (!subseries) {
        subseries = new Subseries({
          name: subseriesName.trim(),
          series: series._id
        });
        await subseries.save();
      }
    }

    // 5. Create model
    const newModel = new Model({
      serial_number: serialNumber,
      model_name: modelName.trim(),
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

  static async updateModel(serialNumber, updates) {
    const modelObj = await Model.findOne({ serial_number: serialNumber });
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
      let brand = await Brand.findOne({ name: brandName });
      if (!brand) {
        brand = new Brand({ name: brandName });
        await brand.save();
      }
      modelObj.metadata.brand = brand._id;

      // 2. Find or create series
      let series = null;
      if (seriesName && seriesName.trim()) {
        series = await Series.findOne({ name: seriesName.trim(), brand: brand._id });
        if (!series) {
          series = new Series({ name: seriesName.trim(), brand: brand._id });
          await series.save();
        }
      }
      modelObj.metadata.series = series ? series._id : null;

      // 3. Find or create subseries
      let subseries = null;
      if (series && subseriesName && subseriesName.trim()) {
        subseries = await Subseries.findOne({ name: subseriesName.trim(), series: series._id });
        if (!subseries) {
          subseries = new Subseries({ name: subseriesName.trim(), series: series._id });
          await subseries.save();
        }
      }
      modelObj.metadata.subseries = subseries ? subseries._id : null;
    }

    await modelObj.save();
    return await Model.findById(modelObj._id).populate('metadata.brand metadata.series metadata.subseries');
  }

  static async deleteModel(serialNumber) {
    const modelObj = await Model.findOne({ serial_number: serialNumber });
    if (!modelObj) {
      throw new Error(`Model with S.No ${serialNumber} not found`);
    }

    await Model.deleteOne({ _id: modelObj._id });

    // Re-sync serial numbers
    const allModels = await Model.find().sort({ serial_number: 1 });
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
