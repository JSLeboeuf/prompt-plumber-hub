import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  HelpCircle,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Mic,
  Send,
  Bot,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock support data
const supportData = {
  quickActions: [
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
      action: () => console.log("Open chatbot")
    },
    {
      icon: Mail,
      title: "Email support",
      description: "support@drainfortin.com",
      subtitle: "Réponse sous 2h",
      urgent: false,
      action: () => window.open("mailto:support@drainfortin.com")
    }
  ],
  faq: [
    {
      question: "Comment planifier une intervention d'urgence ?",
      reponse: "Utilisez le bouton 'Nouveau Call' dans la file d'appels, sélectionnez la priorité P1 et assignez immédiatement un technicien disponible."
    },
    {
      question: "Comment exporter les données clients pour la comptabilité ?",
      reponse: "Dans la section Analytics, cliquez sur 'Exporter CSV' puis sélectionnez la période souhaitée. Le fichier inclut toutes les interventions facturées."
    },
    {
      question: "Que faire si un client n'est pas satisfait ?",
      reponse: "Créez immédiatement un ticket de suivi dans le CRM, planifiez un rappel et, si nécessaire, une intervention corrective gratuite."
    }
  ],
  tickets: [
    {
      id: "T-2025-001",
      titre: "Problème synchronisation mobile",
      statut: "ouvert", 
      priorite: "normal",
      dateCreation: "2025-09-26",
      description: "L'application mobile ne synchronise pas les nouvelles interventions"
    },
    {
      id: "T-2025-002", 
      titre: "Export PDF ne fonctionne pas",
      statut: "resolu",
      priorite: "faible",
      dateCreation: "2025-09-25", 
      description: "Erreur lors de la génération des rapports PDF"
    }
  ]
};

export default function Support() {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", content: "Bonjour ! Je suis l'assistant Drain Fortin. Comment puis-je vous aider ?" },
  ]);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'ouvert': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200'; 
      case 'resolu': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'faible': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    
    setChatMessages(prev => [...prev, 
      { type: "user", content: message },
      { type: "bot", content: "Merci pour votre message. Un agent va vous répondre sous peu. Pour des urgences, utilisez le numéro d'appel direct." }
    ]);
    setMessage("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Support & Aide
          </h1>
          <p className="subtitle text-muted-foreground">
            Centre d'aide et support technique Drain Fortin
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Nouveau Ticket
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {supportData.quickActions.map((action, index) => {
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

      {/* Main Support Tabs */}
      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Assistant IA Drain Fortin
              </CardTitle>
              <p className="caption text-muted-foreground">
                Support vocal et textuel alimenté par VAPI et IA conversationnelle
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Chat Messages */}
                <div className="bg-surface rounded-lg p-4 h-64 overflow-y-auto space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-white border'
                      }`}>
                        {msg.type === 'bot' && (
                          <div className="flex items-center gap-2 mb-1">
                            <Bot className="h-4 w-4" />
                            <span className="text-xs font-medium">Assistant IA</span>
                          </div>
                        )}
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez votre question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button size="sm" variant="outline">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    Intégration VAPI pour support vocal intelligent
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md">Questions Fréquentes</CardTitle>
              <p className="caption text-muted-foreground">
                Solutions aux problèmes les plus courants
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportData.faq.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-primary" />
                      {item.question}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.reponse}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="title-md">Mes Tickets de Support</CardTitle>
                <p className="caption text-muted-foreground">
                  Suivi de vos demandes de support technique
                </p>
              </div>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Nouveau Ticket
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportData.tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{ticket.id}</span>
                          <Badge className={`border text-xs ${getStatusColor(ticket.statut)}`}>
                            {ticket.statut}
                          </Badge>
                          <Badge className={`border text-xs ${getPriorityColor(ticket.priorite)}`}>
                            {ticket.priorite}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{ticket.titre}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{ticket.dateCreation}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                      {ticket.statut !== 'resolu' && (
                        <Button size="sm" variant="ghost">
                          Ajouter commentaire
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="title-md">Formulaire de Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <label className="label block mb-2">Sujet</label>
                    <Input placeholder="Décrivez brièvement votre demande..." />
                  </div>
                  <div>
                    <label className="label block mb-2">Priorité</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="faible">Faible</option>
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="label block mb-2">Message détaillé</label>
                    <Textarea 
                      placeholder="Décrivez votre problème ou question en détail..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la demande
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="title-md">Informations de Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Urgences 24/7</div>
                    <div className="text-sm text-muted-foreground">+1 438 601 2625</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-muted-foreground">support@drainfortin.com</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Heures d'ouverture</div>
                    <div className="text-sm text-muted-foreground">Lun-Dim: 24h/24</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Temps de réponse</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Urgence
                      </span>
                      <span>Immédiat</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        Normal
                      </span>
                      <span>2 heures</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Faible
                      </span>
                      <span>24 heures</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}