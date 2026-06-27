import Link from "next/link";

import type { AdminField, AdminResource } from "@/lib/admin/resources";

type AdminRecord = Record<string, unknown>;

type AdminRecordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: AdminField[];
  mode: "create" | "edit";
  record?: AdminRecord;
  resource: AdminResource;
};

function getDefaultValue(record: AdminRecord | undefined, key: string) {
  const value = record?.[key];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function renderField(field: AdminField, record: AdminRecord | undefined) {
  const defaultValue = getDefaultValue(record, field.key);
  const inputClassName =
    "mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-3 text-sm" key={field.key}>
        <input
          className="size-4 rounded border-input"
          defaultChecked={record ? Boolean(record[field.key]) : true}
          name={field.key}
          type="checkbox"
        />
        <span className="font-medium">{field.label}</span>
      </label>
    );
  }

  return (
    <label className="block text-sm" key={field.key}>
      <span className="font-medium">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </span>

      {field.type === "textarea" ? (
        <textarea
          className="mt-1 min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          defaultValue={defaultValue}
          name={field.key}
          required={field.required}
        />
      ) : null}

      {field.type === "select" ? (
        <select
          className={inputClassName}
          defaultValue={defaultValue}
          name={field.key}
          required={field.required}
        >
          <option value="">{field.required ? "Select an option" : "None"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : null}

      {field.type === "number" || field.type === "text" ? (
        <input
          className={inputClassName}
          defaultValue={defaultValue}
          name={field.key}
          required={field.required}
          step={field.type === "number" ? "0.01" : undefined}
          type={field.type}
        />
      ) : null}

      {field.helpText ? (
        <span className="mt-1 block text-xs text-muted-foreground">{field.helpText}</span>
      ) : null}
    </label>
  );
}

export function AdminRecordForm({ action, fields, mode, record, resource }: AdminRecordFormProps) {
  return (
    <div>
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">{resource.pluralLabel}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
          {mode === "create" ? `Create ${resource.label}` : `Edit ${resource.label}`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{resource.description}</p>
      </div>

      <form action={action} className="max-w-2xl space-y-5">
        {fields.map((field) => renderField(field, record))}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
            href={`/admin/${resource.slug}`}
          >
            Cancel
          </Link>
          <button
            className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background"
            type="submit"
          >
            {mode === "create" ? `Create ${resource.label}` : `Save ${resource.label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
