import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

type FormValues = z.infer<typeof schema>;

export default function AuthNew() {
  const { signIn, signUp, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user) {
      
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const onSubmit = async (values: FormValues) => {
    setDebugInfo(`Tentative de ${mode === 'login' ? 'connexion' : 'inscription'} pour ${values.email}...`);
    
    try {
      let result;
      
      if (mode === 'login') {
        result = await signIn(values.email, values.password);
      } else {
        result = await signUp(values.email, values.password);
      }
      
      if (result.error) {
        const errorMessage = result.error.message || 'Erreur inconnue';
        setLastError(errorMessage);
        setDebugInfo(`Erreur: ${errorMessage}`);
      } else {
        setDebugInfo(mode === 'login' ? 'Connexion réussie!' : 'Inscription réussie! Vérifiez votre email.');
        
        if (mode === 'signup') {
          setDebugInfo('Inscription réussie! Un email de confirmation a été envoyé.');
        }
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Une erreur est survenue';
      setLastError(errorMessage);
      setDebugInfo(`Erreur: ${errorMessage}`);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setLastError('');
    setDebugInfo('');
    reset();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-lg">Chargement de l'authentification...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="title-lg text-center">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input 
                  type="email" 
                  placeholder="Email" 
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="caption text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Input 
                  type="password" 
                  placeholder="Mot de passe" 
                  {...register('password')}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="caption text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full"
              >
                {isSubmitting ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
              </Button>
            </form>

            <div className="text-center mt-4">
              <button 
                type="button"
                className="text-primary underline hover:no-underline" 
                onClick={switchMode}
                disabled={isSubmitting}
              >
                {mode === 'login' ? "Pas de compte ? Inscrivez-vous" : 'Déjà un compte ? Connectez-vous'}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Alert className={lastError ? 'border-destructive' : 'border-green-500'}>
            {lastError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{debugInfo}</AlertDescription>
          </Alert>
        )}

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Debug Info</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>Mode: {mode}</p>
                <p>Session: {session ? 'Connecté' : 'Non connecté'}</p>
                <p>Loading: {authLoading ? 'Oui' : 'Non'}</p>
                <p>Submitting: {isSubmitting ? 'Oui' : 'Non'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}