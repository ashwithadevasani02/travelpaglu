const Listing= require("../models/listings.js");
const Review = require("../models/reviews.js");
const {listingSchema , reviewSchema}= require("../schema.js");
const ExpressError= require("../utils/ExpressError.js");
module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl= req.originalUrl;
        req.flash("error","You have to be Logged In first");
        return res.redirect("/login");
    }
     next();
}
module.exports.saveRedirectUrl= (req,res , next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}
module.exports.isOwner= async (req,res,next)=>{
    let {id}= req.params;
    let listing= await Listing.findById(id);
    if(!res.locals.currentUser || !res.locals.currentUser._id.equals(listing.owner._id)){
        req.flash("error","You don't have permission as you aren't owner");
        return res.redirect(`/listings/${id}`);
    } 
    next(); 
}
module.exports.handleError= (req,res,next)=>{
     const {error}=listingSchema.validate(req.body);
     console.log(error);
    if(error){
        throw new ExpressError(400, error.details.map((el)=> el.message).join(","));
    }
    else{
        next();
    }
}
module.exports.handlereviewError= (req,res,next)=>{
     const {error}=reviewSchema.validate(req.body);
    if(error){
        throw new ExpressError(400, error.details.map((el)=> el.message).join(","));
    }
    else{
        next();
    }
}
module.exports.isAuthor= async (req,res,next)=>{
    let {id, reviewId}= req.params;
    let review= await Review.findById(reviewId);
    if(!res.locals.currentUser || !res.locals.currentUser._id.equals(review.author._id)){
        req.flash("error","You don't have permission as you aren't author");
        return res.redirect(`/listings/${id}`);
    } 
    next(); 
}