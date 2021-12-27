const jwt = require('jsonwebtoken')
const dotenv = require('dotenv').config();

const Authentication = (req,res,next)=>{
    const token = req.get('token')
    try {
        const payload = jwt.verify(token,process.env.SECRETKEY);
        const Name = payload.Name;
        const ID = payload.ID
        req.Name = Name ;
        req.ID = ID ; 
        next();

    } catch (error) {
        console.log(error.message);
        res.status(401).json("un-authorized")
    }
}


module.exports = Authentication