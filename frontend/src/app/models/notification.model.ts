/** A simulated message the server "sent" (saved) on the person's preferred channel. */
export interface Notification {
  _id: string;
  recipientId: string;
  channel: 'phone' | 'email';
  to: string;
  message: string;
  createdAt: string;
}
