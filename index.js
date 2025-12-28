const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
// Render-এর জন্য পোর্ট প্রসেস এনভায়রনমেন্ট থেকে নেওয়া জরুরি
const port = process.env.PORT || 10000; 

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db("test");
    const usersCollection = db.collection("users");
    const buyerCollection = db.collection("buyerdata");
    const projectCollection = db.collection("project");

    // --- Routes ---

    app.get('/', (req, res) => {
      res.send('AI Verse Backend is Running 🚀');
    });

    // Projects GET
    app.get('/project', async (req, res) => {
      try {
        const projects = await projectCollection.find().toArray();
        res.json(projects);
      } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project data' });
      }
    });

    // Single Project GET
    app.get('/project/:id', async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
        const project = await projectCollection.findOne({ _id: new ObjectId(id) });
        res.json(project);
      } catch (err) {
        res.status(500).json({ error: 'Server Error' });
      }
    });

    // Add Model POST
    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        res.status(500).send({ error: "Failed to insert user" });
      }
    });

    // Purchase Count Increment
    app.post('/users/:id/purchase', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { purchased: 1 } },
          { returnDocument: 'after' }
        );
        // MongoDB driver version 5.x+ এ result.value এর বদলে সরাসরি result পাওয়া যায়
        res.json({ success: true, updatedModel: result });
      } catch (err) {
        res.status(500).json({ success: false, message: 'Purchase failed' });
      }
    });

    // Buyer Post with validation
    app.post('/buyerdata', async (req, res) => {
      try {
        const buyerInfo = req.body;
        const { modelName, buyerEmail } = buyerInfo;
        const haveUser = await buyerCollection.findOne({ modelName, buyerEmail });
        
        if (haveUser) {
          return res.status(400).json({ error: 'User already purchased this model' });
        }
        
        const result = await buyerCollection.insertOne({
          ...buyerInfo,
          purchasedAt: new Date(),
        });
        res.json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save buyer data!' });
      }
    });

    // ... অন্য সব রুটগুলো আগের মতোই থাকবে ...

  } catch (err) {
    console.error("MongoDB error:", err);
  }
}

run().catch(console.dir);

// সার্ভার লিসেনিং 'run' ফাংশনের বাইরে রাখা নিরাপদ
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});