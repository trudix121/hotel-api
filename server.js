const express = require('express')
const cors = require('cors')
require('dotenv').config({path:'.env'})
const morgan = require('morgan')


const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const book = require('./routers/book')
const auth = require('./routers/auth')
const services = require('./routers/services')
const utils = require('./routers/utils')

app.use('/auth', auth)
app.use('/hotel', book)
app.use('/services', services)
app.use('/hotel', utils)

app.listen(process.env.PORT, ()=>{
    console.log(`Api started on port ${process.env.PORT}`)
})