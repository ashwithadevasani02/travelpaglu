const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listings.js");
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/TravelPaglu");
}
main()
    .then(()=>{
        console.log("Connection Successful!");
    })
    .catch((err)=>{
        console.log(err);
    });
async function init(){
    await Listing.deleteMany({});
    initData.data= initData.data.map((obj)=>({...obj,owner:'6826cee65de7b6747f376bd1'}));
    await Listing.insertMany(initData.data);
}
init();