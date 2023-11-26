const express = require('express');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
var jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;



// middlewire
app.use(cors());
app.use(express.json())

const verifyToken = (req, res, next) => {
    console.log(req.headers.authorization);
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



app.get('/', (req, res) => {
    res.send('brother is using harmony')
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