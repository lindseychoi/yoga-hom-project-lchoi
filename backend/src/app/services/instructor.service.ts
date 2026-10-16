import bcrypt from 'bcryptjs';
import { Instructor, IInstructor } from '../models/instructor.model';
import { Counter } from '../models/counter.model';
import { INotification } from '../models/notification.model';
import { User } from '../models/user.model';
import * as notificationService from './notification.service';
import { SALT_ROUNDS } from './auth.service';
import { AppError } from '../../middleware/error-handler';

/** Shortest login password the server accepts. */
export const MIN_PASSWORD_LENGTH = 8;

/** The instructor form, plus an optional login password that is never stored on the instructor record. */
type InstructorInput = Partial<IInstructor> & { password?: string };

const assertPasswordValid = (password: string): void => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
};

/** Fails with 409 if another login already uses this email. Pass instructorId to skip this instructor's own login. */
const assertLoginEmailFree = async (email: string, instructorId?: string): Promise<void> => {
  const taken = await User.exists({
    email: email.toLowerCase(),
    ...(instructorId && { instructorId: { $ne: instructorId } }),
  });
  if (taken) {
    throw new AppError(409, 'A login with this email already exists');
  }
};

/** Creates the instructor's login, or replaces its email and password if it already exists. */
const saveLogin = async (instructor: IInstructor, password: string) =>
  User.updateOne(
    { instructorId: instructor.instructorId },
    {
      email: instructor.email,
      role: 'Instructor',
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    },
    { upsert: true }
  );

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
 * Creates an instructor, an optional login, and sends the UC1 welcome message. The readable ID comes from a
 * counter that goes up by one each time (I00001, I00002, ...). All checks run first so a bad form doesn't use up an ID.
 */
export const create = async ({
  password,
  ...data
}: InstructorInput): Promise<{ instructor: IInstructor; notification: INotification }> => {
  const instructor = new Instructor(data);
  await instructor.validate({ pathsToSkip: ['instructorId'] });
  if (password) {
    assertPasswordValid(password);
    await assertLoginEmailFree(instructor.email);
  }

  const counter = await Counter.findByIdAndUpdate(
    { _id: 'instructor' },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  instructor.instructorId = `I${String(counter.sequenceValue).padStart(5, '0')}`;

  const saved = await instructor.save();
  if (password) {
    await saveLogin(saved, password);
  }
  const notification = await notificationService.send(
    saved.instructorId,
    saved,
    `Welcome to Yoga'Hom! Your instructor id is ${saved.instructorId}.`
  );
  return { instructor: saved, notification };
};

/** Applies the changes, re-checks them against the schema, and keeps the instructor's login in step. */
export const update = async (
  id: string,
  { password, ...data }: InstructorInput
): Promise<IInstructor> => {
  if (password) {
    assertPasswordValid(password);
  }
  const existing = await findById(id);
  if (data.email) {
    await assertLoginEmailFree(data.email, existing.instructorId);
  }

  const instructor = await Instructor.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }

  // A new password replaces the login; otherwise the login just follows an email change
  if (password) {
    await saveLogin(instructor, password);
  } else {
    await User.updateOne({ instructorId: instructor.instructorId }, { email: instructor.email });
  }
  return instructor;
};

/** Deletes an instructor and their login, or a 404 if it doesn't exist. */
export const remove = async (id: string): Promise<void> => {
  const instructor = await Instructor.findByIdAndDelete(id);
  if (!instructor) {
    throw new AppError(404, 'Instructor not found');
  }
  await User.deleteOne({ instructorId: instructor.instructorId });
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
