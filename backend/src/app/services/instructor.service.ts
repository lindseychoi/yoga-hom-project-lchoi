import { Instructor, IInstructor } from '../models/instructor.model';
import { Counter } from '../models/counter.model';
import { INotification } from '../models/notification.model';
import * as notificationService from './notification.service';
import { AppError } from '../../middleware/error-handler';

/** Lists instructors, newest first. */
export const findAll = async (): Promise<IInstructor[]> => {
  return Instructor.find().sort({ createdAt: -1 });
};

/** Returns one instructor by database ID, or a 404. */
export const findById = async (id: string): Promise<IInstructor> => {
  const instructor = await Instructor.findById(id);
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
  return instructor;
};

/**
 * Creates an instructor and sends the UC1 welcome message. The readable ID comes from a counter that goes up
 * by one each time (I00001, I00002, ...). Validation runs first so a bad form doesn't use up an ID.
 */
export const create = async (
  data: Partial<IInstructor>
): Promise<{ instructor: IInstructor; notification: INotification }> => {
  const instructor = new Instructor(data);
  await instructor.validate({ pathsToSkip: ['instructorId'] });

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'instructor' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  instructor.instructorId = `I${String(counter.sequenceValue).padStart(5, '0')}`;

  const saved = await instructor.save();
  const notification = await notificationService.send(
    saved.instructorId,
    saved,
    `Welcome to Yoga'Hom! Your instructor id is ${saved.instructorId}.`
  );
  return { instructor: saved, notification };
};

/** Applies the changes and re-checks them against the schema. */
export const update = async (
  id: string,
  data: Partial<IInstructor>
): Promise<IInstructor> => {
  const instructor = await Instructor.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
  return instructor;
};

/** Deletes an instructor, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  const instructor = await Instructor.findByIdAndDelete(id);
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
};

/** True if an instructor with this first and last name exists, ignoring capitals. The screen uses it to warn before saving a duplicate. */
export const checkDuplicate = async (
  firstName: string,
  lastName: string
): Promise<boolean> => {
  const existing = await Instructor.findOne({
    firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
    lastName: { $regex: new RegExp(`^${lastName}$`, 'i') },
  });
  return !!existing;
};
