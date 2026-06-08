import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminTopicsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading topic management...</CardTitle>
        </CardHeader>
      </Card>
    </main>
  );
}
