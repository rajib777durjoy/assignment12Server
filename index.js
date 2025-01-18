const express=require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors')
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 9000;
require('dotenv').config()
const app=express()

app.use(cors())
app.use(express.json())


const varifytoken=(req,res,next)=>{
  console.log('varifytoken',req.headers.authorization)
  if(!req.headers.authorization){
    return res.status(401).send({message:'forbidden access'})
  }
  const token =req.headers.authorization.split(' ')[1];
 
  jwt.verify(token,process.env.Access_Token_key,(err,decoded)=>{
    if(err){
     return res.status(401).send({message:'forbidden access'})
    }
    req.decoded=decoded;
    next();
  })
  
}
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
    const trainerDb=database.collection('trainerCollection');
   
    // token create related api//
    app.post('/jwt',async(req,res)=>{
      const userEmail= req.body;
      // console.log(userEmail)
      const token=jwt.sign(userEmail,process.env.Access_Token_key, { expiresIn: '1h' });
      res.send({token})
    })
 // user related api//
    app.post('/user',varifytoken,async(req,res)=>{
        const userId=req.body;
        const user=await usersDb.findOne({email:userId.email})
        if(user){
            return res.send({message:'you already user'})
        }
        const result=await usersDb.insertOne(userId);
   
        res.send(result)
    })
// trainer related api //
app.post('/trainer',async(req,res)=>{
  const data= req.body;
  // console.log(data)
  const result= await trainerDb.insertOne(data);
  // console.log(result)
  res.send(result)
})
app.get('/trainer',async(req,res)=>{
  const result= await trainerDb.find().toArray()
  res.send(result)
})
/// trainer details ///
app.get('/trainerDetails/:id',async(req,res)=>{
  const id= req.params.id;
  // console.log(id);
  const query={_id: new ObjectId(id)}
  const result= await trainerDb.findOne(query);
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