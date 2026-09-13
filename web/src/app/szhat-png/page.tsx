import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { toolDefs } from "@/lib/tools";

const def = toolDefs["szhat-png"];

export const metadata: Metadata = {
  title: def.title,
  description: def.description,
  alternates: { canonical: def.path },
};

export default function Page() {
  return (
    <ToolPage
      path={def.path}
      h1={def.h1}
      lead={def.lead}
      body={def.body}
      faq={def.faq}
      preset={def.preset}
    />
  );
}
