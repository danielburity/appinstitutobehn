export type Module = {
  id: string; // uuid
  course_id: number; // bigint from courses table
  title: string;
  order: number;
  lessons?: Lesson[];
};

export type Lesson = {
  id: string; // uuid
  module_id: string; // uuid
  title: string;
  description: string;
  video_url: string;
  duration: string;
  visible: boolean;
  release_days: number;
  validity_days: number | null;
  order: number;
  status?: string; // For UI state (locked/unlocked)
};

export type LessonAttachment = {
  id: string;
  lesson_id: string;
  name: string;
  url: string;
  type: string;
};

export type Course = {
  id: number; // Changed to number/bigint to match database reality
  title: string;
  slug?: string;
  instructor: string;
  duration: string;
  image_url: string;
  description: string;
  published: boolean;
  is_premium?: boolean;
  badge?: string;
  learning_outcomes?: string[];
  created_at?: string;
  video_url?: string;
  external_url?: string;
  modules?: Module[];
};

export type Therapist = {
  id: number;
  name: string;
  avatar_url: string | null;
  specialties: string[] | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  contact_whatsapp: string | null;
  selo_approved: boolean;
  gender?: 'male' | 'female';
  postal_code?: string | null;
};

export type AppEvent = {
  id: number;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  type: 'online' | 'presencial';
  category: string | null;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  featured: boolean;
};

export type Profile = {
  id: string;
  email: string | null;
  role: 'admin' | 'member' | null;
  migrated: boolean;
  selo_approved: boolean;
};

export type Material = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string | null;
  price: string | null;
  category: string | null;
  created_at?: string;
};
