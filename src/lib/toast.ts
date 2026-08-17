"use client";

import { toast } from "sonner";

export const showToast = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  // Dismiss all previous toasts so they don't stack up
  toast.dismiss();

  toast(title, {
    description,
  });
};
