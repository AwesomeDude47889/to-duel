import { Button } from "@/components/ui/button";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
    { id: 'tasks', label: 'Tasks', icon: 'fas fa-list-check' },
    { id: 'friends', label: 'Friends', icon: 'fas fa-users' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-3">
      <div className="flex gap-2 p-1.5 rounded-xl" style={{ 
        backgroundColor: 'rgb(var(--bg-secondary))',
        border: '1px solid rgb(var(--border-primary))'
      }}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id 
                ? "btn-primary shadow-sm" 
                : "btn-secondary hover:bg-opacity-50"
            }`}
          >
            <i className={`${tab.icon} text-sm mr-2`}></i>
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}