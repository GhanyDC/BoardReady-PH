import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PageLoadingProps = {
  titleWidth?: string;
  cardCount?: number;
};

export function PageLoading({
  titleWidth = "w-72",
  cardCount = 4,
}: PageLoadingProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="h-4 w-28 rounded-md bg-muted" />
        <div className={`h-8 ${titleWidth} max-w-full rounded-md bg-muted`} />
        <div className="h-4 w-full max-w-xl rounded-md bg-muted" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cardCount }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-5 w-36 rounded-md bg-muted" />
              <div className="h-4 w-24 rounded-md bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 w-28 rounded-md bg-muted" />
              <div className="h-3 w-full rounded-full bg-muted" />
              <div className="h-4 w-40 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <div className="h-5 w-44 rounded-md bg-muted" />
          <div className="h-4 w-64 max-w-full rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-12 rounded-md bg-muted" />
          <div className="h-12 rounded-md bg-muted" />
          <div className="h-12 rounded-md bg-muted" />
        </CardContent>
      </Card>
    </div>
  );
}
