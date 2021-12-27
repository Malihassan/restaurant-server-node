const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();
const UsersAccount = require("../Tables/UserAcount");
const jwt = require("jsonwebtoken");

const authByGmail = async (req, res,next) => {
  try {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email } = ticket.getPayload();

    const emailExist = await UsersAccount.getAccountByEmail(email);
    if (!emailExist.length) {
      return res.status(404).send({ response: " Email Not Exist " });
    }

    const newToken = await createToken({
      Email: email,
      Name: emailExist[0].Name,
      ID: emailExist[0]._id,
    });
    
    emailExist[0].TokenID = newToken;
    req.userData = emailExist[0]
    next()

  } catch (error) {
    res.status(400).send(error.message);
  }
};

async function createToken(payload) {
  const token = await jwt.sign(payload, process.env.SECRETKEY, {
    expiresIn: 24 * 60 * 60,
  });
  return token;
}

module.exports = authByGmail;
