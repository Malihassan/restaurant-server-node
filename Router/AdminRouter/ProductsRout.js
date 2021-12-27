const express = require("express");
var multer = require("multer");
var path = require("path");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv").config();
const ProductCategory = require("../../Tables/ProductCategory");
const router = express.Router();



router.post("/addCategory",
  ProductCategory.validateCategory,
  async (req, res) => {
    const category = req.body;
    try {
      await ProductCategory.insertCategory(category);
      res.status(201).send();
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);
router.post("/addSubCategory",
  ProductCategory.joiValidateSubCategory,
  ProductCategory.validateSubCategoryHierarchy,
  async (req, res) => {
    try {
      await ProductCategory.insertSubCategory(req.body.CategoryName, req.body);
      res.status(201).send();
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);
// cloudinary configuration
cloudinary.config({
  cloud_name: process.env.cloudinaryAPI_NAME,
  api_key: process.env.cloudinaryAPI_KEY,
  api_secret: process.env.cloudinaryAPI_SECRET,
});
function uploadToCloudinary(image) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(process.cwd() + image, (err, url) => {
      if (err) return reject(err);
      return resolve(url);
    });
  });
}
var storage = multer.diskStorage({
  limits: {
    fileSize: 1000000,
  },
  destination: function (req, file, callback) {
    callback(null, "uploads/productsImage");
  },
  filename: function (req, file, callback) {
    callback(
      null,
      file.fieldname + "-" + req.body.ProductName + "-" + Date.now()
    );
  },
});
const upload = multer({
  storage: storage,
  fileFilter: async function (req, file, callback) {
    // console.log("Validate Error ==>>");
    const { error } = await ProductCategory.joiValidateCategoryItem(req);
    if (error) {
      return callback(new Error(error));
    }
    // Validate if category , subcategory and product  is exist or not  ==>>
    const validProductTree = await ProductCategory.validateProductHierarchy(
      req
    );
    if (validProductTree instanceof Error) {
      return callback(new Error(validProductTree));
    }

    if (!file.originalname.match(/\.(png|PNG|jpg|gif|jpeg)$/)) {
      return callback(new Error("Only images are allowed"));
    }
    callback(undefined, true);
  },
});
router.post("/addProduct",
  upload.single("Image"),
  async (req, res) => {
    try {
      let result = await uploadToCloudinary(
        `/uploads/productsImage/${req.file.filename}`
      );
      req.body.Urls = {
        ServerImage: `uploads/productsImage/${req.file.filename}`,
        CloudinaryImage: result.secure_url,
      };

      const inserted = await ProductCategory.insertProduct(req.body.CategoryName,req.body.Type,req.body);
      if (inserted.ok === 1) {
        res.status(200).send(req.body);
      }
      
    } catch (error) {
      res.status(500).send(error.message);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);
module.exports = router;

