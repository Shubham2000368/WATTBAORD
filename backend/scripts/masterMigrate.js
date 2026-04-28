const mongoose = require('mongoose');
require('dotenv').config();

const localUri = 'mongodb://localhost:27017/wattflow';
const cloudUri = process.env.MONGODB_URI;

const masterMigrate = async () => {
  try {
    console.log('🚀 Starting Master Migration...');

    // Connections
    const localConn = await mongoose.createConnection(localUri).asPromise();
    const cloudConn = await mongoose.createConnection(cloudUri).asPromise();
    console.log('✅ Connected to both Databases');

    // 1. Get User Mapping (Email -> CloudID)
    const localUsers = await localConn.collection('users').find({}).toArray();
    const cloudUsers = await cloudConn.collection('users').find({}).toArray();
    
    const userMap = {}; // localUserId -> cloudUserId
    
    localUsers.forEach(lu => {
      const cu = cloudUsers.find(c => c.email === lu.email);
      if (cu) {
        userMap[lu._id.toString()] = cu._id;
      }
    });

    console.log(`👤 Mapped ${Object.keys(userMap).length} users based on email`);

    // 2. Clear existing data in Cloud (except users)
    const collectionsToMigrate = ['teams', 'projects', 'sprints', 'tickets'];
    for (const col of collectionsToMigrate) {
      await cloudConn.collection(col).deleteMany({});
      console.log(`🧹 Cleared cloud collection: ${col}`);
    }

    // 3. Migrate and Fix IDs
    for (const colName of collectionsToMigrate) {
      const data = await localConn.collection(colName).find({}).toArray();
      
      if (data.length === 0) continue;

      const fixedData = data.map(doc => {
        const newDoc = { ...doc };
        
        // Fix common user fields
        if (newDoc.owner && userMap[newDoc.owner.toString()]) newDoc.owner = userMap[newDoc.owner.toString()];
        if (newDoc.lead && userMap[newDoc.lead.toString()]) newDoc.lead = userMap[newDoc.lead.toString()];
        if (newDoc.reporter && userMap[newDoc.reporter.toString()]) newDoc.reporter = userMap[newDoc.reporter.toString()];
        if (newDoc.assignee && userMap[newDoc.assignee.toString()]) newDoc.assignee = userMap[newDoc.assignee.toString()];
        if (newDoc.createdBy && userMap[newDoc.createdBy.toString()]) newDoc.createdBy = userMap[newDoc.createdBy.toString()];

        // Fix members arrays (Teams and Projects)
        if (newDoc.members && Array.isArray(newDoc.members)) {
          newDoc.members = newDoc.members.map(m => {
            if (m.user && userMap[m.user.toString()]) m.user = userMap[m.user.toString()];
            return m;
          });
        }

        return newDoc;
      });

      await cloudConn.collection(colName).insertMany(fixedData);
      console.log(`✅ Migrated ${fixedData.length} ${colName} with fixed IDs`);
    }

    console.log('\n✨ MASTER MIGRATION COMPLETED!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Failed:', err);
    process.exit(1);
  }
};

masterMigrate();
