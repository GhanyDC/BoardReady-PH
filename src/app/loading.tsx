import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-muted rounded"></div>
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded mt-2"></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-5 w-5 bg-muted rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded"></div>
              <div className="mt-2 h-4 w-32 bg-muted rounded"></div>
              <div className="mt-4 h-2 w-full bg-muted rounded-full"></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2 w-full max-w-[300px]">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
          </div>
          <div className="h-10 w-10 bg-muted rounded-md"></div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border px-3 py-3 space-y-2">
                <div className="h-8 w-16 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
