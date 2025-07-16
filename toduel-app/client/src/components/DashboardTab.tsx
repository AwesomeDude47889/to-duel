import { XPProgressBar } from "./XPProgressBar";
import type { UserProfile, Task } from "@/lib/firebaseTasks";
import { Trophy, Swords, Target } from 'lucide-react';

interface DashboardTabProps {
  userProfile: UserProfile | null;
  tasks: Task[];
}

export function DashboardTab({ userProfile, tasks }: DashboardTabProps) {
  // Calculate task statistics
  const stats = {
    total: tasks.length,
    active: tasks.filter(task => !task.completed).length,
    completed: tasks.filter(task => task.completed).length,
  };

  // Calculate duel statistics from user profile
  const duelStats = {
    wins: 0,
    losses: 0,
    forfeits: 0,
  };

  if (userProfile && (userProfile as any).duelHistory) {
    const history = (userProfile as any).duelHistory;
    Object.values(history).forEach((record: any) => {
      if (record.result === 'win') duelStats.wins++;
      else if (record.result === 'loss') duelStats.losses++;
      else if (record.result === 'forfeit') duelStats.forfeits++;
    });
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-6">
      {/* XP Progress Section */}
      {userProfile && (
        <div className="p-5 rounded-2xl" style={{ 
          backgroundColor: 'rgba(var(--accent-primary), 0.05)',
          border: '1px solid rgba(var(--accent-primary), 0.1)'
        }}>
          <XPProgressBar userProfile={userProfile} />
        </div>
      )}

      {/* Task Overview Stats */}
      {tasks.length > 0 && (
        <div className="p-5 rounded-2xl animate-slide-in" style={{ 
          backgroundColor: 'rgb(var(--bg-primary))',
          border: '1px solid rgb(var(--border-primary))',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h4 className="text-lg font-semibold mb-5" style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'rgb(var(--text-primary))'
          }}>
            Task Overview
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgb(var(--bg-secondary))' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>
                {stats.total}
              </div>
              <div className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                Total Tasks
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(var(--warning), 0.1)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: 'rgb(var(--warning))' }}>
                {stats.active}
              </div>
              <div className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                Active Tasks
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(var(--success), 0.1)' }}>
              <div className="text-3xl font-bold mb-1" style={{ color: 'rgb(var(--success))' }}>
                {stats.completed}
              </div>
              <div className="text-xs font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
                Completed Tasks
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duel Statistics */}
      {(duelStats.wins > 0 || duelStats.losses > 0 || duelStats.forfeits > 0) && (
        <div className="p-6 rounded-2xl animate-slide-in" style={{ 
          backgroundColor: 'rgb(var(--bg-primary))',
          border: '1px solid rgb(var(--border-primary))',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-lg font-semibold" style={{ 
              fontFamily: 'var(--font-heading)',
              color: 'rgb(var(--text-primary))'
            }}>
              Duel Statistics
            </h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/40">
                  <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
                {duelStats.wins}
              </div>
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                Victories
              </div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
                  <Target className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300 mb-1">
                {duelStats.losses}
              </div>
              <div className="text-sm font-medium text-red-600 dark:text-red-400">
                Defeats
              </div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/40">
                  <Swords className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                {duelStats.forfeits}
              </div>
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Forfeits
              </div>
            </div>
          </div>
          
          {(duelStats.wins + duelStats.losses + duelStats.forfeits) > 0 && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Win Rate:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {Math.round((duelStats.wins / (duelStats.wins + duelStats.losses + duelStats.forfeits)) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}