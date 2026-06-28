"use client";

import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { type ChangeEvent, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AdminField } from "@/lib/admin/resources";
import { SearchableMultiSelect } from "./searchable-multi-select";

type AdminRecord = Record<string, unknown>;

type AdminRecordFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  canCreate?: boolean;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  duplicateAction?: (formData: FormData) => void | Promise<void>;
  fields: AdminField[];
  mode: "create" | "edit";
  record?: AdminRecord;
  resource: {
    description: string;
    label: string;
    pluralLabel: string;
    slug: string;
  };
};

function getDefaultValue(record: AdminRecord | undefined, key: string) {
  const value = record?.[key];

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getDefaultValues(record: AdminRecord | undefined, key: string) {
  const value = record?.[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(String);
}

function getInitialFieldValues(fields: AdminField[], record: AdminRecord | undefined) {
  return fields.reduce<Record<string, string[]>>((values, field) => {
    if (field.type === "boolean") {
      values[field.key] = record ? (Boolean(record[field.key]) ? ["on"] : []) : ["on"];
      return values;
    }

    if (field.type === "multiselect") {
      values[field.key] = getDefaultValues(record, field.key).sort();
      return values;
    }

    values[field.key] = [getDefaultValue(record, field.key)];
    return values;
  }, {});
}

function hasFieldChanged(initialValue: string[], currentValue: string[]) {
  const normalizedInitialValue = [...initialValue].sort();
  const normalizedCurrentValue = [...currentValue].sort();

  if (normalizedCurrentValue.length !== normalizedInitialValue.length) {
    return true;
  }

  return normalizedCurrentValue.some((value, index) => value !== normalizedInitialValue[index]);
}

function formatDateTime(value: unknown) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(String(value)));
}

function renderField(
  field: AdminField,
  record: AdminRecord | undefined,
  resourceSlug: string,
  onValueChange: (key: string, values: string[]) => void,
) {
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

  if (field.type === "multiselect") {
    return (
      <SearchableMultiSelect
        defaultValue={getDefaultValues(record, field.key)}
        helpText={field.helpText}
        key={field.key}
        label={field.label}
        name={field.key}
        onValueChange={(values) => onValueChange(field.key, values)}
        options={field.options ?? []}
        required={field.required}
        searchUrl={
          field.searchable
            ? `/api/admin/relation-options?collection=${resourceSlug}&field=${field.key}`
            : undefined
        }
      />
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

export function AdminRecordForm({
  action,
  canCreate = false,
  deleteAction,
  duplicateAction,
  fields,
  mode,
  record,
  resource,
}: AdminRecordFormProps) {
  const initialValues = useMemo(() => getInitialFieldValues(fields, record), [fields, record]);
  const [changedFields, setChangedFields] = useState<Record<string, boolean>>({});
  const hasChanges = Object.values(changedFields).some(Boolean);

  function updateChangedField(key: string, values: string[]) {
    setChangedFields((currentChangedFields) => {
      const changed = hasFieldChanged(initialValues[key] ?? [], values);

      if (currentChangedFields[key] === changed) {
        return currentChangedFields;
      }

      return {
        ...currentChangedFields,
        [key]: changed,
      };
    });
  }

  function handleFieldChange(event: ChangeEvent<HTMLFormElement>) {
    const field = event.target;

    if (
      !(
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      )
    ) {
      return;
    }

    if (!field.name) {
      return;
    }

    updateChangedField(
      field.name,
      field instanceof HTMLInputElement && field.type === "checkbox" && !field.checked
        ? []
        : [field.value],
    );
  }

  return (
    <div>
      <div className="border-b border-border pb-4">
        <p className="text-sm font-medium text-muted-foreground">{resource.pluralLabel}</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
          {mode === "create" ? `Create ${resource.label}` : `Edit ${resource.label}`}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{resource.description}</p>
        {mode === "edit" ? (
          <div className="mt-4 flex items-center gap-6 border-t border-border pt-4 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Created</span>{" "}
              {formatDateTime(record?.created_at)}
            </p>
            <p>
              <span className="font-medium text-foreground">Updated</span>{" "}
              {formatDateTime(record?.updated_at)}
            </p>
          </div>
        ) : null}
      </div>

      <form action={action} className="max-w-2xl space-y-5" onChange={handleFieldChange}>
        <div className="sticky top-14 z-40 flex items-center justify-between border-b border-border bg-background py-4 lg:top-0">
          <Button disabled={!hasChanges} size="sm" type="submit">
            {mode === "create" ? "Create" : "Save"}
          </Button>

          {mode === "edit" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button aria-label="Open form actions" size="icon" type="button" variant="outline">
                  <Ellipsis className="size-4" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 rounded-md p-1">
                {canCreate ? (
                  <Link
                    className="flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    href={`/admin/${resource.slug}/create`}
                  >
                    Create New
                  </Link>
                ) : (
                  <button
                    className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium opacity-50"
                    disabled
                    type="button"
                  >
                    Create New
                  </button>
                )}
                <button
                  className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground"
                  disabled={!duplicateAction}
                  formAction={duplicateAction}
                  type="submit"
                >
                  Duplicate
                </button>
                <button
                  className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:hover:bg-transparent"
                  disabled={!deleteAction}
                  formAction={deleteAction}
                  type="submit"
                >
                  Delete
                </button>
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        {fields.map((field) => renderField(field, record, resource.slug, updateChangedField))}
      </form>
    </div>
  );
}
