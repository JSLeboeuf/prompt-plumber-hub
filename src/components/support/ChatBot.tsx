import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Mic, Send } from 'lucide-react';

interface ChatMessage {
  type: 'bot' | 'user';
  content: string;
}

interface ChatBotProps {
  chatMessages: ChatMessage[];
  message: string;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

export const ChatBot = ({ chatMessages, message, onMessageChange, onSendMessage }: ChatBotProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSendMessage();
    }
  };

  return (
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
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button size="sm" variant="outline" disabled>
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={onSendMessage}>
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
  );
};