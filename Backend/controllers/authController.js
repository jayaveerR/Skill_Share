const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { checkTextQuality, isUserSpamBlocked } = require('../utils/moderation');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      avatar,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          token: generateToken(user._id),
        },
        message: 'User registered successfully',
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for: ${email}`);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (include password)
    // Use strict lowercase comparison matching the Model's lowercase enforcement
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET is not defined in environment variables');
      // Fallback or error? Better to error to force fix, but for this context assume fallback might keep it running.
      // Actually, generateToken will fail (or use undefined? No, typically throws).
      // verify generateToken uses process.env.JWT_SECRET
    }

    console.log(`Login successful for ${email}`);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        skills: user.skills,
        interests: user.interests,
        token: generateToken(user._id),
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/auth/profile/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name bio avatar createdAt isOnline lastSeen');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar, skills, interests } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // SPAM PROTECTION & MODERATION
    if (bio) {
      const isBlocked = await isUserSpamBlocked(req.user._id);
      if (isBlocked) {
        return res.status(429).json({
          success: false,
          message: 'Your account is temporarily restricted due to multiple spam detections. Please try again in 24 hours.'
        });
      }

      const moderation = await checkTextQuality(bio, 'bio');
      if (moderation.classification === 'SPAM') {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { spamAttemptCount: 1 },
          lastSpamAttempt: new Date()
        });
        return res.status(400).json({
          success: false,
          message: 'Your bio was flagged as spam.',
          suggestion: moderation.suggestion
        });
      }
      // Proceed with bio
    }

    // Update fields if provided
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (skills) user.skills = skills;
    if (interests) user.interests = interests;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message,
    });
  }
};
