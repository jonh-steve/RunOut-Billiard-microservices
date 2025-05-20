// Khởi tạo database runout-biliard
db = db.getSiblingDB('runout-biliard');

// Tạo user admin nếu chưa có
db.createUser({
  user: "admin",
  pwd: "admin_password",
  roles: [
    { role: "readWrite", db: "runout-biliard" },
    { role: "dbAdmin", db: "runout-biliard" }
  ]
});

// Tạo các collections
db.createCollection("users");
db.createCollection("categories");
db.createCollection("products");
db.createCollection("orders");
db.createCollection("reviews");
db.createCollection("carts");
db.createCollection("payments");

// Tạo admin user mặc định
db.users.insertOne({
  name: "Admin User",
  email: "admin@runout-biliard.com",
  password: "$2b$10$7D1yd1Nj0WuPrFM7F0au5O9UlhTUsniqGAF9qZ/JgUnTwt4S89Ym6", // bcrypt hash của "password123"
  role: "admin",
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Tạo một số danh mục mẫu
const categoriesData = [
  {
    name: "Cue Sticks",
    slug: "cue-sticks",
    description: "Professional and amateur cue sticks for all skill levels",
    parent: null,
    ancestors: [],
    level: 0,
    order: 1,
    isActive: true,
    isVisible: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Balls",
    slug: "balls",
    description: "High-quality billiard balls for pool, snooker, and carom",
    parent: null,
    ancestors: [],
    level: 0,
    order: 2,
    isActive: true,
    isVisible: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Accessories for billiard enthusiasts",
    parent: null,
    ancestors: [],
    level: 0,
    order: 3,
    isActive: true,
    isVisible: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.categories.insertMany(categoriesData);

// Lấy ID của các danh mục để tạo sản phẩm mẫu
const cueStickCategory = db.categories.findOne({ slug: "cue-sticks" });
const ballsCategory = db.categories.findOne({ slug: "balls" });
const accessoriesCategory = db.categories.findOne({ slug: "accessories" });

// Tạo một số sản phẩm mẫu
const productsData = [
  {
    name: "Professional Maple Cue Stick",
    slug: "professional-maple-cue-stick",
    price: 299.99,
    stock: 25,
    category: cueStickCategory._id,
    brand: "CueMaster",
    description: "High-quality maple cue stick for professional players",
    images: [],
    isActive: true,
    isFeatured: true,
    ratings: { average: 4.8, count: 32 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Tournament Standard Ball Set",
    slug: "tournament-standard-ball-set",
    price: 89.99,
    stock: 40,
    category: ballsCategory._id,
    brand: "BilliardPro",
    description: "Official tournament standard billiard ball set",
    images: [],
    isActive: true,
    isFeatured: true,
    ratings: { average: 4.6, count: 28 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Premium Leather Tip",
    slug: "premium-leather-tip",
    price: 14.99,
    stock: 100,
    category: accessoriesCategory._id,
    brand: "CueMaster",
    description: "Premium quality leather tip for cue sticks",
    images: [],
    isActive: true,
    isFeatured: false,
    ratings: { average: 4.5, count: 42 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.products.insertMany(productsData);

print("Database initialization completed successfully!");