"use client";

import { useRef, useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { CirclePlus, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BatchStatus } from "@/generated/prisma/enums";
import { createBatchAction } from "@/features/batches/actions";
import { BatchForm } from "@/features/batches/components/batch-form";
import type { LookupOption } from "@/features/lookups/queries";

import { createTenureAction, updateTenureAction } from "../actions";
import type { TenureDto } from "../dto";
import { tenureClientSchema, type TenureClientFormValues } from "../schemas";

export interface BatchOption {
  id: number;
  name: string;
  status: BatchStatus;
}

const EMPTY_VALUES: TenureClientFormValues = {
  batchId: "",
  startDate: "",
  endDate: "",
  instituteId: "",
  degreeId: "",
  degreeStartDate: "",
  degreeEndDate: "",
  semester: "",
  grade: "",
  skills: "",
  miscCourses: "",
  skillsLearned: "",
  certStartDate: "",
  certEndDate: "",
  certIssueDate: "",
  score: "",
  comments: "",
};

function dtoToFormValues(tenure: TenureDto): TenureClientFormValues {
  return {
    batchId: String(tenure.batchId),
    startDate: tenure.startDate,
    endDate: tenure.endDate,
    instituteId: tenure.instituteId ? String(tenure.instituteId) : "",
    degreeId: tenure.degreeId ? String(tenure.degreeId) : "",
    degreeStartDate: tenure.degreeStartDate ?? "",
    degreeEndDate: tenure.degreeEndDate ?? "",
    semester: tenure.semester === null ? "" : String(tenure.semester),
    grade: tenure.grade ?? "",
    skills: tenure.skills ?? "",
    miscCourses: tenure.miscCourses ?? "",
    skillsLearned: tenure.skillsLearned ?? "",
    certStartDate: tenure.certStartDate ?? "",
    certEndDate: tenure.certEndDate ?? "",
    certIssueDate: tenure.certIssueDate ?? "",
    score: tenure.score === null ? "" : String(tenure.score),
    comments: tenure.comments ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

function DateField({
  form,
  name,
  label,
  disabled,
}: {
  form: UseFormReturn<TenureClientFormValues>;
  name: keyof TenureClientFormValues;
  label: string;
  disabled: boolean;
}) {
  const message = form.formState.errors[name]?.message;
  return (
    <div className="space-y-2">
      <Label htmlFor={`tenure-${name}`}>{label}</Label>
      <Input
        id={`tenure-${name}`}
        type="date"
        aria-invalid={Boolean(message)}
        disabled={disabled}
        className="[color-scheme:dark]"
        {...form.register(name)}
      />
      <FieldError message={message} />
    </div>
  );
}

function LookupSelect({
  form,
  name,
  label,
  options,
  disabled,
}: {
  form: UseFormReturn<TenureClientFormValues>;
  name: "instituteId" | "degreeId";
  label: string;
  options: LookupOption[];
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`tenure-${name}`}>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            items={{
              "": "Select",
              ...Object.fromEntries(options.map((o) => [String(o.id), o.name])),
            }}
            value={field.value}
            onValueChange={(value) => field.onChange(value === null ? "" : String(value))}
          >
            <SelectTrigger id={`tenure-${name}`} className="w-full" disabled={disabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Select</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function TenureForm({
  interneeId,
  tenure,
  batches,
  institutes,
  degrees,
  onDone,
}: {
  interneeId: number;
  /** Present when editing an existing tenure. */
  tenure?: TenureDto;
  batches: BatchOption[];
  institutes: LookupOption[];
  degrees: LookupOption[];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  // Batch created inline appears in the dropdown before router.refresh lands.
  const [extraBatch, setExtraBatch] = useState<BatchOption | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TenureClientFormValues>({
    resolver: zodResolver(tenureClientSchema),
    defaultValues: tenure ? dtoToFormValues(tenure) : EMPTY_VALUES,
  });
  const errors = form.formState.errors;

  const batchOptions: BatchOption[] =
    extraBatch && !batches.some((b) => b.id === extraBatch.id)
      ? [extraBatch, ...batches]
      : batches;

  const onSubmit = (values: TenureClientFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.append(key, value);
      }
      if (certFile) formData.append("certFile", certFile);

      const result = tenure
        ? await updateTenureAction(tenure.id, formData)
        : await createTenureAction(interneeId, formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(tenure ? "Tenure updated" : "Tenure added");
      form.reset(EMPTY_VALUES);
      setCertFile(null);
      router.refresh();
      onDone?.();
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tenure-batchId">Select Batch</Label>
          <div className="flex items-center gap-2">
            <Controller
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <Select
                  items={{
                    "": "Select",
                    ...Object.fromEntries(
                      batchOptions.map((b) => [String(b.id), b.name]),
                    ),
                  }}
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value === null ? "" : String(value))
                  }
                >
                  <SelectTrigger
                    id="tenure-batchId"
                    className="w-full"
                    disabled={isPending}
                    aria-invalid={Boolean(errors.batchId)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Select</SelectItem>
                    {batchOptions.map((batch) => (
                      <SelectItem key={batch.id} value={String(batch.id)}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Create a new batch"
                    className="shrink-0 text-primary"
                  >
                    <CirclePlus />
                  </Button>
                }
              />
              <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create Batch</DialogTitle>
                </DialogHeader>
                <BatchForm
                  onSubmitAction={createBatchAction}
                  onSuccess={(id, name) => {
                    if (id) {
                      form.setValue("batchId", String(id), { shouldValidate: true });
                      setExtraBatch({ id, name: name ?? "New batch", status: "UPCOMING" });
                    }
                    setBatchDialogOpen(false);
                    router.refresh();
                  }}
                  onCancel={() => setBatchDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <FieldError message={errors.batchId?.message} />
        </div>
        <DateField form={form} name="startDate" label="Start Date" disabled={isPending} />
        <DateField form={form} name="endDate" label="End Date" disabled={isPending} />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <LookupSelect
          form={form}
          name="instituteId"
          label="Select Institute"
          options={institutes}
          disabled={isPending}
        />
        <LookupSelect
          form={form}
          name="degreeId"
          label="Select Degree"
          options={degrees}
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DateField
          form={form}
          name="degreeStartDate"
          label="Degree Start Date"
          disabled={isPending}
        />
        <DateField
          form={form}
          name="degreeEndDate"
          label="Degree End Date"
          disabled={isPending}
        />
        <div className="space-y-2">
          <Label htmlFor="tenure-semester">Degree Semester</Label>
          <Input
            id="tenure-semester"
            inputMode="numeric"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.semester)}
            disabled={isPending}
            {...form.register("semester")}
          />
          <FieldError message={errors.semester?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenure-grade">Degree Grade</Label>
          <Input
            id="tenure-grade"
            placeholder="A+"
            aria-invalid={Boolean(errors.grade)}
            disabled={isPending}
            {...form.register("grade")}
          />
          <FieldError message={errors.grade?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(
          [
            { name: "skills", label: "Skills" },
            { name: "miscCourses", label: "Misc Courses" },
            { name: "skillsLearned", label: "Skills Learned" },
          ] as const
        ).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`tenure-${field.name}`}>{field.label}</Label>
            <Textarea
              id={`tenure-${field.name}`}
              placeholder="Enter here"
              rows={4}
              disabled={isPending}
              {...form.register(field.name)}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DateField
          form={form}
          name="certStartDate"
          label="Cert Start Date"
          disabled={isPending}
        />
        <DateField form={form} name="certEndDate" label="Cert End Date" disabled={isPending} />
        <DateField
          form={form}
          name="certIssueDate"
          label="Cert Issue Date"
          disabled={isPending}
        />
        <div className="space-y-2">
          <Label htmlFor="tenure-score">Score</Label>
          <Input
            id="tenure-score"
            inputMode="decimal"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.score)}
            disabled={isPending}
            {...form.register("score")}
          />
          <FieldError message={errors.score?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Upload Cert</Label>
          <button
            type="button"
            onClick={() => certInputRef.current?.click()}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-secondary/60 bg-input/20 px-4 py-4 text-left transition-colors hover:border-secondary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
              {certFile || tenure?.certFilePath ? (
                <FileText className="size-4" />
              ) : (
                <Upload className="size-4" />
              )}
            </span>
            <span className="text-sm">
              {certFile ? (
                certFile.name
              ) : tenure?.certFilePath ? (
                "Certificate uploaded — click to replace"
              ) : (
                <>
                  <span className="text-secondary">Choose file</span> to upload
                  <span className="block text-xs text-muted-foreground">
                    Supported formats: jpeg, pdf
                  </span>
                </>
              )}
            </span>
          </button>
          <input
            ref={certInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenure-comments">Comments</Label>
          <Textarea
            id="tenure-comments"
            placeholder="Enter here"
            rows={4}
            disabled={isPending}
            {...form.register("comments")}
          />
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-6"
          disabled={isPending}
          onClick={() => {
            form.reset(EMPTY_VALUES);
            setCertFile(null);
            onDone?.();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-10 px-8" disabled={isPending}>
          {isPending ? "Saving…" : tenure ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}
