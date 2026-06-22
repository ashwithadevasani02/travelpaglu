const User= require("../models/user.js");
module.exports.renderSignupForm=(req,res)=>{
    res.render("./users/signup.ejs");
}
module.exports.signup=async (req, res)=>{
   try{
     let {username, email, password}= req.body;
    const user= new User({username, email});
    const registeredUser= await User.register(user,password);
    req.login(registeredUser,(err)=>{
        if(err) next(err);
          req.flash("success", "Welcome to TravelPaglu");
    res.redirect("/listings");
    });
   }
   catch(err){
        req.flash('error',"Username Already Exists!!!!");
        res.redirect("/listings");
   }
}
module.exports.renderLoginform=(req,res)=>{
    res.render("./users/login.ejs");
}
module.exports.postUser=(req,res)=>{
    req.flash("success","Welcome to TravelPaglu");
    let tomove=res.locals.redirectUrl;
   
    if(!tomove){
        tomove="/listings";
    }
    res.redirect(tomove);
}
module.exports.logout=(req,res,next)=>{
    req.logOut(err=>{
        if(err) return next(err);
         req.flash("success","You are Logged Out");
    res.redirect("/listings");
    });
}