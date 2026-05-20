const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getPermissions, can } = require('../utils/permissions');

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

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    // Attach derived permissions so controllers never need to re-compute them
    req.user.permissions = getPermissions(req.user.role);

    next();
  } catch (err) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' Auth Middleware Error: ' + err.message + '\n');
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized to access this route', error: err.message });
  }
};

// Grant access to specific roles (e.g. authorize('admin'))
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Fine-grained permission check (e.g. hasPermission('manage:teams'))
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    if (!can(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: '${permission}' is required for this action`,
      });
    }
    next();
  };
};
