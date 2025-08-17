const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
async function register(req, res) {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.create({ email, password, firstName, lastName });
    // In a real app, you might want to automatically log them in and return a token here
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    logger.error({ err: error }, 'Error during user registration');
    res.status(500).json({ message: 'Internal server error.' });
  }
}

/**
 * Log in a user
 */
const jwt = require('jsonwebtoken');

// ... (register function remains the same)

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // User.authenticate should just return the user now
    const user = await User.authenticate(email, password);

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'a-very-secret-key-that-should-be-in-env',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    logger.warn({ err: error, email }, 'Failed login attempt');
    res.status(401).json({ message: 'Invalid credentials.' });
  }
}

module.exports = {
  register,
  login,
};
