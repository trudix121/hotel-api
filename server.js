const express = require('express')
const cors = require('cors')
require('dotenv').config({path:'.env'})
const morgan = require('morgan')

const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

errorHandler = (res, error) => {
    console.error('Operation failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
};

const book = require('./routers/book')
const auth = require('./routers/auth')
const services = require('./routers/services')
const utils = require('./routers/utils')
const customers = require('./routers/customers')
const hotel = require('./routers/hotel')

app.use('/auth', auth)
app.use('/hotel', book)
app.use('/services', services)
app.use('/hotel', utils)
app.use('/customers', customers)
app.use('/hotel', hotel)
app.listen(process.env.PORT, ()=>{
    console.log(`Api started on port ${process.env.PORT}`)
})