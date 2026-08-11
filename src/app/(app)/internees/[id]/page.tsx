import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CircleUser, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getBatchOptions } from "@/features/batches/queries";
import { updateInterneeAction } from "@/features/internees/actions";
import { PersonalInfoForm } from "@/features/internees/components/personal-info-form";
import { getInterneeById } from "@/features/internees/queries";
import type { InterneePersonalFormValues } from "@/features/internees/schemas";
import { getCities, getDegrees, getInstitutes } from "@/features/lookups/queries";
import { toTenureDto } from "@/features/tenures/dto";
import { TenureSection } from "@/features/tenures/components/tenure-section";

export const metadata: Metadata = {
  title: "Internee",
};

export default async function InterneeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id: idParam }, search] = await Promise.all([params, searchParams]);
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const internee = await getInterneeById(id);
  if (!internee) notFound();

  const [cities, institutes, degrees, batches] = await Promise.all([
    getCities(),
    getInstitutes(),
    getDegrees(),
    getBatchOptions(),
  ]);

  const fullName = `${internee.person.firstName} ${internee.person.lastName}`;
  const defaultTab = search.tab === "tenure" ? "tenure" : "personal";

  const personalDefaults: InterneePersonalFormValues = {
    firstName: internee.person.firstName,
    lastName: internee.person.lastName,
    // DB-nullable for system humans only; internees always have these set.
    gender:
      internee.person.gender ??
      (undefined as unknown as InterneePersonalFormValues["gender"]),
    cityId: internee.person.cityId ? String(internee.person.cityId) : "",
    email: internee.person.email,
    phone: internee.person.phone ?? "",
    referredBy: internee.referredBy ?? "",
    fatherName: internee.fatherName ?? "",
    guardianPhone: internee.guardianPhone ?? "",
  };

  const boundUpdate = updateInterneeAction.bind(null, internee.id);

  return (
    <div className="space-y-6">
      <PageHeader title={fullName} subtitle={`Internees List > ${fullName}`} />
      <div className="rounded-xl bg-card p-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="personal">
              <CircleUser data-icon="inline-start" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="tenure">
              <GraduationCap data-icon="inline-start" />
              Tenure Info
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <PersonalInfoForm
              mode="edit"
              defaultValues={personalDefaults}
              existingProfileImagePath={internee.person.profileImagePath}
              existingCvPath={internee.person.cvFilePath}
              cities={cities}
              action={boundUpdate}
            />
          </TabsContent>
          <TabsContent value="tenure">
            <TenureSection
              interneeId={internee.id}
              tenures={internee.tenures.map(toTenureDto)}
              batches={batches}
              institutes={institutes}
              degrees={degrees}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
