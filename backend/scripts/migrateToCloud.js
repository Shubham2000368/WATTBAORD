const mongoose = require('mongoose');
require('dotenv').config();

// URIs
const localUri = 'mongodb://localhost:27017/wattflow';
const cloudUri = process.env.MONGODB_URI;

if (!cloudUri) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const migrate = async () => {
  try {
    console.log('🚀 Starting Migration...');

    // Connect to Local
    const localConn = await mongoose.createConnection(localUri).asPromise();
    console.log('✅ Connected to Local MongoDB');

    // Connect to Cloud
    const cloudConn = await mongoose.createConnection(cloudUri).asPromise();
    console.log('✅ Connected to Cloud MongoDB');

    const collections = ['users', 'teams', 'projects', 'sprints', 'tickets'];

    for (const colName of collections) {
      console.log(`📦 Migrating collection: ${colName}...`);
      
      const localCol = localConn.collection(colName);
      const cloudCol = cloudConn.collection(colName);

      const data = await localCol.find({}).toArray();
      
      if (data.length > 0) {
        // Clear existing data in cloud to avoid duplicates (Optional)
        // await cloudCol.deleteMany({});
        
        // Insert data
        try {
          await cloudCol.insertMany(data, { ordered: false });
          console.log(`✅ Migrated ${data.length} documents for ${colName}`);
        } catch (insertErr) {
          if (insertErr.code === 11000) {
            console.log(`⚠️ Some documents in ${colName} already exist (skipped duplicates)`);
          } else {
            console.error(`❌ Error inserting ${colName}:`, insertErr.message);
          }
        }
      } else {
        console.log(`ℹ️ Collection ${colName} is empty in local DB`);
      }
    }

    console.log('\n✨ Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Failed:', err);
    process.exit(1);
  }
};

migrate();
