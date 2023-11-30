const express = require('express');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
var jwt = require('jsonwebtoken');

const stripe = require('stripe')(process.env.SECRET_KEY);
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
const commentsCollection = client.db("harmony").collection("commentsDB");


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
    res.send(result);
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
app.post('/posts', async (req, res) => {
    const post = req.body;
    // const email = post.authorEmail;
    // const filter = { authorEmail: email }
    const result = await postCollection.insertOne(post);
    // const updateOperation = {
    //     $inc: { postCount: 1 }
    // };
    // const result2 = await postCollection.updateOne(filter, updateOperation)
    res.send(result);
})

app.get('/posts', async (req, res) => {
    const email = req.query.email;
    const filter = { authorEmail: email };
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    const result = await postCollection.find().sort({ time: -1 }).skip(page * size).limit(size).toArray();
    const result22 = await postCollection.find(filter).toArray();
    const result44 = await postCollection.find(filter).sort({ time: -1 }).limit(3).toArray();
    res.send({ result, result22, result44 });
})

app.get('/posts/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await postCollection.findOne(filter);
    res.send(result);
})

app.delete('/posts/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const result = await postCollection.deleteOne(filter);
    res.send(result);
})


// app.get('/posts', async (req, res) => {
//     const email = req.query.email;
//     const filter = { authorEmail: email };
//     const result = await postCollection.find(filter).toArray();
//     res.send(result)
// })

app.get('/postcount', async (req, res) => {
    const result = await postCollection.estimatedDocumentCount()
    res.send({ result });
})

// comments

app.post('/comments', async (req, res) => {
    const comment = req.body;
    const result = await commentsCollection.insertOne(comment);
    res.send(result);
})



//payment
app.post('/create-payment-intent', async (req, res) => {
    const { price } = req.body;

    // because stripe count money in pennies, we have to make
    // the cash in pennies
    const ammount = parseInt(price * 100);


    //here  await stripe.paymentIntents.create is to hit stripes 
    //server so the payment can be monitored by the admin
    const paymentIntent = await stripe.paymentIntents.create({
        amount: ammount,
        currency: 'usd',
        payment_method_types: ['card']//this line is also can not fondin example
    });
    res.send({
        clientSecret: paymentIntent.client_secret
    })
})

app.patch('/users/:email', async (req, res) => {
    const email = req.params.email;
    const filter = { email: email };
    const updatedDoc = {
        $set: {
            badge: "gold",
        }
    }
    const result = await userCollection.updateOne(filter, updatedDoc);
    res.send(result);
})



// jwt
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '365d' });
    res.send({ token })

})



app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})