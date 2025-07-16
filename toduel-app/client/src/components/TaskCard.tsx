import { Task, Priority } from '@/lib/firebaseTasks';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Upload } from "lucide-react";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleStep?: (taskId: string, stepId: string) => void;
  onSubmitProof?: (taskId: string, proof: { text?: string; imageURL?: string }) => void;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateToCheck = new Date(dateString);
  
  if (dateToCheck.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (dateToCheck.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const isTaskOverdue = (dueDate: string): boolean => {
  const today = new Date();
  const taskDate = new Date(dueDate + 'T00:00:00');
  today.setHours(0, 0, 0, 0);
  return taskDate < today;
};

const getPriorityIcon = (priority: Priority): string => {
  switch (priority) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🔴';
    default: return '⚪';
  }
};

const getPriorityClass = (priority: Priority): string => {
  switch (priority) {
    case 'low': return 'priority-low';
    case 'medium': return 'priority-medium';
    case 'high': return 'priority-high';
    default: return 'priority-low';
  }
};

export function TaskCard({ task, onToggleComplete, onEdit, onDelete, onToggleStep, onSubmitProof }: TaskCardProps) {
  const isOverdue = isTaskOverdue(task.dueDate);
  const isDuelTask = task.isDuelTask || !!task.duelId;
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [proofText, setProofText] = useState('');
  const [proofImageURL, setProofImageURL] = useState('');

  const handleSubmitProof = () => {
    if (onSubmitProof && (proofText.trim() || proofImageURL.trim())) {
      onSubmitProof(task.id, { 
        text: proofText.trim() || undefined, 
        imageURL: proofImageURL.trim() || undefined 
      });
      setProofText('');
      setProofImageURL('');
      setIsProofDialogOpen(false);
    }
  };

  return (
    <div className={`task-card animate-slide-in ${task.completed ? 'completed' : ''} ${isDuelTask ? 'duel-task' : ''}`}>
      {/* Task Header */}
      <div className="flex items-start gap-5 mb-4">
        {/* Completion Button */}
        <button
          onClick={() => onToggleComplete(task)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1 hover:scale-110 ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-blue-500'
          }`}
          style={{
            borderColor: task.completed ? 'rgb(var(--success))' : 'rgb(var(--border-secondary))',
            backgroundColor: task.completed ? 'rgb(var(--success))' : 'transparent',
          }}
        >
          {task.completed && (
            <i className="fas fa-check text-white text-sm"></i>
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              {/* Duel Task Badge */}
              {isDuelTask && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-2">
                  ⚔️ Duel Task
                </div>
              )}
              
              <h3 
                className={`text-lg font-semibold leading-tight ${task.completed ? 'line-through' : ''}`}
                style={{ 
                  color: 'rgb(var(--text-primary))',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                {task.text}
              </h3>
            </div>
            {isOverdue && !task.completed && (
              <span className="text-red-500 text-sm font-bold ml-3 flex-shrink-0">
                ⚠️ OVERDUE
              </span>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="flex items-center gap-4 mb-4">
            <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
              {getPriorityIcon(task.priority)} {task.priority}
            </span>
            <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-secondary))' }}>
              Due: {formatDate(task.dueDate)}
            </span>
            {task.steps && task.steps.length > 0 && (
              <span className="text-xs text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +5 XP Bonus
              </span>
            )}
          </div>

          {/* Task Steps */}
          {task.steps && task.steps.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Steps ({task.steps.length}):
              </h4>
              <div className="space-y-1">
                {task.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleStep && onToggleStep(task.id, step.id)}
                      className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
                      disabled={task.completed || !onToggleStep}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    <span 
                      className={`text-sm ${step.completed ? 'line-through' : ''}`}
                      style={{ color: step.completed ? 'rgb(var(--text-tertiary))' : 'rgb(var(--text-secondary))' }}
                    >
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Meta Info */}
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'rgb(var(--text-tertiary))' }}>
              {task.completed 
                ? `Completed ${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}`
                : `Created ${new Date(task.createdAt).toLocaleDateString()}`
              }
            </span>
            {task.completed && task.xpAwarded && task.xpAwarded > 0 && (
              <span className="text-green-600 font-medium">+{task.xpAwarded} XP</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isDuelTask && !task.completed && (
            <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-3 w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110"
                  style={{ 
                    color: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)'
                  }}
                >
                  <Upload className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Proof for Duel Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Submit proof that you completed: <strong>{task.text}</strong>
                  </p>
                  
                  <div>
                    <Label htmlFor="proofText">Text Description (Optional)</Label>
                    <Textarea
                      id="proofText"
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      placeholder="Describe what you accomplished..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="proofImage">Image URL (Optional)</Label>
                    <Input
                      id="proofImage"
                      type="url"
                      value={proofImageURL}
                      onChange={(e) => setProofImageURL(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setIsProofDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmitProof}
                      disabled={!proofText.trim() && !proofImageURL.trim()}
                    >
                      Submit Proof
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="p-3 w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110"
            style={{ 
              color: 'rgb(var(--text-tertiary))',
              backgroundColor: 'rgba(var(--accent-primary), 0.1)'
            }}
          >
            <i className="fas fa-edit text-lg"></i>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            className="p-3 w-12 h-12 rounded-xl transition-all duration-200 hover:scale-110"
            style={{ 
              color: 'rgb(var(--error))',
              backgroundColor: 'rgba(var(--error), 0.1)'
            }}
          >
            <i className="fas fa-trash text-lg"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}