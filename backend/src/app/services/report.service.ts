import { Attendance } from '../models/attendance.model';
import { Class } from '../models/class.model';
import { Customer } from '../models/customer.model';
import { Instructor } from '../models/instructor.model';
import { Package } from '../models/package.model';
import { Sale } from '../models/sale.model';
import { AppError } from '../../middleware/error-handler';

const MONTH_PATTERN = /^\d{4}-\d{2}$/; // YYYY-MM

/** Package sales: how many of each package were sold and the total taken. */
export const packageSales = async () => {
  // MongoDB groups the sales by package and adds them up
  const totals = await Sale.aggregate<{ _id: string; sold: number; revenue: number }>([
    { $group: { _id: '$packageId', sold: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
  ]);
  const packages = await Package.find();
  return totals.map((t) => ({
    packageName: packages.find((p) => p.packageId === t._id)?.packageName ?? t._id,
    sold: t.sold,
    revenue: t.revenue,
  }));
};

/** Instructors: each one's classes and how many check-ins those classes have had. */
export const instructors = async () => {
  const [all, classes, sheets] = await Promise.all([
    Instructor.find(),
    Class.find(),
    Attendance.find(),
  ]);
  return all.map((instructor) => ({
    instructorId: instructor.instructorId,
    name: `${instructor.firstName} ${instructor.lastName}`,
    classes: classes
      .filter((c) => c.instructorId === instructor.instructorId)
      .map((c) => c.className),
    // Every attendee on every one of their sheets counts as a check-in
    checkIns: sheets
      .filter((s) => s.instructorId === instructor.instructorId)
      .reduce((total, s) => total + s.entries.length, 0),
  }));
};

/** Customers: each one's balance and packages, marked active, future, or expired as of today. */
export const customers = async () => {
  const [all, sales, packages] = await Promise.all([Customer.find(), Sale.find(), Package.find()]);
  const now = new Date();
  return all.map((customer) => ({
    name: `${customer.firstName} ${customer.lastName}`,
    classBalance: customer.classBalance,
    packages: sales
      .filter((s) => s.customerId === customer.customerId)
      .map((s) => ({
        packageName:
          packages.find((p) => p.packageId === s.packageId)?.packageName ?? s.packageId,
        status: s.validityStart > now ? 'future' : s.validityEnd < now ? 'expired' : 'active',
      })),
  }));
};

/**
 * Teacher payment for one month (YYYY-MM): each class held with at least one check-in pays its pay rate.
 * Pass instructorId to get just one instructor (the self-performance report).
 */
export const teacherPayment = async (month: string, instructorId?: string) => {
  if (!MONTH_PATTERN.test(month)) {
    throw new AppError(400, 'Month must be YYYY-MM');
  }
  // The month runs from the 1st up to (not including) the 1st of the next month
  const start = new Date(`${month}-01T00:00:00Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);

  const filter = instructorId ? { instructorId } : {};
  const [all, classes, sheets] = await Promise.all([
    Instructor.find(filter),
    Class.find(filter),
    Attendance.find({ ...filter, date: { $gte: start, $lt: end } }),
  ]);

  return all.map((instructor) => {
    // Only sessions where someone actually checked in are paid
    const paidSessions = sheets.filter(
      (s) => s.instructorId === instructor.instructorId && s.entries.length > 0
    );
    const pay = paidSessions.reduce(
      (total, s) => total + (classes.find((c) => c.id === s.classId)?.payRate ?? 0),
      0
    );
    return {
      instructorId: instructor.instructorId,
      name: `${instructor.firstName} ${instructor.lastName}`,
      classesHeld: paidSessions.length,
      checkIns: paidSessions.reduce((total, s) => total + s.entries.length, 0),
      pay,
    };
  });
};
