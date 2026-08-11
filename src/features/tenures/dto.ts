import type { BatchStatus } from "@/generated/prisma/enums";
import type { InterneeDetail } from "@/features/internees/queries";
import { toDateInputValue } from "@/lib/utils/format";

/**
 * Client-safe tenure shape: Dates become "YYYY-MM-DD" strings and the Prisma
 * Decimal score becomes a number (Decimal instances don't cross the RSC
 * serialization boundary).
 */
export interface TenureDto {
  id: number;
  batchId: number;
  batchName: string;
  batchStatus: BatchStatus;
  startDate: string;
  endDate: string;
  instituteId: number | null;
  instituteName: string | null;
  degreeId: number | null;
  degreeName: string | null;
  degreeStartDate: string | null;
  degreeEndDate: string | null;
  semester: number | null;
  grade: string | null;
  skills: string | null;
  miscCourses: string | null;
  skillsLearned: string | null;
  certStartDate: string | null;
  certEndDate: string | null;
  certIssueDate: string | null;
  score: number | null;
  certFilePath: string | null;
  comments: string | null;
}

export function toTenureDto(tenure: InterneeDetail["tenures"][number]): TenureDto {
  return {
    id: tenure.id,
    batchId: tenure.batchId,
    batchName: tenure.batch.name,
    batchStatus: tenure.batch.status,
    startDate: toDateInputValue(tenure.startDate),
    endDate: toDateInputValue(tenure.endDate),
    instituteId: tenure.instituteId,
    instituteName: tenure.institute?.name ?? null,
    degreeId: tenure.degreeId,
    degreeName: tenure.degree?.name ?? null,
    degreeStartDate: tenure.degreeStartDate ? toDateInputValue(tenure.degreeStartDate) : null,
    degreeEndDate: tenure.degreeEndDate ? toDateInputValue(tenure.degreeEndDate) : null,
    semester: tenure.semester,
    grade: tenure.grade,
    skills: tenure.skills,
    miscCourses: tenure.miscCourses,
    skillsLearned: tenure.skillsLearned,
    certStartDate: tenure.certStartDate ? toDateInputValue(tenure.certStartDate) : null,
    certEndDate: tenure.certEndDate ? toDateInputValue(tenure.certEndDate) : null,
    certIssueDate: tenure.certIssueDate ? toDateInputValue(tenure.certIssueDate) : null,
    score: tenure.score === null ? null : Number(tenure.score),
    certFilePath: tenure.certFilePath,
    comments: tenure.comments,
  };
}
