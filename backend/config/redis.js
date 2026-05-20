const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

let isConnected = false;

const connectRedis = async () => {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('✅ Connected to Redis');
    } catch (err) {
      console.error('❌ Redis Connection Error:', err);
    }
  }
};

connectRedis();

module.exports = client;
