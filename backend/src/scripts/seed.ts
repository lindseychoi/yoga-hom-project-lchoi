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
  const email = SEED_MANAGER_EMAIL.toLowerCase();
  const passwordHash = await bcrypt.hash(SEED_MANAGER_PASSWORD, SALT_ROUNDS);
  const { upsertedCount } = await User.updateOne(
    { email },
    { passwordHash, role: 'Manager' },
    { upsert: true }
  );
  console.log(`${upsertedCount ? 'Created' : 'Updated'} Manager ${email}`);
};

seed()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
