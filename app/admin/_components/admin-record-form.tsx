"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Ellipsis, LoaderCircle } from "lucide-react";
import {
  type ChangeEvent,
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AdminField } from "@/lib/admin/resources";
import { SearchableMultiSelect } from "./searchable-multi-select";

type ActionState = { error?: string; success?: boolean } | null;

type AdminRecord = Record<string, unknown>;

type AdminRecordFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  canCreate?: boolean;
  children?: React.ReactNode;
  deleteAction?: (formData: FormData) => void | Promise<void>;
  duplicateAction?: (formData: FormData) => void | Promise<void>;
  fields: AdminField[];
  imageValues?: Record<string, string>;
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

type ImageUploadFieldProps = {
  field: AdminField;
  savedUrl: string;
  onValueChange: (key: string, values: string[]) => void;
};

const CROP_STAGE_WIDTH = 352;
const CROP_STAGE_HEIGHT = 256;
const CROP_FRAME_SIZE = 216;

function getContainedSize(width: number, height: number) {
  const scale = Math.min(CROP_STAGE_WIDTH / width, CROP_STAGE_HEIGHT / height);

  return {
    height: height * scale,
    width: width * scale,
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));
    image.src = src;
  });
}

async function cropImageToSquare(
  file: File,
  src: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  const size = 1200;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not crop image.");
  }

  const containedSize = getContainedSize(image.naturalWidth, image.naturalHeight);
  const displayedWidth = containedSize.width * zoom;
  const displayedHeight = containedSize.height * zoom;
  const imageX = (CROP_STAGE_WIDTH - displayedWidth) / 2 + offsetX;
  const imageY = (CROP_STAGE_HEIGHT - displayedHeight) / 2 + offsetY;
  const frameX = (CROP_STAGE_WIDTH - CROP_FRAME_SIZE) / 2;
  const frameY = (CROP_STAGE_HEIGHT - CROP_FRAME_SIZE) / 2;
  const sourceX = ((frameX - imageX) / displayedWidth) * image.naturalWidth;
  const sourceY = ((frameY - imageY) / displayedHeight) * image.naturalHeight;
  const sourceWidth = (CROP_FRAME_SIZE / displayedWidth) * image.naturalWidth;
  const sourceHeight = (CROP_FRAME_SIZE / displayedHeight) * image.naturalHeight;

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not crop image."));
          return;
        }

        const baseName = file.name.replace(/\.[^.]+$/, "") || "menu-item-image";
        resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  });
}

function ImageUploadField({ field, onValueChange, savedUrl }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<{ file: File; url: string } | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const [cropImageSize, setCropImageSize] = useState<{ height: number; width: number } | null>(
    null,
  );
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const previewUrl = objectUrl ?? savedUrl;
  const containedCropSize = cropImageSize
    ? getContainedSize(cropImageSize.width, cropImageSize.height)
    : null;
  const minCropZoom = containedCropSize
    ? Math.max(
        CROP_FRAME_SIZE / containedCropSize.width,
        CROP_FRAME_SIZE / containedCropSize.height,
      )
    : 1;
  const displayedCropWidth = containedCropSize ? containedCropSize.width * cropZoom : 0;
  const displayedCropHeight = containedCropSize ? containedCropSize.height * cropZoom : 0;
  const maxCropOffsetX = Math.max(0, (displayedCropWidth - CROP_FRAME_SIZE) / 2);
  const maxCropOffsetY = Math.max(0, (displayedCropHeight - CROP_FRAME_SIZE) / 2);
  const displayedCropX = (CROP_STAGE_WIDTH - displayedCropWidth) / 2 + cropOffsetX;
  const displayedCropY = (CROP_STAGE_HEIGHT - displayedCropHeight) / 2 + cropOffsetY;

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      if (cropSource) {
        URL.revokeObjectURL(cropSource.url);
      }
    };
  }, [cropSource, objectUrl]);

  function closeCropDialog() {
    if (cropSource) {
      URL.revokeObjectURL(cropSource.url);
    }

    setCropSource(null);
    setCropError(null);
    setCropImageSize(null);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      onValueChange(field.key, [savedUrl]);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setCropSource({ file, url: nextObjectUrl });
    setCropError(null);
    setCropImageSize(null);
    setCropZoom(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  }

  async function confirmCrop() {
    if (!cropSource || !inputRef.current) {
      return;
    }

    try {
      const croppedFile = await cropImageToSquare(
        cropSource.file,
        cropSource.url,
        cropZoom,
        cropOffsetX,
        cropOffsetY,
      );
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);
      inputRef.current.files = dataTransfer.files;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }

      const nextPreviewUrl = URL.createObjectURL(croppedFile);
      URL.revokeObjectURL(cropSource.url);
      setObjectUrl(nextPreviewUrl);
      setCropSource(null);
      setCropError(null);
      setSelectedFileName(croppedFile.name);
      onValueChange(field.key, [croppedFile.name]);
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Could not crop image.");
    }
  }

  return (
    <div className="block text-sm" key={field.key}>
      <span className="font-medium">
        {field.label}
        {field.required ? <span className="text-destructive"> *</span> : null}
      </span>

      <label
        className="mt-2 flex cursor-pointer justify-center rounded-md border border-border bg-muted p-3"
        htmlFor={`${field.key}-file`}
      >
        {previewUrl ? (
          <img
            alt="Current image preview"
            className="aspect-square w-full max-w-sm cursor-pointer rounded-md object-cover"
            src={previewUrl}
          />
        ) : (
          <div className="flex aspect-square w-full max-w-sm cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-background px-4 text-sm text-muted-foreground">
            Upload image
          </div>
        )}
      </label>

      <input name={field.key} type="hidden" value={savedUrl} />
      <input
        accept="image/*"
        className="sr-only"
        id={`${field.key}-file`}
        name={`${field.key}_file`}
        onChange={handleImageChange}
        ref={inputRef}
        required={field.required && !savedUrl}
        type="file"
      />
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <label
          className="inline-flex h-9 cursor-pointer items-center rounded-md bg-foreground px-3 text-sm font-medium text-background hover:bg-foreground/90"
          htmlFor={`${field.key}-file`}
        >
          Choose file
        </label>
        {selectedFileName ? (
          <span className="text-sm text-muted-foreground">{selectedFileName}</span>
        ) : null}
      </div>

      {cropSource ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-end bg-foreground/40 p-4 backdrop-blur-sm sm:items-center sm:justify-center"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-xl bg-background p-5 shadow-2xl">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-semibold">Crop image</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the image so it fits the square menu item format.
              </p>
            </div>

            <div className="mt-5 flex justify-center">
              <div
                className="relative overflow-hidden rounded-md border border-border bg-muted"
                style={{ height: CROP_STAGE_HEIGHT, maxWidth: "100%", width: CROP_STAGE_WIDTH }}
              >
                <img
                  alt="Crop preview"
                  className="absolute max-w-none select-none"
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    const nextImageSize = {
                      height: image.naturalHeight,
                      width: image.naturalWidth,
                    };
                    const nextContainedSize = getContainedSize(
                      nextImageSize.width,
                      nextImageSize.height,
                    );
                    const nextMinZoom = Math.max(
                      CROP_FRAME_SIZE / nextContainedSize.width,
                      CROP_FRAME_SIZE / nextContainedSize.height,
                    );

                    setCropImageSize(nextImageSize);
                    setCropZoom(Number(nextMinZoom.toFixed(2)));
                  }}
                  src={cropSource.url}
                  style={{
                    height: displayedCropHeight || "auto",
                    left: displayedCropX,
                    top: displayedCropY,
                    width: displayedCropWidth || "auto",
                  }}
                />
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                  style={{
                    height: CROP_FRAME_SIZE,
                    left: (CROP_STAGE_WIDTH - CROP_FRAME_SIZE) / 2,
                    top: (CROP_STAGE_HEIGHT - CROP_FRAME_SIZE) / 2,
                    width: CROP_FRAME_SIZE,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Zoom</span>
                <input
                  className="mt-2 w-full"
                  max={Math.max(3, minCropZoom + 2)}
                  min={minCropZoom}
                  onChange={(event) => {
                    const nextZoom = Number(event.target.value);
                    setCropZoom(nextZoom);
                    setCropOffsetX(0);
                    setCropOffsetY(0);
                  }}
                  step="0.05"
                  type="range"
                  value={cropZoom}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Horizontal position</span>
                <input
                  className="mt-2 w-full"
                  max={maxCropOffsetX}
                  min={-maxCropOffsetX}
                  onChange={(event) => setCropOffsetX(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={cropOffsetX}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Vertical position</span>
                <input
                  className="mt-2 w-full"
                  max={maxCropOffsetY}
                  min={-maxCropOffsetY}
                  onChange={(event) => setCropOffsetY(Number(event.target.value))}
                  step="1"
                  type="range"
                  value={cropOffsetY}
                />
              </label>
            </div>

            {cropError ? <p className="mt-4 text-sm text-destructive">{cropError}</p> : null}

            <div className="mt-5 flex justify-between border-t border-border pt-4">
              <Button onClick={closeCropDialog} type="button" variant="outline">
                Cancel
              </Button>
              <Button onClick={confirmCrop} type="button">
                Use cropped image
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {field.helpText ? (
        <span className="mt-1 block text-xs text-muted-foreground">{field.helpText}</span>
      ) : null}
    </div>
  );
}

function renderField(
  field: AdminField,
  record: AdminRecord | undefined,
  resourceSlug: string,
  imageValues: Record<string, string>,
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

  if (field.type === "image") {
    const savedUrl = imageValues[field.key] ?? defaultValue;

    return (
      <ImageUploadField
        field={field}
        key={`${field.key}-${savedUrl}`}
        onValueChange={onValueChange}
        savedUrl={savedUrl}
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

function FormSubmitButton({ disabled, mode }: { disabled: boolean; mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} size="sm" type="submit">
      {pending && <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />}
      {mode === "create" ? "Create" : "Save"}
    </Button>
  );
}

export function AdminRecordForm({
  action,
  canCreate = false,
  children,
  deleteAction,
  duplicateAction,
  fields,
  imageValues = {},
  mode,
  record,
  resource,
}: AdminRecordFormProps) {
  const formId = useId();
  const initialValues = useMemo(() => getInitialFieldValues(fields, record), [fields, record]);
  const [changedFields, setChangedFields] = useState<Record<string, boolean>>({});
  const hasChanges = Object.values(changedFields).some(Boolean);
  const [state, formAction] = useActionState<ActionState>(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Saved");
    }
  }, [state]);

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

    if (!field.name || field.name.endsWith("_file")) {
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

      <form
        action={formAction}
        className="w-full space-y-5"
        id={formId}
        onChange={handleFieldChange}
      >
        <div className="sticky top-14 z-20 flex items-center justify-between border-b border-border bg-background py-4 lg:top-0">
          <FormSubmitButton disabled={!hasChanges} mode={mode} />

          {mode === "edit" && (canCreate || duplicateAction || deleteAction) ? (
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
                ) : null}
                {duplicateAction ? (
                  <button
                    className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                    form={formId}
                    formAction={duplicateAction}
                    type="submit"
                  >
                    Duplicate
                  </button>
                ) : null}
                {deleteAction ? (
                  <button
                    className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
                    form={formId}
                    formAction={deleteAction}
                    type="submit"
                  >
                    Delete
                  </button>
                ) : null}
              </PopoverContent>
            </Popover>
          ) : null}
        </div>

        {fields.map((field) =>
          renderField(field, record, resource.slug, imageValues, updateChangedField),
        )}
        {children}
      </form>
    </div>
  );
}
