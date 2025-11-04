import mongoose from 'mongoose';

const YogaPoseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sanskritName: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  benefits: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  csvFileName: {
    type: String,
    required: true
  },
  // --- ADD THIS NEW FIELD ---
  csvData: {
    type: String,
    required: true
  },
  // --- END OF NEW FIELD ---
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const YogaPose = mongoose.models.YogaPose || mongoose.model('YogaPose', YogaPoseSchema);

export default YogaPose;
