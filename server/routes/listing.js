const express=require("express");
const router= express.Router();
const Listing=require("../models/listings.js");
const asyncWrap=require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, handleError}=require("../middleware/middleware.js");
const listingController= require("../controllers/listing.js");
let {storage}=require("../config/cloudConfig.js");
const multer  = require('multer')
const upload = multer({storage });
router.route("/")
.get(asyncWrap(listingController.showListings))
.post(isLoggedIn,upload.single('listing[image]'),handleError,asyncWrap(listingController.postTheListing));
router.get("/new",isLoggedIn,listingController.renderNewForm);
router.route("/:id")
.get(asyncWrap(listingController.seeListing))
.put(isOwner,upload.single('listing[image]'),handleError,isLoggedIn,asyncWrap(listingController.editTheListing))
.delete(isOwner,isLoggedIn,asyncWrap(listingController.destroyLisitng));
router.get("/:id/edit",isOwner,isLoggedIn,asyncWrap(listingController.renderEditForm));
module.exports=router;