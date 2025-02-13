const express = require('express')
const router = express.Router()

// Suggested code may be subject to a license. Learn more: ~LicenseLog:1690683025.
const { client } = require('../database/db');
const jwt = require('../middleware/hotel_jwt')
const gen_pass = require('../utils/generatePassword')
router.use(jwt)

const getCollections = () => ({
    rooms: client.db('hotel_soft').collection('rooms'),
    roomsInfo: client.db('hotel_soft').collection('rooms_infos')
});

// Get room details
router.get('/get-room/:room_number', async (req, res) => {
    try {
        const { room_number } = req.params;
        const { rooms, roomsInfo } = getCollections();

        const [roomDetails, roomOccupancy] = await Promise.all([
            rooms.findOne({ roomNumber: Number(room_number) }),
            roomsInfo.find({ room_number: Number(room_number) }).toArray()
        ]);

        if (!roomDetails) {
            return res.status(404).json({ message: 'Room Not Found' });
        }

        res.status(200).json({
            'Room Details': roomDetails,
            'Room Infos': roomOccupancy.length ? roomOccupancy : 'Not Occupied'
        });
    } catch (error) {
        errorHandler(res, error);
    }
});



router.get('/reset', async (req,res)=>{
    await getCollections().rooms.updateMany({}, 
        {$set:{
            isOccupied:false,
            occupied_for:'',
            isReserved: false,
            reserved_on:'',
            expected_checkout: ''
        }}
    )
    await getCollections().roomsInfo.deleteMany({})
    res.status(200).json({message:'ok'})
})

router.get('/cleaned', async (req,res)=>{
    await getCollections().rooms.updateMany({}, {$set: {
        isCleaned:true
    }})
    res.status(200).json(({
        'message':'ok'
    }))
})


router.get('/create/cleaning', async (req,res)=>{
    const {username} = req.query

    const db = client.db('hotel_soft').collection('credentials_services')

    const pass = gen_pass()
    const rest = await db.insertOne({
        username:username,
        password:pass,
        work_at:"cleaning",
        cleaned_total:0
    })

    res.status(200).json({
        'message':'ok',
        'username': username,
        'password': pass
    })
})



module.exports = router