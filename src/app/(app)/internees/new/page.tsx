import type { Metadata } from "next";

import { CircleUser, GraduationCap } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createInterneeAction } from "@/features/internees/actions";
import { PersonalInfoForm } from "@/features/internees/components/personal-info-form";
import { getCities } from "@/features/lookups/queries";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Create Internee",
};

export default async function CreateInterneePage() {
  await requirePermission("internee:create");
  const cities = await getCities();

  return (
    <div className="space-y-6">
      <PageHeader title="Create Internee" subtitle="Internees List > Create New Internee" />
      <div className="rounded-xl bg-card p-6">
        <Tabs defaultValue="personal">
          <TabsList className="mx-auto mb-6">
            <TabsTrigger value="personal">
              <CircleUser data-icon="inline-start" />
              Personal Info
            </TabsTrigger>
            {/* Tenure needs the internee to exist first — Save & Next unlocks it. */}
            <TabsTrigger value="tenure" disabled>
              <GraduationCap data-icon="inline-start" />
              Tenure Info
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <PersonalInfoForm mode="create" cities={cities} action={createInterneeAction} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
