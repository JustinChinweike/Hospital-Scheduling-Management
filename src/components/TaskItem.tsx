
import { useState } from "react";
import { Check, Trash } from "lucide-react";
import { Task } from "@/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskItem = ({ task, onComplete, onDelete }: TaskItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const categoryColors: Record<string, string> = {
    work: "bg-blue-100 text-blue-800",
    personal: "bg-purple-100 text-purple-800",
    shopping: "bg-green-100 text-green-800",
    health: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };

  const categoryColor = categoryColors[task.category.toLowerCase()] || categoryColors.default;

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 mb-2 border rounded-lg transition-all duration-200 group",
        task.completed ? "bg-gray-50 opacity-60" : "hover:bg-gray-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={() => onComplete(task.id)}
          className={cn(
            "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
            task.completed
              ? "bg-blue-500 border-blue-500 text-white"
              : "border-gray-300 hover:border-blue-500"
          )}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>
        
        <div className="flex flex-col">
          <span className={cn(
            "font-medium transition-all duration-200",
            task.completed && "line-through text-gray-500"
          )}>
            {task.title}
          </span>
          <div className="flex items-center mt-1">
            <span className={cn("text-xs px-2 py-1 rounded-full", categoryColor)}>
              {task.category}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className={cn(
          "text-gray-400 hover:text-red-500 transition-opacity", 
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <Trash className="h-4 w-4" />
      </button>
    </div>
  );
};

export default TaskItem;
