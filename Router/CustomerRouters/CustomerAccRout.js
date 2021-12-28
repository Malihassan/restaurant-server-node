const express = require("express");
const sendMail = require("../../Config/EmailSender.Config");
const authentication = require("../../Middleware/authentication");
const UsersAccount = require("../../Tables/UserAcount");
const usersOrder = require("../../Tables/Orders");
const ContactUs = require("../../Tables/ContactMail");
const bookTable = require("../../Tables/ReservedTable");
const Product = require("../../Tables/ProductCategory");
const Subscriber = require("../../Tables/Subscriber");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const authByGmail = require("../../Middleware/authByGmail");
const dotenv = require("dotenv").config();

const router = express.Router();

router.get("/checkAuth", authentication, async (req, res) => {
  if (req.status == 401) {
    console.log("not Auth");
    res.status(401).json({ response: "unAuth" });
  } else {
    console.log("auth");
    res.status(200).json({ response: "auth", id: req.ID });
  }
});
router.post("/addNewAcount", async (req, res) => {
  try {
    const userData = req.body;
    const { error } = await UsersAccount.validateNewAcount(userData);
    if (error) {
      return res.status(400).json({ response: error.details[0].message });
    }
    const accountCreated = await UsersAccount.addAccount(userData);
    console.log(accountCreated);
    if (!accountCreated) {
      return res.status(405).json({ response: "Account Exist" });
    }
    sendMail.sendConfirmationEmail(
      accountCreated._id,
      accountCreated.Email,
      accountCreated.Name,
      accountCreated.ConfirmationCode
    );
    return res.status(200).json({ isCreated: true });
  } catch (error) {
    res.status(500).send();
  }
});
router.get("/activateAccount/:_id/:confirmationCode", async (req, res) => {
  const { confirmationCode, _id } = req.params;
  const emailExist = await UsersAccount.getAccountByID(_id);
  if (Object.keys(emailExist).length === 0) {
    return res.render("welcome", { message: "This Account Not Exist" });
  }
  if (emailExist.Status !== "Pending") {
    return res.render("welcome", {
      message: "Account alredy activated",
      link: `${process.env.PROJECT_URL}account/login`,
    });
  }
  if (emailExist.ConfirmationCode !== confirmationCode) {
    return res.render("welcome", { message: " WRONG CONFIRAMTION CODE " });
  }

  emailExist.Status = "Active";
  await UsersAccount.updateAccount(emailExist._id, emailExist);
  return res.render("welcome", {
    message: "Thank You For Confirmation Account ",
    link: `${process.env.PROJECT_URL}account/login`,
  });
});
router.post("/login", async (req, res) => {
  try {
    let { Email, Password } = req.body;
    const emailExist = await UsersAccount.getAccountByEmail(Email);
    if (emailExist.length === 0) {
      return res.status(404).send({ response: " Email Not Exist " });
    }
    if (emailExist[0].Status === "Pending") {
      return res.status(401).send({ response: " this account not active " });
    }
  
    const validPassword = await bcrypt.compare(Password, emailExist[0].Password);
  
    if (!validPassword) {
      return res.status(400).send({ response: " Incorrect Password " });
    }
    const payload = {
      Email: Email,
      Name: emailExist[0].Name,
      ID: emailExist[0]._id,
    };
  
    const token = await jwt.sign(payload, process.env.SECRETKEY, {
      expiresIn: 24 * 60 * 60,
    });
    //save new token
    emailExist[0].TokenID = token;
  
    UsersAccount.updateAccount(emailExist[0]._id, emailExist[0]);
  
    res.status(200).send({ response: " Authentication ", tokenID: token });
  } catch (error) {
    res.status(500).send()
  }
 
});
router.post("/logout", authentication, async (req, res) => {
  try {
    const emailExist = await UsersAccount.getAccountByID(req.ID);
    emailExist.TokenID = "";
    await emailExist.save();
    res.status(200).send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post("/loginWithGmail", authByGmail, async (req, res) => {
  try {
    const userData = req.userData;
    await UsersAccount.updateAccount(userData._id, userData);
    res
      .status(200)
      .send({ response: " Authentication ", tokenID: userData.TokenID });
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.post("/forgetPassword", async (req, res) => {
  const emailExist = await UsersAccount.getAccountByEmail(req.body.Email);

  if (emailExist.length === 0) {
    return res.status(404).json({ response: "Email Not Exist" });
  }
  sendMail.sendResetPassword(
    emailExist[0]._id,
    emailExist[0].Email,
    emailExist[0].Name,
    emailExist[0].ConfirmationCode
  );
  res.status(200).json({ response: "Success send code" });
});
router.get("/resetPassword", async (req, res) => {
  let confirmationCode = req.query.c;
  res.render("resetPassword");
});
router.post("/newPassword", async (req, res) => {
  let newpass = req.body;
  let documentId =newpass.i
  let confirmCode =newpass.c
  console.log('documentId',documentId);
  console.log("Code Confirmation",confirmCode);

  const emailExist = await UsersAccount.getAccountByID(documentId);
  console.log("email Exist",emailExist);
  console.log("email Exist lenth arr",emailExist.length);

  if (
    Object.keys(emailExist).length === 0 ||
    emailExist.ConfirmationCode !== confirmCode
  ) {
    return res.status(404).send({ response: " Server Error " });
  }

  newpass.Password = await bcrypt.hash(newpass.Password, 12);
  emailExist.Password = newpass.Password;
  const active = await UsersAccount.updateAccount(emailExist._id, emailExist);
  res.status(200).json({ response: " success create new password " });
});
router.post("/subscribeNewsLetter", async (req, res) => {
  try {
    const Email = req.body;
    const { error } = Subscriber.validateSubscriber(Email);
    if (error) {
      throw new Error(error);
    }
    const addNewSubscriber = await Subscriber.addSubscriber(Email);
    res.status(200).send(addNewSubscriber);
  } catch (error) {
    if (error.message.includes("E11000 duplicate key error collection")) {
      return res.status(404).json({ response: "Subscriber is Exist" });
    }
    return res.status(500).send(error.message);
  }
});
router.get("/category", async (req, res) => {
  try {
    const category = await Product.getAllCategoryProduct();
    res.status(200).send(category);
  } catch (error) {
    res.status(500).send();
  }
});
router.get("/menu/:category/:subcategory", async (req, res) => {
  const { category, subcategory } = req.params;
  //   console.log(category, subcategory);
  try {
    const product = await Product.getAllSubCategoryProduct(
      category,
      subcategory
    );
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send();
  }
});
router.post("/sendOrder", authentication, async (req, res) => {
  try {
    const _id = req.ID;
    let newOrder = req.body;

    const { error } = await usersOrder.validateNewOrder(newOrder);
    if (error) {
      return res.status(400).json({response:error.message});
    }
    const { products: cart, totalPaymentPrice } =
      await Product.calculateTotalOrderPrice(newOrder.Cart);
    await usersOrder.addNewOrder(
      _id,
      newOrder.Location,
      cart,
      totalPaymentPrice
    );
    return res.status(200).send("Success");
  } catch (error) {
    return res.status(500).send();
  }
});
router.get('/getOrders' ,authentication,async (req,res)=>{
    try {
      const ordersHistory =await usersOrder.getUserOrders(req.ID)
      res.status(200).send(ordersHistory)
    } catch (error) {
      res.status(500).send(error.message)
    }
})
router.post("/contactUs", async (req, res) => {
  let userMail = req.body;
  console.log(userMail);
  const { error } = await ContactUs.validateContactMail(userMail);
  if (error) {
    res.status(400).json(error.details[0].message);
  } else {
    const addMail = ContactUs.addContactMail(userMail);
    res.status(200).json("Success");
  }
});
router.post("/bookTable", async (req, res) => {
  try {
  let userData = req.body;
  const { error } = await bookTable.validateNewReservation(userData);
  if (error) {
    return res.status(400).json({response:error.details[0].message});
  }
  const addReservation =await bookTable.addReservation(userData);
  res.status(200).json("Success");

  } catch (error) {
   res.status(500).send() 
  }

});
module.exports = router;
