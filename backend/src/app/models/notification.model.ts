import mongoose, { Schema, Document } from 'mongoose';

export const CHANNELS = ['phone', 'email'] as const;

export interface INotification extends Document {
  recipientId: string;
  channel: (typeof CHANNELS)[number];
  to: string;
  message: string;
  createdAt: Date;
}

/** A simulated message: saved instead of actually sent by email or text. recipientId is the readable ID (I00001, C00001). */
const notificationSchema = new Schema<INotification>(
  {
    recipientId: { type: String, required: true },
    channel: { type: String, enum: CHANNELS, required: true },
    to: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
