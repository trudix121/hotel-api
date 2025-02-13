const jwt = require('jsonwebtoken');

const verifyJWTMiddlewareServices = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: 'Acces interzis: Token-ul lipsește' 
            });
        }

        // Extract the token (remove 'Bearer ' from string)
        const token = authHeader.split(' ')[1];
        
        // Verify the token
        const decoded = jwt.verify(token, process.env.jwt_secret);
        
        // Add decoded user to request object
        req.user = decoded.data;
        
        // Continue to next middleware/route handler
        next();
        
    } catch (error) {
        console.log(error);
        return res.status(401).json({ 
            message: 'Token invalid sau expirat' 
        });
    }
};

module.exports = verifyJWTMiddlewareServices