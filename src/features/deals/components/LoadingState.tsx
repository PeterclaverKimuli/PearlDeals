import { LoaderCircle } from "lucide-react";

export function LoadingState({
  title = "Loading deals",
  body = "Getting the latest comparisons ready.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="rounded-3xl border border-emerald-900/10 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-black text-gray-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
        {body}
      </p>
    </div>
  );
}
