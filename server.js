const express = require('express')
const cors = require('cors')
require('dotenv').config({path:'.env'})
const morgan = require('morgan')


const app = express()

app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const auth_route = require('./routers/auth')

app.set('/auth', auth_route)




app.listen(process.env.PORT, ()=>{
    console.log(`Api started on port ${process.env.PORT}`)
})