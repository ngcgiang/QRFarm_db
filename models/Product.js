const mongoose = require('mongoose');

const ProductBlockSchema = new mongoose.Schema({
  blockId: Number,
  timestamp: Number,
  actor: String,
  actorType: String,
  location: String,
  data: mongoose.Schema.Types.Mixed,
  prevHash: String,
  hash: String
});

const ProductSchema = new mongoose.Schema({
  _id: String, // Custom ID format (PROD-XXX)
  batchId: {
    type: String,
    ref: 'Batch',
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  quality: String,
  additionalNotes: String,
  blocks: [ProductBlockSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);