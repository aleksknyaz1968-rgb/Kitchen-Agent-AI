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
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster, toast } from 'sonner';
import { InventoryItem, UserProfile, AgentResponse, Suggestion, ProfileRecommendation } from './types';
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

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });
  }, []);

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

  const clearInventory = () => {
    if (inventory.length === 0) return;
    setInventory([]);
    toast.info(t('empty_fridge'));
  };

  const handleGetAdvice = async (overrideInventory?: InventoryItem[], overrideProfile?: UserProfile) => {
    setIsLoading(true);
    try {
      const response = await getCulinaryAdvice(
        overrideInventory || inventory, 
        overrideProfile || profile, 
        query || t('query_placeholder'),
        i18n.language
      );
      setAiResponse(response);
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
        handleGetAdvice(currentInventory, currentProfile);
      }
    };

    updateAllContent();
  }, [i18n.language]);

  const toggleDiet = (diet: string) => {
    setProfile(prev => {
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
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger render={<button className="bg-brand-primary p-2.5 rounded-xl interactive-button flex items-center justify-center border-none shadow-sm" />}>
                <ChefHat className="w-6 h-6 text-white" />
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('ask_chef')}</TooltipContent>
            </Tooltip>
            <span className="font-display font-bold text-2xl tracking-tight text-brand-primary">{t('app_name')}</span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex gap-1.5 bg-brand-bg p-1.5 rounded-2xl border border-black/5">
              {['ru', 'en', 'zh'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase transition-all interactive-button min-w-[44px] h-11 flex items-center justify-center ${
                    i18n.language === lang 
                      ? 'bg-brand-primary text-white shadow-md' 
                      : 'text-brand-secondary hover:bg-brand-accent/50'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex gap-2 max-w-[500px] flex-wrap justify-end">
              <Badge className="bg-brand-primary text-white border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase shadow-sm">
                {t(`profile_${profile.profileType}`)}
              </Badge>
              
              {profile.profileType === 'individual' && (
                <>
                  <Badge className="bg-brand-accent text-brand-primary border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                    {t(`gender_${profile.gender}`)}, {getAgeString(profile.age || 0, i18n.language)}
                  </Badge>
                  {profile.chronicIllnesses && profile.chronicIllnesses.length > 0 && (
                    <Badge className="bg-red-50 text-red-600 border-red-100 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                      {profile.chronicIllnesses.join(', ')}
                    </Badge>
                  )}
                </>
              )}

              {profile.profileType === 'family' && (
                <Badge className="bg-brand-accent text-brand-primary border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                  {getPeopleString(profile.familySize || 1, i18n.language)}
                </Badge>
              )}

              {profile.diets.length > 0 ? (
                profile.diets.map(diet => (
                  <Badge key={diet} className="bg-brand-accent text-brand-primary hover:bg-brand-accent border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                    {t('diet_label')}: {t(`diet_${diet}`)}
                  </Badge>
                ))
              ) : (
                <Badge className="bg-brand-accent text-brand-primary border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                  {t('diet_label')}: {t('diet_none')}
                </Badge>
              )}
              <Badge className="bg-brand-warm text-brand-primary hover:bg-brand-warm border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase">
                {t('budget_label')}: {profile.budget === 'low' ? t('budget_low') : profile.budget === 'medium' ? t('budget_medium') : t('budget_high')}
              </Badge>
            </div>
            
            <Dialog>
              <Tooltip>
                <TooltipTrigger render={
                  <DialogTrigger render={
                    <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-brand-accent/30 w-11 h-11 interactive-button border border-black/5">
                      <Settings className="w-5 h-5 text-brand-secondary" />
                    </Button>
                  } />
                } />
                <TooltipContent side="bottom">{t('settings')}</TooltipContent>
              </Tooltip>
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
                          variant={profile.profileType === type ? 'default' : 'ghost'}
                          onClick={() => setProfile({ ...profile, profileType: type })}
                          className={`flex-1 rounded-xl text-xs font-bold h-12 transition-all interactive-button ${
                            profile.profileType === type 
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
                      key={profile.profileType}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-8"
                    >
                      {profile.profileType === 'family' ? (
                        <div className="space-y-4 p-5 rounded-3xl bg-brand-warm/30 border border-brand-primary/10">
                          <Label className="text-[12px] font-bold text-brand-primary flex items-center gap-2">
                            <Package className="w-4 h-4" /> {t('family_size')}
                          </Label>
                          <Input 
                            type="number" 
                            min="1"
                            value={profile.familySize || ''} 
                            onChange={(e) => setProfile({ ...profile, familySize: parseInt(e.target.value) || 1 })}
                            className="h-14 text-lg font-bold rounded-2xl border-brand-primary/20 bg-white focus:ring-brand-primary/20 transition-all"
                          />
                          <p className="text-[10px] text-brand-secondary font-medium opacity-70">
                            * Количество ингредиентов в списке покупок будет рассчитано на {profile.familySize || 2} чел.
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
                                    onClick={() => setProfile({ ...profile, gender: g })}
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition-all interactive-button ${
                                      profile.gender === g 
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
                                value={profile.age || ''} 
                                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
                                className="h-12 text-sm font-bold rounded-xl border-black/10 bg-white focus:border-brand-primary transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-[10px] font-bold uppercase text-brand-secondary/70 ml-1">{t('chronic_illnesses')}</Label>
                            <Input 
                              placeholder={t('illness_placeholder')}
                              value={profile.chronicIllnesses?.join(', ') || ''}
                              onChange={(e) => setProfile({ ...profile, chronicIllnesses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
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
                              (diet.id === 'none' ? profile.diets.length === 0 : profile.diets.includes(diet.id))
                                ? 'bg-brand-primary/5 border-brand-primary/30'
                                : 'bg-white border-black/5 hover:border-brand-primary/20'
                            }`}
                            onClick={() => toggleDiet(diet.id)}
                          >
                            <Checkbox 
                              id={diet.id} 
                              checked={diet.id === 'none' ? profile.diets.length === 0 : profile.diets.includes(diet.id)} 
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
                            variant={profile.budget === b ? 'default' : 'ghost'}
                            onClick={() => setProfile({ ...profile, budget: b })}
                            className={`flex-1 rounded-xl text-[10px] font-bold uppercase h-11 transition-all interactive-button ${
                              profile.budget === b 
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
                  <DialogClose render={
                    <Button className="w-full h-14 rounded-2xl bg-brand-primary text-white font-bold text-lg shadow-xl shadow-brand-primary/30 interactive-button">
                      {t('save')}
                    </Button>
                  } />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

      {/* Main Grid */}
      <main className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6 p-4 md:p-8 flex-1 w-full">
        
        {/* LEFT COLUMN: Fridge & Thought Process */}
        <div className="space-y-6 flex flex-col">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex flex-col h-fit">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center justify-between w-full">
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
            <CardContent className="p-6 pt-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-1">
                  {inventory.map((item) => (
                    <div key={item.id} className="flex flex-col py-3 border-b border-black/5 last:border-0 group">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-medium text-[#1A1A1A]">{item.name} {item.quantity && <span className="text-brand-secondary ml-1">({item.quantity})</span>}</span>
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
                  <Input 
                    placeholder={t('product_placeholder')} 
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="h-11 text-xs rounded-xl border-black/5 bg-brand-bg focus:bg-white transition-colors"
                  />
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
                    className="h-12 pr-14 rounded-xl border-black/5 bg-brand-bg focus:bg-white transition-colors"
                  />
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        size="icon" 
                        onClick={() => handleGetAdvice()} 
                        disabled={isLoading}
                        className="absolute right-1 top-1 h-10 w-10 bg-brand-primary rounded-lg interactive-button shadow-sm"
                      />
                    }>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('ask_chef')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>

          {aiResponse && (
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex-1 flex flex-col">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> {t('thought_process')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 flex-1 flex flex-col">
                <div className="bg-[#1A1C23] text-[#E0E1DD] p-5 rounded-2xl font-mono text-[11px] leading-relaxed flex-1 overflow-auto border border-white/5">
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
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2">
                <Utensils className="w-4 h-4" /> {t('current_suggestion')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex-1 flex flex-col">
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
                                    <div key={i} className="flex items-center gap-3 text-sm text-brand-secondary bg-brand-bg p-4 rounded-2xl border border-black/5 hover:border-brand-primary/20 transition-colors">
                                      <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                                      <span className="font-medium">{ing}</span>
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
                                        <Badge key={i} variant="outline" className="bg-white border-red-100 text-red-600 px-3 py-1 rounded-lg font-medium">
                                          {ing}
                                        </Badge>
                                      ))}
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

                              <div className="flex gap-3">
                                <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] rounded-2xl h-14 font-bold text-lg shadow-lg shadow-[#2D6A4F]/20">
                                  {t('start_cooking')}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="rounded-2xl h-14 w-14 border-black/5 hover:bg-[#F4F7F5]" 
                                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.shopping_links.replace('Ссылка на поиск: ', ''))}`, '_blank')}
                                >
                                  <ExternalLink className="w-6 h-6" />
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

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
                            <Button className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] rounded-xl h-11 font-bold">
                              Начать готовить
                            </Button>
                            <Button variant="outline" className="rounded-xl h-11 border-black/5 hover:bg-[#F4F7F5]" onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(suggestion.shopping_links.replace('Ссылка на поиск: ', ''))}`, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
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
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden h-fit">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {t('calendar')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
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
            <CardHeader className="p-6 pb-2">
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
                      <div key={i} className="p-4 rounded-2xl bg-brand-bg border border-black/5 space-y-2 hover:border-brand-primary/20 transition-colors">
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

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden flex-1 flex flex-col">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-[14px] font-bold uppercase text-brand-secondary flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> {t('shopping_list')}
                </div>
                {profile.profileType === 'family' && (
                  <Badge variant="outline" className="text-[10px] border-brand-primary/20 text-brand-primary rounded-lg px-2 py-0">
                    {getPeopleString(profile.familySize || 1, i18n.language)}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2.5">
                  {aiResponse ? (
                    aiResponse.suggestions.flatMap(s => s.missing_ingredients).map((ing, i) => (
                      <div key={i} className="text-[13px] p-3 bg-brand-bg rounded-xl flex justify-between items-center group border border-black/5 hover:border-brand-primary/10 transition-colors">
                        <span className="font-medium text-[#1A1A1A]">{ing}</span>
                        <span 
                          className="text-brand-primary underline text-[10px] font-bold uppercase tracking-wider cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(ing)}`, '_blank')}
                        >
                          {t('market')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 opacity-20">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-[11px] font-medium">{t('empty_shopping_list')}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="mt-auto pt-6">
                <button className="w-full bg-brand-accent/30 p-5 rounded-2xl text-center space-y-1 group interactive-button border border-brand-accent/50">
                  <div className="text-[15px] font-display font-bold text-brand-primary">{t('order_all')}</div>
                  <div className="text-[11px] font-medium text-brand-secondary opacity-80">{t('approx_price')}: {aiResponse?.estimated_total_price_rub ? `${aiResponse.estimated_total_price_rub}₽` : '0₽'}</div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
      </div>
    </TooltipProvider>
  );
}
