/**
 * Vị trí file: /src/seed/seed-data.js
 * Script tạo dữ liệu mẫu cho product service
 * Style: Hồng dễ thương dành cho anh yêu dễ thương 🩷
 * Chạy với lệnh: node src/seed/seed-data.js
 */

const mongoose = require('mongoose');
const slugify = require('slugify');
const Category = require('../models/category.model');
const Product = require('../models/product.model');
const logger = require('../utils/logger');
const connectDB = require('../config/db');
require('dotenv').config();

// Xóa dữ liệu cũ
const clearData = async () => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    logger.info('Existing data cleared');
  } catch (error) {
    logger.error(`Error clearing data: ${error.message}`);
    throw new Error(`Failed to clear data: ${error.message}`);
  }
};

// Tạo danh mục mẫu
const createCategories = async () => {
  try {
    const categories = [
      {
        name: "Cơ bida",
        description: "Các loại cơ bida chất lượng cao",
        order: 1,
        image: "https://example.com/images/cues.jpg"
      },
      {
        name: "Bi bida",
        description: "Bộ bi bida chính hãng",
        order: 2,
        image: "https://example.com/images/balls.jpg"
      },
      {
        name: "Phấn bida",
        description: "Phấn chuyên dụng cho cơ bida",
        order: 3,
        image: "https://example.com/images/chalk.jpg"
      },
      {
        name: "Phụ kiện",
        description: "Các phụ kiện khác cho bida",
        order: 4,
        image: "https://example.com/images/accessories.jpg"
      },
      {
        name: "Bàn bida",
        description: "Bàn bida chất lượng cao",
        order: 5,
        image: "https://example.com/images/tables.jpg"
      }
    ].map(cat => ({
      ...cat,
      slug: slugify(cat.name, { lower: true, strict: true }) // Tự động sinh slug từ name
    }));

    const savedCategories = await Category.insertMany(categories);
    logger.info(`${savedCategories.length} categories created`);
    return savedCategories;
  } catch (error) {
    logger.error(`Error creating categories: ${error.message}`);
    throw new Error(`Failed to create categories: ${error.message}`);
  }
};

// Tạo sản phẩm mẫu
const createProducts = async (categories) => {
  try {
    // Map các category theo name để dễ tham chiếu
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    const products = [
      // Cơ bida
      {
        name: "Cơ Cue Sports C-07",
        description: "Cơ bida cao cấp với trọng lượng cân đối, đầu cơ làm từ gỗ thích, phù hợp cho người chơi chuyên nghiệp",
        price: 1200000,
        salePrice: 999000,
        category: categoryMap["Cơ bida"],
        brand: "Cue Sports",
        stock: 20,
        images: [
          "https://example.com/images/cue-c07-1.jpg",
          "https://example.com/images/cue-c07-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/cue-c07-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 4.8, count: 15 }
      },
      {
        name: "Cơ Adam A-900",
        description: "Cơ bida Adam chuyên nghiệp, sản xuất từ gỗ thủy tùng, chính xác và cân bằng tốt",
        price: 2500000,
        category: categoryMap["Cơ bida"],
        brand: "Adam",
        stock: 8,
        images: [
          "https://example.com/images/cue-a900-1.jpg",
          "https://example.com/images/cue-a900-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/cue-a900-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 4.9, count: 22 }
      },
      {
        name: "Cơ Lồng Taiwan TX-2",
        description: "Cơ bida lồng giá rẻ phù hợp cho người mới tập chơi",
        price: 650000,
        salePrice: 550000,
        category: categoryMap["Cơ bida"],
        brand: "Taiwan",
        stock: 30,
        images: [
          "https://example.com/images/cue-tx2-1.jpg"
        ],
        thumbnailImage: "https://example.com/images/cue-tx2-thumb.jpg",
        isActive: true,
        isFeatured: false,
        ratings: { average: 4.1, count: 8 }
      },
      
      // Bi bida
      {
        name: "Bộ bi Pool Aramith Premier",
        description: "Bộ bi bida 16 viên chính hãng Aramith, chuẩn thi đấu quốc tế",
        price: 4200000,
        category: categoryMap["Bi bida"],
        brand: "Aramith",
        stock: 5,
        images: [
          "https://example.com/images/aramith-premier-1.jpg",
          "https://example.com/images/aramith-premier-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/aramith-premier-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 5.0, count: 12 }
      },
      {
        name: "Bộ bi Carom Dynamic Billiard",
        description: "Bộ bi Carom 3 viên chất lượng cao, độ nảy chuẩn",
        price: 3800000,
        category: categoryMap["Bi bida"],
        brand: "Dynamic Billiard",
        stock: 3,
        images: [
          "https://example.com/images/dynamic-carom-1.jpg"
        ],
        thumbnailImage: "https://example.com/images/dynamic-carom-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 4.7, count: 7 }
      },
      
      // Phấn bida
      {
        name: "Phấn Master", 
        description: "Phấn Master chất lượng cao, màu xanh, hộp 12 viên",
        price: 180000,
        category: categoryMap["Phấn bida"],
        brand: "Master",
        stock: 50,
        images: [
          "https://example.com/images/master-chalk-1.jpg"
        ],
        thumbnailImage: "https://example.com/images/master-chalk-thumb.jpg",
        isActive: true,
        isFeatured: false,
        ratings: { average: 4.5, count: 30 }
      },
      
      // Phụ kiện
      {
        name: "Bao cơ bida 2 ngăn",
        description: "Bao đựng cơ bida 2 ngăn, chất liệu da PU cao cấp, chống thấm tốt",
        price: 450000,
        salePrice: 399000,
        category: categoryMap["Phụ kiện"],
        brand: "Carom",
        stock: 15,
        images: [
          "https://example.com/images/cue-case-1.jpg",
          "https://example.com/images/cue-case-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/cue-case-thumb.jpg",
        isActive: true,
        isFeatured: false,
        ratings: { average: 4.3, count: 9 }
      },
      {
        name: "Găng tay bida",
        description: "Găng tay bida cao cấp, chất liệu mềm mại, thoáng khí",
        price: 120000,
        category: categoryMap["Phụ kiện"],
        brand: "Billiard Pro",
        stock: 40,
        images: [
          "https://example.com/images/glove-1.jpg"
        ],
        thumbnailImage: "https://example.com/images/glove-thumb.jpg",
        isActive: true,
        isFeatured: false,
        ratings: { average: 4.2, count: 15 }
      },
      
      // Bàn bida
      {
        name: "Bàn bida pool 9018 Điện tử",
        description: "Bàn bida pool cao cấp, kích thước 9ft, đá bàn Slate 3 mảnh, hệ thống điện tử",
        price: 45000000,
        category: categoryMap["Bàn bida"],
        brand: "Việt Nam",
        stock: 2,
        images: [
          "https://example.com/images/table-9018-1.jpg",
          "https://example.com/images/table-9018-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/table-9018-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 4.9, count: 5 }
      },
      {
        name: "Bàn bida Carom TS-01",
        description: "Bàn bida carom chuyên nghiệp, đá Slate nguyên khối, mặt nỉ Simonis",
        price: 60000000,
        category: categoryMap["Bàn bida"],
        brand: "Belgium",
        stock: 1,
        images: [
          "https://example.com/images/carom-ts01-1.jpg"
        ],
        thumbnailImage: "https://example.com/images/carom-ts01-thumb.jpg",
        isActive: true,
        isFeatured: true,
        ratings: { average: 5.0, count: 3 }
      },
      {
        name: "Bàn bida mini",
        description: "Bàn bida mini để bàn, phù hợp cho trẻ em và giải trí gia đình",
        price: 2500000,
        salePrice: 1999000,
        category: categoryMap["Bàn bida"],
        brand: "Fun Pool",
        stock: 7,
        images: [
          "https://example.com/images/mini-table-1.jpg",
          "https://example.com/images/mini-table-2.jpg"
        ],
        thumbnailImage: "https://example.com/images/mini-table-thumb.jpg",
        isActive: true,
        isFeatured: false,
        ratings: { average: 4.0, count: 12 }
      },
      
      // Sản phẩm không active
      {
        name: "Cơ bida cũ (Đã ngừng kinh doanh)",
        description: "Sản phẩm đã ngừng kinh doanh",
        price: 500000,
        category: categoryMap["Cơ bida"],
        brand: "Unknown",
        stock: 0,
        images: [],
        isActive: false,
        isFeatured: false,
        ratings: { average: 0, count: 0 }
      }
    ].map(prod => ({
      ...prod,
      slug: slugify(prod.name, { lower: true, strict: true }) // Tự động sinh slug từ name cho mỗi product
    }));

    const savedProducts = await Product.insertMany(products);
    logger.info(`${savedProducts.length} products created`);
    return savedProducts;
  } catch (error) {
    logger.error(`Error creating products: ${error.message}`);
    throw new Error(`Failed to create products: ${error.message}`);
  }
};

// Hàm chính để chạy quá trình seed data
const seedData = async () => {
  try {
    await connectDB();
    await clearData();
    const categories = await createCategories();
    await createProducts(categories);
    
    logger.info('Data seeding completed successfully!');
    return true;
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`);
    throw error;
  }
};

// Thực thi hàm seedData và xử lý kết quả
const main = async () => {
  try {
    await seedData();
    // Kết thúc chương trình thành công
    process.exitCode = 0;
  } catch (error) {
    // Kết thúc chương trình với lỗi
    process.exitCode = 1;
  } finally {
    // Đóng kết nối MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

// Chạy hàm main
main();