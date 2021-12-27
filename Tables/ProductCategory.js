const mongo = require("mongoose");
const Joi = require("joi");
const ProductSchema = new mongo.Schema(
  {
    CategoryName: {
      type: String,
      required: true, //  food or drink
      lowercase: true,
      trim: true,
    },
    SubCategory: [
      {
        SubCategory_id: mongo.ObjectId,
        Type: {
          type: String,
          lowercase: true,
          trim: true,
        },
        CategoryDescription: String, // food ===> pizza
        Items: [
          {
            Item_id: mongo.ObjectId, //(123464sgdjhgd)
            ProductName: String, //(margreta)
            Describe: String, // delicous pizza
            Rate: { type: String, default: "1" },
            Urls: {
              CloudinaryImage: String,
              ServerImage: String,
            },
            Size: {
              Value: { type: String, default: "1" }, // large
              Price: Number, // 50
              OldPrice: Number, //  70
            },
            created_at: { type: Date },
            updated_at: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  },
  { timestamp: true }
);

const joiSubCategory = Joi.object({
  CategoryName: Joi.string().required(),
  Type: Joi.string().required(),
  CategoryDescription: Joi.string().required(), // food ===> pizza
  Items: Joi.array().required(),
});

const joiCategoryItems = Joi.object({
  CategoryName: Joi.string().required(),
  Type: Joi.string().required(),
  ProductName: Joi.string().required().min(5).max(30),
  Describe: Joi.string().required().min(10).max(160),
  Size: Joi.object({
    Value: Joi.string(), // large
    Price: Joi.number().required(), // 50
    OldPrice: Joi.number(),
  }),
});

const ProductModel = mongo.model("Product", ProductSchema);

const joiValidateSubCategory = async (req, res, next) => {
  try {
    let { error } = await joiSubCategory.validate(req.body);
    if (error) {
      throw new Error(error);
    }
    next();
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const joiValidateCategoryItem = async (req, res, next) => {
  req.body.Size = {
    Price: +req.body.Price,
    OldPrice: +req.body.OldPrice,
    Value: req.body.Value,
  };

  delete req.body.Value;
  delete req.body.Price;
  delete req.body.OldPrice;
  console.log("text filds oK");
  return await joiCategoryItems.validate(req.body);
};
const findHierarchyIsValid = async (query) => {
  return await ProductModel.findOne(query).lean();
};
const validateCategory = async (req, res, next) => {
  const { CategoryName } = req.body;

  try {
    let result = await ProductModel.findOne({
      CategoryName: CategoryName,
    }).lean();
    if (result !== null) {
      throw new Error(" Category is Exist ");
    }
    next();
  } catch (error) {
    res.status(400).send(error.message);
  }
};
const validateSubCategoryHierarchy = async (req, res, next) => {
  let categoryName = req.body.CategoryName;
  try {
    let categoryExist = await findHierarchyIsValid({
      CategoryName: categoryName,
    });
    if (categoryExist === null) {
      throw new Error(" Category Not Exist ");
    }
    let result = await ProductModel.findOne({
      $and: [
        { CategoryName: categoryName },
        { "SubCategory.Type": req.body.Type },
      ],
    }).lean();
    if (result !== null) {
      res.status(400).send(" SubCategory is already Exist ");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
  next();
};
const validateProductHierarchy = async (req, res, next) => {
  try {
    let categoryName = req.body.CategoryName;
    let Type = req.body.Type;
    let categoryAndSubCategoryIsExist = await findHierarchyIsValid({
      $and: [{ CategoryName: categoryName }, { "SubCategory.Type": Type }],
    });
    if (categoryAndSubCategoryIsExist === null) {
      return new Error("Category or SubCategory Not Exist ");
    }
    let result = await ProductModel.findOne({
      $and: [
        { CategoryName: categoryName },
        { "SubCategory.Type": Type },
        { "SubCategory.Items.ProductName": req.body.ProductName },
      ],
    }).lean();
    if (result !== null) {
      return new Error(" Product Name Exist ");
    }
    console.log("Product tree oK");
  } catch (error) {
    return new Error(error.masseage);
  }
};

const insertCategory = async (category) => {
  let newCategory = new ProductModel(category);
  return await newCategory.save();
};
const insertSubCategory = async (categoryName, subCategory) => {
  let response = await ProductModel.findOneAndUpdate(
    { CategoryName: categoryName },
    { $push: { SubCategory: subCategory } },
    { useFindAndModify: false }
  );

  return response;
};
const insertProduct = async (categoryName, type, item) => {
  const updateditem = {
    ProductName: item.ProductName,
    Describe: item.Describe,
    Size: item.Size,
    Urls: item.Urls,
  };
  const response = await ProductModel.updateOne(
    { CategoryName: categoryName, SubCategory: { $elemMatch: { Type: type } } },
    { $push: { "SubCategory.$.Items": updateditem } },
    { useFindAndModify: false, new: true }
  );
  return response;
};

const getAllSubCategoryProduct = async (category, subCategory) => {
  const response = await ProductModel.findOne(
    { CategoryName: category },
    { SubCategory: { $elemMatch: { Type: subCategory } } }
  ).lean();

  return response.SubCategory[0].Items;
};

const getAllCategoryProduct = async () => {
  let subCategoryType = [];
  const response = await ProductModel.find(
    {},
    {
      CategoryName: 1,
      "SubCategory.Type": 1,
      "SubCategory.CategoryDescription": 1,
      "SubCategory.SubCategoryUrls": 1,
      _id: 0,
    }
  ).lean();
  response.map((category) => {
    category.SubCategory.map((item) => {
      subCategoryType.push({ item, CategoryName: category.CategoryName });
    });
  });
  return subCategoryType;
};
const getProductByName = async (product) => {
  const result = await ProductModel.aggregate([
    { $match: { CategoryName: product.mainCategory } },
    { $unwind: "$SubCategory" },
    { $match: { "SubCategory.Type": product.subCategory } },
    { $unwind: "$SubCategory.Items" },
    { $match: { "SubCategory.Items.ProductName": product.productName } },
    {
      $project: {
        "SubCategory.Items.Size": 1,
      },
    },
  ]);

  return result[0].SubCategory.Items;
};
const getProductsForSendOrderRequest = async (products) => {
  try {
    const productsName = [],
      productsCategory = [],
      productsSubCategory = [];

    products.map((item) => {
      productsName.push(item.name);
      productsCategory.push(item.mainCategory);
      productsSubCategory.push(item.subCategory);
    });
    const result = await ProductModel.aggregate([
      { $match: { CategoryName: { $in: productsCategory } } },
      { $unwind: "$SubCategory" },
      { $match: { "SubCategory.Type": { $in: productsSubCategory } } },
      { $unwind: "$SubCategory.Items" },
      { $match: { "SubCategory.Items.ProductName": { $in: productsName } } },
      {
        $project: {
          "SubCategory.Items.Size": 1,
          "SubCategory.Items.ProductName": 1,
        },
      },
    ]);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};

const calculateTotalOrderPrice = async (products) => {
  try {
    let totalPaymentPrice = 0;
    const productsPrice = await getProductsForSendOrderRequest(products);
    products.map((item) => {
      const Product = productsPrice.filter((element) => {
        return element.SubCategory.Items.ProductName === item.name;
      });
      item.PaymentPrice = Product[0].SubCategory.Items.Size.Price * item.amount;
      totalPaymentPrice += item.PaymentPrice;

      item.MainCategory = item.mainCategory;
      (item.SubCategory = item.subCategory),
        (item.ProductName = item.name),
        (item.Price = item.price),
        (item.Amount = item.amount);

      delete item.mainCategory;
      delete item.subCategory;
      delete item.name;
      delete item.price;
      delete item.amount;
      delete item.total;
    });
    return { products, totalPaymentPrice };
  } catch (error) {
    throw new Error(error.message);
  }
};
module.exports = {
  joiValidateCategoryItem,
  joiValidateSubCategory,
  insertCategory,
  insertSubCategory,
  insertProduct,
  validateCategory,
  validateSubCategoryHierarchy,
  validateProductHierarchy,
  getAllCategoryProduct,
  getAllSubCategoryProduct,
  getProductsForSendOrderRequest,
  getProductByName,
  calculateTotalOrderPrice,
};
