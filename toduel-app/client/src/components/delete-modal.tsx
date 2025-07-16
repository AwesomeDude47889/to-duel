import { Button } from "@/components/ui/button";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteModal({ isOpen, onClose, onConfirm, isLoading = false }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-scale-in">
      <div 
        className="rounded-2xl max-w-sm w-full p-6 animate-slide-in"
        style={{
          backgroundColor: 'rgb(var(--bg-primary))',
          border: '1px solid rgb(var(--border-primary))',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{
            backgroundColor: 'rgba(var(--error), 0.1)',
            border: '1px solid rgba(var(--error), 0.2)'
          }}>
            <i className="fas fa-exclamation-triangle text-xl" style={{ color: 'rgb(var(--error))' }}></i>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{
            fontFamily: 'var(--font-heading)',
            color: 'rgb(var(--text-primary))'
          }}>
            Delete Task
          </h3>
          <p className="mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-2 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1 py-2 transition-all duration-200"
              style={{
                backgroundColor: 'rgb(var(--error))',
                color: 'white',
                fontWeight: '500'
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
