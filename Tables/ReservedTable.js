const mongo = require("mongoose")
const Joi = require('joi').extend(require('@hapi/joi-date'));

const ReservationTablesSchema = new mongo.Schema({
    Name: String,
    Email: String,
    Date: Date,
    Time: String,
    Phone: String,
    NumberOfPeople: Number,
    SpecialRequest: String
})

const reservedTableModel = mongo.model("ReservationTables", ReservationTablesSchema)

const joiReservationTable = Joi.object({
    Name: Joi.string().min(3).max(20).required(),
    Email: Joi.string().email().required(),
    Date: Joi.date().raw().required(),
    Time: Joi.string().pattern(new RegExp('((1[0-2]|0?[1-9]):([0-5][0-9]) ?([AaPp][Mm]))')).required(),
    Phone: Joi.string().pattern(new RegExp('^01[0125][0-9]{8}$')).required(),
    NumberOfPeople: Joi.number().required(),
    SpecialRequest: Joi.string().required()
})

const validateNewReservation = (data) => {
    return joiReservationTable.validate(data);
}
const addReservation =async (data) => {
    const newReservation = new reservedTableModel(data)
    await newReservation.save();
    return newReservation;
}
const getReservedOrderbyEmail = async (email) => {
    let emailExsit;
    await reservedTableModel.find({ "Email": email }, (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            emailExsit = result;
        }
    });
    return emailExsit;
}


module.exports = {
    validateNewReservation,
    addReservation,
    getReservedOrderbyEmail
}

