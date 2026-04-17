import React from 'react';
import { 
  Refrigerator, 
  Calendar, 
  ShoppingCart, 
  User, 
  ChefHat,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Clock,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Menu as MenuIcon,
  Settings,
  Package,
  Terminal,
  Sparkles,
  Star,
  Mic,
  MicOff,
  ShoppingBag,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster, toast } from 'sonner';
import { InventoryItem, UserProfile, AgentResponse, Suggestion, ProfileRecommendation, ChatMessage, Order } from './types';
import { getCulinaryAdvice, getProfileRecommendations, translateInventory, translateChronicIllnesses } from './services/geminiService';
import { useTranslation } from 'react-i18next';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  eachDayOfInterval, 
  endOfWeek 
} from 'date-fns';
import { ru, enUS, zhCN } from 'date-fns/locale';

const locales: Record<string, any> = {
  ru,
  en: enUS,
  zh: zhCN
};

const DELIVERY_STORES = [
  { id: 'magnit', name: 'store_magnit', url: 'https://magnit.ru/search/?q=', color: 'bg-[#E51B24]' },
  { id: 'pyaterochka', name: 'store_pyaterochka', url: 'https://5ka.ru/search?text=', color: 'bg-[#ED7102]' },
  { id: 'auchan', name: 'store_auchan', url: 'https://www.auchan.ru/search/?query=', color: 'bg-[#E11F26]' },
  { id: 'metro', name: 'store_metro', url: 'https://online.metro-cc.ru/search?q=', color: 'bg-[#003B91]' },
  { id: 'lenta', name: 'store_lenta', url: 'https://lenta.com/search/?searchText=', color: 'bg-[#004A99]' },
  { id: 'vkusvill', name: 'store_vkusvill', url: 'https://vkusvill.ru/search/?q=', color: 'bg-[#5DB34A]' },
  { id: 'globus', name: 'store_globus', url: 'https://www.globus.ru/search/?q=', color: 'bg-[#FF7300]' },
  { id: 'kuper', name: 'store_kuper', url: 'https://kuper.ru/search?q=', color: 'bg-[#24C653]' },
];

const getProductEmoji = (name: string): string => {
  const n = name.toLowerCase();
  
  // Russian
  if (n.includes('яйц')) return '🥚';
  if (n.includes('молок') || n.includes('кефир') || n.includes('сливк')) return '🥛';
  if (n.includes('сыр')) return '🧀';
  if (n.includes('хлеб') || n.includes('булк') || n.includes('батон')) return '🍞';
  if (n.includes('мяс') || n.includes('говяд') || n.includes('свин') || n.includes('фарш')) return '🥩';
  if (n.includes('кур') || n.includes('индейк')) return '🍗';
  if (n.includes('рыб') || n.includes('лосось') || n.includes('тунец')) return '🐟';
  if (n.includes('ябл')) return '🍎';
  if (n.includes('банан')) return '🍌';
  if (n.includes('огур')) return '🥒';
  if (n.includes('помидо') || n.includes('томат')) return '🍅';
  if (n.includes('карт')) return '🥔';
  if (n.includes('морк')) return '🥕';
  if (n.includes('капуст') || n.includes('броккол')) return '🥦';
  if (n.includes('масл')) return '🧈';
  if (n.includes('сок') || n.includes('компот')) return '🧃';
  if (n.includes('вода')) return '💧';
  if (n.includes('кофе')) return '☕';
  if (n.includes('чай')) return '🍵';
  if (n.includes('сахар')) return '🍬';
  if (n.includes('мука')) return '🥡';
  if (n.includes('рис')) return '🍚';
  if (n.includes('паст') || n.includes('макар')) return '🍝';
  if (n.includes('лук')) return '🧅';
  if (n.includes('чесно')) return '🧄';
  if (n.includes('гриб')) return '🍄';
  if (n.includes('авок')) return '🥑';
  if (n.includes('лимон')) return '🍋';
  if (n.includes('ягод') || n.includes('клубн') || n.includes('малин')) return '🍓';

  // English
  if (n.includes('egg')) return '🥚';
  if (n.includes('milk') || n.includes('cream')) return '🥛';
  if (n.includes('cheese')) return '🧀';
  if (n.includes('bread') || n.includes('bun')) return '🍞';
  if (n.includes('meat') || n.includes('beef') || n.includes('pork') || n.includes('steak')) return '🥩';
  if (n.includes('chick') || n.includes('turkey')) return '🍗';
  if (n.includes('fish') || n.includes('salmon')) return '🐟';
  if (n.includes('appl')) return '🍎';
  if (n.includes('banan')) return '🍌';
  if (n.includes('cucum')) return '🥒';
  if (n.includes('tomato')) return '🍅';
  if (n.includes('potat')) return '🥔';
  if (n.includes('carrot')) return '🥕';
  if (n.includes('oil') || n.includes('butter')) return '🧈';
  if (n.includes('juice')) return '🧃';
  if (n.includes('water')) return '💧';
  if (n.includes('coffee')) return '☕';
  if (n.includes('tea')) return '🍵';
  if (n.includes('rice')) return '🍚';
  if (n.includes('pasta')) return '🍝';
  if (n.includes('onion')) return '🧅';
  if (n.includes('garlic')) return '🧄';

  // Chinese
  if (n.includes('蛋')) return '🥚';
  if (n.includes('奶')) return '🥛';
  if (n.includes('肉') || n.includes('牛') || n.includes('猪')) return '🥩';
  if (n.includes('鱼')) return '🐟';
  if (n.includes('菜') || n.includes('西兰花')) return '🥦';
  if (n.includes('果') || n.includes('苹果')) return '🍎';
  if (n.includes('面')) return '🍝';
  if (n.includes('水')) return '💧';
  if (n.includes('米')) return '🍚';
  if (n.includes('茶')) return '🍵';

  return '📦';
};

export default function App() {
  const { t, i18n } = useTranslation();
  const currentLocale = locales[i18n.language] || ru;

  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [profile, setProfile] = React.useState<UserProfile>({
    profileType: 'family',
    familySize: 2,
    allergies: [],
    diets: [],
    budget: 'medium',
    gender: 'male',
    age: 30,
    chronicIllnesses: [],
  });
  const [newItem, setNewItem] = React.useState({ name: '', quantity: '' });
  const [aiResponse, setAiResponse] = React.useState<AgentResponse | null>(null);
  const [recommendations, setRecommendations] = React.useState<ProfileRecommendation[]>([]);
  const [isRecLoading, setIsRecLoading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [starRatings, setStarRatings] = React.useState<Record<string, number>>({});
  const [shoppingList, setShoppingList] = React.useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = React.useState(false);
  const [tempProfile, setTempProfile] = React.useState<UserProfile>(profile);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = React.useState(false);
  const [orderHistory, setOrderHistory] = React.useState<Order[]>([]);

  // Get geolocation on mount
  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await response.json();
          if (data && data.address) {
            const country = data.address.country;
            const city = data.address.city || data.address.town || data.address.village;
            setProfile(prev => ({ ...prev, country, city }));
            setTempProfile(prev => ({ ...prev, country, city }));
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      }, (error) => {
        console.warn("Geolocation permission denied or error:", error);
      });
    }
  }, []);

  const hasUnsavedChanges = React.useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(tempProfile);
  }, [profile, tempProfile]);

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleVoiceInput = (onResult: (text: string) => void, autoSubmit = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error(t('voice_not_supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'en' ? 'en-US' : 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info(t('voice_listening'), { id: 'voice-toast', duration: 2000 });
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error(t('voice_error'), { id: 'voice-toast' });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      setIsListening(false);
      const text = event.results[0][0].transcript;
      onResult(text);
      if (autoSubmit) {
        handleGetAdvice(text);
      }
    };

    recognition.start();
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = i18n.language === 'zh' ? 'zh-CN' : i18n.language === 'en' ? 'en-US' : 'ru-RU';
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const addItem = () => {
    if (!newItem.name) return;
    setInventory([...inventory, { id: Math.random().toString(), ...newItem }]);
    setNewItem({ name: '', quantity: '' });
    toast.success(t('product_added'));
  };

  const removeItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
    toast.info(t('product_removed'));
  };

  const clearChat = () => {
    setChatHistory([]);
    setAiResponse(null);
  };

  const clearInventory = () => {
    if (inventory.length === 0) return;
    setInventory([]);
    toast.info(t('empty_fridge'));
  };

  const addAllToShoppingList = (ingredients: string[]) => {
    if (!ingredients.length) return;
    setShoppingList(prev => {
      const newList = [...prev];
      ingredients.forEach(ing => {
        if (!newList.includes(ing)) newList.push(ing);
      });
      return newList;
    });
    toast.success(t('added_to_shopping_list'));
  };

  const handlePlaceOrder = async (store: { storeId: string; storeName: string; estimatedPrice: number }) => {
    setIsCheckoutLoading(true);
    
    // Simulate "Adding to Cart" process
    const items = shoppingList.length > 0 
      ? shoppingList 
      : (aiResponse?.suggestions.flatMap(s => s.missing_ingredients) || []);
    
    toast.loading(`Складываем продукты в корзину ${store.storeName}...`, { id: 'checkout-loading' });
    
    // Artificial delay to simulate automation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      items,
      totalPrice: store.estimatedPrice,
      currency: aiResponse?.currency || "RUB",
      storeName: store.storeName,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setOrderHistory(prev => [newOrder, ...prev]);
    setIsCheckoutLoading(false);
    setIsStoreModalOpen(false);
    toast.success("Корзина собрана! Перенаправляем для оплаты.", { id: 'checkout-loading' });
    
    // Open store search for the first item as a starting point
    const queryStr = items.length > 0 ? items[0] : "";
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${store.storeName} ${items.join(', ')}`)}`;
    window.open(searchUrl, '_blank');

    // Speech feedback
    speak(`Корзина в магазине ${store.storeName} почти готова. Я подготовил список из ${items.length} продуктов. Теперь вы можете завершить оплату на сайте магазина.`);
  };

  const removeShoppingItem = (item: string) => {
    setShoppingList(prev => prev.filter(i => i !== item));
  };

  const handleGetAdvice = async (customQuery?: string, overrideInventory?: InventoryItem[], overrideProfile?: UserProfile) => {
    setIsLoading(true);
    const activeQuery = customQuery || query || t('query_placeholder');
    
    // Update local history
    const newUserMsg: ChatMessage = { role: 'user', content: activeQuery };
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);

    if (customQuery === t('plan_weekly')) {
      toast.promise(
        new Promise((resolve) => resolve(null)), 
        {
          loading: t('weekly_plan_loading'),
          success: t('analyzing'),
        }
      );
    }

    try {
      const response = await getCulinaryAdvice(
        overrideInventory || inventory, 
        overrideProfile || profile, 
        activeQuery,
        i18n.language,
        chatHistory
      );
      setAiResponse(response);
      
      // Update history with assistant response
      const assistantMsg: ChatMessage = { role: 'assistant', content: response.audio_response || '' };
      setChatHistory(prev => [...prev, assistantMsg]);
      
      // Apply profile updates if any
      if (response.profile_updates) {
        setProfile(prev => ({
          ...prev,
          ...response.profile_updates,
          chronicIllnesses: response.profile_updates?.chronicIllnesses 
            ? Array.from(new Set([...(prev.chronicIllnesses || []), ...response.profile_updates.chronicIllnesses]))
            : prev.chronicIllnesses
        }));
        setTempProfile(prev => ({
          ...prev,
          ...response.profile_updates
        }));
        toast.info(t('profile_updated_auto'));
      }

      // Apply shopping list updates if any
      if (response.shopping_list_updates) {
        if (response.shopping_list_updates.add && response.shopping_list_updates.add.length > 0) {
          setShoppingList(prev => {
            const newItems = response.shopping_list_updates?.add?.filter(item => !prev.includes(item)) || [];
            return [...prev, ...newItems];
          });
        }
        if (response.shopping_list_updates.remove && response.shopping_list_updates.remove.length > 0) {
          setShoppingList(prev => prev.filter(item => !response.shopping_list_updates?.remove?.includes(item)));
        }
      }

      // Speak the response
      if (response.audio_response) {
        speak(response.audio_response, () => {
          if (response.follow_up_question) {
            setTimeout(() => {
              handleVoiceInput((text) => setQuery(text), true);
            }, 500);
          }
        });
      }
    } catch (error) {
      toast.error(t('ask_chef_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendations = async (overrideProfile?: UserProfile) => {
    setIsRecLoading(true);
    try {
      const recs = await getProfileRecommendations(overrideProfile || profile, i18n.language);
      setRecommendations(recs);
    } catch (error) {
      toast.error(t('recommendations_error'));
    } finally {
      setIsRecLoading(false);
    }
  };

  // Re-fetch AI content and translate user data when language changes to ensure "automatic" translation
  React.useEffect(() => {
    const updateAllContent = async () => {
      let currentInventory = inventory;
      let currentProfile = profile;

      // 1. Translate user-entered data first
      if (inventory.length > 0) {
        currentInventory = await translateInventory(inventory, i18n.language);
        setInventory(currentInventory);
      }
      if (profile.chronicIllnesses && profile.chronicIllnesses.length > 0) {
        const translatedIllnesses = await translateChronicIllnesses(profile.chronicIllnesses, i18n.language);
        currentProfile = { ...profile, chronicIllnesses: translatedIllnesses };
        setProfile(currentProfile);
      }

      // 2. Re-fetch AI generated content using the translated data
      if (recommendations.length > 0) {
        handleGetRecommendations(currentProfile);
      }
      if (aiResponse) {
        handleGetAdvice(undefined, currentInventory, currentProfile);
      }
    };

    updateAllContent();
  }, [i18n.language]);

  const toggleDiet = (diet: string) => {
    const targetSet = isSettingsOpen ? setTempProfile : setProfile;
    targetSet(prev => {
      if (diet === 'none') {
        return { ...prev, diets: [] };
      }
      
      const newDiets = prev.diets.includes(diet) 
        ? prev.diets.filter(d => d !== diet) 
        : [...prev.diets, diet];
        
      return { ...prev, diets: newDiets };
    });
  };

  const getAgeString = (age: number, lang: string) => {
    if (lang !== 'ru') return `${age} ${t('age_unit')}`;
    
    const lastDigit = age % 10;
    const lastTwoDigits = age % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${age} лет`;
    if (lastDigit === 1) return `${age} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${age} года`;
    return `${age} лет`;
  };

  const getPeopleString = (count: number, lang: string) => {
    if (lang === 'zh') return `${count} 人`;
    if (lang === 'en') return `${count} ${count === 1 ? 'person' : 'people'}`;
    
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return `${count} человек`;
    if (lastDigit === 1) return `${count} человек`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${count} человека`;
    return `${count} человек`;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-brand-bg text-[#1A1A1A] font-sans selection:bg-brand-accent/30">
        <Toaster position="top-center" />
        
        {/* Header */}
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-3 md:px-10 sticky top-0 z-50">
          <div className="flex items-center gap-1.5 md:gap-3 shrink min-w-0">
            <Sheet>
              <SheetTrigger render={
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl hover:bg-brand-accent/30 interactive-button shrink-0">
                  <MenuIcon className="w-4 h-4 text-brand-primary" />
                </Button>
              } />
              <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0 border-none bg-white">
                <SheetHeader className="p-6 border-b border-black/5">
                  <SheetTitle className="flex items-center gap-3 text-left">
                    <div className="bg-brand-primary p-2 rounded-xl">
                      <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-display font-bold text-lg tracking-tight text-brand-primary uppercase">{t('app_name')}</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      scrollTo('fridge-section');
                      (document.querySelector('[data-state="open"]') as any)?.click();
                    }} 
                    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[11px] tracking-widest transition-all"
                  >
                    <Refrigerator className="w-5 h-5 text-brand-primary" /> {t('nav_fridge')}
                  </button>
                  <button 
                    onClick={() => {
                      scrollTo('calendar-section');
                      (document.querySelector('[data-state="open"]') as any)?.click();
                    }} 
                    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[11px] tracking-widest transition-all"
                  >
                    <Calendar className="w-5 h-5 text-brand-primary" /> {t('nav_calendar')}
                  </button>
                  <button 
                    onClick={() => {
                      scrollTo('shopping-list-section');
                      (document.querySelector('[data-state="open"]') as any)?.click();
                    }} 
                    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[11px] tracking-widest transition-all"
                  >
                    <ShoppingCart className="w-5 h-5 text-brand-primary" /> {t('nav_shopping')}
                  </button>
                  <button 
                    onClick={() => {
                      setTempProfile(profile);
                      setIsSettingsOpen(true);
                      (document.querySelector('[data-state="open"]') as any)?.click();
                    }} 
                    className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[11px] tracking-widest transition-all"
                  >
                    <Settings className="w-5 h-5 text-brand-primary" /> {t('nav_settings')}
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:flex bg-brand-primary p-2 rounded-xl h-10 w-10 items-center justify-center border-none shadow-sm shrink-0">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-base md:text-2xl tracking-tight text-brand-primary truncate leading-tight">{t('app_name')}</span>
          </div>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <button 
                  onClick={() => scrollTo('fridge-section')} 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[10px] tracking-widest px-4 h-11 rounded-xl")}
                >
                  <Refrigerator className="w-4 h-4 mr-2" /> {t('nav_fridge')}
                </button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <button 
                  onClick={() => scrollTo('calendar-section')} 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[10px] tracking-widest px-4 h-11 rounded-xl")}
                >
                  <Calendar className="w-4 h-4 mr-2" /> {t('nav_calendar')}
                </button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <button 
                  onClick={() => scrollTo('shopping-list-section')} 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[10px] tracking-widest px-4 h-11 rounded-xl")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> {t('nav_shopping')}
                </button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <button 
                  onClick={() => {
                    setTempProfile(profile);
                    setIsSettingsOpen(true);
                  }} 
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent hover:bg-brand-accent/30 text-brand-secondary font-bold uppercase text-[10px] tracking-widest px-4 h-11 rounded-xl")}
                >
                  <Settings className="w-4 h-4 mr-2" /> {t('nav_settings')}
                </button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-1 md:gap-6 shrink-0">
            <div className="flex gap-1 bg-brand-bg p-1 rounded-xl border border-black/5">
              {['ru', 'en', 'zh'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-1.5 md:px-3 py-1.5 rounded-lg text-[9px] md:text-[12px] font-bold uppercase transition-all interactive-button min-w-[28px] md:min-w-[36px] h-7 md:h-9 flex items-center justify-center ${
                    i18n.language === lang 
                      ? 'bg-brand-primary text-white shadow-sm' 
                      : 'text-brand-secondary hover:bg-brand-accent/50'
                  }`}
                >
                  {lang === 'zh' ? '中' : lang}
                </button>
              ))}
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={(open) => {
              if (!open) {
                if (hasUnsavedChanges) {
                  setShowDiscardConfirm(true);
                } else {
                  setIsSettingsOpen(false);
                }
              } else {
                setTempProfile(profile);
                setIsSettingsOpen(true);
              }
            }}>
              <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden flex flex-col max-h-[95vh] bg-white">
                <DialogHeader className="p-6 pb-2 border-b border-black/5">
                  <DialogTitle className="font-display font-bold text-xl text-brand-primary flex items-center gap-2">
                    <Settings className="w-5 h-5" /> {t('settings')}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* Profile Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-brand-secondary/60 ml-1">{t('profile_type')}</Label>
                    <div className="flex gap-2 p-1.5 bg-brand-bg rounded-2xl border border-black/5">
                      {(['individual', 'family'] as const).map((type) => (
                        <Button
                          key={type}
                          variant={tempProfile.profileType === type ? 'default' : 'ghost'}
                          onClick={() => setTempProfile({ ...tempProfile, profileType: type })}
                          className={`flex-1 rounded-xl text-xs font-bold h-12 transition-all interactive-button ${
                            tempProfile.profileType === type 
                              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]' 
                              : 'text-brand-secondary hover:bg-brand-accent/30'
                          }`}
                        >
                          {type === 'individual' ? '👤 ' : '👨‍👩‍👧‍👦 '} {t(`profile_${type}`)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Fields based on Profile Type */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tempProfile.profileType}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      {tempProfile.profileType === 'family' ? (
                        <div className="space-y-4 p-5 rounded-3xl bg-brand-warm/30 border border-brand-primary/10">
                          <Label className="text-[12px] font-bold text-brand-primary flex items-center gap-2">
                            <Package className="w-4 h-4" /> {t('family_size')}
                          </Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={tempProfile.familySize || ''} 
                            onChange={(e) => setTempProfile({ ...tempProfile, familySize: parseInt(e.target.value) || 1 })}
                            className="h-14 text-lg font-bold rounded-2xl border-brand-primary/20 bg-white focus:ring-brand-primary/20 transition-all"
                          />
                          <p className="text-[10px] text-brand-secondary font-medium opacity-70">
                            * Количество ингредиентов в списке покупок будет рассчитано на {tempProfile.familySize || 2} чел.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6 p-5 rounded-3xl bg-brand-bg border border-black/5">
                          <Label className="text-[12px] font-bold text-brand-primary flex items-center gap-2">
                            <User className="w-4 h-4" /> {t('personal_info')}
                          </Label>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-bold uppercase text-brand-secondary/70 ml-1">{t('gender')}</Label>
                              <div className="flex gap-1 bg-white p-1 rounded-xl border border-black/10">
                                {(['male', 'female', 'other'] as const).map((g) => (
                                  <button
                                    key={g}
                                    onClick={() => setTempProfile({ ...tempProfile, gender: g })}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all interactive-button ${
                                      tempProfile.gender === g 
                                        ? 'bg-brand-primary text-white shadow-md' 
                                        : 'text-brand-secondary hover:bg-brand-accent/20'
                                    }`}
                                  >
                                    {t(`gender_${g}`)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-[10px] font-bold uppercase text-brand-secondary/70 ml-1">{t('age')}</Label>
                              <Input 
                                type="number" 
                                value={tempProfile.age || ''} 
                                onChange={(e) => setTempProfile({ ...tempProfile, age: parseInt(e.target.value) || 0 })}
                                className="h-12 text-sm font-bold rounded-xl border-black/10 bg-white focus:border-brand-primary transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase text-brand-secondary/70 ml-1">{t('chronic_illnesses')}</Label>
                            <Input 
                              placeholder={t('illness_placeholder')}
                              value={tempProfile.chronicIllnesses?.join(', ') || ''}
                              onChange={(e) => setTempProfile({ ...tempProfile, chronicIllnesses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              className="h-12 text-sm rounded-xl border-black/10 bg-white focus:border-brand-primary transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Common Settings */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-brand-secondary/60 ml-1">{t('diets')}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'none', label: 'diet_none' },
                          { id: 'vegan', label: 'diet_vegan' },
                          { id: 'vegetarian', label: 'diet_vegetarian' },
                          { id: 'gluten_free', label: 'diet_gluten_free' },
                          { id: 'keto', label: 'diet_keto' },
                          { id: 'paleo', label: 'diet_paleo' }
                        ].map((diet) => (
                          <div 
                            key={diet.id} 
                            className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all cursor-pointer interactive-button ${
                              (diet.id === 'none' ? tempProfile.diets.length === 0 : tempProfile.diets.includes(diet.id))
                                ? 'bg-brand-primary/5 border-brand-primary/30'
                                : 'bg-white border-black/5 hover:border-brand-primary/20'
                            }`}
                            onClick={() => toggleDiet(diet.id)}
                          >
                            <Checkbox 
                              id={diet.id} 
                              checked={diet.id === 'none' ? tempProfile.diets.length === 0 : tempProfile.diets.includes(diet.id)} 
                              onCheckedChange={() => toggleDiet(diet.id)}
                              className="rounded-md border-brand-primary/30 data-[state=checked]:bg-brand-primary"
                            />
                            <Label htmlFor={diet.id} className="text-[13px] font-bold text-brand-primary cursor-pointer">{t(diet.label)}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-brand-secondary/60 ml-1">{t('budget')}</Label>
                      <div className="flex gap-2 p-1.5 bg-brand-bg rounded-2xl border border-black/5">
                        {(['low', 'medium', 'high'] as const).map((b) => (
                          <Button
                            key={b}
                            variant={tempProfile.budget === b ? 'default' : 'ghost'}
                            onClick={() => setTempProfile({ ...tempProfile, budget: b })}
                            className={`flex-1 rounded-xl text-[10px] font-bold uppercase h-11 transition-all interactive-button ${
                              tempProfile.budget === b 
                                ? 'bg-brand-primary text-white shadow-md' 
                                : 'text-brand-secondary hover:bg-brand-accent/30'
                            }`}
                          >
                            {b === 'low' ? t('budget_low') : b === 'medium' ? t('budget_medium') : t('budget_high')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-brand-bg border-t border-black/5">
                  <Button 
                    onClick={() => {
                      setProfile(tempProfile);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full h-14 rounded-2xl bg-brand-primary text-white font-bold text-lg shadow-xl shadow-brand-primary/30 interactive-button"
                  >
                    {t('save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
              <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none p-6 text-center">
                <DialogHeader>
                  <div className="mx-auto bg-red-50 p-3 rounded-full w-fit mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-brand-primary mb-2 text-center">
                    {t('unsaved_changes_title')}
                  </DialogTitle>
                  <DialogDescription className="text-brand-secondary text-center">
                    {t('unsaved_changes_desc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-6">
                  <Button 
                    variant="destructive" 
                    className="rounded-xl h-12 font-bold"
                    onClick={() => {
                      setShowDiscardConfirm(false);
                      setIsSettingsOpen(false);
                    }}
                  >
                    {t('discard_changes')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl h-12 font-bold border-black/5"
                    onClick={() => setShowDiscardConfirm(false)}
                  >
                    {t('continue_editing')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 p-4 md:p-8 flex-1 w-full">
        
        {/* LEFT COLUMN: Fridge & Thought Process */}
        <div id="fridge-section" className="space-y-6 flex flex-col">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex flex-col h-fit">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-[13px] md:text-[14px] font-bold uppercase text-brand-secondary flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" /> {t('fridge_module')}
                </div>
                {profile.profileType === 'family' && (
                  <Badge variant="outline" className="text-[10px] border-brand-primary/20 text-brand-primary rounded-lg px-2 py-0">
                    {getPeopleString(profile.familySize || 1, i18n.language)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-1">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex flex-col py-3 border-b border-black/5 last:border-0 group">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-medium text-[#1A1A1A] flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center text-base">
                            {getProductEmoji(item.name)}
                          </span>
                          <span>
                            {item.name} {item.quantity && <span className="text-brand-secondary ml-1">({item.quantity})</span>}
                          </span>
                        </span>
                        <Tooltip>
                          <TooltipTrigger render={
                            <button 
                              onClick={() => removeItem(item.id)} 
                              className="md:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity w-10 h-10 flex items-center justify-center interactive-button rounded-xl hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          }>
                          </TooltipTrigger>
                          <TooltipContent side="right">{t('product_removed')}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="w-full h-1 bg-brand-bg rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.floor(Math.random() * 60) + 40}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input 
                      placeholder={t('product_placeholder')} 
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="h-11 text-xs rounded-xl border-black/5 bg-brand-bg focus:bg-white transition-colors pr-10"
                    />
                    <button 
                      onClick={() => handleVoiceInput((text) => setNewItem({ ...newItem, name: text }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-secondary/40 hover:text-brand-primary transition-colors h-8 w-8 flex items-center justify-center p-0"
                    >
                      <Mic className={`w-4 h-4 ${(isSpeaking || isListening) ? 'animate-pulse text-brand-primary' : ''}`} />
                    </button>
                  </div>
                  <Input 
                    placeholder={t('quantity_placeholder')} 
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="h-11 text-xs rounded-xl border-black/5 bg-brand-bg w-20 focus:bg-white transition-colors"
                  />
                  <Tooltip>
                    <TooltipTrigger render={<Button size="icon" onClick={addItem} className="h-11 w-11 shrink-0 bg-brand-primary rounded-xl interactive-button shadow-sm" />}>
                      <Plus className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top">{t('add_product')}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger render={<Button size="icon" variant="outline" onClick={clearInventory} className="h-11 w-11 shrink-0 rounded-xl border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 interactive-button" />}>
                      <Trash2 className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top">{t('clear_fridge')}</TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Input 
                    placeholder={t('query_placeholder')} 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-12 pr-32 rounded-xl border-black/5 bg-brand-bg focus:bg-white transition-colors"
                  />
                  <div className="absolute right-1 top-1 flex gap-1 items-center">
                    {query && (
                      <button 
                        onClick={() => setQuery('')}
                        className="p-2 text-brand-secondary/30 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => handleVoiceInput((text) => setQuery(text), true)}
                      className="h-10 w-10 text-brand-secondary/40 hover:text-brand-primary rounded-lg interactive-button"
                    >
                      <Mic className={`w-4 h-4 ${(isSpeaking || isListening) ? 'animate-pulse text-brand-primary' : ''}`} />
                    </Button>
                    <Tooltip>
                      <TooltipTrigger render={
                        <Button 
                          size="icon" 
                          onClick={() => handleGetAdvice()} 
                          disabled={isLoading}
                          className="h-10 w-10 bg-brand-primary rounded-lg interactive-button shadow-sm"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      }>
                      </TooltipTrigger>
                      <TooltipContent side="right">{t('ask_chef')}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {chatHistory.length > 0 && (
                  <div className="mt-4 space-y-3 bg-brand-bg rounded-2xl p-4 border border-black/5 max-h-[200px] overflow-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase text-brand-secondary/50 tracking-wider">
                        {t('conversation')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearChat}
                        className="h-6 text-[10px] text-red-400 hover:text-red-500 hover:bg-red-50"
                      >
                        {t('clear_chat')}
                      </Button>
                    </div>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-[1.2rem] px-4 py-2 text-[13px] ${
                          msg.role === 'user' 
                            ? 'bg-brand-primary text-white rounded-tr-none' 
                            : 'bg-white text-brand-primary border border-black/5 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {isSpeaking && (
                      <div className="flex justify-start">
                        <div className="bg-white/50 border border-brand-primary/20 rounded-2xl px-3 py-1 text-[10px] text-brand-primary flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                          </span>
                          {t('speaking')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {aiResponse && (
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex-1 flex flex-col">
              <CardHeader className="p-4 md:p-6 pb-2">
                <CardTitle className="text-[13px] md:text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> {t('thought_process')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col">
                <div className="bg-[#1A1C23] text-[#E0E1DD] p-5 rounded-2xl font-mono text-[11px] leading-relaxed flex-1 min-h-[160px] max-h-[300px] lg:max-h-none overflow-auto border border-white/5">
                  {aiResponse.thought_process.split('. ').map((line, i) => (
                    <div key={i} className="mb-2 flex gap-3">
                      <span className="text-brand-primary font-bold">{'>'}</span>
                      <span className="opacity-90">{line}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CENTER COLUMN: Main Suggestion */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden h-full flex flex-col">
            <CardHeader className="p-4 md:p-6 pb-2">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <CardTitle className="text-[13px] md:text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2 shrink-0">
                  <Utensils className="w-4 h-4" /> {t('current_suggestion')}
                </CardTitle>
                <div className="relative flex-1 w-full sm:max-w-[200px] md:max-w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-secondary/50" />
                  <Input 
                    placeholder={t('search_recipes_placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGetAdvice()}
                    className="pl-9 pr-14 rounded-xl bg-brand-bg/50 border-none h-10 md:h-8 text-[11px] md:text-[11px] font-medium focus-visible:ring-1 focus-visible:ring-brand-primary w-full"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                      <button 
                        onClick={() => setQuery('')}
                        className="text-brand-secondary/30 hover:text-red-400 transition-colors h-6 w-6 flex items-center justify-center p-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleVoiceInput((text) => setQuery(text), true)}
                      className="text-brand-secondary/40 hover:text-brand-primary transition-colors h-6 w-6 flex items-center justify-center p-0"
                    >
                      <Mic className={`w-3.5 h-3.5 ${(isSpeaking || isListening) ? 'animate-pulse text-brand-primary' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center py-20"
                  >
                    <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                    <p className="font-display font-bold text-xl">{t('loading_chef')}</p>
                    <p className="text-brand-secondary text-sm mt-1">{t('analyzing')}</p>
                  </motion.div>
                ) : aiResponse ? (
                  <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 flex flex-col"
                  >
                    {aiResponse.suggestions.map((suggestion, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="space-y-6"
                      >
                        <Dialog>
                          <DialogTrigger render={
                            <button className="w-full h-[240px] rounded-2xl overflow-hidden relative group cursor-pointer text-left border-none p-0 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 clickable-card">
                              <div 
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800')` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                              <div className="absolute bottom-6 left-6 right-6">
                                <Badge className="bg-brand-primary text-white border-none mb-3 px-3 py-1 font-bold uppercase text-[10px] tracking-wider">{suggestion.cuisine}</Badge>
                                <h2 className="text-2xl md:text-3xl font-display font-bold text-white leading-tight">{suggestion.dish_name}</h2>
                                <p className="text-white/80 text-sm mt-2 line-clamp-2 font-medium">{suggestion.description}</p>
                              </div>
                            </button>
                          } />
                          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
                            <div className="relative h-72 w-full">
                              <div 
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800')` }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                              <div className="absolute bottom-8 left-8 right-8">
                                <Badge className="bg-brand-primary text-white border-none mb-3 px-3 py-1 font-bold uppercase text-[10px] tracking-wider">{suggestion.cuisine}</Badge>
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-white">{suggestion.dish_name}</h2>
                              </div>
                            </div>
                            
                            <div className="p-8 md:p-10 space-y-10">
                              <div className="flex justify-between items-center p-6 bg-brand-bg rounded-3xl border border-black/5">
                                <div className="text-center flex-1">
                                  <p className="text-[10px] uppercase font-bold text-brand-secondary mb-1 tracking-widest">{t('time_unit')}</p>
                                  <p className="font-display font-bold text-brand-primary text-lg">{suggestion.time_minutes} {t('time_unit')}</p>
                                </div>
                                <div className="w-px h-10 bg-black/10 mx-4" />
                                <div className="text-center flex-1">
                                  <p className="text-[10px] uppercase font-bold text-brand-secondary mb-1 tracking-widest">{t('difficulty')}</p>
                                  <p className="font-display font-bold text-brand-primary text-lg">{suggestion.difficulty}</p>
                                </div>
                                <div className="w-px h-10 bg-black/10 mx-4" />
                                <div className="text-center flex-1">
                                  <p className="text-[10px] uppercase font-bold text-brand-secondary mb-1 tracking-widest">{t('budget_label')}</p>
                                  <p className="font-display font-bold text-brand-primary text-lg">{suggestion.suitability.includes('бюджетное') ? t('budget_low') : t('budget_medium')}</p>
                                </div>
                              </div>

                              <div className="space-y-6">
                                <h3 className="font-display font-bold text-xl flex items-center gap-3 text-[#1A1A1A]">
                                  <div className="p-2 bg-brand-accent/30 rounded-lg">
                                    <Package className="w-5 h-5 text-brand-primary" />
                                  </div>
                                  {t('ingredients')}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {suggestion.ingredients_needed.map((ing, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm text-brand-secondary bg-brand-bg p-3 rounded-2xl border border-black/5 hover:border-brand-primary/20 transition-colors">
                                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm border border-black/5 shrink-0">
                                        {getProductEmoji(ing)}
                                      </div>
                                      <span className="font-medium text-[13px]">{ing}</span>
                                    </div>
                                  ))}
                                </div>
                                {suggestion.missing_ingredients.length > 0 && (
                                  <div className="mt-6 p-6 bg-red-50/50 rounded-3xl border border-red-100">
                                    <p className="text-[11px] font-bold text-red-600 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                      <AlertCircle className="w-4 h-4" /> {t('missing_ingredients')}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {suggestion.missing_ingredients.map((ing, i) => (
                                        <Badge key={i} variant="outline" className="bg-white border-red-100 text-red-600 px-3 py-1 rounded-lg font-medium flex items-center gap-1.5">
                                          <span>{getProductEmoji(ing)}</span> {ing}
                                        </Badge>
                                      ))}
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg ml-auto interactive-button"
                                        onClick={() => addAllToShoppingList(suggestion.missing_ingredients)}
                                      >
                                        {t('add_all_to_shopping_list')}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-6">
                                <h3 className="font-display font-bold text-xl flex items-center gap-3 text-[#1A1A1A]">
                                  <div className="p-2 bg-brand-accent/30 rounded-lg">
                                    <Utensils className="w-5 h-5 text-brand-primary" />
                                  </div>
                                  {t('recipe_steps')}
                                </h3>
                                <div className="space-y-6">
                                  {suggestion.recipe.steps.map((step, i) => (
                                    <div key={i} className="flex gap-4 group">
                                      <div className="flex flex-col items-center gap-2 shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                          {i + 1}
                                        </div>
                                        {step.duration_minutes && (
                                          <div className="text-[10px] font-bold text-brand-primary/60 bg-brand-primary/5 px-2 py-0.5 rounded-full">
                                            {step.duration_minutes}м
                                          </div>
                                        )}
                                        {i < suggestion.recipe.steps.length - 1 && (
                                          <div className="w-0.5 flex-1 bg-brand-primary/10 rounded-full my-1" />
                                        )}
                                      </div>
                                      <div className="flex-1 pt-1">
                                        <p className="text-brand-secondary leading-relaxed text-sm font-medium">
                                          {step.instruction}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-[#E9EDC9] p-6 rounded-2xl border border-[#2D6A4F]/10">
                                <div className="flex items-start gap-3">
                                  <div className="bg-[#2D6A4F] p-2 rounded-lg shrink-0">
                                    <ChefHat className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-[#2D6A4F] mb-1">{t('chef_secret')}</h4>
                                    <p className="text-sm text-[#52796F] italic leading-relaxed">
                                      "{suggestion.recipe.chef_secret}"
                                    </p>
                                  </div>
                                </div>
                              </div>

                                <div className="p-6 bg-[#F4F7F5] rounded-3xl border border-black/5 text-center space-y-4">
                                  <p className="text-[14px] font-bold text-brand-secondary uppercase tracking-widest">{t('rate_recipe')}</p>
                                  <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => {
                                          setStarRatings(prev => ({ ...prev, [suggestion.dish_name]: star }));
                                          toast.success(t('rating_thanks'));
                                        }}
                                        className="transition-transform active:scale-95 group"
                                      >
                                        <Star 
                                          className={`w-8 h-8 transition-colors ${
                                            star <= (starRatings[suggestion.dish_name] || 0)
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-300 group-hover:text-yellow-200'
                                          }`} 
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex gap-3">
                                  <Button 
                                  className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] rounded-2xl h-14 font-bold text-lg shadow-lg shadow-[#2D6A4F]/20 interactive-button"
                                  onClick={() => {
                                    toast.success(t('cooking_started_msg') || 'Приятного аппетита! Пошаговый режим активирован.');
                                  }}
                                >
                                  {t('start_cooking')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="rounded-2xl h-14 w-14 border-black/5 hover:bg-[#F4F7F5] interactive-button" 
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.shopping_links.replace('Ссылка на поиск: ', ''))}`, '_blank')}
                                >
                                  <ExternalLink className="w-6 h-6" />
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        
                          <div className="flex gap-4 text-[12px] text-[#52796F] font-medium">
                            <span className="flex items-center gap-1">⏱️ {suggestion.time_minutes} {t('time_unit')}</span>
                            <span className="flex items-center gap-1">🔥 {suggestion.difficulty}</span>
                            <span className="text-[#2D6A4F] font-bold">$ {suggestion.suitability.includes('бюджетное') ? t('budget_low') : t('budget_medium')}</span>
                          </div>

                          <div className="space-y-3">
                            {suggestion.recipe.steps.map((step, i) => (
                              <div key={i} className="flex gap-3 text-[13px] text-brand-secondary leading-relaxed">
                                <span className="font-bold text-brand-primary shrink-0">0{i + 1}</span>
                                <p className="line-clamp-2">{step.instruction}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-4 space-y-4">
                            <div className="bg-[#FFF8E1] p-4 border-l-4 border-[#FFD54F] rounded-r-lg text-[12px] italic">
                              <strong>Секрет шефа:</strong> {suggestion.recipe.chef_secret}
                            </div>
                            
                            <div className="flex gap-2">
                              <DialogTrigger render={
                                <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl h-11 font-bold interactive-button">
                                  {t('start_cooking')}
                                </Button>
                              } />
                              <Button variant="outline" className="rounded-xl h-11 border-black/5 hover:bg-[#F4F7F5] interactive-button" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.shopping_links.replace('Ссылка на поиск: ', ''))}`, '_blank')}>
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Dialog>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-40">
                    <Utensils className="w-16 h-16 mb-4" />
                    <p className="font-bold">{t('empty_suggestion')}</p>
                    <p className="text-sm">{t('empty_suggestion_hint')}</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Planning & Shopping */}
        <div className="space-y-6 flex flex-col">
          <Card id="calendar-section" className="border-none shadow-sm bg-white rounded-3xl overflow-hidden h-fit">
            <CardHeader className="p-4 md:p-6 pb-2">
              <div className="flex justify-between items-center gap-2">
                <CardTitle className="text-[13px] md:text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {t('calendar')}
                </CardTitle>
                <button 
                  onClick={() => handleGetAdvice(t('plan_weekly'))}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold hover:bg-brand-primary/20 transition-all uppercase tracking-wider disabled:opacity-50 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span className="hidden sm:inline">{t('plan_weekly')}</span>
                  <span className="sm:hidden">7 {t('days_short')}</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
              <div className="grid grid-cols-7 gap-1.5 mb-6">
                {weekDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button 
                      key={day.toString()} 
                      onClick={() => setSelectedDate(day)}
                      className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all interactive-button ${
                        isSelected 
                          ? 'bg-brand-primary text-white shadow-md scale-105' 
                          : isToday
                            ? 'bg-brand-warm text-brand-primary border border-brand-primary/20'
                            : 'bg-brand-bg text-brand-secondary hover:bg-brand-accent/50'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase opacity-70">
                        {format(day, 'eeeeee', { locale: currentLocale })}
                      </span>
                      <span className="text-[14px] font-display font-bold">
                        {format(day, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="bg-brand-bg p-4 rounded-2xl border border-black/5 space-y-3">
                <p className="text-[12px] text-brand-secondary leading-relaxed">
                  📅 <strong className="text-brand-primary">{format(selectedDate, 'd MMMM', { locale: currentLocale })}:</strong> {aiResponse?.calendar_tip || t('no_plans')}
                </p>
                {aiResponse?.meal_plan && aiResponse.meal_plan.filter(m => isSameDay(new Date(m.day), selectedDate)).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-black/5">
                    {aiResponse.meal_plan
                      .filter(m => isSameDay(new Date(m.day), selectedDate))
                      .map((meal, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px]">
                          <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 h-4 border-brand-primary/20 text-brand-primary">
                            {meal.meal_type === 'breakfast' ? '🍳' : meal.meal_type === 'lunch' ? '🍲' : '🍽️'}
                          </Badge>
                          <span className="font-bold text-brand-primary truncate">{meal.dish_name}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4" /> {t('profile_recommendations')}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-11 w-11 rounded-xl hover:bg-brand-accent/30 interactive-button" 
                  onClick={() => handleGetRecommendations()}
                  disabled={isRecLoading}
                >
                  {isRecLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <ScrollArea className="h-[220px] pr-4">
                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, i) => (
                      <div key={i} className="p-3 md:p-4 rounded-2xl bg-brand-bg border border-black/5 space-y-2 hover:border-brand-primary/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[9px] uppercase font-bold border-none px-2 py-0.5 ${
                            rec.category === 'nutrition' ? 'bg-blue-50 text-blue-600' :
                            rec.category === 'lifestyle' ? 'bg-purple-50 text-purple-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {t(`rec_${rec.category}`)}
                          </Badge>
                          <span className="text-[13px] font-display font-bold text-brand-primary">{rec.title}</span>
                        </div>
                        <p className="text-[11px] text-brand-secondary leading-tight font-medium">{rec.description}</p>
                        <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-brand-primary uppercase tracking-wider">
                          <ChevronRight className="w-3 h-3" /> {rec.action_step}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-30 flex flex-col items-center">
                      <ChefHat className="w-10 h-10 mb-3" />
                      <p className="text-[11px] font-medium">{t('get_recommendations')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card id="shopping-list-section" className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex-1 flex flex-col">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-[13px] md:text-[14px] font-bold uppercase text-brand-secondary flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> {t('shopping_list')}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "w-8 h-8 rounded-full interactive-button transition-all",
                      (isListening || isSpeaking) && "animate-pulse bg-brand-primary/10 text-brand-primary"
                    )}
                    onClick={() => handleVoiceInput((text) => handleGetAdvice(text))}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  {profile.profileType === 'family' && (
                    <Badge variant="outline" className="text-[10px] border-brand-primary/20 text-brand-primary rounded-lg px-2 py-0">
                      {getPeopleString(profile.familySize || 1, i18n.language)}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2.5">
                  {(shoppingList.length > 0 || aiResponse) ? (
                    (() => {
                      const displayItems = shoppingList.length > 0 
                        ? shoppingList 
                        : (aiResponse?.suggestions.flatMap(s => s.missing_ingredients) || []);
                      
                      return displayItems.map((ing, i) => (
                        <div key={i} className="text-[13px] p-3 bg-brand-bg rounded-xl flex justify-between items-center group border border-black/5 hover:border-brand-primary/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-sm shadow-sm">
                              {getProductEmoji(ing)}
                            </span>
                            <span className="font-medium text-[#1A1A1A]">{ing}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-brand-primary underline text-[10px] font-bold uppercase tracking-wider cursor-pointer md:opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(ing)}`, '_blank')}
                            >
                              {t('market')}
                            </span>
                            {shoppingList.includes(ing) && (
                              <button 
                                onClick={() => removeShoppingItem(ing)}
                                className="md:opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ));
                    })()
                  ) : (
                    <div className="text-center py-12 opacity-20">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-[11px] font-medium">{t('empty_shopping_list')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {aiResponse?.cheapest_store_id && (
                <div className="mt-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center gap-3">
                  <div className="bg-brand-primary p-2 rounded-xl">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">{t('cheapest')}</p>
                    <p className="text-[12px] font-medium text-brand-secondary">
                      {t('est_price')}: <span className="font-bold">{aiResponse?.store_price_comparison?.find(c => c.storeId === aiResponse?.cheapest_store_id)?.estimatedPrice} {aiResponse?.currency}</span> в {aiResponse?.store_price_comparison?.find(c => c.storeId === aiResponse?.cheapest_store_id)?.storeName || t('unknown_store')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                <button 
                  onClick={() => setIsStoreModalOpen(true)}
                  className="w-full bg-brand-accent/30 p-5 rounded-2xl text-center space-y-1 group interactive-button border border-brand-accent/50"
                >
                  <div className="text-[15px] font-display font-bold text-brand-primary">{t('order_all')}</div>
                  <div className="text-[11px] font-medium text-brand-secondary opacity-80">{t('approx_price')}: {aiResponse?.estimated_total_price ? `${aiResponse.estimated_total_price} ${aiResponse?.currency}` : `0 ${aiResponse?.currency || ''}`}</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        </main>

        {/* Store Selection Dialog */}
        <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
          <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden border-none bg-white">
            <DialogHeader className="p-6 bg-brand-bg border-b border-black/5">
              <DialogTitle className="text-xl font-display font-bold text-brand-primary flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> {t('select_store')}
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {aiResponse?.store_price_comparison ? (
                aiResponse.store_price_comparison.map((store) => {
                  const isCheapest = aiResponse.cheapest_store_id === store.storeId;

                  return (
                    <button
                      key={store.storeId}
                      disabled={isCheckoutLoading}
                      onClick={() => handlePlaceOrder(store)}
                      className={cn(
                        "group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-brand-bg hover:bg-white border transition-all interactive-button overflow-hidden",
                        isCheapest ? "border-brand-primary/40 ring-1 ring-brand-primary/20" : "border-black/5 hover:border-brand-primary/20",
                        isCheckoutLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isCheapest && (
                        <Badge className="absolute top-2 right-2 bg-brand-primary text-white text-[8px] px-1.5 py-0 h-4 border-none uppercase font-bold animate-pulse">
                          {t('cheapest')}
                        </Badge>
                      )}
                      <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-brand-primary/10 text-brand-primary text-xl font-bold shadow-sm">
                        {store.storeName.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-brand-secondary text-center leading-tight">
                        {store.storeName}
                      </span>
                      <span className="text-[10px] font-medium text-brand-primary mt-1">
                        ~{store.estimatedPrice} {aiResponse?.currency}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 py-10 text-center text-brand-secondary text-[11px] font-medium opacity-60">
                  {t('no_stores_found')}
                </div>
              )}
            </div>
            <div className="p-4 bg-brand-bg border-t border-black/5">
              <Button 
                variant="ghost" 
                onClick={() => setIsStoreModalOpen(false)}
                className="w-full h-12 rounded-xl text-brand-secondary font-bold uppercase text-[10px] tracking-widest interactive-button"
              >
                 {t('discard_changes')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}
