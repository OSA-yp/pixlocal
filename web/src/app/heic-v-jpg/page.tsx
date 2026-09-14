import type { Metadata } from "next";
import { ToolPage } from "@/components/ToolPage";
import { pageMeta, toolDefs } from "@/lib/tools";

const def = toolDefs["heic-v-jpg"];

export const metadata: Metadata = pageMeta(def);

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
