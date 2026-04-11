require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');

// Import Models
const Brand = require('../models/Brand');
const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Model = require('../models/Model');
const Preorder = require('../models/Preorder');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB.');

    // 1. Drop existing collections
    console.log('Dropping existing collections...');
    await Brand.deleteMany({});
    await Series.deleteMany({});
    await Subseries.deleteMany({});
    await Model.deleteMany({});
    await Preorder.deleteMany({});
    console.log('Collections cleared.');

    // 2. Default Brand
    console.log('Creating default Brand...');
    const mainBrand = new Brand({ name: 'Hot Wheels' });
    await mainBrand.save();
    console.log('Default Brand created.');

    // 3. Migrate Series
    console.log('Fetching series from Supabase...');
    const { rows: sqlSeries } = await pool.query('SELECT * FROM series');
    const seriesMap = new Map(); // sql_id -> mongo_id

    for (const s of sqlSeries) {
      const mongoS = new Series({
        name: s.name,
        brand: mainBrand._id
      });
      await mongoS.save();
      seriesMap.set(s.id, mongoS._id);
    }
    console.log(`Migrated ${sqlSeries.length} Series.`);

    // 4. Migrate Subseries
    console.log('Fetching subseries from Supabase...');
    const { rows: sqlSubseries } = await pool.query('SELECT * FROM subseries');
    const subseriesMap = new Map(); // sql_id -> { mongo_id, series_mongo_id }

    for (const sub of sqlSubseries) {
      const seriesMongoId = seriesMap.get(sub.series_id);
      if (!seriesMongoId) {
        console.warn(`Series not found for subseries ${sub.name} (SQL ID: ${sub.id})`);
        continue;
      }

      const mongoSub = new Subseries({
        name: sub.name,
        series: seriesMongoId
      });
      await mongoSub.save();
      subseriesMap.set(sub.id, { 
        mongo_id: mongoSub._id, 
        series_mongo_id: seriesMongoId 
      });
    }
    console.log(`Migrated ${sqlSubseries.length} Subseries.`);

    // 5. Migrate Models (Cars)
    console.log('Fetching cars from Supabase...');
    const { rows: sqlCars } = await pool.query('SELECT * FROM cars');
    let modelCount = 0;

    for (const car of sqlCars) {
      const subInfo = subseriesMap.get(car.subseries_id);
      if (!subInfo) {
        console.warn(`Subseries not found for car ${car.model_name} (SQL ID: ${car.serial_number})`);
        continue;
      }

      const mongoModel = new Model({
        serial_number: car.serial_number,
        model_name: car.model_name,
        metadata: {
          brand: mainBrand._id,
          series: subInfo.series_mongo_id,
          subseries: subInfo.mongo_id
        },
        date_added: car.date_added || new Date()
      });
      await mongoModel.save();
      modelCount++;
    }
    console.log(`Migrated ${modelCount} Models.`);

    // 6. Migrate Preorders
    console.log('Fetching preorders from Supabase...');
    const { rows: sqlPreorders } = await pool.query('SELECT * FROM preorders');
    for (const po of sqlPreorders) {
      const mongoPo = new Preorder({
        serial_number: po.serial_number,
        seller: po.seller,
        models: po.models,
        eta: po.eta,
        total_price: po.total_price,
        po_amount: po.po_amount,
        on_arrival_amount: po.on_arrival_amount,
        delivery_status: po.delivery_status || 'Pending',
        date_added: po.date_added
      });
      await mongoPo.save();
    }
    console.log(`Migrated ${sqlPreorders.length} Preorders.`);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

