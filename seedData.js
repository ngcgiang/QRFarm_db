require('dotenv').config();
const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function seed() {
  await Batch.deleteMany({});
  await Product.deleteMany({});

  // Thêm 3 batch ảo với trái cây và location mới
  const batches = await Batch.insertMany([
    {
      _id: 'BATCH-SR001',
      productType: 'Sầu riêng',
      harvestDate: new Date('2024-06-01'),
      location: 'Tiền Giang',
      responsibleStaff: 'Nguyễn Văn Sầu',
      quantity: 100,
      status: 'Đã thu hoạch',
      notes: 'Sầu riêng đầu mùa',
      blocks: []
    },
    {
      _id: 'BATCH-DH002',
      productType: 'Dưa hấu',
      harvestDate: new Date('2024-06-02'),
      location: 'Long An',
      responsibleStaff: 'Trần Thị Dưa',
      quantity: 80,
      status: 'Đã thu hoạch',
      notes: '',
      blocks: []
    },
    {
      _id: 'BATCH-TA003',
      productType: 'Táo',
      harvestDate: new Date('2024-06-03'),
      location: 'Lâm Đồng',
      responsibleStaff: 'Lê Văn Táo',
      quantity: 120,
      status: 'Đã thu hoạch',
      notes: '',
      blocks: []
    }
  ]);

  // Thêm 10 sản phẩm ảo, phân bố ở các batch và location khác nhau
  await Product.insertMany([
    {
      _id: 'PROD-SR-001',
      batchId: 'BATCH-SR001',
      weight: 2.5,
      size: 'L',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Nguyễn Văn Sầu', actorType: 'producer', location: 'Tiền Giang', data: {}, prevHash: '', hash: 'hash1' }
      ]
    },
    {
      _id: 'PROD-SR-002',
      batchId: 'BATCH-SR001',
      weight: 2.3,
      size: 'M',
      quality: 'B',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Nguyễn Văn Sầu', actorType: 'producer', location: 'Tiền Giang', data: {}, prevHash: '', hash: 'hash2' }
      ]
    },
    {
      _id: 'PROD-DH-003',
      batchId: 'BATCH-DH002',
      weight: 1.8,
      size: 'L',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Trần Thị Dưa', actorType: 'producer', location: 'Long An', data: {}, prevHash: '', hash: 'hash3' }
      ]
    },
    {
      _id: 'PROD-DH-004',
      batchId: 'BATCH-DH002',
      weight: 1.7,
      size: 'M',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Trần Thị Dưa', actorType: 'producer', location: 'Long An', data: {}, prevHash: '', hash: 'hash4' }
      ]
    },
    {
      _id: 'PROD-TA-005',
      batchId: 'BATCH-TA003',
      weight: 0.5,
      size: 'S',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Lê Văn Táo', actorType: 'producer', location: 'Lâm Đồng', data: {}, prevHash: '', hash: 'hash5' }
      ]
    },
    {
      _id: 'PROD-TA-006',
      batchId: 'BATCH-TA003',
      weight: 0.6,
      size: 'M',
      quality: 'B',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Lê Văn Táo', actorType: 'producer', location: 'Lâm Đồng', data: {}, prevHash: '', hash: 'hash6' }
      ]
    },
    {
      _id: 'PROD-SR-007',
      batchId: 'BATCH-SR001',
      weight: 2.7,
      size: 'L',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Nguyễn Văn Sầu', actorType: 'producer', location: 'Tiền Giang', data: {}, prevHash: '', hash: 'hash7' }
      ]
    },
    {
      _id: 'PROD-DH-008',
      batchId: 'BATCH-DH002',
      weight: 1.9,
      size: 'L',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Trần Thị Dưa', actorType: 'producer', location: 'Long An', data: {}, prevHash: '', hash: 'hash8' }
      ]
    },
    {
      _id: 'PROD-TA-009',
      batchId: 'BATCH-TA003',
      weight: 0.7,
      size: 'L',
      quality: 'A',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Lê Văn Táo', actorType: 'producer', location: 'Lâm Đồng', data: {}, prevHash: '', hash: 'hash9' }
      ]
    },
    {
      _id: 'PROD-SR-010',
      batchId: 'BATCH-SR001',
      weight: 2.4,
      size: 'M',
      quality: 'B',
      additionalNotes: '',
      blocks: [
        { blockId: 1, timestamp: Date.now(), actor: 'Nguyễn Văn Sầu', actorType: 'producer', location: 'Tiền Giang', data: {}, prevHash: '', hash: 'hash10' }
      ]
    }
  ]);

  console.log('Seed data inserted!');
  mongoose.disconnect();
}

seed();