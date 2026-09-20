import mongoose, { Schema, Document } from 'mongoose';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export const CLASS_TYPES = ['General', 'Special'] as const;

export interface IClass extends Document {
  instructorId: string;
  dayOfWeek: (typeof DAYS_OF_WEEK)[number];
  time: string;
  classType: (typeof CLASS_TYPES)[number];
  className: string;
  payRate: number;
  isPublished: boolean;
  createdAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    instructorId: {
      type: String,
      required: [true, 'Instructor is required'],
      trim: true,
    },
    dayOfWeek: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: [true, 'Day of week is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm (24-hour)'],
    },
    classType: {
      type: String,
      enum: CLASS_TYPES,
      required: [true, 'Class type is required'],
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    payRate: {
      type: Number,
      required: [true, 'Pay rate is required'],
      min: [0, 'Pay rate cannot be negative'],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Only one class can be held at any time
classSchema.index({ dayOfWeek: 1, time: 1 }, { unique: true });

export const Class = mongoose.model<IClass>('Class', classSchema);
