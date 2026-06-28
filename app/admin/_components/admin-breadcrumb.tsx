import Link from "next/link";

export type AdminBreadcrumbItem = {
  href?: string;
  label: string;
};

type AdminBreadcrumbProps = {
  className?: string;
  compact?: boolean;
  items?: AdminBreadcrumbItem[];
};

export function AdminBreadcrumb({ className, compact = false, items = [] }: AdminBreadcrumbProps) {
  const breadcrumbItems = items.length ? items : [{ label: "Admin" }];

  return (
    <nav aria-label="Breadcrumb" className={className ?? "mb-6 text-sm text-muted-foreground"}>
      <ol
        className={`flex items-center gap-2 ${compact ? "min-w-0 flex-nowrap overflow-hidden" : "flex-wrap"}`}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;

          return (
            <li
              className={`flex items-center gap-2 ${compact && isLast ? "min-w-0" : "shrink-0"}`}
              key={`${item.label}-${index}`}
            >
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {item.href && !isLast ? (
                <Link
                  className="font-medium transition-colors hover:text-foreground"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={`font-medium text-foreground ${compact ? "truncate" : ""}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
