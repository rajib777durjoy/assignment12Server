const express=require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors')
const jwt = require('jsonwebtoken');
const port=process.env.PORT || 9000;
require('dotenv').config()
const stripe=require('stripe')(process.env.Stripe_Secret_key);
const app=express()

app.use(cors())
app.use(express.json())

/// token varify///
const varifytoken=(req,res,next)=>{
  // console.log('varifytoken',req.headers.authorization)
  if(!req.headers.authorization){
    return res.status(401).send({message:'Unauthorized access'})
  }
  const token =req.headers.authorization.split(' ')[1];
 
  jwt.verify(token,process.env.Access_Token_key,(err,decoded)=>{
    if(err){
     return res.status(403).send({message:'forbidden access'})
    }
    req.decoded=decoded;
    next();
  }) 
}

/// varify Admin ///
// const varifyAdmin=async(req,res,next)=>{
//   const email= req.decoded?.email;
//   const query={email:email}
//   const result=await usersDb.findOne(query) 
//   const user=result?.role === 'admin';
//   if(!user){
//     return res.status(403).send({message:'forbidden access'})
//   }
//   next()
// }
/// varify trainer ///
// const varifyTrainer=async(req,res,next)=>{
//   const email= req.decoded.email;
//   const query={email:email}
//   const result=await usersDb.findOne(query) 
//   const user=result?.role === 'trainer';
//   if(!user){
//     return res.status(403).send({message:'forbidden access'})
//   }
//   next()
// }

/// varifyMember
// const varifyMember=async(req,res,next)=>{
//   const email= req.decoded.email;
//   const query={email:email}
//   const result=await usersDb.findOne(query) 
//   const user=result?.role === 'member';
//   if(!user){
//     return res.status(403).send({message:'forbidden access'})
//   }
//   next()
// }

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
    const SaveTrainer=database.collection('saveToTrainer')
    const ClassDb=database.collection('ClassCollection');
    const BookDetails=database.collection('trainerBooked');
    const bookpackage=database.collection('packagedb');
    const paymentDb=database.collection('paymentCollection');
    const froumDb= database.collection('froumCollection');
    const rejectedData=database.collection('rejectedCollection')
    // token create related api//
    app.post('/jwt',async(req,res)=>{
      const userEmail= req.body;
      // console.log(userEmail)
      const token=jwt.sign(userEmail,process.env.Access_Token_key, { expiresIn: '1h' });
      res.send({token})
    })

  // check admin check // todo: set user
  app.get('/userCheck/:email',varifytoken,async(req,res)=>{
    const email= req.params?.email;
    const query={email:email};
    const result= await usersDb.findOne(query)
   
    if(result?.role==="admin"){
    return res.send({user:"admin"})
    }
     if(result?.role==='trainer'){
    return res.send({user:'trainer'})
    }
  if(result?.role === 'member'){
     return res.send({user:'member'})  
    }
   res.send({user:'normal'})
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
   /// team related api //
   app.get('/team',async(req,res)=>{
    const result= await SaveTrainer.find().limit(3).toArray()
    res.send(result)
   })
  /// all newsletter subcriber (admin) ///
  app.get('/allnewsletter/:email',varifytoken,async(req,res)=>{
    const userEmail= req.params.email;
    const query={email:{$ne:userEmail}}
    const result = await usersDb.find(query).toArray()
    // console.log(result)
    res.send(result)
  })
/// alltrainelist /// (admin)
app.get('/alltrainerlist',async(req,res)=>{
  const result= await SaveTrainer.find().toArray()
  res.send(result)
})
app.delete('/trainerRoleChange/:id',async(req,res)=>{
  const Id= req.params.id;
  console.log(Id)
  const query={_id:new ObjectId(Id)};
  const Update={
    $set:{
      role:'member'
    }
  }
  const RoleChange= await SaveTrainer.updateOne(query,Update)
  const findOne= await SaveTrainer.findOne(query)
  const setup= await usersDb.insertOne(findOne)
  const trainerDelete= await SaveTrainer.deleteOne(query)
  res.send(trainerDelete)
})

/// Add froum related api ///
app.post('/addFroum',async(req,res)=>{
  const froumdata= req.body;
  // console.log(froumdata)
  const result= await froumDb.insertOne(froumdata)
  res.send(result)
})
// trainer related api // todo:set varify 
app.post('/trainer',varifytoken,async(req,res)=>{
  const data= req.body;
  // console.log(data)
  const userCheck= await trainerDb.findOne({email:data?.email})
  if(userCheck){
   return res.send({message:'your almost request for  be a trainer'})
  }
  const result= await trainerDb.insertOne(data);
  // console.log(result)
  res.send(result)
})

app.get('/trainer',async(req,res)=>{
  const result= await SaveTrainer.find().toArray()
  res.send(result)
})
/// trainer details /// 
app.get('/trainerDetails/:id',async(req,res)=>{
  const id=req.params.id;
  // console.log(id);
  const query={_id: new ObjectId(id)}
  const result= await SaveTrainer.findOne(query);
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
/// applied reject feedback///
app.post('/feedback',async(req,res)=>{
  const data= req.body;
  // console.log(data)
  const result = await rejectedData.insertOne(data)
  res.send(result)
})

/// applied rejected ///
app.delete('/appliedReject/:id',async(req,res)=>{
  const Id= req.params?.id;
  // console.log(Id)
  const result = await trainerDb.deleteOne({_id:new ObjectId(Id)})
  res.send(result)
})

/// booked package related api //
app.post('/packageDetails',async(req,res)=>{
  const data=req.body;
  const result= await bookpackage.insertOne(data)
  res.send(result)
})
app.get('/packageInfo/:id',async(req,res)=>{
   const Id= req.params.id;
   const query={ _id:new ObjectId(Id)}
   const result= await bookpackage.findOne(query);
  //  console.log(result)
   res.send(result)
})

/// applied details /// todo: all trainer db change///?
app.get('/details/:id',async(req,res)=>{
  const ids= req.params.id;
  const query={_id:new ObjectId(ids)}
  const details= await trainerDb.findOne(query)
  // console.log(details)
  res.send(details)
})
// applied status update/// todo: saveTrainer-- error
app.patch('/statusChange',async(req,res)=>{
  const data=req.body;
  // console.log('sopon id',data?.id)
  // console.log('status',data?.status)
  const query={_id:new ObjectId(data?.id)}
  const update={
    $set:{
      status:data.status,
      role:'trainer',
      appliedId:data?.id,
    }
  }
  const options = { upsert: true };
  const result= await trainerDb.updateOne(query,update,options)
  // const getTrainer= await trainerDb.findOne(query);
  // const pushData= await SaveTrainer.insertOne(getTrainer)
  // const updateUser= await SaveTrainer.updateOne(query,update,options)
  // console.log(result)
  res.send(result)
})
/// applied remove /// ---- recheck needed-- error
app.delete('/applied/:id',async(req,res)=>{
  const Id= req.params.id;
  const query={_id:new ObjectId(Id)}
  const trainerCheck= await SaveTrainer.findOne(query)
  if(trainerCheck){
    const result= await trainerDb.deleteOne(query)
    return res.send(result)
  }
  const trainerFind=await trainerDb.findOne(query)
  const setTrainer= await SaveTrainer.insertOne(trainerFind)
  const result= await trainerDb.deleteOne(query)
  res.send(result)
})
// searching by class name//
app.get('/searchClass',async(req,res)=>{
  const searchbyname= req.query.search;
  const result= await ClassDb.find({name:{$regex:searchbyname}}).toArray()
  res.send(result)
})
// get allClass with trainer Class// todo: customize from;
app.get('/allClass',async(req,res)=>{
  const skipNum= parseInt(req.query.page);
  const limitNum= parseInt(req.query.size);
  const result = await ClassDb.find().skip(skipNum*limitNum).limit(limitNum).toArray();
  res.send(result)
})

app.get('/classbyTrainer',async(req,res)=>{
  const addItem= await SaveTrainer.aggregate([
    { $unwind: "$skills" },
    {
      $lookup: {
        from: 'ClassCollection',
        localField: 'skills',
        foreignField: 'name',
        as:'detailsInfo'
      }
    },
    // {
    //   $project: {
    //     name: 1,
    //     skills: 1,
    //     matchedClasses: { name: 1 },
    //   },
    // },
    // {
    //   $match: {
    //     "matchedClasses.0": { $exists: true },
    //   },
    // },
  ]).toArray();
  res.send(addItem);
})
app.get('/totalclass',async(req,res)=>{
  const totalPage= await ClassDb.estimatedDocumentCount()
  res.send({totalPage})
})

// add Class (Admin)//
app.post('/addclass',async(req,res)=>{
  const data = req.body;
  // console.log(data)
  const result= await ClassDb.insertOne(data)
  // console.log(result)
  res.send(result)
})
/// set availabel slot ///
app.post('/slot',async(req,res)=>{
  const data= req.body;
  const check={
    bookId:data.bookId,
    name:data.name,
    slot:data.slot,
    useremail:data?.useremail
  }
  // console.log(data)
  const query=await BookDetails.findOne(check)
  // console.log(query)
  if(query){
    return res.send({message:"Your Trainer Booked"})
  }
  const result= await BookDetails.insertOne(data);
 
  // console.log(result)
  res.send(result)
})

/// payment intent ///
 app.post('/CreatePaymentIntent',async(req,res)=>{
  const {price}=req.body;
  // console.log(price)
  const amount=parseInt(price * 100)
  const paymentIntent =await stripe.paymentIntents.create({
    amount:amount,
    currency:'usd',
    payment_method_types:['card']
  });
  res.send({
    clientSecret:paymentIntent.client_secret
  })
 })
 
 /// payment related api /// todo:add booked count ++
 app.post('/payments',async(req,res)=>{
  const payment= req.body;
  const result=await paymentDb.insertOne(payment);
  if(!result){
    return res.send({message:'payment unsuccessful'})
  }
  res.send(result)
 })

 /// payment details ///
 app.get('/allpayment',async(req,res)=>{
  // const result= await paymentDb.aggregate([
  //   {
  //     $addFields: {
  //       price: { $toInt: "$price" } 
  //     }
  //   },
  //   // {
  //   //   $sort: {
  //   //     price: -1 
  //   //   }
  //   // },
  //   {
  //     $group: {
  //       _id: null, 
  //       totalBalance: { $sum: "$price" }, 
  //      allTransactions: { $push: "$$ROOT" } 
  //     }
  //   },
    
  //    {
  //     $project: {
  //       _id: 0, 
  //       totalBalance: 1,
  //       allTransactions: 1
  //     }
  //   }
  // ]).toArray()
  const result = await paymentDb.find().toArray()
  res.send(result)
 })
 /// get allnewletter subcriber for balance page ///
  app.get('/Allnewsletter',async(req,res)=>{
    const result= await usersDb.find().toArray();
    res.send(result)
  })

/// all forums page get ///
app.get('/allforum',async(req,res)=>{
  const skipNum= parseInt(req.query?.page);
  const limitNum= parseInt(req.query?.size);
  const result= await froumDb.find().skip(skipNum*limitNum).limit(limitNum).toArray();
  res.send(result)
})
app.get('/totalforum',async(req,res)=>{
  const total= await froumDb.estimatedDocumentCount();
  res.send({total})
})
/// fourm page voting up //
app.patch('/voteUp/:id',async(req,res)=>{
  const email= req.body.email;
  const Id= req.params.id;
  // console.log(Id,email)
  const query = {_id: new ObjectId(Id)}
  const updateVote={
    $inc:{Vote:1},
    $set:{votarEmail:email}
  }
  const options = { upsert: true };
  const check= await froumDb.findOne(query);
  if(check.votarEmail=== email){
    return res.send({message:'you already liked'})
  }
  const result = await froumDb.updateOne(query,updateVote,options)
  res.send(result)
})
/// forum page voting down ///
app.patch('/voteDown/:id',async(req,res)=>{
  const Id= req.params.id;
  const email= req.body.email;
  const query= {_id: new ObjectId(Id)}
  const updateVote={
    $inc:{Vote:-1},
    $unset:{votarEmail:email}
  }
  const check= await froumDb.findOne(query);
  if(check.votarEmail!== email){
    return res.send({message:'You already voting (-1)'})
  }
  const result = await froumDb.updateOne(query,updateVote)
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