import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Task, Priority, CreateTaskData, UpdateTaskData, TaskStep } from "@/lib/firebaseTasks";
import { Trash2, Plus } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTaskData | UpdateTaskData) => void;
  task?: Task | null;
  isLoading?: boolean;
}

export function TaskModal({ isOpen, onClose, onSave, task, isLoading = false }: TaskModalProps) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [newStepText, setNewStepText] = useState("");

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    if (isOpen) {
      setText(task?.text || "");
      setPriority(task?.priority || "medium");
      setDueDate(task?.dueDate || getTodayDate());
      setSteps(task?.steps || []);
    }
  }, [isOpen, task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!text.trim()) {
      alert("Task description cannot be empty");
      return;
    }
    
    if (text.trim().length < 3) {
      alert("Task description must be at least 3 characters");
      return;
    }
    
    if (!dueDate) {
      alert("Due date is required");
      return;
    }
    
    const taskData = {
      text: text.trim(),
      priority,
      dueDate,
      steps: steps.length > 0 ? steps : undefined
    };
    onSave(taskData);
    // Don't reset form here - let parent handle it after successful save
  };

  const resetForm = () => {
    setText("");
    setPriority("medium");
    setDueDate(getTodayDate());
    setSteps([]);
    setNewStepText("");
  };

  const addStep = () => {
    if (newStepText.trim()) {
      const newStep: TaskStep = {
        id: Date.now().toString(),
        text: newStepText.trim(),
        completed: false
      };
      setSteps([...steps, newStep]);
      setNewStepText("");
    }
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter(step => step.id !== stepId));
  };

  const isTaskCompleted = task?.completed || false;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50 animate-scale-in">
      <div 
        className="rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-in"
        style={{
          backgroundColor: 'rgb(var(--bg-primary))',
          border: '1px solid rgb(var(--border-primary))',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid rgb(var(--border-primary))' }}>
          <h3 className="text-xl font-semibold" style={{
            fontFamily: 'var(--font-heading)',
            color: 'rgb(var(--text-primary))'
          }}>
            {task ? "Edit Task" : "Add New Task"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ color: 'rgb(var(--text-tertiary))' }}
          >
            <i className="fas fa-times"></i>
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="taskText" className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Task Description
              </Label>
              <Textarea
                id="taskText"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl focus:ring-2 transition-all duration-200 resize-none"
                style={{
                  backgroundColor: 'rgb(var(--bg-secondary))',
                  border: '1px solid rgb(var(--border-primary))',
                  color: 'rgb(var(--text-primary))'
                }}
                placeholder="What do you need to get done?"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="priority" className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Priority Level
              </Label>
              <Select value={priority} onValueChange={(value: Priority) => setPriority(value)} disabled={isLoading}>
                <SelectTrigger 
                  className="w-full px-4 py-3 rounded-xl focus:ring-2 transition-all duration-200"
                  style={{
                    backgroundColor: 'rgb(var(--bg-secondary))',
                    border: '1px solid rgb(var(--border-primary))',
                    color: 'rgb(var(--text-primary))'
                  }}
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Priority (+5 XP)</SelectItem>
                  <SelectItem value="medium">🟡 Medium Priority (+10 XP)</SelectItem>
                  <SelectItem value="high">🔴 High Priority (+20 XP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate" className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={getTodayDate()}
                className="w-full px-4 py-3 rounded-xl focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'rgb(var(--bg-secondary))',
                  border: '1px solid rgb(var(--border-primary))',
                  color: 'rgb(var(--text-primary))'
                }}
                required
                disabled={isLoading}
              />
            </div>

            {/* Task Steps Section */}
            <div>
              <Label className="block text-sm font-medium mb-3" style={{ color: 'rgb(var(--text-secondary))' }}>
                Task Steps (Optional) {steps.length > 0 && <span className="text-green-600 font-medium">+5 XP Bonus</span>}
              </Label>
              
              {/* Add New Step Input */}
              {!isTaskCompleted && (
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add a step..."
                    value={newStepText}
                    onChange={(e) => setNewStepText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault() && addStep()}
                    className="flex-1 px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: 'rgb(var(--bg-secondary))',
                      border: '1px solid rgb(var(--border-primary))',
                      color: 'rgb(var(--text-primary))'
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStep}
                    disabled={!newStepText.trim() || isLoading}
                    className="px-3 py-2 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Steps List */}
              {steps.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-xl p-3" style={{ backgroundColor: 'rgb(var(--bg-secondary))', borderColor: 'rgb(var(--border-primary))' }}>
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgb(var(--bg-primary))' }}>
                      <span className="text-sm flex-1" style={{ color: 'rgb(var(--text-primary))' }}>
                        {index + 1}. {step.text}
                      </span>
                      {!isTaskCompleted && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          disabled={isLoading}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {isTaskCompleted && steps.length === 0 && (
                <p className="text-sm" style={{ color: 'rgb(var(--text-tertiary))' }}>
                  No steps were added to this task.
                </p>
              )}
            </div>

            <div className="flex space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 py-3"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 py-3"
                disabled={isLoading || !text.trim() || !dueDate}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  task ? "Save Changes" : "Add Task"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
