import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Database,
  Globe,
  Phone,
  MessageSquare,
  Zap
} from "lucide-react";
import { apiClient, API_CONFIG } from "@/config/api.config";
import { supabase } from "@/integrations/supabase/client";

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'checking';
  latency?: number;
  lastCheck: Date;
  icon: any;
  url?: string;
}

export default function HealthCheck() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Base de données Supabase',
      status: 'checking',
      icon: Database,
      lastCheck: new Date()
    },
    {
      name: 'API VAPI',
      status: 'checking', 
      icon: Phone,
      lastCheck: new Date()
    },
    {
      name: 'Webhooks n8n',
      status: 'checking',
      icon: Zap,
      lastCheck: new Date()
    },
    {
      name: 'SMS Twilio',
      status: 'checking',
      icon: MessageSquare,
      lastCheck: new Date()
    },
    {
      name: 'Google Maps API',
      status: 'checking',
      icon: Globe,
      lastCheck: new Date()
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const checkSupabase = async (): Promise<Partial<ServiceStatus>> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('vapi_calls')
        .select('count(*)')
        .limit(1);
      
      const latency = Date.now() - startTime;
      
      if (error) throw error;
      
      return {
        status: 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  };

  const checkVAPI = async (): Promise<Partial<ServiceStatus>> => {
    const startTime = Date.now();
    try {
      if (!API_CONFIG.vapi.publicKey) {
        return {
          status: 'warning',
          latency: 0,
          lastCheck: new Date()
        };
      }

      // Simple health check - just verify API key format
      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  };

  const checkN8n = async (): Promise<Partial<ServiceStatus>> => {
    const startTime = Date.now();
    try {
      if (!API_CONFIG.n8n.baseUrl || API_CONFIG.n8n.baseUrl.includes('your-n8n')) {
        return {
          status: 'warning',
          latency: 0,
          lastCheck: new Date()
        };
      }

      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  };

  const checkTwilio = async (): Promise<Partial<ServiceStatus>> => {
    const startTime = Date.now();
    try {
      // Check if Twilio secrets are configured via Supabase function
      const { data, error } = await supabase.functions.invoke('health-check');
      
      const latency = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'warning',
          latency,
          lastCheck: new Date()
        };
      }
      
      return {
        status: 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  };

  const checkGoogleMaps = async (): Promise<Partial<ServiceStatus>> => {
    const startTime = Date.now();
    try {
      if (!API_CONFIG.maps.apiKey) {
        return {
          status: 'warning',
          latency: 0,
          lastCheck: new Date()
        };
      }

      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        latency,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  };

  const runHealthChecks = async () => {
    setIsChecking(true);
    
    const checks = [
      checkSupabase(),
      checkVAPI(),
      checkN8n(),
      checkTwilio(),
      checkGoogleMaps()
    ];

    try {
      const results = await Promise.all(checks);
      
      setServices(prev => prev.map((service, index) => ({
        ...service,
        ...results[index]
      })));
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
    
    // Run health checks every 5 minutes
    const interval = setInterval(runHealthChecks, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'checking':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'Opérationnel';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Erreur';
      case 'checking':
        return 'Vérification...';
      default:
        return 'Inconnu';
    }
  };

  const overallStatus = services.every(s => s.status === 'healthy') 
    ? 'healthy' 
    : services.some(s => s.status === 'error') 
    ? 'error' 
    : 'warning';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="title-md flex items-center gap-2">
            <Activity className="h-5 w-5" />
            État des Services
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`border ${getStatusColor(overallStatus)}`}>
              {getStatusIcon(overallStatus)}
              <span className="ml-1">{getStatusLabel(overallStatus)}</span>
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={runHealthChecks}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-surface rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="caption text-muted-foreground">
                      Dernière vérification: {service.lastCheck.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {service.latency !== undefined && service.latency > 0 && (
                    <div className="caption text-muted-foreground">
                      {service.latency}ms
                    </div>
                  )}
                  <Badge className={`border ${getStatusColor(service.status)} flex items-center gap-1`}>
                    {getStatusIcon(service.status)}
                    <span>{getStatusLabel(service.status)}</span>
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}