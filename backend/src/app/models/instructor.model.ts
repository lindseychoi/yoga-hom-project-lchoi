import mongoose, { Schema, Document } from 'mongoose';

export interface IInstructor extends Document {
  instructorId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  email: string;
  preferredContact: 'phone' | 'email';
  createdAt: Date;
}

const instructorSchema = new Schema<IInstructor>(
  {
    instructorId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    preferredContact: {
      type: String,
      enum: ['phone', 'email'],
      default: 'email',
    },
  },
  {
    timestamps: true,
  }
);

export const Instructor = mongoose.model<IInstructor>('Instructor', instructorSchema);
