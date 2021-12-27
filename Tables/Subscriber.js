const mongo = require("mongoose")
const joi = require('joi')

const subscriberSchema = new mongo.Schema({
    Email:{
        type:String,
        unique: true,
    }
})
const subscriberModel = mongo.model('subscriber',subscriberSchema)

const joiSubscriber = joi.object({
    Email: joi.string().email().required(),
})

const validateSubscriber = (userObj) =>{
    return joiSubscriber.validate(userObj)
}
const addSubscriber = async (userObj) =>{
    try {
        const newSubscriber  = new subscriberModel(userObj)
        return await newSubscriber.save()
    } catch (error) {
        throw new Error(error.message)
    }
}

module.exports = {
    validateSubscriber,
    addSubscriber
}



