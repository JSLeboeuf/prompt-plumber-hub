import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <h1 className="title-xl">Paramètres</h1>
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="body text-muted-foreground">
            Page de paramètres en cours de préparation. Revenez bientôt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
