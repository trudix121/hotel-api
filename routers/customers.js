const express = require('express')
const router = express.Router()
const {client} = require('../database/db')
const rateLimiter = require('../middleware/rateLimiter')
const { ObjectId } = require('mongodb')
const jwt = require('../middleware/hotel_jwt')

router.use(rateLimiter.limitRequests)




router.post('/review', async (req,res)=>{
    const { name, roomNumber,stars,message } = req.body

    const db = client.db('hotel_soft').collection('reviews')

    if(Number(stars) > 10){
        return res.status(400).json({
            'message':'Stars must be between 1 and 10'
        })
    }
    await db.insertOne({
        Name: name,
        RoomNumber: roomNumber,
        stars: `${stars}/10`,
        message:message,
        verified:false
    })

    res.status(200).json({
        'message':'Review sent successfully'
    })
})


router.get('/review/see', jwt, async (req,res)=>{
    const db = client.db('hotel_soft').collection('reviews')

    const rest = await db.find({verified:false}).toArray()

    return res.status(200).json(rest)
} )

router.patch('/review/verify/:id', jwt, async (req,res)=>{
    const {id}= req.params
    const {message} = req.body

    const db = client.db('hotel_soft').collection('reviews')

    const rest = await db.findOne({_id:new ObjectId(id)})

    if(rest.verified == true){
        return res.status(400).json({
            'message':'Review already verified'
        })
    }
    await db.updateOne({
        _id:new ObjectId(id)
    },{$set:{
        verified:true,
        admin_message:message
    }})

    return res.status(200).json({
        'message':'Review verified successfully'
    })
})



module.exports = router