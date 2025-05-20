const { v4: uuidv4 } = require('uuid');

/**
 * Middleware để đảm bảo mỗi request có sessionId
 * - Nếu đã có sessionId trong cookie, sử dụng giá trị đó
 * - Nếu chưa có, tạo mới và lưu vào cookie
 */
const ensureSessionId = (options = { cookieName: 'sessionId', maxAge: 7 * 24 * 60 * 60 * 1000 }) => {
  return (req, res, next) => {
    // Lấy sessionId từ cookie nếu có
    const sessionId = req.cookies[options.cookieName];

    if (sessionId) {
      // Gán vào request để sử dụng trong controller
      req.sessionId = sessionId;
    } else {
      // Tạo mới sessionId nếu chưa có
      const newSessionId = uuidv4();
      
      // Lưu vào cookie
      res.cookie(options.cookieName, newSessionId, {
        maxAge: options.maxAge, // Mặc định: 7 ngày
        httpOnly: true,
        sameSite: 'strict'
      });
      
      // Gán vào request
      req.sessionId = newSessionId;
    }
    
    next();
  };
};

module.exports = {
  ensureSessionId
};