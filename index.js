const express = require('express');
require('dotenv').config()
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;



// middlewire
app.use(cors());
app.use(express.json())






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



app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})