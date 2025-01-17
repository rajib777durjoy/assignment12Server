const express=require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors=require('cors')
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 9000;
require('dotenv').config()
const app=express()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.User_key}:${process.env.User_pass}@cluster0.u87dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("fitnessZone");
    const usersDb = database.collection("userCollection");
   
    app.post('jwt',async(req,res)=>{
      const userEmail= req.body;
      const token=jwt.sign(userEmail,process.env.Access_Token_key, { expiresIn: '1h' });
      res.
    })

    app.post('/user',async(req,res)=>{
        const userId=req.body;
        const user=await usersDb.findOne({email:userId.email})
        if(user){
            return res.send({message:'you already user'})
        }
        const result=await usersDb.insertOne(userId);
        console.log(result)
        res.send(result)
    })




    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('your server is runing')
})
app.listen(port,()=>{
    console.log('your server is runing in this port',port)
})