import { 
  ref, 
  push, 
  remove, 
  update, 
  onValue, 
  off,
  query,
  orderByChild,
  set,
  get
} from 'firebase/database';
import { database } from './firebase';

export type Priority = 'low' | 'medium' | 'high';

export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
  xpAwarded?: number; // Track XP awarded for this task
  steps?: TaskStep[]; // Optional task steps/checklist
  duelId?: string; // Link to duel if this is a duel task
  duelTaskIndex?: number; // Index of this task in the duel
  isDuelTask?: boolean; // Mark if this is a duel task (no XP reward)
  proof?: {
    text?: string;
    imageURL?: string;
    submittedAt?: string;
  };
}

export interface CreateTaskData {
  text: string;
  priority: Priority;
  dueDate: string;
  steps?: TaskStep[]; // Optional task steps
  duelId?: string; // For duel tasks
  duelTaskIndex?: number; // Index in duel
  isDuelTask?: boolean; // Mark if this is a duel task (no XP reward)
}

export interface UpdateTaskData {
  text?: string;
  priority?: Priority;
  dueDate?: string;
  completed?: boolean;
  completedAt?: number | null;
  xpAwarded?: number;
  steps?: TaskStep[]; // Optional task steps
  isDuelTask?: boolean; // Mark if this is a duel task (no XP reward)
  proof?: {
    text?: string;
    imageURL?: string;
    submittedAt?: string;
  };
}

export interface UserProfile {
  xp: number; // Current XP in this level
  level: number;
  totalXP: number; // Total lifetime XP (for tracking/display)
  email?: string;
  displayName?: string;
  streak: number; // Current daily streak count
  lastCompletedDate: string; // Last date a task was completed (YYYY-MM-DD format)
}

export class FirebaseTaskManager {
  private userId: string;
  private tasksRef;
  private userProfileRef;
  private currentProfile: UserProfile | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.tasksRef = ref(database, `tasks/${userId}`);
    this.userProfileRef = ref(database, `userProfiles/${userId}`);
  }

  // XP calculation based on priority
  private getXPForPriority(priority: Priority): number {
    switch (priority) {
      case 'low': return 5;
      case 'medium': return 10;
      case 'high': return 20;
      default: return 0;
    }
  }

  private getXPRequiredForLevel(level: number): number {
    return level * level * 10;
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  }

  private updateStreakForCompletion(): { streak: number; lastCompletedDate: string } {
    const today = this.getTodayDateString();
    const yesterday = this.getYesterdayDateString();
    
    // Get current profile data
    const currentProfile = this.currentProfile;
    const lastCompletedDate = currentProfile?.lastCompletedDate || '';
    const currentStreak = currentProfile?.streak || 0;

    let newStreak = 1; // At minimum, completing a task today gives 1 streak

    if (lastCompletedDate === yesterday) {
      // Consecutive day - increment streak
      newStreak = currentStreak + 1;
    } else if (lastCompletedDate === today) {
      // Already completed a task today - keep current streak
      newStreak = currentStreak;
    }
    // If lastCompletedDate is neither yesterday nor today, streak resets to 1

    return { streak: newStreak, lastCompletedDate: today };
  }

  private calculateXPForTask(task: Task): number {
    const baseXP = this.getXPForPriority(task.priority);
    const stepsBonus = (task.steps && task.steps.length > 0) ? 5 : 0;
    return baseXP + stepsBonus;
  }

  private processLevelUp(currentXP: number, currentLevel: number): { xp: number; level: number } {
    let xp = currentXP;
    let level = currentLevel;
    
    while (true) {
      const xpRequired = this.getXPRequiredForLevel(level);
      if (xp < xpRequired) break;
      
      xp -= xpRequired;
      level++;
    }
    
    return { xp, level };
  }

  // Check if task is overdue (comparing dates properly)
  private isTaskOverdue(dueDate: string): boolean {
    const today = new Date();
    const taskDate = new Date(dueDate + 'T00:00:00'); // Add time to avoid timezone issues
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
    return taskDate < today;
  }

  // Sort tasks by priority (high->medium->low) then by due date
  private sortTasks(tasks: Task[]): Task[] {
    const priorityOrder: Record<Priority, number> = { 'high': 3, 'medium': 2, 'low': 1 };
    
    return tasks.sort((a, b) => {
      // First by priority (high to low)
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date (earliest first)
      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  // Subscribe to tasks changes
  onTasksChange(callback: (tasks: Task[]) => void) {
    const unsubscribe = onValue(this.tasksRef, (snapshot) => {
      const tasksData = snapshot.val();
      const tasks: Task[] = [];
      
      if (tasksData) {
        Object.entries(tasksData).forEach(([id, taskData]: [string, any]) => {
          tasks.push({
            id,
            ...taskData
          });
        });
        
        // Sort by priority then due date
        const sortedTasks = this.sortTasks(tasks);
        callback(sortedTasks);
      } else {
        callback([]);
      }
    });

    return () => off(this.tasksRef, 'value', unsubscribe);
  }

  // Subscribe to user profile changes
  onUserProfileChange(callback: (profile: UserProfile) => void) {
    const unsubscribe = onValue(this.userProfileRef, (snapshot) => {
      const profileData = snapshot.val();
      console.log('Profile data from Firebase:', profileData);
      console.log('Profile snapshot exists:', snapshot.exists());
      
      const profile: UserProfile = {
        xp: profileData?.xp || 0,
        level: profileData?.level || 1,
        totalXP: profileData?.totalXP || 0,
        email: profileData?.email || null,
        displayName: profileData?.displayName || null,
        streak: profileData?.streak || 0,
        lastCompletedDate: profileData?.lastCompletedDate || ''
      };
      this.currentProfile = profile; // Store current profile for streak calculations
      
      console.log('Sending profile to UI:', profile);
      callback(profile);
    });

    return () => off(this.userProfileRef, 'value', unsubscribe);
  }

  // Create a new task
  async createTask(taskData: CreateTaskData): Promise<void> {
    try {
      const now = Date.now();
      const newTaskRef = push(this.tasksRef);
      
      // Validate input data
      if (!taskData.text?.trim()) {
        throw new Error('Task text is required');
      }
      if (!taskData.dueDate) {
        throw new Error('Due date is required');
      }
      
      await set(newTaskRef, {
        text: taskData.text.trim(),
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        xpAwarded: 0,
        steps: taskData.steps || [],
        duelId: taskData.duelId,
        duelTaskIndex: taskData.duelTaskIndex,
        isDuelTask: taskData.isDuelTask || false
      });
      
      console.log('Task created successfully:', taskData.text);
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create task');
    }
  }

  // Update an existing task (only if not completed)
  async updateTask(taskId: string, updates: UpdateTaskData): Promise<void> {
    try {
      if (!taskId) {
        throw new Error('Task ID is required');
      }
      
      const taskRef = ref(database, `tasks/${this.userId}/${taskId}`);
      
      // Clean up the updates object
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      await update(taskRef, {
        ...cleanUpdates,
        updatedAt: Date.now()
      });
      
      console.log('Task updated successfully:', taskId);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update task');
    }
  }

  // Complete a task with XP logic
  async completeTask(taskId: string, task: Task): Promise<void> {
    try {
      const now = Date.now();
      const completedAt = now;
      const isOverdue = this.isTaskOverdue(task.dueDate);
      
      // NO XP for duel tasks - they should only get XP from duel completion
      let xpToAward = 0;
      if (!task.isDuelTask && !task.duelId && !isOverdue && !task.completed && (!task.xpAwarded || task.xpAwarded === 0)) {
        xpToAward = this.calculateXPForTask(task);
      }

      // Update task with proper XP tracking
      const finalXpAwarded = (task.xpAwarded && task.xpAwarded > 0) ? task.xpAwarded : xpToAward;
      await this.updateTask(taskId, {
        completed: true,
        completedAt,
        xpAwarded: finalXpAwarded
      });

      // Update user XP only if new XP is being awarded and it's NOT a duel task
      if (xpToAward > 0 && !task.isDuelTask && !task.duelId) {
        await this.addXP(xpToAward);
        await this.updateStreak();
      }

      console.log(`Task completed. XP awarded: ${xpToAward}${task.isDuelTask || task.duelId ? ' (duel task - no direct XP)' : ''}`);
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Add XP to user profile with dynamic level calculation
  private async addXP(xp: number): Promise<void> {
    try {
      console.log(`Attempting to add ${xp} XP to user profile`);
      console.log(`User profile ref path: userProfiles/${this.userId}`);
      
      // First ensure the profile exists
      const snapshot = await get(this.userProfileRef);
      console.log('Current profile snapshot exists:', snapshot.exists());
      console.log('Current profile data:', snapshot.val());
      
      if (!snapshot.exists()) {
        // Initialize profile if it doesn't exist
        console.log('Profile does not exist, creating...');
        const { xp: newXP, level: newLevel } = this.processLevelUp(xp, 1);
        await set(this.userProfileRef, {
          xp: newXP,
          level: newLevel,
          totalXP: Math.max(0, xp),
          email: null,
          displayName: null,
          streak: 0,
          lastCompletedDate: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log(`Profile created with ${xp} XP, Level: ${newLevel}, XP in level: ${newXP}`);
        return;
      }
      
      const currentProfile = snapshot.val();
      const currentXP = Math.max(0, currentProfile.xp || 0);
      const currentLevel = Math.max(1, currentProfile.level || 1);
      const currentTotalXP = Math.max(0, currentProfile.totalXP || 0);
      
      const newCurrentXP = currentXP + Math.max(0, xp);
      const newTotalXP = currentTotalXP + Math.max(0, xp);
      const { xp: finalXP, level: finalLevel } = this.processLevelUp(newCurrentXP, currentLevel);
      
      console.log(`Current: Level ${currentLevel}, XP ${currentXP}, Total ${currentTotalXP}`);
      console.log(`Adding: ${xp} XP`);
      console.log(`New: Level ${finalLevel}, XP ${finalXP}, Total ${newTotalXP}`);
      
      // Use set to completely overwrite the profile
      await set(this.userProfileRef, {
        ...currentProfile,
        xp: finalXP,
        level: finalLevel,
        totalXP: newTotalXP,
        updatedAt: Date.now()
      });
      
      console.log(`Successfully updated profile. Level: ${finalLevel}, XP: ${finalXP}, Total: ${newTotalXP}`);
    } catch (error) {
      console.error('Error adding XP:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      throw error;
    }
  }

  // Update user streak when completing a task
  private async updateStreak(): Promise<void> {
    try {
      const { streak, lastCompletedDate } = this.updateStreakForCompletion();
      
      const snapshot = await get(this.userProfileRef);
      if (!snapshot.exists()) {
        throw new Error('User profile not found');
      }
      
      const currentProfile = snapshot.val();
      
      await set(this.userProfileRef, {
        ...currentProfile,
        streak,
        lastCompletedDate,
        updatedAt: Date.now()
      });
      
      console.log(`Streak updated: ${streak} days, last completed: ${lastCompletedDate}`);
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      const taskRef = ref(database, `tasks/${this.userId}/${taskId}`);
      await remove(taskRef);
      console.log('Task deleted successfully:', taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Toggle step completion within a task (no XP awarded)
  async toggleTaskStep(taskId: string, stepId: string): Promise<void> {
    try {
      const taskRef = ref(database, `tasks/${this.userId}/${taskId}`);
      const snapshot = await get(taskRef);
      
      if (!snapshot.exists()) {
        throw new Error('Task not found');
      }
      
      const task = snapshot.val() as Task;
      if (!task.steps) {
        throw new Error('Task has no steps');
      }
      
      // Find and toggle the specific step
      const updatedSteps = task.steps.map(step => 
        step.id === stepId 
          ? { ...step, completed: !step.completed }
          : step
      );
      
      // Update the task with the new steps
      await update(taskRef, {
        steps: updatedSteps,
        updatedAt: Date.now()
      });
      
      console.log('Step toggled successfully:', stepId);
    } catch (error) {
      console.error('Error toggling step:', error);
      throw error;
    }
  }

  // Initialize user profile
  async initializeUserProfile(email?: string, displayName?: string): Promise<void> {
    try {
      const snapshot = await get(this.userProfileRef);
      
      if (!snapshot.exists()) {
        console.log('Creating new user profile...');
        await set(this.userProfileRef, {
          xp: 0,
          level: 1,
          totalXP: 0,
          email: email || null,
          displayName: displayName || null,
          streak: 0,
          lastCompletedDate: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        console.log('User profile created successfully');
      } else {
        console.log('User profile already exists');
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  // Helper method to get XP required for next level (public for UI use)
  getXPRequiredForNextLevel(level: number): number {
    return this.getXPRequiredForLevel(level);
  }
}