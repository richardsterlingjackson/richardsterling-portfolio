const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  role: { type: String, required: true },
  tenure: { type: Number, required: true },
  avatarUrl: { type: String }
});

module.exports = mongoose.model('User', userSchema);