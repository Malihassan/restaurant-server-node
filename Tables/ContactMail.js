const mongo = require("mongoose")
const Joi = require('joi').extend(require('@hapi/joi-date'));


const contactSchema  = new mongo.Schema({
    Email   :String ,
    Subject :String ,
    Message : String 
})

const contactModel = mongo.model("UserContactMail",contactSchema)

const joiContactUs = Joi.object({
    Email: Joi.string().email().required(),
    Subject: Joi.string().required(),
    Message: Joi.string().required()
})

const validateContactMail = (mail) =>{
    return joiContactUs.validate(mail)
}

const addContactMail = (mail) =>{
    const newMail = new contactModel(mail)
    newMail.save();
    return newMail ;
}
const getContactMailByEmail = async (email) => {
    let emailExsit;
    await contactModel.find({ "Email": email }, (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            emailExsit = result;
        }
    });
    return emailExsit;
}


module.exports= {
    validateContactMail,
    addContactMail,
    getContactMailByEmail
}