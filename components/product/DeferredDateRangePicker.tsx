import React, { Suspense, lazy, useEffect, useRef, useState } from "react";

const InlineDateRangePicker = lazy(() => import("./InlineDateRangePicker"));

interface DeferredDateRangePickerProps {
  selected: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  startDate: Date | null;
  endDate: Date | null;
  minDate?: Date;
  monthsShown?: number;
  dateFormat?: string;
  locale?: string;
}

const CalendarSkeleton = ({ onActivate }: { onActivate: () => void }) => (
  <button
    type="button"
    onClick={onActivate}
    className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
    aria-label="날짜 선택 달력 불러오기"
  >
    <div className="mb-4 flex items-center justify-between">
      <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, index) => (
        <div
          key={index}
          className="aspect-square rounded-lg bg-gray-50 animate-pulse"
        />
      ))}
    </div>
    <p className="mt-4 text-sm text-gray-400">
      달력을 준비하고 있습니다.
    </p>
  </button>
);

export const DeferredDateRangePicker: React.FC<DeferredDateRangePickerProps> = (
  props,
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof window.IntersectionObserver === "undefined"
    ) {
      setShouldLoad(true);
      return;
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    const target = containerRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [shouldLoad]);

  const activate = () => {
    setShouldLoad(true);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={activate}
      onMouseEnter={activate}
      onFocusCapture={activate}
    >
      {shouldLoad ? (
        <Suspense fallback={<CalendarSkeleton onActivate={activate} />}>
          <InlineDateRangePicker {...props} />
        </Suspense>
      ) : (
        <CalendarSkeleton onActivate={activate} />
      )}
    </div>
  );
};
