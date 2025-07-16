import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import { TaskModal } from "./task-modal";
import { DeleteModal } from "./delete-modal";
import { Plus } from 'lucide-react';
import type { Task, CreateTaskData, UpdateTaskData } from "@/lib/firebaseTasks";

interface TasksTabProps {
  tasks: Task[];
  onToggleComplete: (task: Task) => void;
  onCreateTask: (data: CreateTaskData) => void;
  onUpdateTask: (taskId: string, data: UpdateTaskData) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStep?: (taskId: string, stepId: string) => void;
  onSubmitProof?: (taskId: string, proof: { text?: string; imageURL?: string }) => void;
  isLoading: boolean;
}

type FilterType = "all" | "active" | "completed";

export function TasksTab({ 
  tasks, 
  onToggleComplete, 
  onCreateTask, 
  onUpdateTask, 
  onDeleteTask, 
  onToggleStep,
  onSubmitProof,
  isLoading 
}: TasksTabProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Filter tasks based on current filter
  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case "active":
        return !task.completed;
      case "completed":
        return task.completed;
      default:
        return true;
    }
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingTaskId) {
      onDeleteTask(deletingTaskId);
      setShowDeleteModal(false);
      setDeletingTaskId(null);
    }
  };

  const handleSaveTask = (data: CreateTaskData | UpdateTaskData) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, data as UpdateTaskData);
    } else {
      onCreateTask(data as CreateTaskData);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-8">
      {/* Header with Add Task Button */}
      <div className="flex items-center justify-between py-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tasks
          </h2>
          <p className="text-muted-foreground text-lg">Manage your productivity goals</p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setShowTaskModal(true);
          }}
          className="flex items-center space-x-2 h-12 px-6 bg-green-600 hover:bg-green-700 rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
          disabled={isLoading}
        >
          <Plus className="h-5 w-5" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 p-1.5 rounded-xl mb-6" style={{ backgroundColor: 'rgb(var(--bg-secondary))' }}>
        {(["all", "active", "completed"] as FilterType[]).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(filterType)}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              filter === filterType 
                ? "btn-primary shadow-sm" 
                : "btn-secondary"
            }`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="pb-20">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 animate-slide-in">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ 
              backgroundColor: 'rgba(var(--accent-primary), 0.1)',
              border: '1px solid rgba(var(--accent-primary), 0.2)'
            }}>
              <i className="fas fa-clipboard-list text-3xl" style={{ color: 'rgb(var(--accent-primary))' }}></i>
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ 
              fontFamily: 'var(--font-heading)',
              color: 'rgb(var(--text-primary))'
            }}>
              {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
            </h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              {filter === "all"
                ? "Ready to conquer your day? Add your first task to start earning XP!"
                : `You don't have any ${filter} tasks.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={onToggleComplete}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggleStep={onToggleStep}
                onSubmitProof={onSubmitProof}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => {
          setEditingTask(null);
          setShowTaskModal(true);
        }}
        className="fixed bottom-8 right-4 w-16 h-16 rounded-full btn-primary shadow-xl hover:shadow-2xl p-0 animate-scale-in transition-all duration-300 hover:scale-105"
        style={{ 
          background: 'linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
          boxShadow: '0 8px 32px rgba(var(--accent-primary), 0.25)'
        }}
      >
        <i className="fas fa-plus text-xl text-white"></i>
      </Button>

      {/* Modals */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        isLoading={isLoading}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTaskId(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}