import Link from "next/link";

import type { AdminColumn, AdminResource } from "@/lib/admin/resources";

type AdminRecord = Record<string, unknown>;

type CollectionListProps = {
  count: number;
  page: number;
  pageSize: number;
  query: string;
  records: AdminRecord[];
  resource: AdminResource;
};

function getValue(record: AdminRecord, key: string) {
  return key.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[part];
  }, record);
}

function formatValue(record: AdminRecord, column: AdminColumn) {
  const value = getValue(record, column.key);

  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }

  if (column.type === "boolean") {
    const active = Boolean(value);

    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
          active
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-gray-200 bg-gray-50 text-gray-600"
        }`}
      >
        {active ? "Yes" : "No"}
      </span>
    );
  }

  if (column.type === "currency") {
    return `${Number(value).toFixed(2)} kr`;
  }

  if (column.type === "datetime") {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(String(value)));
  }

  if (column.type === "status") {
    return (
      <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium capitalize">
        {String(value).replaceAll("_", " ")}
      </span>
    );
  }

  return String(value);
}

export function CollectionList({
  count,
  page,
  pageSize,
  query,
  records,
  resource,
}: CollectionListProps) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Collection</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">{resource.pluralLabel}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{resource.description}</p>
        </div>
        {resource.createFields?.length ? (
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
            href={`/admin/${resource.slug}/create`}
          >
            Create {resource.label}
          </Link>
        ) : (
          <button
            className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background opacity-50"
            disabled
            type="button"
          >
            Create {resource.label}
          </button>
        )}
      </div>

      <form className="mb-4 flex max-w-md gap-2">
        <input
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          defaultValue={query}
          name="q"
          placeholder={`Search ${resource.pluralLabel.toLowerCase()}`}
          type="search"
        />
        <button
          className="h-10 rounded-md border border-border px-4 text-sm font-medium"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {resource.columns.map((column) => (
                  <th className="px-4 py-3 font-semibold" key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  key={String(record.id)}
                >
                  {resource.columns.map((column, index) => (
                    <td className="max-w-[280px] truncate px-4 py-3 align-middle" key={column.key}>
                      {index === 0 ? (
                        <Link
                          className="font-medium text-foreground underline underline-offset-4"
                          href={`/admin/${resource.slug}/edit?id=${encodeURIComponent(String(record.id))}`}
                        >
                          {formatValue(record, column)}
                        </Link>
                      ) : (
                        formatValue(record, column)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                    colSpan={resource.columns.length}
                  >
                    No {resource.pluralLabel.toLowerCase()} found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {count} total · Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Link
            aria-disabled={!hasPrevious}
            className={`rounded-md border border-border px-3 py-2 ${hasPrevious ? "text-foreground" : "pointer-events-none opacity-40"}`}
            href={`/admin/${resource.slug}?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          >
            Previous
          </Link>
          <Link
            aria-disabled={!hasNext}
            className={`rounded-md border border-border px-3 py-2 ${hasNext ? "text-foreground" : "pointer-events-none opacity-40"}`}
            href={`/admin/${resource.slug}?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
