const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Product = require('../models/Product');

// GET all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific batch
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new batch
router.post('/', async (req, res) => {
  try {
    const batch = new Batch({
      _id: req.body.id,
      productType: req.body.productType,
      harvestDate: req.body.harvestDate,
      location: req.body.location,
      responsibleStaff: req.body.responsibleStaff,
      quantity: req.body.quantity || 0,
      status: req.body.status,
      notes: req.body.notes,
      blocks: req.body.blocks || []
    });
    const newBatch = await batch.save();
    res.status(201).json(newBatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a block to a batch
router.post('/:id/blocks', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.blocks.push(req.body);
    
    // Update status if provided
    if (req.body.data && req.body.data.status) {
      batch.status = req.body.data.status;
    }
    
    const updatedBatch = await batch.save();
    res.json(updatedBatch);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all products in a batch
router.get('/:id/products', async (req, res) => {
  try {
    const products = await Product.find({ batchId: req.params.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;