import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-md bg-muted" />
        <div className="h-8 w-72 rounded-md bg-muted" />
        <div className="h-4 w-full max-w-xl rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <Card key={item}>
            <CardHeader>
              <div className="h-5 w-40 rounded-md bg-muted" />
              <div className="h-4 w-24 rounded-md bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-16 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
