const express = require('express')
const router = express.Router()
const verifyJWTMiddlewareServices  = require('../middleware/services_jwt')
const { client } = require('../database/db');
const { get } = require('./utils');



router.use(verifyJWTMiddlewareServices)


const getCollections = () => ({
    rooms: client.db('hotel_soft').collection('rooms'),
    roomsInfo: client.db('hotel_soft').collection('rooms_infos'),
    services_infos: client.db('hotel_soft').collection('credentials_services')
});




router.get('/cleaned/:room_id', async (req,res)=>{
    if(req.user.work_at !== 'cleaning'){
        return res.status(400).json({
            'message':'You do not work at Cleaning Service!'
        })
    }
    const {room_id} = req.params
    const rest = await getCollections().rooms.findOne({
        roomNumber:Number(room_id)
    })
    if(rest == null){
        return res.status(404).json({
            'message':'Room doens`t exist'
        })
    }
    await getCollections().rooms.updateOne({roomNumber:Number(room_id)},{$set:{
        isCleaned:true,
        cleaned_on:new Date().toLocaleDateString(),
        cleaned_by:req.user.username
    }})
    await client.db('hotel_soft').collection('credentials_services').updateOne({
        username:req.user.username
    }, {$inc: {
        cleaned_total:1
    },})
    res.status(200).json({
        'message':'Room cleaned successfully'
    })
})

router.get('/cleaning/see', async (req,res)=>{

    try {
        const { rooms } = getCollections();
        
        // Get all room numbers
        const roomNumbers = await rooms.find({isCleaned:false}, { roomNumber: 1, _id: 0}).toArray();
        
        // Extract just the numbers into an array
        const numbers = roomNumbers.map(room => room.roomNumber);
        
        res.status(200).json({ roomNumbers: numbers });
    } catch (error) {
        errorHandler(res, error);
    }
})


module.exports = router