const jwt = require('jsonwebtoken')
require('dotenv').config({ path: '.env' })


function createJWT(data) {
    try {
        const token = jwt.sign({data:data}, process.env.jwt_secret, { expiresIn: '1h' })
        return token
    }
    catch (error) {
        console.log(error)
    }

}


function verifyJWT(token){
    try {
        const rest = jwt.verify(token, process.env.jwt_secret)
        if(rest){
            return rest
        }        
        return false
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    createJWT,
    verifyJWT

}