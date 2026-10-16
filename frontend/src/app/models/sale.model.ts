// Must match the payment modes the backend accepts.
export const PAYMENT_MODES = ['Cash', 'Card', 'Check'] as const;

/** A sale as the API returns it. Dates come back as ISO strings. */
export interface Sale {
  _id: string;
  customerId: string;
  packageId: string;
  amountPaid: number;
  paymentMode: (typeof PAYMENT_MODES)[number];
  paymentDate: string;
  validityStart: string;
  validityEnd: string;
}
