const mongo = require("mongoose");
const joi = require("joi").extend(require("@hapi/joi-date"));

const OrderSchema = new mongo.Schema(
  {
    Owner: {
      type: mongo.ObjectId,
      ref: "UserAcount",
    },
    Orders: [
      {
        _OrderID: mongo.Schema.Types.ObjectId,
        TotalPaymentPrice: Number,
        Canceling: Boolean,
        Timestamp: { type: Date, default: Date.now },
        Finshed: Boolean,
        Location: {
          Coordinates: { type: { Number }, default: ["", ""] }, // 'location.type' must be 'Point'
        },
        Cart: [
          {
            MainCategory: String,
            SubCategory: String,
            ProductName: String,
            Price: Number,
            Amount: Number,
            PaymentPrice: Number,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);
const OrderModel = mongo.model("Order", OrderSchema);

const joiOrder = joi.object({
  Location: joi
    .object()
    .keys({
      Coordinates: joi.required(),
    })
    .optional(),
  Cart: joi.array().items(
    joi.object().keys({
      id: joi.string().required(),
      mainCategory: joi.string().required(),
      subCategory: joi.string().required(),
      name: joi.string().required(),
      price: joi.number().required(),
      amount: joi.number().min(1).max(9).required(),
      total: joi.number().required(),
    })
  ),
});

const validateNewOrder = (order) => {
  return joiOrder.validate(order);
};

const addUserOrderDoc = (obj) => {
  const newAcount = new OrderModel(obj);
  return newAcount.save();

  // OrderModel.findOneAndUpdate({ Owner: id } ,{ upsert: true, new: true, setDefaultsOnInsert: true })
};

const addNewOrder = async (
  id,
  orderLocationDelivery,
  cart,
  totalPaymentPrice
) => {
  let order = {
    Canceling: false,
    Finshed: false,
    TotalPaymentPrice: totalPaymentPrice,
    Location: orderLocationDelivery,
    Cart: cart,
    Owner: id,
  };
  try {
    await OrderModel.findOneAndUpdate(
      { Owner: id },
      { $push: { Orders: order } },
      { useFindAndModify: false, upsert: true, new: true }
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

const getUserOrders = async (id) => {
  try {
    const orders = await OrderModel.findOne(
      { Owner: id },
      {
        'Orders.Canceling': 0,
        'Orders.Finshed': 0,
      }
    )
    return orders.Orders;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  validateNewOrder,
  addUserOrderDoc,
  addNewOrder,
  getUserOrders,
};
