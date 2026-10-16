import { Attendance, IAttendance } from '../models/attendance.model';
import { Class, DAYS_OF_WEEK } from '../models/class.model';
import { Customer } from '../models/customer.model';
import { INotification } from '../models/notification.model';
import { Package, UNLIMITED } from '../models/package.model';
import { Sale } from '../models/sale.model';
import * as notificationService from './notification.service';
import { AppError } from '../../middleware/error-handler';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

interface AttendanceInput {
  classId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerIds: string[];
  confirmed?: boolean; // True once the user has said "save anyway" to the warnings
}

/** The package that covers this date for a customer: from their latest sale whose validity includes it. */
const coveringPackage = async (customerId: string, date: Date) => {
  const sale = await Sale.findOne({
    customerId,
    validityStart: { $lte: date },
    validityEnd: { $gte: date },
  }).sort({ paymentDate: -1 });
  return sale ? Package.findOne({ packageId: sale.packageId }) : null;
};

/** Formats the check-in date and time the way UC6 asks: dd/mm/yy and h:mm am/pm. */
const formatCheckIn = (date: string, time: string) => {
  const [year, month, day] = date.split('-');
  const [hour, minutes] = time.split(':').map(Number);
  const suffix = hour < 12 ? 'am' : 'pm';
  const hour12 = hour % 12 || 12; // 0 -> 12, 13 -> 1
  return {
    date: `${day}/${month}/${year.slice(2)}`,
    time: `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`,
  };
};

/** Managers see every sheet; an instructor sees only their own classes' sheets. */
export const findAll = async (role: string, ownInstructorId?: string): Promise<IAttendance[]> => {
  return Attendance.find(role === 'Instructor' ? { instructorId: ownInstructorId } : {}).sort({
    date: -1,
  });
};

/** Records a class's attendance (UC6): checks everything, warns, then updates balances and sends check-ins. */
export const record = async (
  role: string,
  ownInstructorId: string | undefined,
  input: AttendanceInput
): Promise<{ record: IAttendance; notifications: INotification[] }> => {
  // Required fields and formats
  if (
    !input.classId ||
    !DATE_PATTERN.test(input.date) ||
    !TIME_PATTERN.test(input.time) ||
    !input.customerIds?.length
  ) {
    throw new AppError(400, 'Class, date, time, and at least one customer are required');
  }

  const yogaClass = await Class.findById(input.classId);
  if (!yogaClass) {
    throw new AppError(404, 'Class not found');
  }
  // Instructors can only take attendance for their own classes
  if (role === 'Instructor' && yogaClass.instructorId !== ownInstructorId) {
    throw new AppError(403, 'You can only record attendance for your own classes');
  }

  const customers = await Customer.find({ customerId: { $in: input.customerIds } });
  if (customers.length !== input.customerIds.length) {
    throw new AppError(404, 'One or more customers not found');
  }

  const date = new Date(`${input.date}T00:00:00Z`);
  const warnings: string[] = [];

  // Warn if the date and time don't match the class schedule
  const day = DAYS_OF_WEEK[(date.getUTCDay() + 6) % 7]; // getUTCDay() counts Sunday as 0
  if (day !== yogaClass.dayOfWeek || input.time !== yogaClass.time) {
    warnings.push(
      `This class is scheduled for ${yogaClass.dayOfWeek} at ${yogaClass.time}, not ${day} at ${input.time}.`
    );
  }

  // For each customer: is their package the right type, and do they have a class left?
  const attendees = await Promise.all(
    customers.map(async (customer) => {
      const pkg = await coveringPackage(customer.customerId, date);
      const unlimited = pkg?.numberOfClasses === UNLIMITED;
      const name = `${customer.firstName} ${customer.lastName}`;
      if (pkg && pkg.classType !== yogaClass.classType) {
        warnings.push(
          `${name}'s package is for ${pkg.classType} classes, but this is a ${yogaClass.classType} class.`
        );
      }
      if (!unlimited && customer.classBalance < 1) {
        warnings.push(`${name} has no classes left and will go to ${customer.classBalance - 1}.`);
      }
      return { customer, unlimited };
    })
  );

  // Stop so the screen can ask "save anyway?", unless it already did
  if (warnings.length && !input.confirmed) {
    throw new AppError(409, warnings.join(' '));
  }

  // Use one class from each balance (unlimited packages don't use any)
  for (const { customer, unlimited } of attendees) {
    if (!unlimited) {
      customer.classBalance -= 1;
      await customer.save();
    }
  }

  const saved = await Attendance.create({
    classId: input.classId,
    instructorId: yogaClass.instructorId,
    date,
    time: input.time,
    entries: attendees.map(({ customer }) => ({
      customerId: customer.customerId,
      balanceAfter: customer.classBalance,
      negativeBalance: customer.classBalance < 0,
    })),
  });

  // Send each attendee the UC6 check-in confirmation
  const shown = formatCheckIn(input.date, input.time);
  const notifications = await Promise.all(
    attendees.map(({ customer }) =>
      notificationService.send(
        customer.customerId,
        customer,
        `Hello ${customer.firstName}! You are checked-in for a class on ${shown.date} at ${shown.time}. Your class-balance is ${customer.classBalance}.`
      )
    )
  );
  return { record: saved, notifications };
};
