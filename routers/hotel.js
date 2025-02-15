const router = require('express').Router()
const jwt = require('../middleware/hotel_jwt')
const { client } = require('../database/db')
router.use(jwt)
const GetProductsDetails = require('../utils/retrieveinformation')

router.get('/room-service/order', async (req, res) => {
    try {
        const products = req.query.products.split(',');
        const { roomNumber } = req.body;
        const db = client.db('hotel_soft');

        // Obținem detaliile produselor
        const rest = await GetProductsDetails(products);

        // Verificăm dacă camera există și este ocupată
        const verify_roomNumber = await db.collection('rooms').findOne({ roomNumber: Number(roomNumber) });

        if (!verify_roomNumber) {
            return res.status(400).json({ message: 'Room doesn’t exist' });
        }
        if (!verify_roomNumber.isOccupied) {
            return res.status(400).json({ message: 'Room is not occupied' });
        }

        // Pregătim datele produselor
        const productsArray = rest.map(item => ({
            id: item._id,
            price: item.estimated_price,
            name: item.name
        }));

        const productsName = rest.map(item => item.name);

        // Calculăm suma totală
        const totalPrice = productsArray.reduce((sum, item) => sum + item.price, 0);

        // Adăugăm produsele în `rooms_receipts`
        await db.collection('rooms_receipts').updateOne(
            { roomNumber: Number(roomNumber) },
            {
                $push: {
                    products_bayed: { $each: productsArray }
                }
            }
        );

        // Salvăm comanda în `restaurant_orders`
        await db.collection('restaurant_orders').insertOne({
            roomNumber: Number(roomNumber),
            products: productsName,
            total_price: Number(totalPrice), // Adăugăm total_price
            date: new Date().toUTCString()
        });

        res.status(200).json({
            message: 'ok',
            roomNumber: roomNumber,
            products: productsName,
            total_price: totalPrice
        });

    } catch (error) {
        console.error("Error processing order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/room-service/spent', async (req,res)=>{
    const {roomNumber} = req.body

    const receipts_prices = await client.db('hotel_soft').collection('rooms_receipts').findOne({roomNumber:Number(roomNumber)})

    const total_price = receipts_prices.products_bayed.reduce((sum, item) => sum + item.price, 0);

    if(receipts_prices == null){
        return res.status(400).json({
            'message':'Room doens`t is occupied'
        })
    }

    return res.status(200).json({
        roomNumber:roomNumber,
        price: `${total_price.toFixed(2)}$`
    })
})

router.patch('/room-service/order_completed', async (req,res)=>{
    await client.db('hotel_soft').collection('restaurant_orders').deleteOne({roomNumber:Number(req.body.roomNumber)}) 
    
    res.status(200).json({
        'message':'Order Completed'
    })
})

module.exports = router