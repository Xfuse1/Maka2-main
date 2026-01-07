
"use client";

import { Button } from "@/components/ui/button";
import { updateReviewStatus } from "./actions";
import { useTransition } from "react";

export function ReviewActions({ reviewId, currentStatus }: { reviewId: number; currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdateStatus = (status: "approved" | "rejected") => {
    startTransition(() => {
      updateReviewStatus(reviewId, status);
    });
  };

  return (
    <div className="flex justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleUpdateStatus("approved")}
        disabled={isPending || currentStatus === "approved"}
      >
        {isPending ? "جاري..." : "نشر"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleUpdateStatus("rejected")}
        disabled={isPending || currentStatus === "rejected"}
      >
        {isPending ? "جاري..." : "رفض"}
      </Button>
    </div>
  );
}
