import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import SubmissionWizard from "./SubmissionWizard";

export const metadata: Metadata = { title: "New Submission" };

export default function NewSubmissionPage() {
  return (
    <>
      <PageTitle
        title="New Manuscript Submission"
        subtitle="Five steps: metadata, authors, cover letter, files, and confirmation. Fields marked * are required."
      />
      <SubmissionWizard />
    </>
  );
}
