import React from "react";
import KnowledgeBaseTable from "@/app/components/KnowledgeBase";
import { siteConfig } from "../../utils/config";

// Just add this to the top of your other pages!
export const metadata = {
  title: "Knowledge Base",
  description: "Access our comprehensive knowledge base for help and support.",
  alternates: {
    canonical: "/knowledge", // This solves Item #8 for this page!
  },
};
export default function page() {
  return (
    <div>
      <KnowledgeBaseTable />
    </div>
  );
}
