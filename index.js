const expre = require('express');
const mongo = require('mongoose');
const customerRouter = require('./Router/CustomerRouters/CustomerAccRout')
const admainRouter = require('./Router/AdminRouter/ProductsRout')
const CORS = require('cors')
var bodyParser = require('body-parser')
var multer = require('multer');
var upload = multer();
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv').config();

const hbs = require('hbs')
const path = require('path')

const app = expre();

const viewsPath = path.join(__dirname,'/views')
app.set('view engine', 'hbs');
app.set('views',viewsPath);


app.use(CORS())
app.use(cookieParser())
app.use(expre.json())
app.use(expre.urlencoded({ extended: true}));


// for parsing multipart/form-data
// app.use(upload.array());
// app.use(expre.static('uploads'));




mongo.connect(process.env.mongoURI,{ useNewUrlParser: true , useUnifiedTopology: true ,useCreateIndex: true}).then(()=>{
    console.log('connected to Database');
}).catch((err)=>{
    console.log(err);
})

const port = process.env.PORT || 7000 ;
app.listen((port),()=>{
    console.log(`listening on port :${port}`);
})

app.use('/ElhendawyRestaurant',customerRouter)
app.use('/ElhendawyAdminRestaurant',admainRouter)

