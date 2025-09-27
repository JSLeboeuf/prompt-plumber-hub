import { useState } from "react";
import { HelpCircle, Phone, MessageCircle, Mail, FileText, X, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  const supportActions = [
    {
      icon: Phone,
      title: "Appel d'urgence",
      description: "+1 438 601 2625",
      action: () => window.open("tel:+14386012625"),
      urgent: true
    },
    {
      icon: MessageCircle,
      title: "Chatbot IA",
      description: "Disponible 24/7",
      action: () => console.log("Open chatbot"),
      urgent: false
    },
    {
      icon: Mail,
      title: "Email support",
      description: "support@drainfortin.com",
      action: () => window.open("mailto:support@drainfortin.com"),
      urgent: false
    },
    {
      icon: FileText,
      title: "Feedback",
      description: "Partagez votre expérience",
      action: () => console.log("Open feedback form"),
      urgent: false
    }
  ];

  return (
    <>
      {/* Floating Help Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary-dark transition-all duration-200 hover:scale-105 z-50"
            size="sm"
          >
            <HelpCircle className="h-6 w-6 text-primary-foreground" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 title-md">
              🤝 Support Client
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid gap-3">
              {supportActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Card 
                    key={index}
                    className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                      action.urgent ? 'border-destructive bg-red-50' : ''
                    }`}
                    onClick={action.action}
                  >
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`p-2 rounded-lg ${
                        action.urgent ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="label">{action.title}</div>
                        <div className="caption">{action.description}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* AI Chatbot Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 subtitle">
                  🤖 Assistant IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-surface rounded-lg p-3 min-h-[100px] flex items-center justify-center">
                  <p className="caption text-muted-foreground text-center">
                    Comment puis-je vous aider aujourd'hui ?
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" variant="outline">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button size="sm">
                    Envoyer
                  </Button>
                </div>
                
                <p className="caption text-center">
                  Intégration VAPI pour support vocal intelligent
                </p>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};