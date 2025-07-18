const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  label: String,
  amount: Number,
  category: String
}, { _id: false });

const IncomeSchema = new Schema({
  label: String,
  amount: Number
}, { _id: false });

const EntrySchema = new Schema({
  title: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  income: [IncomeSchema],
  expenses: [ExpenseSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Entry', EntrySchema);
