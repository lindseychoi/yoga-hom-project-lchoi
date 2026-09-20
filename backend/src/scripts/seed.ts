import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../app/models/user.model';

dotenv.config();

const SALT_ROUNDS = 10;

const seed = async () => {
  const { MONGODB_URI, SEED_MANAGER_EMAIL, SEED_MANAGER_PASSWORD } = process.env;
  if (!MONGODB_URI || !SEED_MANAGER_EMAIL || !SEED_MANAGER_PASSWORD) {
    throw new Error('MONGODB_URI, SEED_MANAGER_EMAIL and SEED_MANAGER_PASSWORD must be set');
  }

  await mongoose.connect(MONGODB_URI);
  if (await User.exists({ email: SEED_MANAGER_EMAIL.toLowerCase() })) {
    console.log('Manager already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_MANAGER_PASSWORD, SALT_ROUNDS);
  await User.create({ email: SEED_MANAGER_EMAIL, passwordHash, role: 'Manager' });
  console.log(`Created Manager ${SEED_MANAGER_EMAIL}`);
};

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
