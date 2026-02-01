import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/language-context";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Database,
  TrendingUp,
  Tag,
  Clock,
  Store,
  X,
  MessageSquare,
  Trash2,
  Copy,
  RotateCcw,
  Zap,
  AlertTriangle,
  Play,
  Languages
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChatLanguage = "en" | "fi" | "ar";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sqlExecuted?: string;
  sqlResult?: any;
  error?: string;
  isExecuting?: boolean;
  pendingConfirmation?: boolean;
  isDestructive?: boolean;
}

interface PendingQuery {
  sql: string;
  explanation: string;
  isDestructive: boolean;
  messageId: string;
}

interface SuggestionCategory {
  icon: React.ReactNode;
  title: { en: string; fi: string; ar: string };
  suggestions: { en: string; fi: string; ar: string }[];
}

// Translations
const translations = {
  en: {
    aiAssistant: "AI Assistant",
    manageSmartly: "Manage your restaurant smartly",
    clearChat: "Clear chat",
    welcome: "Welcome to AI Assistant!",
    welcomeDesc: "I can help you analyze sales, create offers, manage products and much more.",
    typeMessage: "Type your message...",
    newChat: "New chat",
    processing: "Processing...",
    result: "Result",
    error: "Error",
    executed: "Executed",
    querySuccess: "Query executed successfully",
    changesSaved: "Changes saved successfully",
    copied: "Copied",
    textCopied: "Text copied to clipboard",
    confirmAction: "Confirm Action",
    confirmDesc: "This action will modify the database. Are you sure you want to continue?",
    cancel: "Cancel",
    execute: "Execute",
    modifyData: "This action will modify data",
    operationCancelled: "Operation cancelled",
    andMoreRows: "...and {count} more rows",
    errorOccurred: "Sorry, an error occurred. Please try again.",
    unknownError: "Unknown error",
    salesAnalysis: "Sales Analysis",
    promotions: "Promotions",
    workingHours: "Working Hours",
    productManagement: "Product Management",
  },
  fi: {
    aiAssistant: "AI Avustaja",
    manageSmartly: "Hallitse ravintolaasi älykkäästi",
    clearChat: "Tyhjennä keskustelu",
    welcome: "Tervetuloa AI Avustajaan!",
    welcomeDesc: "Voin auttaa sinua analysoimaan myyntiä, luomaan tarjouksia, hallitsemaan tuotteita ja paljon muuta.",
    typeMessage: "Kirjoita viestisi...",
    newChat: "Uusi keskustelu",
    processing: "Käsitellään...",
    result: "Tulos",
    error: "Virhe",
    executed: "Suoritettu",
    querySuccess: "Kysely suoritettu onnistuneesti",
    changesSaved: "Muutokset tallennettu onnistuneesti",
    copied: "Kopioitu",
    textCopied: "Teksti kopioitu leikepöydälle",
    confirmAction: "Vahvista toiminto",
    confirmDesc: "Tämä toiminto muuttaa tietokantaa. Haluatko varmasti jatkaa?",
    cancel: "Peruuta",
    execute: "Suorita",
    modifyData: "Tämä toiminto muuttaa tietoja",
    operationCancelled: "Toiminto peruutettu",
    andMoreRows: "...ja {count} muuta riviä",
    errorOccurred: "Anteeksi, tapahtui virhe. Yritä uudelleen.",
    unknownError: "Tuntematon virhe",
    salesAnalysis: "Myyntianalyysi",
    promotions: "Tarjoukset",
    workingHours: "Aukioloajat",
    productManagement: "Tuotehallinta",
  },
  ar: {
    aiAssistant: "مساعد الذكاء الاصطناعي",
    manageSmartly: "أدر مطعمك بذكاء",
    clearChat: "مسح المحادثة",
    welcome: "مرحباً بك في مساعد الذكاء الاصطناعي!",
    welcomeDesc: "يمكنني مساعدتك في تحليل المبيعات وإنشاء العروض وإدارة المنتجات والمزيد.",
    typeMessage: "اكتب رسالتك...",
    newChat: "محادثة جديدة",
    processing: "جاري المعالجة...",
    result: "النتيجة",
    error: "خطأ",
    executed: "تم التنفيذ",
    querySuccess: "تم تنفيذ الاستعلام بنجاح",
    changesSaved: "تم حفظ التغييرات بنجاح",
    copied: "تم النسخ",
    textCopied: "تم نسخ النص إلى الحافظة",
    confirmAction: "تأكيد الإجراء",
    confirmDesc: "هذا الإجراء سيعدل قاعدة البيانات. هل أنت متأكد من المتابعة؟",
    cancel: "إلغاء",
    execute: "تنفيذ",
    modifyData: "هذا الإجراء سيعدل البيانات",
    operationCancelled: "تم إلغاء العملية",
    andMoreRows: "...و {count} صفوف أخرى",
    errorOccurred: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.",
    unknownError: "خطأ غير معروف",
    salesAnalysis: "تحليل المبيعات",
    promotions: "العروض",
    workingHours: "ساعات العمل",
    productManagement: "إدارة المنتجات",
  }
};

const OPENROUTER_API_KEY = "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";
const MODEL = "z-ai/glm-4.5-air:free";

export function AIAssistantChat() {
  const { language: appLanguage } = useLanguage();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [chatLanguage, setChatLanguage] = useState<ChatLanguage>("en");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<PendingQuery | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[chatLanguage];
  const isRTL = chatLanguage === "ar";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const suggestionCategories: SuggestionCategory[] = [
    {
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      title: { 
        en: "Sales Analysis", 
        fi: "Myyntianalyysi", 
        ar: "تحليل المبيعات" 
      },
      suggestions: [
        { en: "Analyze this week's sales", fi: "Analysoi tämän viikon myynti", ar: "تحليل مبيعات هذا الأسبوع" },
        { en: "Which products sell best?", fi: "Mitkä tuotteet myyvät parhaiten?", ar: "ما هي المنتجات الأكثر مبيعاً؟" },
        { en: "Compare this and last month's sales", fi: "Vertaile tämän ja viime kuukauden myyntiä", ar: "قارن مبيعات هذا الشهر بالشهر الماضي" },
      ]
    },
    {
      icon: <Tag className="w-4 h-4 text-orange-500" />,
      title: { 
        en: "Promotions", 
        fi: "Tarjoukset", 
        ar: "العروض" 
      },
      suggestions: [
        { en: "Create 20% offer for Margherita pizza", fi: "Luo 20% tarjous Margherita-pizzalle", ar: "إنشاء عرض 20% على بيتزا مارجريتا" },
        { en: "Suggest offers for poor selling products", fi: "Ehdota tarjouksia huonommin myyville tuotteille", ar: "اقترح عروضاً للمنتجات ضعيفة المبيعات" },
        { en: "Remove all expired offers", fi: "Poista kaikki vanhentuneet tarjoukset", ar: "إزالة جميع العروض المنتهية" },
      ]
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      title: { 
        en: "Working Hours", 
        fi: "Aukioloajat", 
        ar: "ساعات العمل" 
      },
      suggestions: [
        { en: "Show current working hours", fi: "Näytä nykyiset aukioloajat", ar: "عرض ساعات العمل الحالية" },
        { en: "Change Saturday hours to 12-23", fi: "Muuta lauantain aukioloajaksi 12-23", ar: "تغيير ساعات السبت إلى 12-23" },
        { en: "Close restaurant for tomorrow", fi: "Sulje ravintola huomiseksi", ar: "إغلاق المطعم غداً" },
      ]
    },
    {
      icon: <Store className="w-4 h-4 text-purple-500" />,
      title: { 
        en: "Product Management", 
        fi: "Tuotehallinta", 
        ar: "إدارة المنتجات" 
      },
      suggestions: [
        { en: "Mark 'Pepperoni Pizza' as unavailable", fi: "Merkitse 'Pepperoni Pizza' loppuneeksi", ar: "وضع علامة 'بيتزا بيبروني' غير متوفرة" },
        { en: "Increase all pizza prices by 5%", fi: "Nosta kaikkien pizzojen hintoja 5%", ar: "زيادة أسعار جميع البيتزا بنسبة 5%" },
        { en: "List all products without images", fi: "Listaa kaikki tuotteet ilman kuvia", ar: "عرض جميع المنتجات بدون صور" },
      ]
    }
  ];

  // Get database schema context for the AI
  const getDatabaseContext = () => {
    const languageInstruction = chatLanguage === "fi" 
      ? "Respond in Finnish." 
      : chatLanguage === "ar" 
        ? "Respond in Arabic." 
        : "Respond in English.";
    
    return `You are an AI assistant for a restaurant admin panel (Babylon Restaurant). You help manage the restaurant through SQL queries on a PostgreSQL database.

DATABASE SCHEMA:
- categories: id, name, name_en, display_order, is_active
- branches: id, name, name_en, address, city, postal_code, latitude, longitude, phone, email, is_active, display_order, opening_hours (jsonb)
- menu_items: id, category_id, name, name_en, description, description_en, price, image_url, is_vegetarian, is_vegan, is_gluten_free, display_order, is_available, offer_price, offer_percentage, offer_start_date, offer_end_date, has_conditional_pricing, included_toppings_count, branch_id
- orders: id, order_number, customer_name, customer_phone, customer_email, delivery_address, order_type, branch_id, status, subtotal, delivery_fee, small_order_fee, total_amount, payment_method, payment_status, stripe_payment_intent_id, special_instructions, created_at, updated_at
- order_items: id, order_id, menu_item_id, quantity, unit_price, total_price, special_instructions
- toppings: id, name, name_en, name_ar, price, is_active, display_order, category, type, is_required
- topping_groups: id, name, name_en, is_required, max_selections, min_selections, display_order
- restaurant_settings: id, is_open, opening_hours, pickup_hours, delivery_hours, lunch_buffet_hours, special_message, stripe_enabled, online_payment_service_fee
- restaurant_config: id, name, name_en, tagline, tagline_en, description, description_en, phone, email, address (jsonb), social_media (jsonb), hours (jsonb), services (jsonb), delivery_config (jsonb), theme (jsonb)

IMPORTANT RULES:
1. ONLY generate SELECT, UPDATE, INSERT queries for safe operations
2. NEVER generate DELETE queries that could delete critical data without explicit user confirmation
3. For offers/promotions, use the offer_price, offer_percentage, offer_start_date, offer_end_date fields in menu_items
4. Always return the SQL query in a JSON format: {"sql": "YOUR_SQL_QUERY", "explanation": "Brief explanation", "isDestructive": true/false}
5. If the request is unclear or potentially dangerous, ask for clarification
6. For analysis queries, generate detailed SELECT queries with aggregations
7. When creating offers, set reasonable date ranges (e.g., 1-2 weeks)
8. Times should be in 24-hour format
9. Currency is in EUR (€)

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

${languageInstruction}`;
  };

  // Parse AI response to extract SQL and explanation
  const parseAIResponse = (content: string): { sql?: string; explanation: string; isDestructive?: boolean } => {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*"sql"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sql: parsed.sql,
          explanation: parsed.explanation || content.replace(jsonMatch[0], '').trim(),
          isDestructive: parsed.isDestructive || false
        };
      }
    } catch (e) {
      // If JSON parsing fails, just return the content as explanation
    }
    return { explanation: content };
  };

  // Execute SQL query via server API
  const executeSQLQuery = async (sql: string, isDestructive: boolean = false): Promise<{ data: any; error: string | null }> => {
    try {
      const response = await fetch('/api/ai/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, isDestructive }),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { data: null, error: result.error || 'Query execution failed' };
      }
      
      return { data: result.data, error: null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  };

  // Send message to OpenRouter AI
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Add thinking message
    const thinkingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isExecuting: true
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Babylon Restaurant Admin"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: getDatabaseContext() },
            ...messages.filter(m => m.role !== "system").map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: "user", content: content.trim() }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || "";
      
      const parsed = parseAIResponse(aiContent);
      
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));

      // If there's SQL to execute
      if (parsed.sql) {
        const messageId = (Date.now() + 2).toString();
        
        // Check if it's a destructive operation (UPDATE, DELETE, INSERT)
        const normalizedSql = parsed.sql.trim().toLowerCase();
        const isDestructiveOp = normalizedSql.startsWith('update') || 
                               normalizedSql.startsWith('delete') || 
                               normalizedSql.startsWith('insert');
        
        const assistantMessage: Message = {
          id: messageId,
          role: "assistant",
          content: parsed.explanation,
          timestamp: new Date(),
          sqlExecuted: parsed.sql,
          isExecuting: false,
          pendingConfirmation: isDestructiveOp,
          isDestructive: isDestructiveOp
        };
        setMessages(prev => [...prev, assistantMessage]);

        // If destructive, wait for confirmation. Otherwise, execute immediately.
        if (isDestructiveOp) {
          setPendingQuery({
            sql: parsed.sql,
            explanation: parsed.explanation,
            isDestructive: true,
            messageId
          });
          setShowConfirmDialog(true);
        } else {
          // Execute SELECT queries immediately
          setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, isExecuting: true } : m
          ));
          
          const { data: sqlData, error: sqlError } = await executeSQLQuery(parsed.sql, false);
          
          setMessages(prev => prev.map(m => 
            m.id === messageId 
              ? { ...m, sqlResult: sqlData, error: sqlError || undefined, isExecuting: false, pendingConfirmation: false }
              : m
          ));

          if (sqlError) {
            toast({
              title: t.error,
              description: sqlError,
              variant: "destructive"
            });
          } else {
            toast({
              title: t.executed,
              description: t.querySuccess,
            });
          }
        }
      } else {
        // Just a conversational response
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: parsed.explanation || aiContent,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMessage.id));

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: t.errorOccurred,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : t.unknownError
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.unknownError,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, toast, t, chatLanguage]);

  // Handle confirmation of destructive queries
  const handleConfirmQuery = async () => {
    if (!pendingQuery) return;
    
    setShowConfirmDialog(false);
    
    // Update message to show executing
    setMessages(prev => prev.map(m => 
      m.id === pendingQuery.messageId 
        ? { ...m, isExecuting: true, pendingConfirmation: false }
        : m
    ));
    
    const { data: sqlData, error: sqlError } = await executeSQLQuery(pendingQuery.sql, true);
    
    // Update message with results
    setMessages(prev => prev.map(m => 
      m.id === pendingQuery.messageId 
        ? { ...m, sqlResult: sqlData, error: sqlError || undefined, isExecuting: false }
        : m
    ));
    
    if (sqlError) {
      toast({
        title: t.error,
        description: sqlError,
        variant: "destructive"
      });
    } else {
      toast({
        title: t.executed,
        description: t.changesSaved,
      });
    }
    
    setPendingQuery(null);
  };
  
  const handleCancelQuery = () => {
    setShowConfirmDialog(false);
    
    // Update message to show cancelled
    if (pendingQuery) {
      setMessages(prev => prev.map(m => 
        m.id === pendingQuery.messageId 
          ? { ...m, pendingConfirmation: false, error: t.operationCancelled }
          : m
      ));
    }
    
    setPendingQuery(null);
  };

  // Execute a pending query manually (from message UI)
  const executeManualQuery = async (messageId: string, sql: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, isExecuting: true, pendingConfirmation: false }
        : m
    ));
    
    const { data: sqlData, error: sqlError } = await executeSQLQuery(sql, true);
    
    setMessages(prev => prev.map(m => 
      m.id === messageId 
        ? { ...m, sqlResult: sqlData, error: sqlError || undefined, isExecuting: false }
        : m
    ));
    
    if (sqlError) {
      toast({
        title: t.error,
        description: sqlError,
        variant: "destructive"
      });
    } else {
      toast({
        title: t.executed,
        description: t.changesSaved,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion: { en: string; fi: string; ar: string }) => {
    sendMessage(suggestion[chatLanguage]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t.copied,
      description: t.textCopied,
    });
  };

  const formatSQLResult = (result: any) => {
    if (!result) return null;
    
    if (Array.isArray(result) && result.length > 0) {
      const keys = Object.keys(result[0]);
      return (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                {keys.map(key => (
                  <th key={key} className="px-2 py-1 text-left border border-gray-200 dark:border-gray-600">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.slice(0, 10).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {keys.map(key => (
                    <td key={key} className="px-2 py-1 border border-gray-200 dark:border-gray-600">
                      {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {result.length > 10 && (
            <p className="text-xs text-gray-500 mt-1">
              {t.andMoreRows.replace('{count}', String(result.length - 10))}
            </p>
          )}
        </div>
      );
    }
    
    return (
      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  const languageOptions = [
    { code: "en" as ChatLanguage, label: "English", flag: "🇬🇧" },
    { code: "fi" as ChatLanguage, label: "Suomi", flag: "🇫🇮" },
    { code: "ar" as ChatLanguage, label: "العربية", flag: "🇸🇦" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 z-50"
          size="icon"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className={cn(
          "w-full sm:w-[500px] md:w-[600px] p-0 flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
          isRTL && "text-right"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-white text-lg font-bold">
                  {t.aiAssistant}
                </SheetTitle>
                <SheetDescription className="text-violet-100 text-sm">
                  {t.manageSmartly}
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 gap-1.5"
                  >
                    <Languages className="w-4 h-4" />
                    <span className="text-sm">
                      {languageOptions.find(l => l.code === chatLanguage)?.flag}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languageOptions.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => setChatLanguage(lang.code)}
                      className={cn(
                        "gap-2 cursor-pointer",
                        chatLanguage === lang.code && "bg-violet-50 dark:bg-violet-900/20"
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                      {chatLanguage === lang.code && (
                        <CheckCircle className="w-3 h-3 ml-auto text-violet-600" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="text-white hover:bg-white/20"
                title={t.clearChat}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t.welcome}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                  {t.welcomeDesc}
                </p>
              </div>

              {/* Suggestion Categories */}
              <div className="space-y-4">
                {suggestionCategories.map((category, idx) => (
                  <Card key={idx} className="border-0 shadow-sm bg-white dark:bg-gray-800/50">
                    <CardHeader className="pb-2">
                      <CardTitle className={cn(
                        "text-sm font-medium flex items-center gap-2",
                        isRTL && "flex-row-reverse"
                      )}>
                        {category.icon}
                        {category.title[chatLanguage]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {category.suggestions.map((suggestion, sIdx) => (
                          <Button
                            key={sIdx}
                            variant="outline"
                            size="sm"
                            className="text-xs h-auto py-1.5 px-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion[chatLanguage]}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" 
                      ? isRTL ? "flex-row" : "flex-row-reverse" 
                      : isRTL ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user" 
                      ? "bg-blue-600" 
                      : "bg-gradient-to-r from-violet-600 to-indigo-600"
                  )}>
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={cn(
                    "flex-1 max-w-[85%]",
                    message.role === "user" 
                      ? isRTL ? "text-left" : "text-right"
                      : isRTL ? "text-right" : "text-left"
                  )}>
                    <div className={cn(
                      "inline-block rounded-2xl px-4 py-2.5",
                      message.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-tl-sm"
                    )}>
                      {message.isExecuting ? (
                        <div className={cn(
                          "flex items-center gap-2 text-gray-600 dark:text-gray-400",
                          isRTL && "flex-row-reverse"
                        )}>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">{t.processing}</span>
                        </div>
                      ) : (
                        <>
                          <p className={cn(
                            "text-sm whitespace-pre-wrap",
                            message.role === "user" ? "text-white" : "text-gray-800 dark:text-gray-200"
                          )}>
                            {message.content}
                          </p>

                          {/* SQL Query Display */}
                          {message.sqlExecuted && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="flex items-center justify-between mb-1">
                                <div className={cn(
                                  "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400",
                                  isRTL && "flex-row-reverse"
                                )}>
                                  <Database className="w-3 h-3" />
                                  <span>SQL</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(message.sqlExecuted!)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto" dir="ltr">
                                {message.sqlExecuted}
                              </pre>
                            </div>
                          )}

                          {/* SQL Result */}
                          {message.sqlResult && !message.error && (
                            <div className="mt-2">
                              <div className={cn(
                                "flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1",
                                isRTL && "flex-row-reverse"
                              )}>
                                <CheckCircle className="w-3 h-3" />
                                <span>{t.result}</span>
                              </div>
                              {formatSQLResult(message.sqlResult)}
                            </div>
                          )}

                          {/* Error Display */}
                          {message.error && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                              <div className={cn(
                                "flex items-center gap-1 text-xs text-red-600 dark:text-red-400",
                                isRTL && "flex-row-reverse"
                              )}>
                                <AlertCircle className="w-3 h-3" />
                                <span>{message.error}</span>
                              </div>
                            </div>
                          )}

                          {/* Pending Confirmation UI */}
                          {message.pendingConfirmation && message.sqlExecuted && (
                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                              <div className={cn(
                                "flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2",
                                isRTL && "flex-row-reverse"
                              )}>
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">{t.modifyData}</span>
                              </div>
                              <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                                <Button
                                  size="sm"
                                  onClick={() => executeManualQuery(message.id, message.sqlExecuted!)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                  <Play className={cn("w-3 h-3", isRTL ? "ml-1" : "mr-1")} />
                                  {t.execute}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setMessages(prev => prev.map(m => 
                                    m.id === message.id 
                                      ? { ...m, pendingConfirmation: false, error: t.operationCancelled }
                                      : m
                                  ))}
                                  className="border-amber-300 dark:border-amber-700"
                                >
                                  {t.cancel}
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-400 mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t bg-white dark:bg-gray-800">
          <form onSubmit={handleSubmit} className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.typeMessage}
              disabled={isLoading}
              className={cn(
                "flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-violet-500 focus:border-violet-500",
                isRTL && "text-right"
              )}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputValue.trim()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className={cn("w-4 h-4", isRTL && "rotate-180")} />
              )}
            </Button>
          </form>
          
          {/* Quick Actions */}
          <div className={cn(
            "flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400",
            isRTL && "flex-row-reverse"
          )}>
            <button 
              onClick={clearChat}
              className={cn(
                "flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors",
                isRTL && "flex-row-reverse"
              )}
            >
              <RotateCcw className="w-3 h-3" />
              {t.newChat}
            </button>
            <span>•</span>
            <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Confirmation Dialog for Destructive Operations */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(
              "flex items-center gap-2",
              isRTL && "flex-row-reverse"
            )}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {t.confirmAction}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="mb-3">{t.confirmDesc}</p>
                {pendingQuery && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <p className="text-gray-600 dark:text-gray-400 mb-1 font-medium">SQL:</p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-40" dir="ltr">
                      {pendingQuery.sql}
                    </pre>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel onClick={handleCancelQuery}>
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmQuery}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {t.execute}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

export default AIAssistantChat;
