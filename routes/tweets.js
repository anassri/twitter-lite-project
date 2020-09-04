const express = require('express');
const {check, validationResult} = require('express-validator');
const db = require("../db/models");
const {asyncHandler, handleValidationErrors} = require("../utils");
const {requireAuth} = require("../auth");
const user = require('../db/models/user');
const {Tweet} = db;

const router = express.Router();

router.use(requireAuth);

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

router.get("/", asyncHandler( async (req, res) => {
    const tweets = await Tweet.findAll({
        include: [{model: user, as: "user", attributes: ["username"]}],
        order: [["createdAt", "DESC"]],
        attributes: ["message"],
    });
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
    const tweet = await Tweet.create({message, userId: req.user.id});
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