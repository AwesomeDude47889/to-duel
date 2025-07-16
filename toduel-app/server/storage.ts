import {
  users,
  tasks,
  type User,
  type UpsertUser,
  type Task,
  type InsertTask,
  type UpdateTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Task operations
  getUserTasks(userId: string): Promise<Task[]>;
  createTask(userId: string, task: InsertTask): Promise<Task>;
  updateTask(userId: string, taskId: number, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(userId: string, taskId: number): Promise<boolean>;
  getTask(userId: string, taskId: number): Promise<Task | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Task operations
  async getUserTasks(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(userId: string, task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        userId,
      })
      .returning();
    return newTask;
  }

  async updateTask(userId: string, taskId: number, updates: UpdateTask): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return updatedTask;
  }

  async deleteTask(userId: string, taskId: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getTask(userId: string, taskId: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return task;
  }
}

export const storage = new DatabaseStorage();
