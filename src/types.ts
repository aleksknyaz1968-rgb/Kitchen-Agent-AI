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

export interface AgentResponse {
  thought_process: string;
  suggestions: Suggestion[];
  calendar_tip: string;
  meal_plan?: MealPlan[];
  estimated_total_price_rub?: number;
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
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity?: string;
}
