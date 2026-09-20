import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AppError } from '../../middleware/error-handler';

const TOKEN_EXPIRES_IN = '8h';

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const valid = user && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: TOKEN_EXPIRES_IN });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
};
