const mongo = require("mongoose");
const Orders = require("./Orders");
const Joi = require("joi").extend(require("@hapi/joi-date"));
const bcrypt = require("bcryptjs");
const userAccountsSchema = new mongo.Schema({
  Name: String,
  Email: String,
  Password: String,
  Phone: String,
  Gander: String,
  Status: String,
  ConfirmationCode: String,
  Timestamp: Date,
  TokenID: String,
});
// userAccountsSchema.virtual("userOrder", {
//   ref: "Order",
//   localField: "_id",
//   foreignField: "Owner",
// });

// userAccountsSchema.set('toObject', { virtuals: true });
// userAccountsSchema.set('toJSON', { virtuals: true });

const userAccountsModel = mongo.model("UsersAccount", userAccountsSchema);

const joiUsersAccount = Joi.object({
  Email: Joi.string().email().required(),
  Name: Joi.string().min(3).max(20).required().messages({
    "string.min": "Name at least 3 characters",
  }),
  Password: Joi.string().min(6).max(30).required().messages({
    "string.min": "Password at least 6 characters",
  }),
  Phone: Joi.string()
    .pattern(new RegExp("^01[0125][0-9]{8}$"))
    .required()
    .messages({
      "string.pattern.base": "Invalid Phone Number",
    }),
  Gander: Joi.string().min(4).max(6).required(),
});

const validateNewAcount = (user) => {
  return joiUsersAccount.validate(user);
  // need to return what in false in specific columns
};

const addAccount = async (obj) => {
  // ConfirmationCode and initial status of account  (Not Verified ) on object of user Data
  const ConfirmationCode = Math.floor(Math.random() * 10000 + 10000).toString();
  obj["ConfirmationCode"] = ConfirmationCode;
  obj["Status"] = "Pending";
  // set Timestamp
  const d = new Date();
  obj["Timestamp"] = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  //hash Password
  obj.Password = await bcrypt.hash(obj.Password, 12);

  try {
    let AccountExist = await getAccountByEmail(obj.Email);
    if (AccountExist.length) {
      return false;
    }
    const newAcount = new userAccountsModel(obj);
    let accountCreated = await newAcount.save();

    return accountCreated;
  } catch (error) {
    throw new Error(error.messages);
  }
};

const getAccountByEmail = async (email) => {
  const emailExsit = await userAccountsModel.find({ Email: email });
  return emailExsit;
};

const getPendingAccount = async ([email, code]) => {
  console.log(email + "  " + code);
  userAccountsModel.findOne({
    $and: [{ Email: email }, { ConfirmationCode: code }],
  });
};

const getAccountByID = (ID) => {
  return userAccountsModel.findById(ID);
};

const updateAccount = async (ID, updateObj) => {
  try {
    await userAccountsModel.findByIdAndUpdate(ID, updateObj, {
      useFindAndModify: false,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

const getUserOrders = async (id) => {
  try {
    const orders = await userAccountsModel
      .findOne(
          { Owner: id },
        // {
        //   'userOrder.Orders.Canceling': 0,
        //   'userOrder.Orders.Finshed': 0,
        // }
      )
      .populate({ path: "userOrder", select: "Phone Orders" });
      console.log(orders);  
    return orders;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  validateNewAcount,
  addAccount,
  getAccountByID,
  getAccountByEmail,
  updateAccount,
  getPendingAccount,
};
