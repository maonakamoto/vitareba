import { NextIntlClientProvider } from "next-intl";
import enMessages from "@/messages/en.json";

// Portal has no locale routing — supply English messages so the Assessment
// component's useMessages() calls resolve when taken from the patient portal.
export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
