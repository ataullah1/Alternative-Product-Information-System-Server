const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 9000;

// Middlewares============
const options = {
  origin: ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(options));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.htex290.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    const queriesCallection = client.db('altQueryDB').collection('queries');

    // JWT Genaret API
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: '1d',
      });
    });

    // Queries added
    app.post('/queries', async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await queriesCallection.insertOne(data);
      res.send(result);
    });

    //  get only 8 data
    app.get('/latest-queries', async (req, res) => {
      const data = await queriesCallection
        .find()
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.json(data);
    });
    //  get only my added query data
    app.get('/my-queries/:email', async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { userEmail: email };
      const data = await queriesCallection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.json(data);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
