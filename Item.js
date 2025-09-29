const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  contact: { type: String, required: true } // added contact field
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);
