import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, Mail } from 'lucide-react';

const quickActions = [
  {
    icon: Phone,
    title: "Appel d'urgence",
    description: "+1 438 601 2625",
    subtitle: "Disponible 24/7",
    urgent: true,
    action: () => window.open("tel:+14386012625")
  },
  {
    icon: MessageCircle,
    title: "Chatbot IA",
    description: "Assistant intelligent",
    subtitle: "Réponse immédiate",
    urgent: false,
    action: () => {},
  },
  {
    icon: Mail,
    title: "Email support",
    description: "support@drainfortin.com",
    subtitle: "Réponse sous 2h",
    urgent: false,
    action: () => window.open("mailto:support@drainfortin.com")
  }
];

export const QuickActionCards = () => {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Card
            key={index}
            className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
              action.urgent ? 'border-red-200 bg-red-50' : ''
            }`}
            onClick={action.action}
          >
            <CardContent className="p-6 text-center">
              <div className={`inline-flex p-4 rounded-full mb-4 ${
                action.urgent ? 'bg-red-100' : 'bg-primary'
              }`}>
                <Icon className={`h-8 w-8 ${
                  action.urgent ? 'text-red-600' : 'text-primary-foreground'
                }`} />
              </div>
              <h3 className="title-md mb-2">{action.title}</h3>
              <p className="body font-medium mb-1">{action.description}</p>
              <p className="caption text-muted-foreground">{action.subtitle}</p>
              {action.urgent && (
                <Badge className="mt-3 bg-red-100 text-red-800 border-red-200">
                  Urgence 24/7
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};