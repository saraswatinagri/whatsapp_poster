import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bdrmbhbzlbudpfvqdjga.supabase.co';
const SUPABASE_KEY = 
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcm1iaGJ6bGJ1ZHBmdnFkamdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDk5MDQsImV4cCI6MjA5MDQyNTkwNH0.o9n1G_21xuYofTY2g0HqoGWU1tUAvyJ6bLCwoJH0pOY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface DbDailyPost {
  id: string;
  title: string;
  type: string;
  urls: string[];
  content?: string;
  project_id?: string;
  projectName?: string;
  posted_by?: string;
  poster_name?: string;
  post_date?: string;
  created_at: string;
  downloads?: number;
  personalizeContact?: boolean;
}

export interface DbProject {
  id: string;
  name: string;
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; count: number; error?: string }> {
  try {
    const { count, error } = await supabase
      .from('daily_posts')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (error) {
      return { connected: false, count: 0, error: error.message };
    }
    return { connected: true, count: count ?? 0 };
  } catch (err: any) {
    return { connected: false, count: 0, error: err.message };
  }
}

export async function fetchLiveProjects(): Promise<DbProject[]> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');

    if (error || !projects) return [];
    return projects;
  } catch {
    return [];
  }
}

export async function fetchLiveDailyPosts(): Promise<DbDailyPost[]> {
  try {
    const [postsRes, projectsRes] = await Promise.all([
      supabase
        .from('daily_posts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase.from('projects').select('id, name'),
    ]);

    const posts = postsRes.data;
    if (postsRes.error || !posts) {
      console.warn('Could not fetch daily_posts from Supabase:', postsRes.error?.message);
      return [];
    }

    const projectMap: Record<string, string> = {};
    if (projectsRes.data) {
      projectsRes.data.forEach((p: any) => {
        projectMap[p.id] = p.name;
      });
    }

    return posts.map((p: any) => ({
      ...p,
      urls: Array.isArray(p.urls) ? p.urls : (p.url ? [p.url] : []),
      projectName: p.project_id ? (projectMap[p.project_id] || 'Saraswati Nagri') : 'General',
    }));
  } catch (err) {
    console.error('Error fetching live posts:', err);
    return [];
  }
}
