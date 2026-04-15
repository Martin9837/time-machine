import { supabase } from './supabaseClient';

// Creates a CRUD handler for a Supabase table that matches Base44's entity API
const createEntityHandler = (tableName) => ({
  list: async (sort, limit, skip) => {
    let query = supabase.from(tableName).select('*');
    if (sort) {
      const desc = sort.startsWith('-');
      query = query.order(sort.replace(/^-/, ''), { ascending: !desc });
    }
    if (limit) query = query.limit(limit);
    if (skip && limit) query = query.range(skip, skip + limit - 1);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  filter: async (filterObj, sort, limit, skip) => {
    let query = supabase.from(tableName).select('*');
    for (const [key, val] of Object.entries(filterObj || {})) {
      if (val !== undefined && val !== null) {
        query = query.eq(key, val);
      }
    }
    if (sort) {
      const desc = sort.startsWith('-');
      query = query.order(sort.replace(/^-/, ''), { ascending: !desc });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  create: async (data) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: result, error } = await supabase
      .from(tableName)
      .insert({ ...data, created_by: user?.email })
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
  },

  deleteMany: async (filterObj) => {
    let query = supabase.from(tableName).delete();
    for (const [key, val] of Object.entries(filterObj || {})) {
      query = query.eq(key, val);
    }
    const { error } = await query;
    if (error) throw error;
  },
});

const auth = {
  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      ...user.user_metadata,
    };
  },

  logout: async (redirectUrl) => {
    await supabase.auth.signOut();
    window.location.href = redirectUrl || '/';
  },

  redirectToLogin: (redirectUrl) => {
    const params = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    window.location.href = `/login${params}`;
  },
};

const appLogs = {
  logUserInApp: () => Promise.resolve(),
};

// File storage helpers using Supabase Storage
const storage = {
  /**
   * Upload a file to a Supabase storage bucket.
   * Returns the public URL of the uploaded file.
   */
  upload: async (bucket, path, file) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  remove: async (bucket, paths) => {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
};

// Drop-in replacement for the Base44 client
// Entities are accessed by name (e.g. base44.entities.TimeMemory)
// and the name is lowercased to match the Supabase table name
export const base44 = {
  auth,
  appLogs,
  storage,
  entities: new Proxy({}, {
    get(_, entityName) {
      return createEntityHandler(entityName.toLowerCase());
    },
  }),
};
