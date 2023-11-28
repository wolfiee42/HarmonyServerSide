const express = require('express');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;



// middlewire
app.use(cors());
app.use(express.json())

const verifyToken = (req, res, next) => {
    // console.log(req.headers.authorization);
    if (!req.headers.authorization) {
        res.status(401).send({ message: "unauthorized access" })
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).send({ message: "access denied" })
        }
        req.decoded = decoded;
        next();
    })
}

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const filter = { email: email };
    const user = await userCollection.findOne(filter);
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
    }
    next();
}


const dbConnet = async () => {
    try {
        console.log('DB Connected Successfully');
    } catch (error) {
        console.log(error.name, error.message);
    }
}
dbConnet();



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster42.pkfz4lk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const userCollection = client.db("harmony").collection("userDB");
const postCollection = client.db("harmony").collection("postDB");


app.get('/', (req, res) => {
    res.send('brother is using harmony')
})

// users
app.post('/users', async (req, res) => {
    const user = req.body;
    const filter = { email: user.email };
    const isExist = await userCollection.findOne(filter);
    if (isExist) {
        return res.send('user already exist');
    }
    const result = await userCollection.insertOne(user);
    res.send(result)

})

app.get('/users', async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
});
app.get(`/users/:email`, async (req, res) => {
    const email = req.params.email;
    // if (email !== req.decoded.email) {
    //     res.status(403).send("access not given");
    // }
    const filter = { email: email };
    const result = await userCollection.findOne(filter);
    res.send(result)
})



// Checking admin
app.get('/users/admin/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    // if (email !== req.decoded.email) {
    //     res.status(403).status({ message: "access rejected" });
    // };
    const filter = { email: email };
    const user = await userCollection.findOne(filter);
    let admin = {};
    if (user) {
        admin = user?.role === 'admin';
    };
    res.send({ admin })
})

// promoting to admin
app.patch('/users/admin/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedDoc = {
        $set: {
            role: "admin",
        }
    }
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
})




// post
app.post('/posts', async(req, res)=>{
    const post = req.body;
    const result = await postCollection.insertOne(post);
    res.send();
})


app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '365d' });
    res.send({ token })

})



app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})