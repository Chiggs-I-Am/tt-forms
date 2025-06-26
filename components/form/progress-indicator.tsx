import { CheckIcon } from "@heroicons/react/solid";
import useJoinClassNames from "@utils/joinClasses";

interface ProgressStep {
  label: string;
  completed: boolean;
  current: boolean;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ steps, currentStep, totalSteps }: ProgressIndicatorProps) {
  const joinClassNames = useJoinClassNames();

  return (
    <div className="flex items-center space-x-2 p-4">
      {/* Progress bar */}
      <div className="flex-1 flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={joinClassNames(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200",
              step.completed
                ? "bg-green-500 text-white"
                : step.current
                ? "bg-blue-500 text-white"
                : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            )}
          >
            {step.completed ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
        ))}
      </div>

      {/* Step counter */}
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        {currentStep} of {totalSteps}
      </div>
    </div>
  );
}