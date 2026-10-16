import mongoose, { Schema } from 'mongoose';

export interface IUser {
  email: string;
  passwordHash: string;
  role: 'Manager' | 'Instructor';
  instructorId?: string;
}

/** A login account. The password hash is never returned by default (select: false). */
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['Manager', 'Instructor'], required: true },
    // Links an Instructor login to its instructor record (I00001). Manager logins don't have one.
    instructorId: {
      type: String,
      required: [
        function (this: IUser) {
          return this.role === 'Instructor';
        },
        'An instructor login needs an instructorId',
      ],
    },
  },
  { timestamps: true }
);

// One login per email
userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
