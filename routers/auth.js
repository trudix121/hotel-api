const express = require('express')
const router = express.Router()
const { Login, LoginServices, client } = require('../database/db')
const { createJWT } = require('../utils/jwt')

router.post('/login/', async (req, res) => {
    const { username, password } = req.body
    const rest = await Login(username, password)
    if (rest !== false) {
        const token = createJWT(rest)
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        })
        return res.status(200).json({
            'message': 'ok',
            'data': rest,
            'token': token
        })
    } else if(rest == false) {
        return res.status(400).json({
            'message': 'Account Not Found'
        })
    }
})

router.post('/login/services', async (req,res)=>{
    const {username,password}  = req.body
    const rest = await LoginServices(username,password)
    if(rest !== false){
        await client.db('hotel_soft').collection('services_logs').insertOne({
            type:'login',
            username: username,
            work_at: rest.work_at,
            date: `${new Date().toLocaleDateString()}`
        })
        const token = await createJWT({
            username:username,
            date: new Date().toLocaleDateString(),
            work_at: rest.work_at
        })
        return res.status(200).json({
            'message':'ok',
            'token': token
        })
    }

    return res.status(400).json({
        'message':'Username or Password is incorrect'
    })
})



module.exports = router