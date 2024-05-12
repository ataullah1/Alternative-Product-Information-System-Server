const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
// Veryfy JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  if (token) {
    jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(401).send({ message: 'Unauthorized access' });
      }
      console.log(decoded);
      req.user = decoded;
      next();
    });
  }
};

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

    // JWT Genaret TOKEN and added cookie
    app.post('/jwt', async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.SECRET_TOKEN, {
        expiresIn: '1d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.MODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });
    // Remove token form cookie ============
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.MODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true });
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
      res.send(data);
    });
    //  get only my added query data
    app.get('/my-queries/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const tokenEmail = req.user.email;
      if (tokenEmail !== email) {
        return res.status(4033).send({ message: 'Forbidden access' });
      }
      const query = { userEmail: email };
      const data = await queriesCallection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(data);
    });
    //  Update my added query data
    app.patch('/my-query-update', async (req, res) => {
      const data = req.body;
      console.log(data);
      const updateDoc = {
        $set: { ...data },
      };
      // Update the first document that matches the filter
      const result = await movies.updateOne(filter, updateDoc);
      res.send(result);
    });
    //  Delete my added query data
    app.delete('/my-queries-delete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await queriesCallection.deleteOne(query);
      res.send(data);
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
