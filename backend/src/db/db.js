const mongoose = require('mongoose');

async function connectDB(){
    try{
         await mongoose.connect(process.env.MONGO_URI)
         console.log("connected to mongoDB");
         
    }
    catch(err){
        console.log("error connecting to MongoDB:", err)
    }
}
 
module.exports = connectDB