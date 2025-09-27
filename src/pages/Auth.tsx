import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

type FormValues = z.infer<typeof schema>;

export default function Auth() {
  const { signIn, signUp, session } = useAuth();
  const { success, error } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (session) {
      window.location.href = '/dashboard';
    }
  }, [session]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === 'login') {
        await signIn(values.email, values.password);
        success('Connecté', 'Authentification réussie');
      } else {
        await signUp(values.email, values.password);
        success('Inscription', 'Vérifiez votre email pour confirmer');
      }
    } catch (e: any) {
      error('Erreur', e?.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="title-lg text-center">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input type="email" placeholder="Email" {...register('email')} />
              {errors.email && <p className="caption text-destructive mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Mot de passe" {...register('password')} />
              {errors.password && <p className="caption text-destructive mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Chargement...' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button className="text-primary underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? "Pas de compte ? Inscrivez-vous" : 'Déjà un compte ? Connectez-vous'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
