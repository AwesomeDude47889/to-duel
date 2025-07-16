import { useEffect, useState } from 'react';
import { UserProfile } from '@/lib/firebaseTasks';

interface XPProgressBarProps {
  userProfile: UserProfile | null;
}

export function XPProgressBar({ userProfile }: XPProgressBarProps) {
  const [animatedXP, setAnimatedXP] = useState(0);

  if (!userProfile) {
    return (
      <div className="animate-slide-in">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-8 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const currentXP = userProfile.xp || 0; // XP within current level
  const level = userProfile.level || 1;
  const totalXP = userProfile.totalXP || 0;
  
  // Dynamic XP calculation: level * level * 10
  const xpRequiredForNextLevel = level * level * 10;
  const progressPercentage = Math.min((currentXP / xpRequiredForNextLevel) * 100, 100);

  useEffect(() => {
    // Animate XP progress bar
    const timer = setTimeout(() => {
      setAnimatedXP(progressPercentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  return (
    <div className="animate-slide-in">
      {/* Level & XP Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{level}</span>
          </div>
          <div>
            <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
              Level {level}
            </h2>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              {currentXP} / {xpRequiredForNextLevel} XP
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold" style={{ color: 'rgb(var(--accent-primary))' }}>
            {totalXP}
          </p>
          <p className="text-xs" style={{ color: 'rgb(var(--text-tertiary))' }}>
            Total XP
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="xp-progress-bar mb-3">
        <div 
          className="xp-progress-fill"
          style={{ 
            width: `${animatedXP}%`,
            '--progress-width': `${animatedXP}%`
          } as any}
        />
      </div>

      {/* Streak Bar */}
      {userProfile.streak > 0 && (
        <div className="mb-3 p-3 rounded-xl animate-slide-in" style={{ 
          backgroundColor: 'rgb(var(--bg-tertiary))',
          border: '1px solid rgb(var(--border-secondary))'
        }}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">🔥</span>
            <span className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
              {userProfile.streak} Day Streak
            </span>
          </div>
          <p className="text-xs text-center mt-1" style={{ color: 'rgb(var(--text-tertiary))' }}>
            Keep completing tasks daily to maintain your streak!
          </p>
        </div>
      )}

      {/* Next Level Info */}
      <div className="flex justify-between text-xs" style={{ color: 'rgb(var(--text-tertiary))' }}>
        <span>Level {level}</span>
        <span>{xpRequiredForNextLevel - currentXP} XP to Level {level + 1}</span>
      </div>
    </div>
  );
}