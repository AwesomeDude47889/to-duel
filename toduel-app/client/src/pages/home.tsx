import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TabNavigation } from "@/components/TabNavigation";
import { DashboardTab } from "@/components/DashboardTab";
import { TasksTab } from "@/components/TasksTab";
import { FriendsTab } from "@/components/FriendsTab";
import { FirebaseTaskManager, type Task, type CreateTaskData, type UpdateTaskData, type UserProfile, type Priority } from "@/lib/firebaseTasks";

// Helper functions
const getXPForPriority = (priority: Priority): number => {
  switch (priority) {
    case 'low': return 5;
    case 'medium': return 10;
    case 'high': return 20;
    default: return 0;
  }
};

const isTaskOverdue = (dueDate: string): boolean => {
  const today = new Date();
  const taskDate = new Date(dueDate + 'T00:00:00');
  today.setHours(0, 0, 0, 0);
  return taskDate < today;
};

const getXPForCompletion = (task: Task): number => {
  // No XP for duel tasks - they only get XP from duel completion
  if (task.isDuelTask || task.duelId) return 0;
  if (isTaskOverdue(task.dueDate)) return 0;
  return getXPForPriority(task.priority);
};

export default function Home() {
  const { user, isLoading: authLoading, logout } = useFirebaseAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taskManager, setTaskManager] = useState<FirebaseTaskManager | null>(null);

  // Initialize task manager when user is available
  useEffect(() => {
    if (user?.uid) {
      console.log('Initializing task manager for user:', user.uid);
      const manager = new FirebaseTaskManager(user.uid);
      setTaskManager(manager);
      
      // Initialize user profile
      manager.initializeUserProfile(user.email || undefined, user.displayName || undefined);
      
      // Subscribe to tasks changes
      const unsubscribeTasks = manager.onTasksChange((newTasks) => {
        console.log('Tasks updated:', newTasks);
        setTasks(newTasks);
      });
      
      // Subscribe to user profile changes with level-up detection
      let previousLevel = 0;
      const unsubscribeProfile = manager.onUserProfileChange((profile) => {
        console.log('Profile updated:', profile);
        
        // Check for level up
        if (previousLevel > 0 && profile.level > previousLevel) {
          toast({
            title: `Level Up! 🎉`,
            description: `Congratulations! You've reached Level ${profile.level}!`,
          });
        }
        previousLevel = profile.level;
        
        setUserProfile(profile);
      });
      
      return () => {
        unsubscribeTasks();
        unsubscribeProfile();
      };
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!taskManager) return;

    try {
      setIsLoading(true);
      
      if (!task.completed) {
        // Completing task
        const xpEarned = getXPForCompletion(task);
        await taskManager.completeTask(task.id, task);
        
        if (xpEarned > 0) {
          // Check if all steps are completed for bonus XP
          const hasSteps = task.steps && task.steps.length > 0;
          const allStepsCompleted = hasSteps ? task.steps.every(step => step.completed) : true;
          const bonusXP = hasSteps && allStepsCompleted ? 5 : 0;
          const totalXP = xpEarned + bonusXP;
          
          toast({
            title: "Task Completed! 🎉",
            description: bonusXP > 0 
              ? `Great job! You earned ${totalXP} XP (${bonusXP} bonus for completing all steps)!`
              : `Great job! You earned ${totalXP} XP.`,
          });
        } else if (task.isDuelTask || task.duelId) {
          toast({
            title: "Duel Task Completed! ⚔️",
            description: "Duel task completed - XP will be awarded when the duel ends!",
          });
        } else if (isTaskOverdue(task.dueDate)) {
          toast({
            title: "Task Completed",
            description: "Task was overdue, no XP earned.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Task Completed",
            description: "Task marked as complete.",
          });
        }
      } else {
        // Uncompleting task
        await taskManager.updateTask(task.id, { 
          completed: false, 
          completedAt: null 
        });
        toast({
          title: "Task Reopened",
          description: "Task marked as incomplete.",
        });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (data: CreateTaskData) => {
    if (!taskManager) return;

    try {
      setIsLoading(true);
      await taskManager.createTask(data);
      toast({
        title: "Task Created! ✅",
        description: `"${data.text}" has been added to your list.`,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Failed to Create Task",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, data: UpdateTaskData) => {
    if (!taskManager) return;

    try {
      setIsLoading(true);
      await taskManager.updateTask(taskId, data);
      toast({
        title: "Task Updated ✏️",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Update Failed",
        description: "Could not save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!taskManager) return;

    try {
      setIsLoading(true);
      await taskManager.deleteTask(taskId);
      toast({
        title: "Task Deleted 🗑️",
        description: "Task has been removed from your list.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStep = async (taskId: string, stepId: string) => {
    if (!taskManager) return;

    try {
      await taskManager.toggleTaskStep(taskId, stepId);
      
      // Get the updated task to check if all steps are completed
      const currentTask = tasks.find(task => task.id === taskId);
      if (currentTask?.steps) {
        const updatedStep = currentTask.steps.find(step => step.id === stepId);
        const allStepsCompleted = currentTask.steps.every(step => 
          step.id === stepId ? !updatedStep?.completed : step.completed
        );
        
        if (allStepsCompleted && !currentTask.completed) {
          toast({
            title: "All Steps Complete! ✨",
            description: "Ready to complete this task for bonus XP?",
          });
        }
      }
      
      console.log('Step toggled successfully');
    } catch (error) {
      console.error('Error toggling step:', error);
      toast({
        title: "Step Update Failed",
        description: "Could not update step. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitProof = async (taskId: string, proof: { text?: string; imageURL?: string }) => {
    if (!taskManager || !user) return;

    try {
      setIsLoading(true);
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.duelId) {
        throw new Error('Task not found or not a duel task');
      }

      // Update task with proof and mark as completed
      await taskManager.updateTask(taskId, {
        proof: {
          text: proof.text,
          imageURL: proof.imageURL,
          submittedAt: new Date().toISOString()
        },
        completed: true,
        completedAt: Date.now()
      });

      // Also complete the duel task in the friends system
      if (task.duelTaskIndex !== undefined) {
        const { FirebaseFriendsManager } = await import('@/lib/firebaseFriends');
        const friendsManager = new FirebaseFriendsManager(user.uid);
        await friendsManager.completeDuelTask(task.duelId, task.duelTaskIndex, proof);
      }

      toast({
        title: "Proof Submitted! ⚔️",
        description: "Your duel task proof has been submitted and task completed.",
      });
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--bg-secondary))' }}>
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--bg-secondary))' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ 
        backgroundColor: 'rgb(var(--bg-primary))', 
        borderBottom: '1px solid rgb(var(--border-primary))',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="w-full max-w-4xl mx-auto px-6 py-4">
          {/* Top Bar with Logo and Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <i className="fas fa-sword text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ 
                  fontFamily: 'var(--font-heading)',
                  color: 'rgb(var(--text-primary))'
                }}>
                  ToDuel
                </h1>
                <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
                  {user?.email || user?.displayName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="p-2 w-10 h-10 rounded-xl transition-all duration-200"
                style={{ color: 'rgb(var(--text-tertiary))' }}
              >
                <i className="fas fa-sign-out-alt text-sm"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </header>
      {/* Main Content */}
      <main className="pt-[83px] pb-[83px] pl-[10px] pr-[10px]">
        {activeTab === "dashboard" && (
          <DashboardTab userProfile={userProfile} tasks={tasks} />
        )}
        {activeTab === "tasks" && (
          <TasksTab
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onToggleStep={handleToggleStep}
            onSubmitProof={handleSubmitProof}
            isLoading={isLoading}
          />
        )}
        {activeTab === "friends" && (
          <FriendsTab userProfile={userProfile} />
        )}
      </main>
    </div>
  );
}