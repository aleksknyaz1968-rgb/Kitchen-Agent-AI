import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponse, UserProfile, InventoryItem, ProfileRecommendation, ChatMessage } from "../types";

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
- МОДУЛЬ "ПРОФИЛЬ": Если в процессе диалога ты узнаешь новые данные о пользователе (возраст, пол, болезни, количество человек), ОБЯЗАТЕЛЬНО верни их в поле "profile_updates". Это позволит системе автоматически обновить профиль.
- МОДУЛЬ "КАЛЕНДАРЬ": Умеешь планировать меню на неделю (7 дней по 3 приема пищи). Если пользователь просит план на неделю, ОБЯЗАТЕЛЬНО заполни массив "meal_plan" на ближайшие 7 дней (от текущей даты), предлагая разнообразные блюда на основе профиля и холодильника.
- МОДУЛЬ "SHOPPING": Генерируй список недостающих продуктов со ссылками на поиск. ОБЯЗАТЕЛЬНО указывай количество и единицы измерения для каждого продукта. Рассчитывай "estimated_total_price" в местной валюте (например, GBP, USD, RUB). Если пользователь просит добавить что-то в список покупок или удалить из него голосом, ОБЯЗАТЕЛЬНО верни изменения в поле "shopping_list_updates". 
- МОДУЛЬ "ORDERING": Если пользователь говорит "Закажи всё", "Купи это" или "Оформи заказ", Твоя задача — подтвердить готовность корзины. В "audio_response" скажи, что ты собрал все продукты в корзину и готов перенаправить в магазин для финальной проверки. ОБЯЗАТЕЛЬНО убедись, что список "missing_ingredients" полон.
- МОДУЛЬ "ГЕОЛОКАЦИЯ И МАГАЗИНЫ": Если в профиле указана страна (country) и город (city), ТЫ ОБЯЗАН предлагать магазины, которые реально существуют в этом регионе. 
  - Если Россия: Магнит, Пятерочка, Ашан, Метро, Лента, ВкусВилл, Глобус.
  - Если Великобритания: Tesco, Sainsbury's, Asda, Morrisons, Waitrose, M&S, Lidl, Aldi.
  - Если США: Walmart, Target, Whole Foods, Kroger, Costco, Safeway.
  - Если другая страна: Подбери топовые супермаркеты самостоятельно.
  Укажи "cheapest_store_id" (walmart, tesco, и т.д.) и заполни массив "store_price_comparison", включая название магазина "storeName".
- МОДУЛЬ "ДИАЛОГ": Ты можешь вести живой диалог. Если информации недостаточно (непонятно что в холодильнике, сколько людей будут есть, нужно ли заказывать продукты), ЗАДАВАЙ уточняющие вопросы в поле "follow_up_question". Твои ответы в поле "audio_response" должны быть краткими, вежливыми и приспособленными для озвучивания голосом.

СТРУКТУРА JSON-ОТВЕТА:
{
  "thought_process": "Твой анализ (цепочка мыслей): почему ты выбрал эти блюда, как они вписываются в бюджет и диету",
  "audio_response": "Твой краткий ответ пользователю для озвучки (например: 'Понял, сделаю пиццу. А что у вас осталось в холодильнике?')",
  "follow_up_question": "Уточняющий вопрос (например: 'Что у Вас есть в холодильнике?') или null, если вопросов нет",
  "shopping_list_updates": {
    "add": ["Молоко", "Хлеб"],
    "remove": ["Яблоки"]
  },
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
  "estimated_total_price": 1250,
  "currency": "RUB",
  "cheapest_store_id": "magnit",
  "store_price_comparison": [
    { "storeId": "magnit", "storeName": "Magnit", "estimatedPrice": 1100 },
    { "storeId": "lenta", "storeName": "Lenta", "estimatedPrice": 1300 }
  ]
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
  language: string = 'ru',
  history: ChatMessage[] = []
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
  const today = new Date().toISOString().split('T')[0];
  
  const formattedHistory = history.map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Шеф'}: ${msg.content}`).join('\n');

  const prompt = `
Контекст:
- Текущая дата: ${today}
- В холодильнике (уже известно): ${inventoryText || 'пусто'}
- Местоположение: ${profile.country || 'неизвестно'}, ${profile.city || 'неизвестно'}
- Тип профиля: ${profile.profileType === 'individual' ? 'Индивидуальный' : `Семейный (${profile.familySize || 2} чел.)`}
- Профиль пользователя: 
  - Пол: ${profile.gender || 'не указан'}
  - Возраст: ${profile.age || 'не указан'}
  - Хронические заболевания: ${profile.chronicIllnesses?.join(', ') || 'нет'}
  - Аллергии: ${profile.allergies.join(', ') || 'нет'}
  - Диеты: ${profile.diets.join(', ') || 'нет'}
  - Бюджет: ${profile.budget}

История диалога:
${formattedHistory || 'Начало диалога'}

Новый запрос пользователя: ${query}

Важно: Если в запросе пользователь сообщает о возрасте, поле или болезнях - учти это в анализе, но приоритет отдавай диалогу. Если пользователь хочет что-то приготовить, начни диалог согласно МОДУЛЮ "ДИАЛОГ". Сначала узнай про холодильник (если там пусто или неизвестно), потом про количество людей, потом предложи заказ продуктов.

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
          audio_response: { type: Type.STRING },
          follow_up_question: { type: Type.STRING, nullable: true },
          shopping_list_updates: {
            type: Type.OBJECT,
            properties: {
              add: { type: Type.ARRAY, items: { type: Type.STRING } },
              remove: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
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
          estimated_total_price: { type: Type.NUMBER },
          currency: { type: Type.STRING },
          cheapest_store_id: { type: Type.STRING },
          store_price_comparison: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                storeId: { type: Type.STRING },
                storeName: { type: Type.STRING },
                estimatedPrice: { type: Type.NUMBER }
              },
              required: ["storeId", "storeName", "estimatedPrice"]
            }
          },
          profile_updates: {
            type: Type.OBJECT,
            properties: {
              age: { type: Type.NUMBER },
              gender: { type: Type.STRING, enum: ["male", "female", "other"] },
              chronicIllnesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              familySize: { type: Type.NUMBER },
              country: { type: Type.STRING },
              city: { type: Type.STRING }
            }
          }
        },
        required: ["thought_process", "audio_response", "suggestions", "calendar_tip", "estimated_total_price", "currency"]
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
