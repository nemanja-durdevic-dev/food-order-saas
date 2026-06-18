export default function OrderStatusLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="mx-auto max-w-lg px-4">
        {/* Back button */}
        <div className="-ml-2 mt-2 size-10 rounded-full bg-gray-200" />

        {/* Title */}
        <div className="mt-4 h-7 w-40 rounded-md bg-gray-200" />

        {/* Status section */}
        <div className="mt-6 flex items-center gap-3">
          <div className="size-8 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-44 rounded-md bg-gray-200" />
            <div className="h-4 w-32 rounded-md bg-gray-200" />
            <div className="h-3 w-20 rounded-md bg-gray-200" />
          </div>
        </div>

        {/* Progress stepper skeleton */}
        <div className="mt-6 space-y-1">
          {[0, 1, 2, 3, 4].map((step) => (
            <div className="flex gap-3" key={step}>
              <div className="flex flex-col items-center">
                <div className="size-8 rounded-full bg-gray-200" />
                {step < 4 && <div className="mt-0.5 h-8 w-0.5 rounded bg-gray-200" />}
              </div>
              <div className="h-5 w-36 self-center rounded-md bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Order items section */}
        <div className="mt-8 border-t border-border pt-4">
          <div className="mb-4 h-5 w-24 rounded-md bg-gray-200" />
          <div className="space-y-4">
            {[0, 1, 2].map((item) => (
              <div className="flex items-center justify-between" key={item}>
                <div className="h-4 w-40 rounded-md bg-gray-200" />
                <div className="h-4 w-16 rounded-md bg-gray-200" />
              </div>
            ))}
          </div>

          {/* Total line */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div className="h-5 w-16 rounded-md bg-gray-200" />
            <div className="h-5 w-20 rounded-md bg-gray-200" />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col items-center gap-4 pb-8">
          <div className="h-12 w-full rounded-md bg-gray-200" />
          <div className="h-4 w-36 rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
