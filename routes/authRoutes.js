// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path as necessary
const verifyToken = require('../middleware.js/authMiddleware'); // Adjust the path as necessary
const Entry = require('../models/entry');

const JWT_SECRET = process.env.JWT_SECRET 


// routes/entries.js
router.get('/', verifyToken, async (req, res) => {
  try {
    const entries = await Entry.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// Create a new entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, startDate, endDate, income, expenses } = req.body;

const newEntry = new Entry({
  userId: req.user.id,
  title,
  startDate,
  endDate,
  income: income || [],          //✅ Fallback to empty array
  expenses: expenses || []       // ✅ Fallback to empty array
});

    await newEntry.save();

    res.status(201).json({ message: 'Entry saved successfully', entry: newEntry });
  } catch (error) {
    console.error('Entry Save Error:', error);
    res.status(500).json({ message: 'Failed to save entry', error: error.message });
  }
});



// Update entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const entry = await Entry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },  // ✅ correct field name
      req.body,
      { new: true }
    );

    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    res.json(entry);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});



// Delete entry
// ✅ DELETE /api/auth/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // ✅ Changed 'owner' to 'userId' to match your schema
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found or not authorized' });
    }

    res.json({ message: 'Deleted' }); // ✅ Success response
  } catch (error) {
    console.error('Backend delete error:', error);
    res.status(500).json({ message: 'Server error during delete' });
  }
});


// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

     const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }


   const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // ✅ Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { name: user.firstName, email: user.email }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }

});

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }


const hashedPassword = await bcrypt.hash(password, 10); // 🔒 Hash password

       const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: 'Signup successful', user: newUser });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});


module.exports = router;
