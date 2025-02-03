require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 7000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(
  cors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.JP_KEYS}:${process.env.JP_PASS}@cluster0.ackxm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const VerifyToken = (req, res, next) => {
  const token = req?.cookies?.Token;
  // console.log('cuk cuk cokkkee', token);

  if (!token) {
    return res.status(403).json({ message: 'Token not provided!' });
  }

  jwt.verify(token, process.env.Secrect_Key, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token!' });
    }

    req.user = decoded;
    next();
  });
};

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
    await client.connect();

    const database = client.db('jobPortal');
    const JobsCollection = database.collection('jobs');

    const ApplyJobs = database.collection('applyJobs');

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.Secrect_Key, {
        expiresIn: '1h',
      });
      res
        .cookie('Token', token, {
          httpOnly: true,
          secure: false, //for Localhost
        })
        .send({ message: true });
    });

    app.get('/Jobs', async (req, res) => {
      // console.log('success');
      const AllData = JobsCollection.find();
      const result = await AllData.toArray();
      res.send(result);
    });

    app.get('/Jobs/:id', async (req, res) => {
      const ID = req.params.id;
      const FilterID = { _id: new ObjectId(ID) };
      const Data = await JobsCollection.findOne(FilterID);
      res.send(Data);
    });

    app.get('/JobsApply', VerifyToken, async (req, res) => {
      const UserEmail = req?.query?.email;

      if (!UserEmail) {
        return res.status(401).send({ message: 'NOT match user email' });
      }
      const query = { ApplicantEmail: UserEmail };

      const AllData = ApplyJobs.find(query);
      const result = await AllData.toArray();
      res.send(result);
    });

    app.post('/JobsApply', async (req, res) => {
      const Data = req.body;
      console.log(Data);
      const result = await ApplyJobs.insertOne(Data);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World this is our server site!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
