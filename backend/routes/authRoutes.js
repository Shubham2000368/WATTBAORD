const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { 
  register, 
  login, 
  getMe, 
  getAllUsers,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Existing auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// ─── Google OAuth Routes ──────────────────────────────────────────────────────

// Step 1: Redirect user to Google login page
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google callback after user grants permission
router.get(
  '/google/callback',
  (req, res, next) => {
    const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
      ? "https://wattbaord-3.onrender.com"
      : (process.env.FRONTEND_URL || "http://localhost:3000");
    
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: `${FRONTEND_BASE_URL}/login?error=google_failed` 
    })(req, res, next);
  },
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        { id: req.user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Environment-based config for Frontend Redirect
      const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
        ? "https://wattbaord-3.onrender.com"
        : (process.env.FRONTEND_URL || "http://localhost:3000");

      res.redirect(`${FRONTEND_BASE_URL}/auth/google-success?token=${token}`);
    } catch (err) {
      console.error('[Google OAuth Callback] Error:', err.message);
      const FRONTEND_BASE_URL = process.env.NODE_ENV === "production"
        ? "https://wattbaord-3.onrender.com"
        : (process.env.FRONTEND_URL || "http://localhost:3000");
      res.redirect(`${FRONTEND_BASE_URL}/login?error=token_failed`);
    }
  }
);

module.exports = router;
