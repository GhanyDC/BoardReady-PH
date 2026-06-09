import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExternalDrillsLoading() {
  return (
    <div className="space-y-8">
      <section>
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-9 w-full max-w-md rounded bg-muted" />
        <div className="mt-3 h-5 w-full max-w-xl rounded bg-muted" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Loading external drills...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="h-10 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
            <div className="h-24 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
