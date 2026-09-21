import mongoose, { Schema } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  role: 'Manager' | 'Instructor';
}

/** A login account. The password hash is never returned by default (select: false). */
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['Manager', 'Instructor'], required: true },
  },
  { timestamps: true }
);

// One login per email
userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
