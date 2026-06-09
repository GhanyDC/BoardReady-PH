import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExternalDrillDetailLoading() {
  return (
    <div className="space-y-8">
      <section>
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-9 w-full max-w-lg rounded bg-muted" />
        <div className="mt-3 h-5 w-full max-w-md rounded bg-muted" />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
