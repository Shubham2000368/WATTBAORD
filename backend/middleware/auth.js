const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    console.log('Verifying token:', token);
    console.log('With Secret:', process.env.JWT_SECRET?.substring(0, 5) + '...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded:', decoded);

    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Auth Middleware Error: ' + err.message + '\n');
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route', error: err.message });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
