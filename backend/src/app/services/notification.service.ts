import { Notification, INotification } from '../models/notification.model';

/** The contact details any person (instructor or customer) has. */
interface Contact {
  phone: string;
  email: string;
  preferredContact: INotification['channel'];
}

/** "Sends" a message on the person's preferred channel by saving it. Swap this body for a real email/SMS sender later. */
export const send = (
  recipientId: string,
  contact: Contact,
  message: string
): Promise<INotification> =>
  Notification.create({
    recipientId,
    channel: contact.preferredContact,
    to: contact.preferredContact === 'phone' ? contact.phone : contact.email,
    message,
  });
