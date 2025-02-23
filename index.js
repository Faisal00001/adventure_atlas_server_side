const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express=require('express')
const jwt = require('jsonwebtoken');
const cors=require('cors')
const app=express();
require('dotenv').config()
const port=process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
// process.env.DB_USER
// process.env.DB_PASS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l5p9dmz.mongodb.net/?retryWrites=true&w=majority`;
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
      // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
  
      const userCollection = client.db("TourGide").collection("users");
      const usersReviewsCollection = client.db("TourGide").collection("usersReviews");
      const bookingCollection = client.db("TourGide").collection("bookings");
      const tourPackagesCollection = client.db("TourGide").collection("TourPackages");
      const tourGuideInfoCollection = client.db("TourGide").collection("GuideInfo");
      const touristStoryCollection = client.db("TourGide").collection("TouristStory");
      const myWishListCollection = client.db("TourGide").collection("WishList");

        // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }
     // use verify admin after verifyToken
     const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
     const verifyTourGuide = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isTourGuide = user?.role === 'tourGuide';
      if (!isTourGuide) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    // user related api
    app.post('/users',async(req,res)=>{
      const user=req.body
      const query={
        email:user.email
      }
      const existingUser=await userCollection.findOne(query)
      if(existingUser){
         return res.send({ message: 'user already exists', insertedId: null })
      }
      const result=await userCollection.insertOne(user)
      res.send(result)
    })
    app.get('/users',verifyToken,verifyAdmin,async(req,res)=>{
      const result=await userCollection.find().toArray()
      res.send(result)
    })
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })
    app.get('/users/tourGuide/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let tourGuide = false;
      if (user) {
        tourGuide = user?.role === 'tourGuide';
      }
      res.send({ tourGuide });
    })

    app.patch('/users/admin/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.patch('/users/makeTourGuide/:id',verifyToken,verifyAdmin,async(req,res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'tourGuide'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.delete('/users/:id',verifyToken,verifyAdmin,async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    // TourPackages related api
    app.get('/tourPackages',async (req, res) => {
        const result = await tourPackagesCollection.find().toArray();
        res.send(result);
    });
    app.get('/tourPackages/:id',async(req,res)=>{
      try{
        const id=req.params.id
        const query={
          _id:new ObjectId(id)
        }
        const result=await tourPackagesCollection.findOne(query)
        res.send(result)
      }
      catch(error){
        res.send(error.message)
      }

    })
    app.post('/addPackage',verifyToken,verifyAdmin,async(req,res)=>{
      const packageInformation=req.body
      const result=await tourPackagesCollection.insertOne(packageInformation)
      res.send(result)
    })
    // Tour guider api
    app.get('/tourGuideInfo',async (req, res) => {
        const result = await tourGuideInfoCollection.find().toArray();
        res.send(result);
    });
    app.get('/tourGuideInfo/:id',async(req,res)=>{
      const id=req.params.id
      const query={
        _id:new ObjectId(id)
      }
      const result=await tourGuideInfoCollection.findOne(query)
      res.send(result)
    })
    app.post('/tourGuideInfo',verifyToken,verifyTourGuide,async(req,res)=>{
      const guideInfo=req.body
      const result=await tourGuideInfoCollection.insertOne(guideInfo)
      res.send(result)
    })
    // TOur Guide Booking collection
    app.get('/tourGuideAssignedTours',verifyToken,verifyTourGuide,async(req,res)=>{
      const email=req.query.email
      const query={
        guideInfoEmail:email
      }
      const result=await bookingCollection.find(query).toArray()
      res.send(result)
    })
    // Tourist story api
    app.get('/touristStory',async(req,res)=>{
       try{
        const result = await touristStoryCollection.find().toArray();
        res.send(result);
       }
       catch(error){
        res.send(error.message)
       }
    })
    app.get('/touristStory/:id',async(req,res)=>{
      try{
        const id=req.params.id
        const query={
          _id:new ObjectId(id)
        }
        const result=await touristStoryCollection.findOne(query)
        res.send(result)
      }
      catch(error){
        res.send(error)
      }
    })
    app.post('/touristStory',verifyToken, async(req,res)=>{
      const touristStory=req.body
      const result=await touristStoryCollection.insertOne(touristStory)
      res.send(result)
    })
    // My booking api
    app.post('/bookings',verifyToken,async(req,res)=>{
      const booking=req.body
      const result=await bookingCollection.insertOne(booking)
      res.send(result)
    })
    app.get('/bookings',verifyToken, async(req,res)=>{
      const email=req.query.email
      const query={
        touristEmail:email
      }
      const result=await bookingCollection.find(query).toArray()
      res.send(result)
    })
    app.patch('/bookings/makeTourReject/:id',verifyToken,verifyTourGuide,async(req,res)=>{
      const id=req.params.id
      const filter={
        _id:new ObjectId(id)
      }
      const updatedDoc={
        $set:{
          status:'Rejected'
        }
      }
      const result=await bookingCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
    app.patch('/bookings/makeTourAccept/:id',verifyToken,verifyTourGuide,async(req,res)=>{
      const id=req.params.id
      const filter={
        _id:new ObjectId(id)
      }
      const updatedDoc={
        $set:{
          status:'Accepted'
        }
      }
      const result=await bookingCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
    app.delete('/bookingDelete/:id',verifyToken,async(req,res)=>{
      const id=req.params.id 
      const query={
        _id:new ObjectId(id)
      }
      const result=await bookingCollection.deleteOne(query)
      res.send(result)
    })
    // My WishList api
    app.post('/myWihList',async(req,res)=>{
      const wishListItem=req.body
      // const query={
      //     email:wishListItem.email
      // }
      // const isExists=await myWishListCollection.findOne(query)
      // if(isExists){
      //   return res.send({ message: 'Items already exists in wishlist', insertedId: null })
      // }
      const result=await myWishListCollection.insertOne(wishListItem)
      res.send(result)
    })
    app.get('/myWishList',verifyToken,async(req,res)=>{
      const email=req.query.email
      const query={
        email:email
      }
      const result=await myWishListCollection.find(query).toArray()
      res.send(result)
    })
    app.delete('/myWishList/:id',verifyToken,async(req,res)=>{
      const id=req.params.id
      const query={
        _id:new ObjectId(id)
      }
      const result=await myWishListCollection.deleteOne(query)
      res.send(result)
    })
    // Review Collection
    app.post('/userReview',verifyToken,async(req,res)=>{
      const review=req.body
      const result=await usersReviewsCollection.insertOne(review)
      res.send(result)
    })
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
    res.send('AdventureAtlas is running')
})
app.listen(port,()=>{
  console.log(`AdventureAtlas is running on ${port}`)
})