import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponse, UserProfile, InventoryItem, ProfileRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Ты — "Кулинарный Агент по Мировой Кухне" AI, интеллектуальная экосистема для кулинарии. 
Твоя цель: управление питанием пользователя, от анализа холодильника до планирования меню и покупок.

ПРАВИЛА:
1. Язык: Строгий русский.
2. Формат: ВСЕГДА отвечаешь в формате чистого JSON.
3. Техника «Цепочка мыслей»: Перед выдачей результата проводи анализ (наличие продуктов, бюджет, время, цель).

КОМПОНЕНТЫ СИСТЕМЫ:
- МОДУЛЬ "ХОЛОДИЛЬНИК": Анализируй входящие данные (текст, описание фото).
- МОДУЛЬ "ПЕРСОНАЛИЗАЦИЯ": Учитывай профиль пользователя (аллергии, диеты: веганское, безглютеновое, количество человек в семье).
- МОДУЛЬ "БЮДЖЕТ": При выборе блюд учитывай экономию, предлагай аналоги дорогих ингредиентов. Рассчитывай количество ингредиентов исходя из количества человек в профиле и ВСЕГДА указывай количество и единицы измерения в списках ингредиентов.
- МОДУЛЬ "КАЛЕНДАРЬ": Умеешь планировать меню на неделю.
- МОДУЛЬ "SHOPPING": Генерируй список недостающих продуктов со ссылками на поиск (указывай: "Ссылка на поиск: [запрос]"). ОБЯЗАТЕЛЬНО указывай количество и единицы измерения для каждого продукта (напр. "Молоко (1 л)", "Яйца (10 шт)"). Рассчитывай "estimated_total_price_rub" как сумму стоимостей всех недостающих продуктов, учитывая количество человек в семье.

СТРУКТУРА JSON-ОТВЕТА:
{
  "thought_process": "Твой анализ (цепочка мыслей): почему ты выбрал эти блюда, как они вписываются в бюджет и диету",
  "suggestions": [
    {
      "dish_name": "...",
      "description": "Краткое аппетитное описание блюда (1-2 предложения)",
      "cuisine": "...",
      "time_minutes": ...,
      "difficulty": "...",
      "suitability": ["веганское", "безглютеновое", "бюджетное"],
      "ingredients_needed": ["Продукт (количество, напр. 200г)", "Продукт (количество, напр. 2 шт)"],
      "missing_ingredients": ["Продукт (количество для покупки, напр. 1 упаковка)", "Продукт (количество, напр. 0.5 кг)"],
      "shopping_links": "Ссылка на поиск: [запрос]",
      "recipe": {
        "steps": [
          { "instruction": "Шаг 1: Подробно...", "duration_minutes": 5 },
          { "instruction": "Шаг 2: Подробно...", "duration_minutes": 15 }
        ],
        "chef_secret": "...",
        "drink_pairing": "..."
      }
    }
  ],
  "calendar_tip": "Совет по планированию в твой календарь",
  "meal_plan": [
    {
      "day": "YYYY-MM-DD",
      "dish_name": "...",
      "meal_type": "breakfast | lunch | dinner"
    }
  ],
  "estimated_total_price_rub": 1250
}`;

const RECOMMENDATION_SYSTEM_INSTRUCTION = `Ты — эксперт по нутрициологии и домашней экономике. 
Твоя задача: проанализировать профиль пользователя и дать 3-5 конкретных рекомендаций по категориям: Питание, Образ жизни, Экономия.

ПРАВИЛА:
1. Язык: Соответствует запросу пользователя.
2. Формат: ВСЕГДА отвечаешь в формате JSON (массив объектов).
3. Рекомендации должны быть персонализированными (учитывай возраст, пол, диеты, бюджет).

СТРУКТУРА JSON:
[
  {
    "category": "nutrition" | "lifestyle" | "budget",
    "title": "Краткий заголовок",
    "description": "Подробное объяснение почему это важно",
    "action_step": "Конкретное действие, которое нужно сделать"
  }
]`;

export async function getProfileRecommendations(
  profile: UserProfile,
  language: string = 'ru'
): Promise<ProfileRecommendation[]> {
  const langMap: Record<string, string> = {
    'ru': 'Русский',
    'en': 'English',
    'zh': 'Chinese (Simplified)'
  };

  const currentLang = langMap[language] || 'Русский';

  const prompt = `
Проанализируй профиль и дай рекомендации на языке: ${currentLang}.
Профиль:
- Тип: ${profile.profileType}
- Пол: ${profile.gender}
- Возраст: ${profile.age}
- Диеты: ${profile.diets.join(', ') || 'нет'}
- Бюджет: ${profile.budget}
- Хронические заболевания: ${profile.chronicIllnesses?.join(', ') || 'нет'}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: RECOMMENDATION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["nutrition", "lifestyle", "budget"] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            action_step: { type: Type.STRING }
          },
          required: ["category", "title", "description", "action_step"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]') as ProfileRecommendation[];
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
}

export async function translateInventory(
  inventory: InventoryItem[],
  targetLanguage: string
): Promise<InventoryItem[]> {
  if (inventory.length === 0) return [];

  const langMap: Record<string, string> = {
    'ru': 'Russian',
    'en': 'English',
    'zh': 'Chinese (Simplified)'
  };

  const currentLang = langMap[targetLanguage] || 'Russian';

  const prompt = `Translate the following list of food items and their quantities to ${currentLang}. 
Keep the same IDs. Return ONLY a JSON array of objects with "id", "name", and "quantity".

Items:
${JSON.stringify(inventory.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })))}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            quantity: { type: Type.STRING }
          },
          required: ["id", "name", "quantity"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]') as InventoryItem[];
  } catch (e) {
    console.error("Failed to translate inventory", e);
    return inventory;
  }
}

export async function translateChronicIllnesses(
  illnesses: string[],
  targetLanguage: string
): Promise<string[]> {
  if (illnesses.length === 0) return [];

  const langMap: Record<string, string> = {
    'ru': 'Russian',
    'en': 'English',
    'zh': 'Chinese (Simplified)'
  };

  const currentLang = langMap[targetLanguage] || 'Russian';

  const prompt = `Translate the following list of chronic illnesses to ${currentLang}. 
Return ONLY a JSON array of strings.

Illnesses:
${JSON.stringify(illnesses)}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]') as string[];
  } catch (e) {
    console.error("Failed to translate illnesses", e);
    return illnesses;
  }
}

export async function getCulinaryAdvice(
  inventory: InventoryItem[],
  profile: UserProfile,
  query: string,
  language: string = 'ru'
): Promise<AgentResponse> {
  const langMap: Record<string, string> = {
    'ru': 'Русский',
    'en': 'English',
    'zh': 'Chinese (Simplified)'
  };

  const currentLang = langMap[language] || 'Русский';

  const systemInstructionWithLang = SYSTEM_INSTRUCTION.replace(
    '1. Язык: Строгий русский.',
    `1. Язык: ${currentLang}.`
  );

  const inventoryText = inventory.map(i => `${i.name}${i.quantity ? ` (${i.quantity})` : ''}`).join(', ');
  
  const prompt = `
Контекст:
- В холодильнике: ${inventoryText || 'пусто'}
- Тип профиля: ${profile.profileType === 'individual' ? 'Индивидуальный' : `Семейный (${profile.familySize || 2} чел.)`}
- Профиль пользователя: 
  - Пол: ${profile.gender || 'не указан'}
  - Возраст: ${profile.age || 'не указан'}
  - Хронические заболевания: ${profile.chronicIllnesses?.join(', ') || 'нет'}
  - Аллергии: ${profile.allergies.join(', ') || 'нет'}
  - Диеты: ${profile.diets.join(', ') || 'нет'}
  - Бюджет: ${profile.budget}
- Запрос пользователя: ${query}

Сгенерируй ответ в формате JSON согласно системной инструкции на языке: ${currentLang}.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: systemInstructionWithLang,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          thought_process: { type: Type.STRING },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dish_name: { type: Type.STRING },
                description: { type: Type.STRING },
                cuisine: { type: Type.STRING },
                time_minutes: { type: Type.NUMBER },
                difficulty: { type: Type.STRING },
                suitability: { type: Type.ARRAY, items: { type: Type.STRING } },
                ingredients_needed: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                shopping_links: { type: Type.STRING },
                recipe: {
                  type: Type.OBJECT,
                  properties: {
                    steps: { 
                      type: Type.ARRAY, 
                      items: { 
                        type: Type.OBJECT,
                        properties: {
                          instruction: { type: Type.STRING },
                          duration_minutes: { type: Type.NUMBER }
                        },
                        required: ["instruction"]
                      } 
                    },
                    chef_secret: { type: Type.STRING },
                    drink_pairing: { type: Type.STRING }
                  },
                  required: ["steps", "chef_secret", "drink_pairing"]
                }
              },
              required: ["dish_name", "description", "cuisine", "time_minutes", "difficulty", "suitability", "ingredients_needed", "missing_ingredients", "shopping_links", "recipe"]
            }
          },
          calendar_tip: { type: Type.STRING },
          meal_plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                dish_name: { type: Type.STRING },
                meal_type: { type: Type.STRING, enum: ["breakfast", "lunch", "dinner"] }
              },
              required: ["day", "dish_name", "meal_type"]
            }
          },
          estimated_total_price_rub: { type: Type.NUMBER }
        },
        required: ["thought_process", "suggestions", "calendar_tip", "estimated_total_price_rub"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as AgentResponse;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Ошибка при обработке ответа от ИИ");
  }
}
