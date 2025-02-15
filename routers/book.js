const express = require('express');
const router = express.Router();
const jwt = require('../middleware/hotel_jwt');
const { client } = require('../database/db');
const { get } = require('./utils');
const getCurrentDateTime = require('../utils/getCurrentDateTime')
const formatDate = require('../utils/formatDate')
const getCollections = require('../utils/getCollections')
router.use(jwt);

// Book a room
router.post('/book/:room_type', async (req, res) => {
    try {
        const { room_type } = req.params;
        const userInfo = req.body;
        const { rooms, roomsInfo } = getCollections();
        const { date, time, fullDate } = getCurrentDateTime();
        if (req.query.room) {
            const requestedRoom = await rooms.findOne({
                roomNumber: Number(req.query.room),
                size: room_type,
                isOccupied: false,
                isReserved: false,
                isCleaned:true
                
            });

            if (!requestedRoom) {
                return res.status(400).json({
                    message: 'Requested room is not available or does not exist'
                });
            }
            if(requestedRoom.isCleaned == false){
                res.status(400).json({
                    message: 'Room is not cleaned'
                })
            }

            await Promise.all([
                rooms.updateOne(
                    { _id: requestedRoom._id },
                    { $set: { isReserved: true, reserved_on: fullDate }}
                ),
                roomsInfo.insertOne({
                    room_number: requestedRoom.roomNumber,
                    size: requestedRoom.size,
                    user_infos: userInfo,
                    date,
                    hour: time
                })
            ]);

            return res.status(200).json({
                message: 'ok',
                room_registered: String(requestedRoom.roomNumber)
            });
        }
        const availableRooms = await rooms.find({
            size: room_type,
            isOccupied: false,
            isReserved: false,
            isCleaned: true
        }).toArray();

        if (!availableRooms.length) {
            return res.status(400).json({ reason: 'No rooms available' });
        }

        const selectedRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];

        await Promise.all([
            rooms.updateOne(
                { _id: selectedRoom._id },
                { $set: { isReserved: true, reserved_on: fullDate }}
            ),
            roomsInfo.insertOne({
                room_number: selectedRoom.roomNumber,
                size: selectedRoom.size,
                user_infos: userInfo,
                date,
                hour: time
            })
        ]);

        res.status(200).json({
            message: 'ok',
            room_registered: String(selectedRoom.roomNumber)
        });
    } catch (error) {
        errorHandler(res, error);
    }
});
// Get booked rooms list
router.get('/booked/list', async (req, res) => {
    try {
        const { roomsInfo } = getCollections();
        const query = req.query.type ? { size: req.query.type } : {};
        
        const bookedRooms = await roomsInfo.find({isOccupied:true}).toArray();
        res.status(200).json({ list: bookedRooms });
    } catch (error) {
        errorHandler(res, error);
    }
});

// Check-in
router.post('/check-in', async (req, res) => {
    try {
        const { name, surname } = req.body;
        const { rooms, roomsInfo } = getCollections();

        const reservation = await roomsInfo.findOne({
            'user_infos.Name': name,
            'user_infos.Surname': surname
        });

        if (!reservation) {
            return res.status(404).json({ reason: 'Room Not Found!' });
        }

        if (reservation.checked_in) {
            return res.status(201).json({ reason: 'Already Checked In!' });
        }

        // Get check-in time
        const checkInDate = new Date();
        const formattedCheckIn = formatDate(checkInDate);

        // Calculate and format check-out date
        const stayDays = parseInt(reservation.user_infos.Stay_For);
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + stayDays);
        const formattedCheckOut = formatDate(checkOutDate);

        await Promise.all([
            rooms.updateOne(
                { roomNumber: Number(reservation.room_number) },
                { 
                    $set: {
                        isOccupied: true,
                        occupied_for: reservation.user_infos.Stay_For,
                        expected_checkout: `${formattedCheckOut.date} ${formattedCheckOut.time}`
                    }
                }
            ),
            roomsInfo.updateOne(
                { 'user_infos.Name': name, 'user_infos.Surname': surname },
                { 
                    $set: {
                        checked_in: true,
                        checked_at: `${formattedCheckIn.date} ${formattedCheckIn.time}`,
                        expected_checkout: `${formattedCheckOut.date} ${formattedCheckOut.time}`,
                        days_to_stay: stayDays
                    }
                }
            ),
            client.db('hotel_soft').collection('rooms_receipts').insertOne({
                roomNumber:Number(reservation.room_number),
                products_bayed:[]
            })
        ]);

        const room = await getCollections().rooms.findOne({
            roomNumber: reservation.room_number
        })
        res.status(200).json({ 
            message: 'Check-in Success',
            room_number: reservation.room_number,
            check_in: `${formattedCheckIn.date} ${formattedCheckIn.time}`,
            expected_checkout: `${formattedCheckOut.date} ${formattedCheckOut.time}`,
            days_to_stay: stayDays,
            room_code: room.code
        });
    } catch (error) {
        errorHandler(res, error);
    }
});
// Check-out
router.post('/check-out', async (req, res) => {
    try {
        const { room_number } = req.body;
        const { rooms, roomsInfo } = getCollections();

        const occupiedRoom = await roomsInfo.findOne({ 
            room_number: Number(room_number) 
        });

        const room = await rooms.findOne({roomNumber:Number(room_number)})

        if (!occupiedRoom) {
            return res.status(404).json({ message: 'Room occupied Not Found' });
        }



        const receipts_prices = await client.db('hotel_soft').collection('rooms_receipts').findOne({roomNumber:Number(room_number)})

        const total_price = receipts_prices.products_bayed.reduce((sum, item) => sum + item.price, 0) + Number(room.price)
        await Promise.all([
            rooms.updateOne(
                { roomNumber: Number(room_number) },
                { $set: {
                    isOccupied: false,
                    occupied_for: '',
                    isReserved: false,
                    reserved_on: '',
                    expected_checkout: '',
                    isCleaned:false,
                    cleaned_by:'',
                    cleaned_on:''
                }}
            ),
            roomsInfo.deleteOne({ room_number: Number(room_number) }),
            client.db('hotel_soft').collection('rooms_receipts').deleteOne({roomNumber:Number(room_number)})
        ]);

        res.status(200).json({ message: 'Checked-Out Successfully', moneyToPay:`${total_price.toFixed(2)}$` });
    } catch (error) {
        errorHandler(res, error);
    }
});


module.exports = router;