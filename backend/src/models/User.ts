import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId:        string;
  email:           string;
  name:            string;
  picture:         string;
  isPremium:       boolean;
  isAdmin:         boolean;
  solvedQuestions: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema({
  googleId:  { type: String, required: true, unique: true },
  email:     { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  picture:   { type: String, default: '' },
  isPremium: { type: Boolean, default: false },
  isAdmin:   { type: Boolean, default: false },
  solvedQuestions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
}, {
  timestamps: true,
});

export default mongoose.model<IUser>('User', UserSchema);
