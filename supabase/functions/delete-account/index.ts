// supabase/functions/delete-account/index.ts
//
// Supprime intégralement le compte de l'utilisateur qui appelle : toutes ses
// lignes dans les tables, tous ses fichiers Storage, puis le compte Auth
// lui-même. Utilise la clé service_role (jamais exposée côté client) —
// c'est pour ça que ça doit tourner ici, pas dans l'app.
//
// Sécurité : on ne fait JAMAIS confiance à un userId envoyé par le client.
// On dérive l'identité uniquement depuis le jeton de connexion (Authorization
// header) — impossible pour quelqu'un de supprimer le compte d'un autre.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Tables où la colonne s'appelle user_id
const TABLES_BY_USER_ID = [
  'daily_logs',
  'goals',
  'user_fragrance_collection',
  'user_goals',
  'user_vision_images',
];

// Buckets Storage, fichiers rangés sous un préfixe {userId}/
const STORAGE_BUCKETS = ['vision-board', 'progress-photos', 'avatar'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }
  const jwt = authHeader.replace('Bearer ', '');

  // Client "anon" juste pour vérifier QUI appelle, à partir de son propre jeton
  const authClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(jwt);

  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401 });
  }
  const userId = userData.user.id;

  // Client admin (service_role) pour effectuer les suppressions réelles
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const errors: string[] = [];

  // 1. Tables — user_id
  for (const table of TABLES_BY_USER_ID) {
    const { error } = await adminClient.from(table).delete().eq('user_id', userId);
    if (error) errors.push(`${table}: ${error.message}`);
  }

  // 2. Table profiles — clé primaire = id (pas user_id)
  {
    const { error } = await adminClient.from('profiles').delete().eq('id', userId);
    if (error) errors.push(`profiles: ${error.message}`);
  }

  // 3. Storage — fichiers sous {userId}/ dans chaque bucket
  for (const bucket of STORAGE_BUCKETS) {
    try {
      const { data: files, error: listError } = await adminClient.storage.from(bucket).list(userId);
      if (listError) { errors.push(`storage ${bucket} list: ${listError.message}`); continue; }
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`);
        const { error: removeError } = await adminClient.storage.from(bucket).remove(paths);
        if (removeError) errors.push(`storage ${bucket} remove: ${removeError.message}`);
      }
    } catch (e) {
      errors.push(`storage ${bucket}: ${String(e)}`);
    }
  }

  // 4. Le compte Auth lui-même — en dernier, une fois tout le reste nettoyé
  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteUserError) errors.push(`auth.deleteUser: ${deleteUserError.message}`);

  if (errors.length > 0) {
    console.error('[delete-account] erreurs partielles:', errors);
    return new Response(JSON.stringify({ success: deleteUserError == null, errors }), {
      status: deleteUserError ? 500 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
