import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ContactFormProps {
  subject: string;
  priority: string;
  detailedMessage: string;
  onSubjectChange: (subject: string) => void;
  onPriorityChange: (priority: string) => void;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
}

export const ContactForm = ({
  subject,
  priority,
  detailedMessage,
  onSubjectChange,
  onPriorityChange,
  onMessageChange,
  onSubmit
}: ContactFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="title-md">Formulaire de Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="label block mb-2">Sujet *</label>
            <Input
              placeholder="Décrivez brièvement votre demande..."
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label block mb-2">Priorité</label>
            <select
              className="w-full p-2 border rounded-md"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
            >
              <option value="faible">Faible</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label block mb-2">Message détaillé *</label>
            <Textarea
              placeholder="Décrivez votre problème ou question en détail..."
              className="min-h-[120px]"
              value={detailedMessage}
              onChange={(e) => onMessageChange(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={onSubmit}>
            <Send className="h-4 w-4 mr-2" />
            Envoyer la demande
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};