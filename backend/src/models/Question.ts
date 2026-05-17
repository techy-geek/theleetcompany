import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  company: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPremium: boolean;
}

const QuestionSchema: Schema = new Schema({
  company: { type: String, required: true, index: true },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  isPremium: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index for optimization
QuestionSchema.index({ company: 1, difficulty: 1 });

export default mongoose.model<IQuestion>('Question', QuestionSchema);
