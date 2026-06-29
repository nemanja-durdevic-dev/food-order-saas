"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import type { AdminFieldOption } from "@/lib/admin/resources";

type SearchableMultiSelectProps = {
  defaultValue: string[];
  helpText?: string;
  label: string;
  name: string;
  onValueChange?: (values: string[]) => void;
  options: AdminFieldOption[];
  required?: boolean;
  searchUrl?: string;
};

export function SearchableMultiSelect({
  defaultValue,
  helpText,
  label,
  name,
  onValueChange,
  options,
  required,
  searchUrl,
}: SearchableMultiSelectProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedValues, setSelectedValues] = useState(defaultValue);
  const [selectedOptions, setSelectedOptions] = useState(options);
  const [searchOptions, setSearchOptions] = useState<AdminFieldOption[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const currentStatus = trimmedQuery ? status : "idle";
  const displayedOptions = searchUrl
    ? trimmedQuery
      ? searchOptions
      : []
    : normalizedQuery
      ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      : [];

  useEffect(() => {
    onValueChange?.(selectedValues);
  }, [onValueChange, selectedValues]);

  useEffect(() => {
    if (!searchUrl) {
      return;
    }

    if (!trimmedQuery) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(`${searchUrl}&q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        const data = (await response.json()) as { options?: AdminFieldOption[] };
        setSearchOptions(data.options ?? []);
        setStatus("idle");
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [searchUrl, trimmedQuery]);

  function selectOption(option: AdminFieldOption) {
    if (selectedValues.includes(option.value)) {
      return;
    }

    setQuery("");
    inputRef.current?.focus();
    setSelectedValues((currentValues) => [...currentValues, option.value]);
    setSelectedOptions((currentOptions) =>
      currentOptions.some((currentOption) => currentOption.value === option.value)
        ? currentOptions
        : [...currentOptions, option],
    );
  }

  function removeValue(value: string) {
    setSelectedValues((currentValues) =>
      currentValues.filter((currentValue) => currentValue !== value),
    );
  }

  return (
    <div className="block text-sm">
      <label className="font-medium" htmlFor={inputId}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>

      <div className="relative mt-1">
        <input
          className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${label.toLowerCase()}`}
          type="search"
          value={query}
        />

        {trimmedQuery ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-white shadow-lg">
            {currentStatus === "loading" ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching...</p>
            ) : null}

            {currentStatus === "idle"
              ? displayedOptions.map((option) => {
                  const selected = selectedValues.includes(option.value);

                  return (
                    <button
                      className="flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                      key={option.value}
                      onClick={() => selectOption(option)}
                      type="button"
                    >
                      <span className="block min-w-0 truncate">{option.label}</span>
                      {selected ? <Check className="size-4 shrink-0 text-green-600" /> : null}
                    </button>
                  );
                })
              : null}

            {currentStatus === "error" ? (
              <p className="px-3 py-6 text-center text-sm text-destructive">Search failed.</p>
            ) : null}

            {currentStatus === "idle" && displayedOptions.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches found.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{selectedValues.length} selected</span>
        {selectedValues.length > 0 ? (
          <button
            className="font-medium text-foreground underline-offset-4 hover:underline"
            onClick={() => setSelectedValues([])}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      {selectedValues.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedValues.map((value) => {
            const selectedOption = selectedOptions.find((option) => option.value === value);

            return (
              <span
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                key={value}
              >
                {selectedOption?.label ?? "Selected item"}
                <button
                  aria-label={`Remove ${selectedOption?.label ?? "selected item"}`}
                  className="rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => removeValue(value)}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      {selectedValues.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}

      {helpText ? (
        <span className="mt-1 block text-xs text-muted-foreground">{helpText}</span>
      ) : null}
    </div>
  );
}
