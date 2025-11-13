const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

// use middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = process.env.MONGO_URI; // ✅ from .env
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const usersCollection = client.db("test").collection("users");
    const dataCollection = client.db("test").collection("data");
    const buyerCollection = client.db("test").collection("buyerdata");

    // --- All your routes (unchanged) ---
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

        res.send({
          success: true,
          message: 'Buyer data saved successfully!',
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: 'Failed to save buyer data!',
        });
      }
    });
 app.delete('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Deleted successfully' });
    } else {
      res.json({ success: false, message: 'Delete failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


    app.delete('/buyerdata/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await buyerCollection.deleteOne(query);
      res.send(result);
    });

    app.post('/data', async (req, res) => {
      try {
        const newdata = req.body;
        const email = newdata.email;
        const existingUser = await dataCollection.findOne({ email: email });

        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }
        const results = await dataCollection.insertOne(newdata);
        res.json({
          success: true,
          user: { _id: results.insertedId, ...newdata }
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to insert user" });
      }
    });

    app.get('/buyerdata', async (req , res) => {
      try{
        const buyer = await buyerCollection.find().toArray();
        res.json(buyer);
      }catch(err) {
        console.error(err);
        res.status(500).send({error : "failed to fetch buyer"})
      }
    });

    app.get('/data', async (req , res) => {
      try{
        const data = await dataCollection.find().toArray();
        res.json(data);
      }catch(err){
        console.error(err);
        res.status(500).send({error : "failed to fetch data"})
      }
    });

    app.get('/users', async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.json(users);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to fetch users" });
      }
    });

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

    app.post('/users', async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.json({
          success: true,
          user: { _id: result.insertedId, ...newUser }
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to insert user" });
      }
    });

    app.patch('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        const result = await usersCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );
        res.json(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to update user" });
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
