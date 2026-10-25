// Temporary diagnostic script to find the real MongoDB connection error
require('dotenv').config();

const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGO_URI;
console.log('URI host part (sanitized):',
  uri.replace(/(\/\/)[^@]+@/, '$1<credentials>@'));

async function test() {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
    serverSelectionTimeoutMS: 15000,
  });
  try {
    await client.connect();
    console.log('CONNECTED OK');
    await client.db().admin().listDatabases();
    console.log('AUTH OK — databases listed');
  } catch (e) {
    console.error('FULL ERROR:');
    console.error('  name:', e.name);
    console.error('  message:', e.message);
    console.error('  code:', e.code);
    if (e.cause) {
      console.error('  cause:', e.cause.message);
      if (e.cause.cause) console.error('  cause.cause:', e.cause.cause.message);
    }
  } finally {
    await client.close().catch(() => {});
    process.exit(0);
  }
}
test();
