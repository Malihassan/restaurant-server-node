const nodemailer = require("nodemailer");
const nodemailerSendgrid = require("nodemailer-sendgrid");
const dotenv = require("dotenv").config();
const transport = nodemailer.createTransport(
  nodemailerSendgrid({
    apiKey: process.env.SENDGRID_API_KEY,
  })
);

module.exports.sendConfirmationEmail = (
  _id,
  userEmail,
  name,
  confirmationCode
) => {
  console.log(`Sending Email to ${userEmail} name ${name} code ${userEmail} `);
  const authData = {
    userEmail,
    confirmationCode,
  };
  transport.sendMail(
    {
      from: process.env.ADMAIN_EMAIL,
      to: userEmail,
      subject: "Please confirm your account",
      html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing. Please confirm your email by clicked on bottom link</p>
        <a href=${process.env.PROJECT_URL}ElhendawyRestaurant/activateAccount/${_id}/${confirmationCode}>verify your email</a>
        </div>`,
    },
    (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Message Sent");
      }
    }
  );
};

module.exports.sendResetPassword = (_id, userEmail, name, confirmationCode) => {
  console.log(
    `Reset Email to ${userEmail} name ${name} code ${confirmationCode} `
  );
  transport.sendMail(
    {
      from: process.env.ADMAIN_EMAIL,
      to: userEmail,
      subject: "Reset Password",
      html: `<h1>Email Confirmation</h1>
        <h2>Hello ${name}</h2>
        <p>Thank you for subscribing.</p>
        <a href=${process.env.PROJECT_URL}ElhendawyRestaurant/resetPassword/?i=${_id}&c=${confirmationCode}>Reset Your Password</a>
        </div>`,
    },
    (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Message Sent: ");
      }
    }
  );
};
