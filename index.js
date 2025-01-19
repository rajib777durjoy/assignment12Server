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
    const ClassDb=database.collection('ClassCollection');
    const BookDetails=database.collection('trainerBooked');
    // token create related api//
    app.post('/jwt',async(req,res)=>{
      const userEmail= req.body;
      // console.log(userEmail)
      const token=jwt.sign(userEmail,process.env.Access_Token_key, { expiresIn: '1h' });
      res.send({token})
    })
  // check admin check //
  app.get('/userCheck/:email',async(req,res)=>{
    const email= req.params.email;
    const query={email:email};
    const result= await usersDb.findOne(query);
    // console.log(result)
    let user='member'
    // if(result.role==="admin"){
    //    user='admin'
    // }
    // else if(result.role==='trainer'){
    //     user ='trainer'
    // }
    // else if(result.role === 'member'){
    //   user ='member'
    // }
    // console.log('user',user)
    res.send(user)
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
  /// all newsletter subcriber (admin page) ///
  app.get('/allnewsletter/:email',async(req,res)=>{
    const userEmail= req.params.email;
    const query={email:{$ne:userEmail}}
    const result = await usersDb.find(query).toArray()
    console.log(result)
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
/// trainer booked related api //
app.get('/bookedData/:id',async(req,res)=>{
     const ids= req.params.id;
     const query={_id:new ObjectId(ids)}
     const result = await BookDetails.findOne(query)
    //  console.log(result)
     res.send(result)
})
// applied trainer (admin page) ///
app.get('/appliedTrainer/:email',async(req,res)=>{
  const useremail= req.params.email;
  const query={email:{$ne:useremail}}
  const result= await trainerDb.find(query).toArray()
  // console.log('applied trainer',result)
  res.send(result)
})

/// applied details /// todo: all trainer db change///
app.get('/details/:id',async(req,res)=>{
  const ids= req.params.id;
  const query={_id:new ObjectId(ids)}
  const details= await trainerDb.findOne(query)
  // console.log(details)
  res.send(details)
})
// applied status update///
app.patch('/statusChange',async(req,res)=>{
  const data=req.body;
  console.log('status',data.status)
  const query={_id:new ObjectId(data.id)}
  const update={
    $set:{
      status:data.status,
      role:'trainer'
    }
  }
  const options = { upsert: true };
  const result= await trainerDb.updateOne(query,update,options)
  res.send(result)
})
/// applied remove ///
app.delete('/applied/:id',async(req,res)=>{
  const Id= req.params.id;
  // console.log(Id)
  const query={_id:new ObjectId(Id)}
  const result= await trainerDb.deleteOne(query)
  console.log('remove',result)
  res.send(result)
})
// add Class (Admin)//
app.post('/addClass',async(req,res)=>{
  const data = req.body;
  const result= await ClassDb.insertOne(data)
  console.log(result)
  res.send(result)
})
/// set availabel slot ///
app.post('/slot',async(req,res)=>{
  const data= req.body;
  const check={
    bookId:data.bookId,
    name:data.name,
    slot:data.slot
  }
  const query=await BookDetails.findOne(check)
  console.log(query)
  if(query){
    return res.send({message:"Your Trainer Booked"})
  }
  const result= await BookDetails.insertOne(data);
 
  console.log(result)
  res.send(result)
})


    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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