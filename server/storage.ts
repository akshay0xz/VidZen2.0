import { db } from "@db";
import { eq } from "drizzle-orm";
import { users, User, InsertUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "@db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUser(user: Omit<InsertUser, "password"> & { password: string }): Promise<User>;
  sessionStore: session.SessionStore;
}

class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "sessions"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
    return result[0];
  }

  async createUser(user: Omit<InsertUser, "password"> & { password: string }): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
