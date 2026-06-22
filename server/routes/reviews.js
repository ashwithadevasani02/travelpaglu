const express=require("express");
const router= express.Router({mergeParams:true});
const asyncWrap=require("../utils/wrapAsync.js");
const reviewController=require("../controllers/reviews.js")
const {isLoggedIn,handlereviewError, isAuthor}= require('../middleware/middleware.js');
router.post("/",isLoggedIn,handlereviewError,asyncWrap(reviewController.postaReview));
router.delete("/:reviewId",isAuthor,asyncWrap(reviewController.destroyReview));
module.exports=router;