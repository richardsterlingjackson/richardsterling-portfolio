const express = require('express');
const router = express.Router();
const User = require('../models/user');

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST new user
router.post('/', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(400).json({ error: 'Failed to add user' });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete user' });
  }
});

// SEARCH users by name
router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const users = await User.find({ name: new RegExp(q, 'i') });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;