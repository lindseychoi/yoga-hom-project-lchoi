import mongoose, { Schema, Document } from 'mongoose';

export const PAYMENT_MODES = ['Cash', 'Card', 'Check'] as const;

export interface ISale extends Document {
  customerId: string;
  packageId: string;
  amountPaid: number;
  paymentMode: (typeof PAYMENT_MODES)[number];
  paymentDate: Date;
  validityStart: Date;
  validityEnd: Date;
  createdAt: Date;
}

/** A package sold to a customer (UC5). Both are referenced by their readable IDs (C00001, PKG001). */
const saleSchema = new Schema<ISale>(
  {
    customerId: { type: String, required: [true, 'Customer is required'] },
    packageId: { type: String, required: [true, 'Package is required'] },
    amountPaid: { type: Number, required: [true, 'Amount paid is required'] },
    paymentMode: {
      type: String,
      enum: PAYMENT_MODES,
      required: [true, 'Payment mode is required'],
    },
    paymentDate: { type: Date, required: [true, 'Payment date is required'] },
    validityStart: { type: Date, required: [true, 'Validity start is required'] },
    validityEnd: { type: Date, required: [true, 'Validity end is required'] },
  },
  { timestamps: true }
);

export const Sale = mongoose.model<ISale>('Sale', saleSchema);
