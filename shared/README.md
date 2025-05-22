# RunOut-Billiard Shared Library

Thư viện shared cho các microservices trong dự án RunOut-Billiard.

## Cài đặt

```bash
npm install --save ../shared
// Sử dụng toàn bộ
const shared = require('runout-shared');

// Hoặc import riêng từng phần
const { logger, ApiError, authenticate } = require('runout-shared');
