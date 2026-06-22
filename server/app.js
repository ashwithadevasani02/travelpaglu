const dotenv= require("dotenv");
dotenv.config();
const express=require("express");
const app=express();
const port =8000;
const mongoose=require("mongoose");
const methodOverride= require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const listingsRouter= require("./routes/listing.js");
const reviewsRouter=require("./routes/reviews.js");
const usersRouter=require("./routes/users.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const localStratergy=require("passport-local");             
const User=require("./models/user.js");
const dbUrl=process.env.ATLAS_LINK;
const store=MongoStore.create({
    mongoUrl: dbUrl,
    secret:process.env.SECRET,
    touchAfter: 24*60*60,
})
const sessionOptions={
    store: store,
    secret: process.env.SECRET,
    resave:false,
    saveUninitialized :true,
    cookie: {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge : 7*24*60*60*1000,
        htttpOnly : true,
    }
}
app.engine('ejs', ejsMate);
app.use(methodOverride("_method"));
const path=require("path");
app.set("views",path.join(__dirname,"../client/views"));
app.set("view engine","ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,"../client/public")));
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
async function main(){
    await mongoose.connect(dbUrl);
}
main()
    .then(()=>{
        console.log("Connection Successful!");
    })
    .catch((err)=>{
        console.log(err);
    }); 
app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    res.locals.currentUser= req.user;
    next();
});
app.get("/demouser",async (req,res)=>{
    let fakeUser= new User({
        email: "devasani34@gmail.com",
        username:"thedevasanis",
    });
    let result= await User.register(fakeUser,"devasani12");
    res.send(result);
})
app.use("/listings", listingsRouter);
app.use("/listings/:id/review",reviewsRouter);
app.use("/", usersRouter);
app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found"));
});
app.use((err,req,res,next)=>{
  let {statusCode=500, message="Something went wrong"}= err;
  res.status(statusCode).render("error.ejs",{message});
});
app.listen(port, ()=>{
    console.log(`app is listening on port : ${port}`);
});