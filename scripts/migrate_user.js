require('dotenv').config();
const mongoose = require('mongoose');

const Brand = require('../models/Brand');
const Series = require('../models/Series');
const Subseries = require('../models/Subseries');
const Model = require('../models/Model');
const Preorder = require('../models/Preorder');
const User = require('../models/User');

const migrateAllToUser = async () => {
  const userId = process.argv[2];

  if (!userId) {
    console.error('❌ Please provide a User ID as an argument.');
    console.log('Usage: node scripts/migrate_user.js <userId>');
    process.exit(1);
  }

  // Check if it's a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error('❌ Invalid User ID format. Must be a valid MongoDB ObjectId.');
    process.exit(1);
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/diecast_tracker';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findById(userId);
    if (!user) {
      console.error(`❌ User with ID ${userId} not found.`);
      process.exit(1);
    }
    console.log(`✅ Found User: ${user.username}`);

    const modelsToUpdate = [
      { name: 'Brands', model: Brand },
      { name: 'Series', model: Series },
      { name: 'Subseries', model: Subseries },
      { name: 'Models', model: Model },
      { name: 'Preorders', model: Preorder }
    ];

    for (const { name, model } of modelsToUpdate) {
      const result = await model.updateMany(
        { $or: [{ user: { $exists: false } }, { user: null }] }, 
        { $set: { user: userId } }
      );
      console.log(`Updated ${result.modifiedCount} ${name} to user ${user.username}`);
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

migrateAllToUser();
