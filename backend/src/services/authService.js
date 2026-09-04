import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../prisma/db.ts";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from environment variables");
}

export async function registerUser({ name, email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await db.orm.public.User
    .where({ email: normalizedEmail })
    .first();

  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.orm.public.User.create({
    email: normalizedEmail,
    name: name?.trim() || null,
    passwordHash,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.orm.public.User
    .where({ email: normalizedEmail })
    .first();

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}