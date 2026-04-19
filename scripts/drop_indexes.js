const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Series = require('../models/Series');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/diecast_tracker');
  console.log("Connected to MongoDB");

  try {
    await Brand.collection.dropIndex("name_1");
    console.log("Dropped Brand.name_1 global index");
  } catch (e) {
    console.log("Could not drop Brand.name_1", e.message);
  }

  try {
    await Series.collection.dropIndex("name_1_brand_1");
    console.log("Dropped Series.name_1_brand_1 global index");
  } catch (e) {
    console.log("Could not drop Series.name_1_brand_1", e.message);
  }

  process.exit(0);
}
run();
