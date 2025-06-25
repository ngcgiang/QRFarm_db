const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Batch = require('../models/Batch');

// API: Thống kê số lượng sản phẩm theo location
router.get('/location', async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: "$blocks.location", // lấy location từ block đầu tiên
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          location: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET a specific product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  try {
    // Check if batch exists
    const batch = await Batch.findById(req.body.batchId);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const product = new Product({
      _id: req.body.id,
      batchId: req.body.batchId,
      weight: req.body.weight,
      size: req.body.size,
      quality: req.body.quality,
      additionalNotes: req.body.additionalNotes,
      blocks: req.body.blocks || []
    });

    const newProduct = await product.save();
    
    // Update batch quantity
    batch.quantity += 1;
    await batch.save();
    
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a block to a product
router.post('/:id/blocks', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.blocks.push(req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;