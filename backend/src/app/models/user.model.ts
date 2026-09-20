import mongoose, { Schema } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  role: 'Manager' | 'Instructor';
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['Manager', 'Instructor'], required: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
