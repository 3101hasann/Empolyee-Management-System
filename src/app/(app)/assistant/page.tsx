import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { AssistantChat } from "@/features/assistant/components/assistant-chat";

export const metadata: Metadata = {
  title: "Assistant",
};

export default function AssistantPage() {
  return (
    // Pinned to the viewport (minus the layout's p-6/lg:p-8) so the message
    // list scrolls inside the card and the composer never leaves the screen.
    <div className="flex h-[calc(100svh-3rem)] min-h-[480px] flex-col gap-6 lg:h-[calc(100svh-4rem)]">
      <PageHeader
        title="Assistant"
        subtitle="Everyday queries and actions, in plain English"
      />
      <AssistantChat />
    </div>
  );
}
