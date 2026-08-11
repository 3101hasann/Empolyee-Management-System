"use client";

import { useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "@/lib/utils/weekdays";

import type { ActionResult } from "../actions";
import { batchFormSchema, type BatchFormInput } from "../schemas";

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
] as const;

const EMPTY_VALUES: BatchFormInput = {
  name: "",
  status: "UPCOMING",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  daysOfWeek: [],
  roadmap: "",
  comments: "",
};

export function BatchForm({
  defaultValues,
  submitLabel = "Save",
  onSubmitAction,
  onSuccess,
  onCancel,
}: {
  defaultValues?: BatchFormInput;
  submitLabel?: string;
  onSubmitAction: (input: BatchFormInput) => Promise<ActionResult>;
  /** Defaults to navigating back to /batches; the inline modal overrides both. */
  onSuccess?: (id: number | undefined, name?: string) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<BatchFormInput>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });
  const errors = form.formState.errors;

  const onSubmit = (values: BatchFormInput) => {
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result.ok) {
        toast.success("Batch saved");
        if (onSuccess) {
          onSuccess(result.id, values.name);
        } else {
          router.push("/batches");
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-3">
          <Label htmlFor="batch-name">Batch Name</Label>
          <Input
            id="batch-name"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.name)}
            disabled={isPending}
            {...form.register("name")}
          />
          {errors.name ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch-status">Select Status</Label>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Select
                items={Object.fromEntries(
                  STATUS_OPTIONS.map((option) => [option.value, option.label]),
                )}
                value={field.value}
                onValueChange={(value) => value !== null && field.onChange(value)}
              >
                <SelectTrigger id="batch-status" className="w-full" disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { name: "startDate", label: "Start Date", type: "date" },
            { name: "endDate", label: "End Date", type: "date" },
            { name: "startTime", label: "Start Time", type: "time" },
            { name: "endTime", label: "End Time", type: "time" },
          ] as const
        ).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={`batch-${field.name}`}>{field.label}</Label>
            <Input
              id={`batch-${field.name}`}
              type={field.type}
              aria-invalid={Boolean(errors[field.name])}
              disabled={isPending}
              className="[color-scheme:dark]"
              {...form.register(field.name)}
            />
            {errors[field.name] ? (
              <p role="alert" className="text-sm text-destructive">
                {errors[field.name]?.message}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Days Of Week</Label>
        <Controller
          control={form.control}
          name="daysOfWeek"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Days of week">
              {WEEKDAYS.map((day) => {
                const selected = field.value.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    aria-pressed={selected}
                    disabled={isPending}
                    onClick={() =>
                      field.onChange(
                        selected
                          ? field.value.filter((key) => key !== day.key)
                          : [...field.value, day.key],
                      )
                    }
                    className={cn(
                      "rounded-lg border border-input px-3 py-2 text-sm transition-colors",
                      selected
                        ? "border-primary bg-primary/15 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.daysOfWeek ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.daysOfWeek.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="batch-roadmap">Roadmap</Label>
          <Textarea
            id="batch-roadmap"
            placeholder="Enter here"
            rows={6}
            disabled={isPending}
            {...form.register("roadmap")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batch-comments">Comments</Label>
          <Textarea
            id="batch-comments"
            placeholder="Enter here"
            rows={6}
            disabled={isPending}
            {...form.register("comments")}
          />
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-6"
          disabled={isPending}
          onClick={() => (onCancel ? onCancel() : router.push("/batches"))}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-10 px-8" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
