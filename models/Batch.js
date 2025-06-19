const mongoose = require('mongoose');

const BatchBlockSchema = new mongoose.Schema({
  blockId: Number,
  timestamp: Number,
  actor: String,
  location: String,
  data: mongoose.Schema.Types.Mixed,
  prevHash: String,
  hash: String
});

const BatchSchema = new mongoose.Schema({
  _id: String, // Custom ID format (BATCH-XXX)
  productType: {
    type: String,
    required: true
  },
  harvestDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  responsibleStaff: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  status: String,
  notes: String,
  blocks: [BatchBlockSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', BatchSchema);