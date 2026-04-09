import { Suspense } from "react";
import StaffNewRecordClient from "./pageClient";

export const dynamic = "force-dynamic";

export default function StaffNewRecordPage() {
  return (
    <Suspense>
      <StaffNewRecordClient />
    </Suspense>
  );
}
