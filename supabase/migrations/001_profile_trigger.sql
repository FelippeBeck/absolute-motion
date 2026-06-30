-- ABSOLUTE MOTION — Trigger para criar perfil automaticamente no signup
-- Rode este SQL no SQL Editor do Supabase DEPOIS do schema.sql principal.

-- Função que cria um perfil com créditos iniciais quando um usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, plan, credits)
  values (
    new.id,
    new.email,
    'free',   -- plano inicial
    30        -- créditos de boas-vindas (~30s de vídeo)
  )
  on conflict (id) do nothing;  -- idempotente (re-run seguro)
  return new;
end;
$$;

-- Trigger no signup (insere em auth.users → cria profiles)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
