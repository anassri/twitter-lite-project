const express = require('express');
const {check, validationResult}= require('express-validator');
const db=require("../db/models");

const {Tweet}=db;

const router = express.Router();

const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);

const tweetValidator = [
    check('message')
        .exists({checkFalsy: true})
        .withMessage('Please provide a message')
        .isLength({max: 280})
        .withMessage('Message must not be more than 280')
];
const tweetNotFoundError = (id) =>{
    const err = Error(`Tweet with id of ${id} could not be found.`);
    err.title = "Tweet not found.";
    err.status = 404;
    return err;
};
const handleValidationErrors = (req,res,next)=>{
    const validationErrors = validationResult(req);

    if(!validationErrors.isEmpty()){
        const errors = validationErrors.array().map((err)=>err.msg);
        const err = Error("Bad request.");
        err.errors = errors;
        err.status = 400;
        err.title = "Bad request.";
        return next(err);
    }
    next();
}

router.get("/", asyncHandler( async (req, res) => {
    const tweets = await Tweet.findAll();
    res.json({ tweets });
}));


router.get("/:id(\\d+)", asyncHandler( async (req, res, next) => {
    const tweetId = parseInt(req.params.id, 10);
    const tweet = await Tweet.findByPk(tweetId);
    if(tweet){
        res.json({ tweet });
    } else {
        next(tweetNotFoundError(tweetId));
    }
}));

router.post("/", tweetValidator, handleValidationErrors, asyncHandler( async (req, res)=>{
    const {message} = req.body;
    const tweet = await Tweet.create({message});
    res.status(201).json({message});
}));

router.put("/:id(\\d+)", tweetValidator, handleValidationErrors, asyncHandler( async (req, res, next) => {
    const tweetId = parseInt(req.params.id,10);
    const tweet = await Tweet.findByPk(tweetId);
    
    if(tweet){
        await tweet.update({message: req.body.message});
        res.json({tweet});
    } else {
        next(tweetNotFoundError(tweetId));
    }
}));

router.delete("/:id(\\d+)", asyncHandler( async (req, res)=>{
    const tweetId = parseInt(req.params.id, 10);
    const tweet = await Tweet.findByPk(tweetId);
    if(tweet){
        await tweet.destroy();
        res.status(204).end();
    } else {
        next(tweetNotFoundError(tweetId));
    }
}));


module.exports = router;