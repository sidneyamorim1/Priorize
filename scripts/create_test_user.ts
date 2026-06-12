// scripts/create_test_user.ts
import { supabase } from '../src/lib/supabase.ts';

async function createTestUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error('Erro ao criar usuário:', error.message);
    return;
  }
  console.log('Usuário criado:', data?.user?.email);
}

// Exemplo de uso: ajuste email e senha abaixo
createTestUser('sidney.a@geniantis.com', 'teste1234');
