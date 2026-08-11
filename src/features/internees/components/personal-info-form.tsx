"use client";

import { useRef, useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Upload, UserRound } from "lucide-react";
import Image from "next/image";
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
import type { Gender } from "@/generated/prisma/enums";
import type { LookupOption } from "@/features/lookups/queries";

import type { ActionResult } from "../actions";
import {
  interneePersonalClientSchema,
  type InterneePersonalFormValues,
} from "../schemas";

const GENDER_ITEMS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

const EMPTY_VALUES: InterneePersonalFormValues = {
  firstName: "",
  lastName: "",
  gender: undefined as unknown as Gender,
  cityId: "",
  email: "",
  phone: "",
  referredBy: "",
  fatherName: "",
  guardianPhone: "",
};

export function PersonalInfoForm({
  mode,
  defaultValues,
  existingProfileImagePath,
  existingCvPath,
  cities,
  action,
}: {
  mode: "create" | "edit";
  defaultValues?: InterneePersonalFormValues;
  existingProfileImagePath?: string | null;
  existingCvPath?: string | null;
  cities: LookupOption[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InterneePersonalFormValues>({
    resolver: zodResolver(interneePersonalClientSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });
  const errors = form.formState.errors;

  const onProfileChange = (file: File | null) => {
    setProfileFile(file);
    setProfilePreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const onSubmit = (values: InterneePersonalFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.append(key, value ?? "");
      }
      if (profileFile) formData.append("profileImage", profileFile);
      if (cvFile) formData.append("cv", cvFile);

      const result = await action(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (mode === "create") {
        toast.success("Internee saved — now add their tenure");
        router.push(`/internees/${result.id}?tab=tenure`);
      } else {
        toast.success("Internee saved");
        router.refresh();
      }
    });
  };

  const profileSrc =
    profilePreview ??
    (existingProfileImagePath ? `/api/files/${existingProfileImagePath}` : null);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Uploads row, per the Figma step-1 header. */}
      <div className="flex flex-wrap items-start gap-8">
        <div className="space-y-2">
          <Label>Profile Pic</Label>
          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            disabled={isPending}
            aria-label="Upload profile picture"
            className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-input bg-input/20 transition-colors hover:border-secondary"
          >
            {profileSrc ? (
              <Image
                src={profileSrc}
                alt="Profile preview"
                fill
                sizes="80px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <UserRound className="size-7 text-muted-foreground" />
            )}
          </button>
          <input
            ref={profileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onProfileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="min-w-64 flex-1 space-y-2 sm:max-w-md">
          <Label>Upload CV</Label>
          <button
            type="button"
            onClick={() => cvInputRef.current?.click()}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-secondary/60 bg-input/20 px-4 py-4 text-left transition-colors hover:border-secondary"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
              {cvFile || existingCvPath ? (
                <FileText className="size-4" />
              ) : (
                <Upload className="size-4" />
              )}
            </span>
            <span className="text-sm">
              {cvFile ? (
                cvFile.name
              ) : existingCvPath ? (
                "CV uploaded — click to replace"
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
            ref={cvInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.firstName)}
            disabled={isPending}
            {...form.register("firstName")}
          />
          {errors.firstName ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.firstName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.lastName)}
            disabled={isPending}
            {...form.register("lastName")}
          />
          {errors.lastName ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.lastName.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select
                items={GENDER_ITEMS}
                value={field.value ?? null}
                onValueChange={(value) => value !== null && field.onChange(value)}
              >
                <SelectTrigger
                  id="gender"
                  className="w-full"
                  disabled={isPending}
                  aria-invalid={Boolean(errors.gender)}
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_ITEMS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.gender ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.gender.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cityId">City</Label>
          <Controller
            control={form.control}
            name="cityId"
            render={({ field }) => (
              <Select
                items={{
                  "": "Select",
                  ...Object.fromEntries(cities.map((c) => [String(c.id), c.name])),
                }}
                value={field.value}
                onValueChange={(value) => field.onChange(value === null ? "" : String(value))}
              >
                <SelectTrigger id="cityId" className="w-full" disabled={isPending}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter here"
            aria-invalid={Boolean(errors.email)}
            disabled={isPending}
            {...form.register("email")}
          />
          {errors.email ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+92 300 1234567"
            aria-invalid={Boolean(errors.phone)}
            disabled={isPending}
            {...form.register("phone")}
          />
          {errors.phone ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.phone.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="referredBy">Referred By</Label>
          <Input
            id="referredBy"
            placeholder="Enter here"
            disabled={isPending}
            {...form.register("referredBy")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fatherName">Father Name</Label>
          <Input
            id="fatherName"
            placeholder="Enter here"
            disabled={isPending}
            {...form.register("fatherName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardianPhone">Guardian Phone</Label>
          <Input
            id="guardianPhone"
            placeholder="+92 300 1234567"
            aria-invalid={Boolean(errors.guardianPhone)}
            disabled={isPending}
            {...form.register("guardianPhone")}
          />
          {errors.guardianPhone ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.guardianPhone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="h-10 px-6"
          disabled={isPending}
          onClick={() => router.push("/internees")}
        >
          Cancel
        </Button>
        <Button type="submit" className="h-10 px-8" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Save & Next" : "Save"}
        </Button>
      </div>
    </form>
  );
}
