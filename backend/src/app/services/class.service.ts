import { Class, IClass } from '../models/class.model';
import { Attendance } from '../models/attendance.model';
import { Instructor } from '../models/instructor.model';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import * as notificationService from './notification.service';
import { AppError } from '../../middleware/error-handler';

/** How many open times to suggest when a slot is taken. */
const SUGGESTION_COUNT = 3;

/** Suggests the next free times on the same day, one hour apart (UC2). */
const suggestFreeTimes = async (dayOfWeek: IClass['dayOfWeek'], time: string): Promise<string[]> => {
  // Every start time already booked on this day, e.g. ['09:00', '11:00']
  const bookedTimes = await Class.find({ dayOfWeek }).distinct('time');
  const startHour = Number(time.slice(0, 2)); // '09:30' -> 9
  const suggestions: string[] = [];

  // Try each later hour of the day (10:00, 11:00, ...) and stop once we have enough
  for (let hour = startHour + 1; hour < 24 && suggestions.length < SUGGESTION_COUNT; hour++) {
    const candidate = `${hour.toString().padStart(2, '0')}:00`; // 9 -> '09:00'
    if (!bookedTimes.includes(candidate)) {
      suggestions.push(candidate);
    }
  }
  return suggestions;
};

/** Fails with 404 if no instructor has this readable ID (for example I00001). */
const assertInstructorExists = async (instructorId: string): Promise<void> => {
  if (!(await Instructor.exists({ instructorId }))) {
    throw new AppError(404, 'Instructor not found');
  }
};

/**
 * Fails with 409 if another class already uses this day and time, listing available times that day in the message.
 * When editing, excludeId skips the class being edited.
 */
const assertSlotFree = async (
  dayOfWeek: IClass['dayOfWeek'],
  time: string,
  excludeId?: string
): Promise<void> => {
  const conflict = await Class.exists({
    dayOfWeek,
    time,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  if (conflict) {
    const suggestions = await suggestFreeTimes(dayOfWeek, time);
    throw new AppError(
      409,
      `A class is already scheduled on ${dayOfWeek} at ${time}. Available times that day: ${suggestions.join(', ') || 'none'}`
    );
  }
};

/**
 * Managers see every class, optionally filtered to one instructor.
 * An instructor sees only their own published classes (UC8).
 */
export const findAll = async (
  role: string,
  ownInstructorId?: string,
  instructorId?: string
): Promise<IClass[]> => {
  const filter =
    role === 'Instructor'
      ? { instructorId: ownInstructorId, isPublished: true }
      : instructorId
        ? { instructorId }
        : {};
  return Class.find(filter).sort({ createdAt: -1 });
};

/** Returns one class, or a 404. */
export const findById = async (id: string): Promise<IClass> => {
  const found = await Class.findById(id);
  if (!found) {
    throw new AppError(404, 'Class not found');
  }
  return found;
};

/** Validates first, then checks the instructor exists and the slot is free, so a bad request never partly saves. */
export const create = async (data: Partial<IClass>): Promise<IClass> => {
  const newClass = new Class(data);
  await newClass.validate();
  await assertInstructorExists(newClass.instructorId);
  await assertSlotFree(newClass.dayOfWeek, newClass.time);
  return newClass.save();
};

/** Applies the changes to the class, then repeats the same checks as create. */
export const update = async (id: string, data: Partial<IClass>): Promise<IClass> => {
  const existing = await findById(id);
  existing.set(data);
  await existing.validate();
  await assertInstructorExists(existing.instructorId);
  await assertSlotFree(existing.dayOfWeek, existing.time, id);
  return existing.save();
};

/** Publishes a class and confirms it to the instructor and the manager who published it (UC2). */
export const publish = async (
  id: string,
  managerUserId: string
): Promise<{ class: IClass; notifications: INotification[] }> => {
  const found = await findById(id);
  found.isPublished = true;
  const saved = await found.save();

  const [instructor, manager] = await Promise.all([
    Instructor.findOne({ instructorId: saved.instructorId }),
    User.findById(managerUserId),
  ]);
  if (!instructor || !manager) {
    throw new AppError(404, 'Instructor or manager not found');
  }
  const message = `New class scheduled: ${saved.className} on ${saved.dayOfWeek} at ${saved.time}.`;
  const notifications = await Promise.all([
    notificationService.send(instructor.instructorId, instructor, message),
    // The manager login only has an email
    notificationService.send(
      manager.id,
      { email: manager.email, phone: '', preferredContact: 'email' },
      message
    ),
  ]);
  return { class: saved, notifications };
};

/** Deletes a class, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  // Keep attendance history intact: a class with attendance sheets can't be deleted
  const found = await findById(id);
  if (await Attendance.exists({ classId: id })) {
    throw new AppError(409, "This class has attendance records and can't be deleted");
  }
  await found.deleteOne();
};
