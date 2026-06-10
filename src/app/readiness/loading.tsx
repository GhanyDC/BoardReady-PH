import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReadinessLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <section className="space-y-3">
        <div className="h-4 w-24 rounded-md bg-muted" />
        <div className="h-8 w-64 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-lg rounded-md bg-muted" />
        <div className="h-4 w-80 rounded-md bg-muted" />
      </section>

      {/* Overall score card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-40 rounded-md bg-muted" />
              <div className="h-4 w-64 rounded-md bg-muted" />
            </div>
            <div className="h-7 w-24 rounded-full bg-muted" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-32 rounded-md bg-muted" />
          <div className="h-3 w-full rounded-full bg-muted" />
          <div className="h-4 w-48 rounded-md bg-muted" />
        </CardContent>
      </Card>

      {/* Component cards */}
      <section className="space-y-3">
        <div className="h-6 w-48 rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardHeader>
                <div className="h-5 w-36 rounded-md bg-muted" />
                <div className="h-4 w-20 rounded-md bg-muted" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-8 w-24 rounded-md bg-muted" />
                <div className="h-3 w-full rounded-full bg-muted" />
                <div className="h-4 w-40 rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Subject breakdown */}
      <section className="space-y-3">
        <div className="h-6 w-56 rounded-md bg-muted" />
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className="flex items-center gap-4">
                  <div className="h-4 w-40 rounded-md bg-muted" />
                  <div className="h-4 w-16 rounded-md bg-muted" />
                  <div className="h-4 w-16 rounded-md bg-muted" />
                  <div className="h-4 w-16 rounded-md bg-muted" />
                  <div className="ml-auto h-6 w-20 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recommendations */}
      <section className="space-y-3">
        <div className="h-6 w-48 rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2].map((item) => (
            <Card key={item}>
              <CardHeader>
                <div className="h-5 w-48 rounded-md bg-muted" />
                <div className="h-4 w-20 rounded-md bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
