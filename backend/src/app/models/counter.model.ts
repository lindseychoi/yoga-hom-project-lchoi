import mongoose, { Schema } from 'mongoose';

export interface ICounter {
  _id: string;
  sequenceValue: number;
}

/** Remembers the last number used for each kind of ID, keyed by name (for example "instructor"). */
const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  sequenceValue: { type: Number, default: 0 },
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
