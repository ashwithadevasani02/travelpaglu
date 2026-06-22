const Listing=require("../models/listings");
const Review= require("../models/reviews.js");
module.exports.postaReview=async (req,res)=>{
    let {id}= req.params;
    let listing= await Listing.findById(id);
    let newReview= new Review(req.body.review);
    newReview.author=req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log("review saved");
    req.flash("success","Review  Added");
    res.redirect(`/listings/${id}`);
}
module.exports.destroyReview=async (req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull: {reviews : reviewId}});
    await Review.findByIdAndDelete(reviewId);
    console.log("Deleted");
    req.flash("success"," Review Deleted");
    res.redirect(`/listings/${id}`);
}