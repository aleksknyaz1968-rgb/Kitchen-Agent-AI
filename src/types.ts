export interface RecipeStep {
  instruction: string;
  duration_minutes?: number;
}

export interface Recipe {
  steps: RecipeStep[];
  chef_secret: string;
  drink_pairing: string;
}

export interface Suggestion {
  dish_name: string;
  description: string;
  cuisine: string;
  time_minutes: number;
  difficulty: string;
  suitability: string[];
  ingredients_needed: string[];
  missing_ingredients: string[];
  shopping_links: string;
  recipe: Recipe;
}

export interface ProfileRecommendation {
  category: 'nutrition' | 'lifestyle' | 'budget';
  title: string;
  description: string;
  action_step: string;
}

export interface MealPlan {
  day: string; // ISO date string or day name
  dish_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Order {
  id: string;
  items: string[];
  totalPrice: number;
  currency: string;
  storeName: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface AgentResponse {
  thought_process: string;
  suggestions: Suggestion[];
  calendar_tip: string;
  meal_plan?: MealPlan[];
  estimated_total_price?: number;
  currency?: string;
  cheapest_store_id?: string;
  store_price_comparison?: { storeId: string; estimatedPrice: number; storeName: string }[];
  audio_response?: string; // Text to be spoken
  follow_up_question?: string; // Next question for the user
  shopping_list_updates?: {
    add?: string[];
    remove?: string[];
  };
  profile_updates?: {
    age?: number;
    gender?: "male" | "female" | "other";
    chronicIllnesses?: string[];
    familySize?: number;
    country?: string;
    city?: string;
  };
}

export interface UserProfile {
  profileType: "individual" | "family";
  familySize?: number;
  allergies: string[];
  diets: string[]; // e.g., "веганское", "безглютеновое"
  budget: "low" | "medium" | "high";
  gender?: "male" | "female" | "other";
  age?: number;
  chronicIllnesses?: string[];
  country?: string;
  city?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity?: string;
}
