import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6">
      <h2 className="text-6xl font-bold text-blue-600 mb-2">404</h2>
      <h3 className="text-2xl font-bold text-slate-900">Page Not Found</h3>
      <p className="text-slate-600 max-w-md mb-6">
        We couldn't find the page you were looking for. It might have been moved or doesn't exist.
      </p>
      <Link href="/login" passHref>
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
}
