import { toast } from "react-toastify";

export const notify = (type: "success" | "error" | "info" | "warning", message: string) => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    case "info":
      toast.info(message);
      break;
    case "warning":
      toast.warning(message);
      break;
  }
};
