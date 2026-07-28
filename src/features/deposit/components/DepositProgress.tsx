import { CheckCircle } from "lucide-react";
import { Fragment } from "react/jsx-runtime";

export type DepositStep = "select" | "details" | "confirm" | "success";

const DepositProgress = ({ current }: { current: DepositStep }) => {
  const steps: { id: DepositStep; label: string }[] = [
    { id: "select", label: "Chọn số tiền" },
    { id: "details", label: "Thông tin" },
    { id: "confirm", label: "Xác nhận" },
  ];

  const activeIndex = steps.findIndex((step) => step.id === current);

  return (
    <div className="mb-8 flex items-center">
      {steps.map((step, index) => (
        <Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index < activeIndex ? "bg-amber-500 text-white" : index === activeIndex ? "bg-amber-500 text-white ring-4 ring-amber-100" : "bg-gray-100 text-gray-400"}`}
            >
              {index < activeIndex ? <CheckCircle size={14} /> : index + 1}
            </div>
            <span
              className={`whitespace-nowrap text-2xs font-medium ${index === activeIndex ? "text-amber-600" : "text-gray-400"}`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`mx-2 mb-4 h-0.5 flex-1 ${index < activeIndex ? "bg-amber-400" : "bg-gray-200"}`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default DepositProgress;
