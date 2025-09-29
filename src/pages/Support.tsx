import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupport } from "@/hooks/useSupport";
import { QuickActionCards } from "@/components/support/QuickActionCards";
import { ChatBot } from "@/components/support/ChatBot";
import { ContactForm } from "@/components/support/ContactForm";


export default function Support() {
  const {
    message,
    tickets,
    faqItems,
    chatMessages,
    loading,
    subject,
    priority,
    detailedMessage,
    setMessage,
    setSubject,
    setPriority,
    setDetailedMessage,
    sendMessage,
    submitSupportRequest,
    resetForm
  } = useSupport();


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
        <Button className="flex items-center gap-2" onClick={resetForm}>
          <FileText className="h-4 w-4" />
          Nouveau Ticket
        </Button>
      </div>

      {/* Quick Actions */}
      <QuickActionCards />

      {/* Main Support Tabs */}
      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="tickets">Mes Tickets</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="chatbot" className="mt-6">
          <ChatBot
            chatMessages={chatMessages}
            message={message}
            onMessageChange={setMessage}
            onSendMessage={sendMessage}
          />
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
            <ContactForm
              subject={subject}
              priority={priority}
              detailedMessage={detailedMessage}
              onSubjectChange={setSubject}
              onPriorityChange={setPriority}
              onMessageChange={setDetailedMessage}
              onSubmit={submitSupportRequest}
            />

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
