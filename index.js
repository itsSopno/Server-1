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
    const itemsCollection = db.collection("items");


    // --- Routes ---

    app.get('/', (req, res) => {
      res.send('AI Verse Backend is Running 🚀');
    });
// GET all items
app.get('/items', async (req, res) => {
  try {
    const items = await itemsCollection.find().toArray();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
// GET single item
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const item = await itemsCollection.findOne({ _id: new ObjectId(id) });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});
// POST add new item
app.post("/items", async (req, res) => {
  const items = req.body; // তোমার array of objects

  try {
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Expected an array of items" });
    }

    const result = await itemsCollection.insertMany(items);

    res.status(201).json({
      message: "Items created successfully",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    });
  } catch (err) {
    console.error("Insert Error:", err);
    res.status(500).json({ error: "Failed to save items" });
  }
});


// PUT update item
app.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const updatedData = req.body;

    const result = await itemsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json({
      message: 'Item updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
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
   app.patch('/project/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const updateDoc = req.body; 
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid Project ID format' });
    }

    const filter = { _id: new ObjectId(id) };
    
    const result = await projectCollection.updateOne(
      filter, 
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'No project found with this ID' });
    }

    res.status(200).json({
      message: 'Update successful',
      modifiedCount: result.modifiedCount
    });

  } catch (err) {
    console.error('Update Error:', err);
    res.status(500).json({ error: 'Internal server error during update' });
  }
});
// Projects POST
app.post('/project', async (req, res) => {
  try {
    const newProject = req.body; 

    // এখানে কোনো কন্ডিশন বা চেক নেই, সরাসরি ডাটাবেসে ইনসার্ট হবে
    const result = await projectCollection.insertOne(newProject);
    
    res.status(201).json({
      message: 'Project created successfully',
      insertedId: result.insertedId,
      project: newProject
    });
  } catch (err) {
    console.error('Error inserting project:', err);
    res.status(500).json({ error: 'Failed to save project data' });
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