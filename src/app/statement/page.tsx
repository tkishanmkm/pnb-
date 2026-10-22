
import React, { Suspense } from 'react';
import { StatementContent } from './statement-content';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatementPage() {
  return (
    <Suspense fallback={<StatementSkeleton />}>
      <StatementContent />
    </Suspense>
  );
}

const StatementSkeleton = () => (
    <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    </div>
);
