import { useState, useEffect } from "react";
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
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

interface SupportTicket {
  id: string;
  titre: string;
  statut: 'ouvert' | 'en_cours' | 'resolu';
  priorite: 'urgent' | 'normal' | 'faible';
  description: string;
  created_at: string;
  updated_at: string;
}

interface FAQItem {
  id: string;
  question: string;
  reponse: string;
  category: string;
}

export default function Support() {
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", content: "Bonjour ! Je suis l'assistant Drain Fortin. Comment puis-je vous aider ?" },
  ]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("normal");
  const [detailedMessage, setDetailedMessage] = useState("");
  const { success, error } = useToast();

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      setLoading(true);

      // Tables support non configurées - affichage état vide
       
      setTickets([]);
      setFaqItems([]);

    } catch (err) {
      console.error('Erreur lors du chargement des données support:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setChatMessages(prev => [...prev, 
      { type: "user", content: message },
      { type: "bot", content: "Merci pour votre message. Un agent va vous répondre sous peu. Pour des urgences, utilisez le numéro d'appel direct." }
    ]);
    setMessage("");

    // Tentative de log du message via Supabase
    try {
      await supabase.functions.invoke('support-feedback', {
        body: {
          type: 'chat_message',
          message: message,
          priority: 'normal'
        }
      });
    } catch (err) {
      
    }
  };

  const submitSupportRequest = async () => {
    if (!subject.trim() || !detailedMessage.trim()) {
      error("Champs requis", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      // Envoi via edge function support-feedback
      const { error: functionError } = await supabase.functions.invoke('support-feedback', {
        body: {
          type: 'support_request',
          subject: subject,
          message: detailedMessage,
          priority: priority
        }
      });

      if (functionError) throw functionError;

      success("Demande envoyée", "Votre demande de support a été enregistrée");
      setSubject("");
      setDetailedMessage("");
      setPriority("normal");

    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      error("Erreur", "Impossible d'envoyer la demande. Veuillez réessayer.");
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement du support...</p>
        </div>
      </div>
    );
  }

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
        <Button className="flex items-center gap-2" onClick={() => {
          setSubject("");
          setDetailedMessage("");
          setPriority("normal");
        }}>
          <FileText className="h-4 w-4" />
          Nouveau Ticket
        </Button>
      </div>

      {/* Quick Actions */}
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

      {/* Main Support Tabs */}
      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
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
                Support vocal et textuel avec intelligence artificielle
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
                  <Button size="sm" variant="outline" disabled>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs">
                    Assistant IA alimenté par données réelles Supabase
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
                {faqItems.length > 0 ? (
                  faqItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        {item.question}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.reponse}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="title-md text-muted-foreground mb-2">Aucune FAQ disponible</h3>
                    <p className="body text-muted-foreground">
                      La base de connaissances FAQ n'est pas encore configurée.
                      Contactez le support pour obtenir de l'aide.
                    </p>
                  </div>
                )}
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">#{ticket.id.slice(0, 8)}</span>
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
                          <span className="text-sm">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
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
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="title-md text-muted-foreground mb-2">Aucun ticket</h3>
                    <p className="body text-muted-foreground">
                      Vous n'avez aucun ticket de support en cours.
                      Créez un nouveau ticket si vous avez besoin d'aide.
                    </p>
                  </div>
                )}
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
                <div className="space-y-4">
                  <div>
                    <label className="label block mb-2">Sujet *</label>
                    <Input 
                      placeholder="Décrivez brièvement votre demande..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label block mb-2">Priorité</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
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
                      onChange={(e) => setDetailedMessage(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={submitSupportRequest}>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la demande
                  </Button>
                </div>
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