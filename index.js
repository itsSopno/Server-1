const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
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

    const usersCollection = client.db("test").collection("users");
    const buyerCollection = client.db("test").collection("buyerdata");
    const projectCollection = client.db("test").collection("project");

    // ------------------ Routes ------------------

    // Root
    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    // --- Get all users / search by name ---
    app.get('/users', async (req, res) => {
      try {
        const { search } = req.query; // ?search=AI Model
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const users = await usersCollection.find(query).toArray();
        res.json(users);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });
app.get('/project', async (req, res) => {
  try {
    const projects = await projectCollection.find().toArray();
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project data' });
  }
});

// GET single project by ID
app.get('/project/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const project = await projectCollection.findOne({ _id: new ObjectId(id) });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch project data' });
  }
});

    // --- Add new model ---
    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.json({ success: true, user: { _id: result.insertedId, ...newUser } });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to insert user" });
      }
    });

    // --- Update model ---
    app.put('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const query = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update model" });
      }
    });

    // --- Delete model ---
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount > 0) {
          res.json({ success: true, message: 'Deleted successfully' });
        } else {
          res.json({ success: false, message: 'Delete failed' });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // --- Purchase route: increment counter ---
    app.post('/users/:id/purchase', async (req, res) => {
      const { id } = req.params;
      try {
        const result = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          { $inc: { purchased: 1 } },
          { returnDocument: 'after' }
        );
        res.json({ success: true, updatedModel: result.value });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Purchase failed' });
      }
    });

    // --- Buyer data ---
    app.get('/buyerdata', async (req, res) => {
      try {
        const buyers = await buyerCollection.find().toArray();
        res.json(buyers);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch buyer data" });
      }
    });

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
        res.json({ success: true, message: 'Buyer data saved successfully!', insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to save buyer data!' });
      }
    });

    app.delete('/buyerdata/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const result = await buyerCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete buyer data' });
      }
    });

  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
