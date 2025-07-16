'use strict';

const Sequelize = require('sequelize');
const {
    db: { host, port, name, user, password, dialect },
} = require('../configs/config.mongodb');

const sequelize = new Sequelize(name, user, password, {
    host: host,
    port: port,
    dialect: dialect,
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((error) => {
        console.error('Unable to connect to the database: ', error);
    });

// Initialize the db object
const database = {};

// Import models
const User = require('./user/user')(sequelize);
const Profile = require('./user/profile')(sequelize);
const Role = require('./user/role')(sequelize);
const KeyToken = require('./user/keyToken')(sequelize);
const RefreshTokenUsed = require('./user/refreshTokenUsed')(sequelize);
const Permission = require('./user/permission')(sequelize);

// Import product-related models
const Brand = require('./product/brand')(sequelize);
const Product = require('./product/product')(sequelize);
const ProductImage = require('./product/productImages')(sequelize);
const ProductMeta = require('./product/productMeta')(sequelize);
const Tag = require('./product/tags')(sequelize);

// Import category model
const Category = require('./categories/categories')(sequelize);

// Import order and payment models
const Order = require('./order/order')(sequelize);
const OrderLineItem = require('./order/orderLineItem')(sequelize);
const OrderLog = require('./order/orderLog')(sequelize);

// Import cart models
const Cart = require('./cart/cart')(sequelize);
const CartLineItem = require('./cart/cartLineItem')(sequelize);

// Import import receipt models
const ImportReceipt = require('./import-receipt/importReceipt')(sequelize);
const ImportReceiptDetail = require('./import-receipt/importReceiptDetail')(
    sequelize,
);
const Supplier = require('./import-receipt/supplier')(sequelize);

// Import address model
const UserAddress = require('./user/address')(sequelize);

// Import payment models
const Payment = require('./payment/payment')(sequelize);
const PaymentMethod = require('./payment/paymentMethod')(sequelize);
const CustomerPaymentOption = require('./payment/customerPaymentOptions')(
    sequelize,
);

// Import shipping models
const shippingMethod = require('./order/shippingMethods')(sequelize);

// Import promotion model
// const Promotion = require('./promotions/promotions')(sequelize);

// Assign models to the database object
// User-related models
database.User = User;
database.Profile = Profile;
database.Role = Role;
database.KeyToken = KeyToken;
database.RefreshTokenUsed = RefreshTokenUsed;
database.Permission = Permission;

// Product-related models
database.Brand = Brand;
database.Product = Product;
database.ProductImage = ProductImage;
database.ProductMeta = ProductMeta;
database.Tag = Tag;

// Category model
database.Category = Category;

// Order and Payment models
database.Order = Order;
database.OrderLineItem = OrderLineItem;
database.OrderLog = OrderLog;

// Cart models
database.Cart = Cart;
database.CartLineItem = CartLineItem;

// Import receipt models
database.ImportReceipt = ImportReceipt;
database.ImportReceiptDetail = ImportReceiptDetail;
database.Supplier = Supplier;

// Address model
database.UserAddress = UserAddress;

// Payment models
database.Payment = Payment;
database.CustomerPaymentOption = CustomerPaymentOption;
database.PaymentMethod = PaymentMethod;

// Shipping models
database.ShippingMethod = shippingMethod;

// Promotion model
// database.Promotion = Promotion;

// Define associations

// User & Profile
database.Profile.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});
database.User.hasOne(database.Profile, {
    foreignKey: 'user_id',
    as: 'profile',
});

// User & Role
database.User.belongsTo(database.Role, { foreignKey: 'role_id', as: 'role' });

// KeyToken & User
database.KeyToken.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});

// RefreshTokenUsed & KeyToken
database.RefreshTokenUsed.belongsTo(database.KeyToken, {
    foreignKey: 'user_id',
    targetKey: 'user_id',
    as: 'key_token',
});

// Permission & Role (Many-to-Many)
database.Permission.belongsToMany(database.Role, {
    through: 'tb_role_permission',
    foreignKey: 'permission_id',
    as: 'roles',
});
database.Role.belongsToMany(database.Permission, {
    through: 'tb_role_permission',
    foreignKey: 'role_id',
    as: 'permissions',
});

// Brand & Product
database.Brand.hasMany(database.Product, {
    foreignKey: 'brand_id',
    as: 'products',
});
database.Product.belongsTo(database.Brand, {
    foreignKey: 'brand_id',
    as: 'brand',
});

// Product & ProductImage
database.Product.hasMany(database.ProductImage, {
    foreignKey: 'product_id',
    as: 'images',
});
database.ProductImage.belongsTo(database.Product, {
    foreignKey: 'product_id',
    as: 'product',
});

// Product & ProductMeta (1-N)
database.Product.hasMany(database.ProductMeta, {
    foreignKey: 'product_id',
    as: 'meta',
});
database.ProductMeta.belongsTo(database.Product, {
    foreignKey: 'product_id',
    as: 'product',
});

// Product & Category (Many-to-Many through product_categories)
database.Product.belongsToMany(database.Category, {
    through: 'product_categories',
    foreignKey: 'product_id',
    otherKey: 'category_id',
    as: 'categories',
});
database.Category.belongsToMany(database.Product, {
    through: 'product_categories',
    foreignKey: 'category_id',
    otherKey: 'product_id',
    as: 'products',
});

// Product & Tag (Many-to-Many through product_tags)
database.Product.belongsToMany(database.Tag, {
    through: 'product_tags',
    foreignKey: 'product_id',
    otherKey: 'tag_id',
    as: 'tags',
});
database.Tag.belongsToMany(database.Product, {
    through: 'product_tags',
    foreignKey: 'tag_id',
    otherKey: 'product_id',
    as: 'products',
});

// Category self-association (parent-child)
database.Category.hasMany(database.Category, {
    foreignKey: 'parent_id',
    as: 'children',
});
database.Category.belongsTo(database.Category, {
    foreignKey: 'parent_id',
    as: 'parent',
});

// Order & User
database.Order.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});
database.User.hasMany(database.Order, {
    foreignKey: 'user_id',
    as: 'orders',
});

// Order & Payment
database.Order.belongsTo(database.Payment, {
    foreignKey: 'payment_id',
    as: 'payment',
});
database.Payment.hasMany(database.Order, {
    foreignKey: 'payment_id',
    as: 'orders',
});

// Payment & Order (reverse association for order_id in payment)
database.Payment.belongsTo(database.Order, {
    foreignKey: 'order_id',
    as: 'order',
});
database.Order.hasMany(database.Payment, {
    foreignKey: 'order_id',
    as: 'payments',
});

// PaymentMethod & CustomerPaymentOption
database.PaymentMethod.hasMany(database.CustomerPaymentOption, {
    foreignKey: 'payment_method_id',
    as: 'customerPaymentOptions',
});
database.CustomerPaymentOption.belongsTo(database.PaymentMethod, {
    foreignKey: 'payment_method_id',
    as: 'paymentMethod',
});

// CustomerPaymentOption & User
database.CustomerPaymentOption.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});
database.User.hasMany(database.CustomerPaymentOption, {
    foreignKey: 'user_id',
    as: 'customerPaymentOptions',
});

// Order & ShippingMethod
database.Order.belongsTo(database.ShippingMethod, {
    foreignKey: 'shipping_method_id',
    as: 'shippingMethod',
});
database.ShippingMethod.hasMany(database.Order, {
    foreignKey: 'shipping_method_id',
    as: 'orders',
});

// Order & OrderLineItem
database.Order.hasMany(database.OrderLineItem, {
    foreignKey: 'order_id',
    as: 'lineItems',
});
database.OrderLineItem.belongsTo(database.Order, {
    foreignKey: 'order_id',
    as: 'order',
});

// Order and OrderLog relationships
database.Order.hasMany(database.OrderLog, {
    foreignKey: 'order_id',
    as: 'logs',
});

database.OrderLog.belongsTo(database.Order, {
    foreignKey: 'order_id',
    as: 'order',
});

// Order & Product (Many-to-Many through OrderLineItem)
database.Order.belongsToMany(database.Product, {
    through: database.OrderLineItem,
    foreignKey: 'order_id',
    otherKey: 'product_id',
    as: 'products',
});
database.Product.belongsToMany(database.Order, {
    through: database.OrderLineItem,
    foreignKey: 'product_id',
    otherKey: 'order_id',
    as: 'orders',
});

// OrderLineItem & Product
database.OrderLineItem.belongsTo(database.Product, {
    foreignKey: 'product_id',
    as: 'product',
});
database.Product.hasMany(database.OrderLineItem, {
    foreignKey: 'product_id',
    as: 'orderLineItems',
});

// Cart & User
database.Cart.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});
database.User.hasMany(database.Cart, {
    foreignKey: 'user_id',
    as: 'carts',
});

// Cart & CartLineItem
database.Cart.hasMany(database.CartLineItem, {
    foreignKey: 'cart_id',
    as: 'lineItems',
});
database.CartLineItem.belongsTo(database.Cart, {
    foreignKey: 'cart_id',
    as: 'cart',
});

// CartLineItem & Product
database.CartLineItem.belongsTo(database.Product, {
    foreignKey: 'product_id',
    as: 'product',
});
database.Product.hasMany(database.CartLineItem, {
    foreignKey: 'product_id',
    as: 'cartLineItems',
});

// Cart & Product (Many-to-Many through CartLineItem)
database.Cart.belongsToMany(database.Product, {
    through: database.CartLineItem,
    foreignKey: 'cart_id',
    otherKey: 'product_id',
    as: 'products',
});
database.Product.belongsToMany(database.Cart, {
    through: database.CartLineItem,
    foreignKey: 'product_id',
    otherKey: 'cart_id',
    as: 'carts',
});

// ImportReceipt & User (N-1)
database.ImportReceipt.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});
database.User.hasMany(database.ImportReceipt, {
    foreignKey: 'user_id',
    as: 'importReceipts',
});

// ImportReceipt & Supplier (N-1)
database.ImportReceipt.belongsTo(database.Supplier, {
    foreignKey: 'supplier_id',
    as: 'supplier',
});
database.Supplier.hasMany(database.ImportReceipt, {
    foreignKey: 'supplier_id',
    as: 'importReceipts',
});

// ImportReceipt & ImportReceiptDetail (1-N)
database.ImportReceipt.hasMany(database.ImportReceiptDetail, {
    foreignKey: 'import_receipt_id',
    as: 'details',
});
database.ImportReceiptDetail.belongsTo(database.ImportReceipt, {
    foreignKey: 'import_receipt_id',
    as: 'importReceipt',
});

// ImportReceipt & Product (Many-to-Many through ImportReceiptDetail)
database.ImportReceipt.belongsToMany(database.Product, {
    through: database.ImportReceiptDetail,
    foreignKey: 'import_receipt_id',
    otherKey: 'product_id',
    as: 'products',
});
database.Product.belongsToMany(database.ImportReceipt, {
    through: database.ImportReceiptDetail,
    foreignKey: 'product_id',
    otherKey: 'import_receipt_id',
    as: 'importReceipts',
});

// ImportReceiptDetail & Product (N-1)
database.ImportReceiptDetail.belongsTo(database.Product, {
    foreignKey: 'product_id',
    as: 'product',
});
database.Product.hasMany(database.ImportReceiptDetail, {
    foreignKey: 'product_id',
    as: 'importReceiptDetails',
});

// User & Address (1-N)
database.User.hasMany(database.UserAddress, {
    foreignKey: 'user_id',
    as: 'addresses',
});
database.UserAddress.belongsTo(database.User, {
    foreignKey: 'user_id',
    as: 'user',
});

// Order & Address (N-1)
database.Order.belongsTo(database.UserAddress, {
    foreignKey: 'address_id',
    as: 'address',
});
database.UserAddress.hasMany(database.Order, {
    foreignKey: 'address_id',
    as: 'orders',
});

// // Product & Promotion (Many-to-Many)
// database.Product.belongsToMany(database.Promotion, {
//     through: 'product_promotions',
//     foreignKey: 'product_id',
//     otherKey: 'promotion_id',
//     as: 'promotions',
// });
// database.Promotion.belongsToMany(database.Product, {
//     through: 'product_promotions',
//     foreignKey: 'promotion_id',
//     otherKey: 'product_id',
//     as: 'products',
// });

// // SKU & Promotion (Many-to-Many, optional)
// database.SKU.belongsToMany(database.Promotion, {
//     through: 'sku_promotions',
//     foreignKey: 'sku_id',
//     otherKey: 'promotion_id',
//     as: 'promotions',
// });
// database.Promotion.belongsToMany(database.SKU, {
//     through: 'sku_promotions',
//     foreignKey: 'promotion_id',
//     otherKey: 'sku_id',
//     as: 'skus',
// });

// Sync the models with the database
sequelize
    .sync({ alter: true })
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch((error) => {
        console.error('Error creating database & tables: ', error);
    });

database.Sequelize = Sequelize;
database.sequelize = sequelize;

module.exports = database;
