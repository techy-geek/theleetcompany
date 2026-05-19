import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  companies:     string[];
  title:         string;
  topic:         string[];
  difficulty:    'Easy' | 'Medium' | 'Hard';
  acceptanceRate: number;
  link:          string;
  frequency:     number;
  isPremium:     boolean;
  logo:          string;  // Google favicon URL, set by seed.ts
}

const QuestionSchema: Schema = new Schema({
  companies:     { type: [String], required: true, index: true },
  title:         { type: String, required: true },
  topic:         { type: [String], default: [] },
  difficulty:    { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  acceptanceRate: { type: Number, default: 0 },
  link:          { type: String, required: true },
  frequency:     { type: Number, default: 0 },
  isPremium:     { type: Boolean, default: false },
  logo:          { type: String, default: '' },  // auto-filled by seed.ts
}, { 
  timestamps: true 
});

// Database Optimization: Compound Index
// Since users will frequently filter questions by "Company" AND "Difficulty", 
// this index tells MongoDB to organize the data on the hard drive specifically for fast lookups combining these two fields.
QuestionSchema.index({ companies: 1, difficulty: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);
