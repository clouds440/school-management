-- CreateEnum
CREATE TYPE "EnrollmentSource" AS ENUM ('MANUAL', 'COHORT');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "academicCycleId" TEXT;

-- AlterTable
ALTER TABLE "AttendanceSession" ADD COLUMN     "academicCycleId" TEXT;

-- AlterTable
ALTER TABLE "CourseMaterial" ADD COLUMN     "academicCycleId" TEXT;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "academicCycleId" TEXT,
ADD COLUMN     "isExcludedFromCohort" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "EnrollmentSource" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "academicCycleId" TEXT;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "academicCycleId" TEXT,
ADD COLUMN     "cohortId" TEXT;

-- AlterTable
ALTER TABLE "SectionSchedule" ADD COLUMN     "academicCycleId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "cohortId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "academicCycleId" TEXT;

-- CreateTable
CREATE TABLE "AcademicCycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "academicCycleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "academicCycleId" TEXT,
    "source" "EnrollmentSource" NOT NULL DEFAULT 'MANUAL',
    "wasExcluded" BOOLEAN NOT NULL DEFAULT false,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "EnrollmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortMembershipHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "academicCycleId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "CohortMembershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademicCycle_organizationId_idx" ON "AcademicCycle"("organizationId");

-- CreateIndex
CREATE INDEX "AcademicCycle_isActive_idx" ON "AcademicCycle"("isActive");

-- CreateIndex
CREATE INDEX "Cohort_organizationId_idx" ON "Cohort"("organizationId");

-- CreateIndex
CREATE INDEX "Cohort_academicCycleId_idx" ON "Cohort"("academicCycleId");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_studentId_idx" ON "EnrollmentHistory"("studentId");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_sectionId_idx" ON "EnrollmentHistory"("sectionId");

-- CreateIndex
CREATE INDEX "EnrollmentHistory_academicCycleId_idx" ON "EnrollmentHistory"("academicCycleId");

-- CreateIndex
CREATE INDEX "CohortMembershipHistory_studentId_idx" ON "CohortMembershipHistory"("studentId");

-- CreateIndex
CREATE INDEX "CohortMembershipHistory_cohortId_idx" ON "CohortMembershipHistory"("cohortId");

-- CreateIndex
CREATE INDEX "CohortMembershipHistory_academicCycleId_idx" ON "CohortMembershipHistory"("academicCycleId");

-- CreateIndex
CREATE INDEX "Assessment_academicCycleId_idx" ON "Assessment"("academicCycleId");

-- CreateIndex
CREATE INDEX "AttendanceSession_academicCycleId_idx" ON "AttendanceSession"("academicCycleId");

-- CreateIndex
CREATE INDEX "CourseMaterial_academicCycleId_idx" ON "CourseMaterial"("academicCycleId");

-- CreateIndex
CREATE INDEX "Enrollment_academicCycleId_idx" ON "Enrollment"("academicCycleId");

-- CreateIndex
CREATE INDEX "Grade_academicCycleId_idx" ON "Grade"("academicCycleId");

-- CreateIndex
CREATE INDEX "Section_academicCycleId_idx" ON "Section"("academicCycleId");

-- CreateIndex
CREATE INDEX "Section_cohortId_idx" ON "Section"("cohortId");

-- CreateIndex
CREATE INDEX "SectionSchedule_academicCycleId_idx" ON "SectionSchedule"("academicCycleId");

-- CreateIndex
CREATE INDEX "Student_cohortId_idx" ON "Student"("cohortId");

-- CreateIndex
CREATE INDEX "Submission_academicCycleId_idx" ON "Submission"("academicCycleId");

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSchedule" ADD CONSTRAINT "SectionSchedule_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMaterial" ADD CONSTRAINT "CourseMaterial_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicCycle" ADD CONSTRAINT "AcademicCycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentHistory" ADD CONSTRAINT "EnrollmentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentHistory" ADD CONSTRAINT "EnrollmentHistory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentHistory" ADD CONSTRAINT "EnrollmentHistory_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembershipHistory" ADD CONSTRAINT "CohortMembershipHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembershipHistory" ADD CONSTRAINT "CohortMembershipHistory_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortMembershipHistory" ADD CONSTRAINT "CohortMembershipHistory_academicCycleId_fkey" FOREIGN KEY ("academicCycleId") REFERENCES "AcademicCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
