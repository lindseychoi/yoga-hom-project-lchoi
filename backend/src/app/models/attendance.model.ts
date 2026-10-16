import mongoose, { Schema, Document } from 'mongoose';

/** One customer checked in to a class session. */
export interface IAttendanceEntry {
  customerId: string;
  balanceAfter: number;
  negativeBalance: boolean; // Saved anyway with a balance below 0, to be resolved later (UC6)
}

/** One class session's attendance sheet. */
export interface IAttendance extends Document {
  classId: string; // The class's database _id
  instructorId: string;
  date: Date; // Midnight UTC of the session day
  time: string; // HH:mm
  entries: IAttendanceEntry[];
}

const entrySchema = new Schema<IAttendanceEntry>(
  {
    customerId: { type: String, required: true },
    balanceAfter: { type: Number, required: true },
    negativeBalance: { type: Boolean, required: true },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    classId: { type: String, required: true },
    instructorId: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    entries: { type: [entrySchema], required: true },
  },
  { timestamps: true }
);

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
