// Vị trí file: product-service/__tests__/unit/product.service.test.js
// File test cho Product Service - Đã sửa lỗi ESLint no-undef
// Style hồng cute cho anh yêu dễ thương 💖

// Thêm các imports cần thiết
const axios = require("axios");
const Product = require("../../src/models/product.model");
const productService = require("../../src/services/product.service");

// Thêm comment để ESLint hiểu đây là môi trường Jest


describe("Product Service - restoreInventory", () => {
  let axiosMock;
  let productFindByIdMock;
  let productSaveMock;

  beforeEach(() => {
    // Mock axios
    axiosMock = jest.spyOn(axios, "get").mockResolvedValue({
      data: {
        success: true,
        data: {
          _id: "orderId123",
          paymentStatus: "refunded",
          items: [
            { product: "productId1", quantity: 2 },
            { product: "productId2", quantity: 3 },
          ],
        },
      },
    });

    // Mock Product model
    productFindByIdMock = jest.spyOn(Product, "findById");

    // Product 1
    const product1 = {
      _id: "productId1",
      name: "Test Product 1",
      stock: 5,
      save: jest.fn().mockResolvedValue(true),
    };

    // Product 2
    const product2 = {
      _id: "productId2",
      name: "Test Product 2",
      stock: 10,
      save: jest.fn().mockResolvedValue(true),
    };

    // Setup mocks
    productFindByIdMock
      .mockResolvedValueOnce(product1)
      .mockResolvedValueOnce(product2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should restore inventory for all products in order", async () => {
    // Call service
    const result = await productService.restoreInventory(
      "orderId123",
      "requestId123"
    );

    // Assert axios called to get order
    expect(axiosMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/orders/orderId123")
    );

    // Assert Product.findById called for each product
    expect(productFindByIdMock).toHaveBeenCalledTimes(2);
    expect(productFindByIdMock).toHaveBeenCalledWith("productId1");
    expect(productFindByIdMock).toHaveBeenCalledWith("productId2");

    // Assert result
    expect(result.success).toBe(true);
    expect(result.restoredItems).toHaveLength(2);
    expect(result.restoredItems[0]).toEqual({
      productId: "productId1",
      quantityRestored: 2,
    });
    expect(result.restoredItems[1]).toEqual({
      productId: "productId2",
      quantityRestored: 3,
    });
  });

  it("should throw error if order payment status is not refunded", async () => {
    // Change mock to return non-refunded order
    axiosMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          _id: "orderId123",
          paymentStatus: "paid", // Not refunded
          items: [],
        },
      },
    });

    // Call service and expect error
    await expect(
      productService.restoreInventory("orderId123", "requestId123")
    ).rejects.toThrow("Cannot restore inventory for non-refunded order");
  });

  it("should handle products that no longer exist", async () => {
    // Change mock to return one existing product and one missing
    productFindByIdMock
      .mockResolvedValueOnce(null) // First product not found
      .mockResolvedValueOnce({
        // Second product found
        _id: "productId2",
        name: "Test Product 2",
        stock: 10,
        save: jest.fn().mockResolvedValue(true),
      });

    // Call service
    const result = await productService.restoreInventory(
      "orderId123",
      "requestId123"
    );

    // Assert result contains only the product that was found
    expect(result.success).toBe(true);
    expect(result.restoredItems).toHaveLength(1);
    expect(result.restoredItems[0]).toEqual({
      productId: "productId2",
      quantityRestored: 3,
    });
  });
});
