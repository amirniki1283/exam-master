// AI Service v1.3.0 - Smart Generation with Enhanced Fallback
// Works great WITHOUT API, even better WITH API

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom' | 'none';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  customEndpoint?: string;
  customModel?: string;
}

// ============ SMART GENERATION (No API Required) ============

// Smart flashcard generation using patterns and templates
function smartGenerateFlashcards(courseName: string, chapterTitle: string, count: number): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  const courseKey = findBestMatchingCourse(courseName);
  const dbCards = flashcardDatabase[courseKey] || [];
  
  // Mix database cards with generated ones
  const shuffledDb = [...dbCards].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    if (i < shuffledDb.length) {
      // Use database card
      cards.push(shuffledDb[i]);
    } else {
      // Generate based on chapter title
      cards.push(generateContextualCard(courseName, chapterTitle, i));
    }
  }
  
  return cards.slice(0, count);
}

function generateContextualCard(courseName: string, chapterTitle: string, index: number): { front: string; back: string } {
  const templates = [
    { front: `تعریف "${chapterTitle}" در ${courseName} چیست؟`, back: `مفهوم اصلی ${chapterTitle} که در این درس بررسی می‌شود` },
    { front: `مهم‌ترین فرمول مربوط به ${chapterTitle} کدام است؟`, back: `فرمول‌های کلیدی این مبحث باید حفظ شوند` },
    { front: `کاربرد ${chapterTitle} در صنعت چیست؟`, back: `استفاده در پروژه‌های عملی و مهندسی` },
    { front: `تفاوت اصلی ${chapterTitle} با مباحث مشابه چیست؟`, back: `ویژگی‌های منحصر به فرد این مبحث` },
    { front: `چه نکاتی از ${chapterTitle} در امتحان مهم است؟`, back: `نکات کلیدی و سوالات احتمالی امتحان` },
  ];
  
  return templates[index % templates.length];
}

function findBestMatchingCourse(courseName: string): string {
  const lowerName = courseName.toLowerCase();
  
  for (const key of Object.keys(flashcardDatabase)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return key;
    }
  }
  
  // Partial matches
  const keywords: Record<string, string> = {
    'زمین': 'زمین‌شناسی',
    'سنگ': 'مکانیک سنگ',
    'انفجار': 'انفجار',
    'ریاضی': 'ریاضی',
    'فیزیک': 'فیزیک',
    'مقاومت': 'مقاومت مصالح',
    'مدار': 'مدار',
    'ترمو': 'ترمودینامیک',
    'سیستم عامل': 'سیستم‌عامل',
    'پایگاه': 'پایگاه داده',
    'کانه': 'کانه‌آرایی',
    'معدن': 'معدنکاری',
    'شیمی': 'شیمی',
    'کامپیوتر': 'کامپیوتر',
    'برق': 'مدار',
    'مکانیک': 'مکانیک',
    'عمران': 'عمران',
    'سازه': 'سازه',
    'خاک': 'مکانیک خاک',
    'بتن': 'بتن',
    'فولاد': 'فولاد',
    'متالورژی': 'متالورژی',
    'مواد': 'مواد',
  };
  
  for (const [keyword, dbKey] of Object.entries(keywords)) {
    if (lowerName.includes(keyword)) {
      if (flashcardDatabase[dbKey]) return dbKey;
    }
  }
  
  return 'default';
}

// Smart chapter generation
function smartGenerateChapters(courseName: string): string[] {
  const courseKey = findBestMatchingCourse(courseName);
  
  if (chapterDatabase[courseKey]) {
    return chapterDatabase[courseKey];
  }
  
  // Check partial matches
  for (const [key, chapters] of Object.entries(chapterDatabase)) {
    if (courseName.includes(key) || key.includes(courseName)) {
      return chapters;
    }
  }
  
  // Generate generic but useful chapters
  return [
    `مقدمه و مبانی ${courseName}`,
    'تعاریف و مفاهیم اولیه',
    'اصول و قوانین پایه',
    'روش‌های محاسباتی',
    'تحلیل و بررسی',
    'کاربردهای عملی',
    'حل مسائل نمونه',
    'مباحث پیشرفته',
    'جمع‌بندی و مرور',
  ];
}

// Smart note analysis
function smartAnalyzeNotes(courseName: string, content: string): { summary: string; topics: string[] } {
  const topics: string[] = [];
  
  // Extract patterns
  const patterns = [
    /فصل\s*[\d۰-۹]+\s*[:：\-–]?\s*([^\n]+)/g,
    /بخش\s*[\d۰-۹]+\s*[:：\-–]?\s*([^\n]+)/g,
    /موضوع\s*[:：\-–]?\s*([^\n]+)/g,
    /عنوان\s*[:：\-–]?\s*([^\n]+)/g,
    /^#+\s*(.+)$/gm,
    /^\d+[\.\-\)]\s*(.+)$/gm,
    /^[آ-ی]+\s*[\.\-\)]\s*(.+)$/gm,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const topic = match[1]?.trim();
      if (topic && topic.length > 3 && topic.length < 80 && !topics.includes(topic)) {
        topics.push(topic);
      }
    }
  }

  // If few topics found, use smart generation
  if (topics.length < 3) {
    const smartChapters = smartGenerateChapters(courseName);
    topics.push(...smartChapters.slice(0, 6 - topics.length));
  }

  const summary = topics.length > 0
    ? `این جزوه شامل ${topics.length} موضوع اصلی است: ${topics.slice(0, 3).join('، ')}${topics.length > 3 ? ' و...' : ''}`
    : `جزوه درس ${courseName} تحلیل شد.`;

  return { summary, topics: topics.slice(0, 12) };
}

// ============ API FUNCTIONS (Optional Enhancement) ============

// List of models to try in order
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
];

async function tryGeminiAPI(config: AIConfig, prompt: string): Promise<{ success: boolean; data?: string; error?: string }> {
  if (config.provider !== 'gemini' || !config.apiKey) {
    return { success: false, error: 'Gemini not configured' };
  }

  const key = config.apiKey.trim();
  const errors: string[] = [];

  // Try each model until one works
  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      // Use key as query parameter (most reliable for browser)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      
      console.log(`[Gemini] Trying model: ${model}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 1500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Gemini] Success with model: ${model}`);
          return { success: true, data: text };
        }
        const blockReason = json.candidates?.[0]?.finishReason;
        if (blockReason && blockReason !== 'STOP') {
          errors.push(`${model}: blocked (${blockReason})`);
          continue;
        }
        errors.push(`${model}: empty response`);
        continue;
      }
      
      // If 404, model doesn't exist, try next
      if (response.status === 404) {
        errors.push(`${model}: not found`);
        continue;
      }
      
      // If 400 or 403, key issue
      const errBody = await response.text().catch(() => '');
      console.error(`[Gemini] ${model} error:`, response.status, errBody.slice(0, 200));
      errors.push(`${model}: ${response.status}`);
      
      // Don't try more models if it's an auth issue
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: `کلید API نامعتبر (${response.status})` };
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        errors.push(`${model}: timeout`);
        continue;
      }
      errors.push(`${model}: ${String(err).slice(0, 50)}`);
    }
  }

  return { success: false, error: `همه مدل‌ها ناموفق: ${errors.join(' | ')}` };
}

// ============ PUBLIC API ============

export async function testAPIConnection(config: AIConfig): Promise<{ success: boolean; message: string }> {
  if (!config.apiKey || config.provider === 'none') {
    return { success: false, message: '📚 حالت هوشمند آفلاین فعال است (بدون نیاز به API)' };
  }

  if (config.provider === 'gemini') {
    const key = config.apiKey.trim();
    
    // Validate key format first
    if (!key.startsWith('AIza')) {
      return { 
        success: false, 
        message: '❌ فرمت کلید اشتباه! کلید Gemini باید با AIza شروع شود. از aistudio.google.com/app/apikey بگیرید' 
      };
    }
    
    try {
      console.log('[Gemini Test] Testing API key...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        { method: 'GET' }
      );
      
      if (response.ok) {
        console.log('[Gemini Test] Key is valid!');
        
        // Try actual generation
        const genResponse = await tryGeminiAPI(config, 'سلام. فقط بگو: تست موفق');
        if (genResponse.success) {
          return { success: true, message: '✅ Gemini کاملاً فعال! فلش‌کارت و سرفصل با AI تولید می‌شود 🎉' };
        }
        return { success: true, message: `✅ کلید معتبر! ${genResponse.error || ''}` };
      }
      
      const errText = await response.text().catch(() => '');
      console.error('[Gemini Test] Error:', response.status, errText.slice(0, 200));
      
      if (response.status === 400 || response.status === 401) {
        return { success: false, message: '❌ کلید نامعتبر! از aistudio.google.com/app/apikey کلید جدید بگیرید' };
      }
      if (response.status === 403) {
        return { success: false, message: '❌ دسترسی رد شد. ممکن است نیاز به VPN باشد یا API در منطقه شما محدود است' };
      }
      return { success: false, message: `❌ خطا (${response.status}) - کلید را بررسی کنید` };
    } catch (e) {
      console.error('[Gemini Test] Connection error:', e);
      return { success: false, message: '❌ خطا در اتصال. اینترنت یا VPN را بررسی کنید' };
    }
  }

  if (config.provider === 'openai') {
    return { 
      success: false, 
      message: '⚠️ OpenAI از مرورگر مستقیم کار نمی‌کند (CORS). از Gemini استفاده کنید یا حالت آفلاین.' 
    };
  }

  if (config.provider === 'anthropic') {
    return { 
      success: false, 
      message: '⚠️ Anthropic از مرورگر مستقیم کار نمی‌کند (CORS). از Gemini استفاده کنید یا حالت آفلاین.' 
    };
  }

  return { success: false, message: '📚 از حالت هوشمند آفلاین استفاده می‌شود' };
}

export async function generateFlashcards(
  config: AIConfig,
  courseName: string,
  chapterTitle: string,
  count: number = 5
): Promise<{ cards: { front: string; back: string }[]; usedFallback: boolean; message: string }> {
  
  // Try Gemini API if configured
  if (config.provider === 'gemini' && config.apiKey) {
    const prompt = `برای درس "${courseName}" و فصل "${chapterTitle}"، دقیقاً ${count} فلش‌کارت آموزشی فارسی بساز. هر کارت یک سوال امتحانی مهم و جواب کوتاه داشته باشد. فقط JSON خالص برگردان بدون توضیح اضافه: [{"front":"سوال","back":"جواب"}]`;

    console.log('[Flashcards] Calling Gemini API...');
    const result = await tryGeminiAPI(config, prompt);
    console.log('[Flashcards] Result:', result.success, result.error || '');
    
    if (result.success && result.data) {
      try {
        // Clean up response
        let cleaned = result.data.trim();
        cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
        
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const cards = JSON.parse(jsonMatch[0]);
          if (Array.isArray(cards) && cards.length > 0 && cards[0].front) {
            return { cards: cards.slice(0, count), usedFallback: false, message: `✅ ${cards.length} فلش‌کارت با Gemini AI ساخته شد` };
          }
        }
        console.warn('[Flashcards] Could not parse JSON from:', result.data.slice(0, 200));
      } catch (parseErr) {
        console.error('[Flashcards] JSON parse error:', parseErr);
      }
      // AI responded but couldn't parse - still show partial success
      return { 
        cards: smartGenerateFlashcards(courseName, chapterTitle, count), 
        usedFallback: true, 
        message: '⚠️ AI جواب داد ولی فرمت نامعتبر بود — از دیتابیس استفاده شد' 
      };
    }
    
    // API failed - show exact error
    const cards = smartGenerateFlashcards(courseName, chapterTitle, count);
    return { 
      cards, 
      usedFallback: true, 
      message: `⚠️ خطای Gemini: ${result.error || 'ناشناخته'} — از دیتابیس استفاده شد` 
    };
  }

  // No API - Smart generation
  const cards = smartGenerateFlashcards(courseName, chapterTitle, count);
  return { cards, usedFallback: true, message: '🧠 فلش‌کارت‌ها از دیتابیس هوشمند ساخته شدند' };
}

export async function generateChapters(
  config: AIConfig,
  courseName: string
): Promise<{ chapters: string[]; usedFallback: boolean; message: string }> {
  
  // Try Gemini API if configured
  if (config.provider === 'gemini' && config.apiKey) {
    const prompt = `برای درس "${courseName}" کارشناسی مهندسی، سرفصل‌های اصلی (۶ تا ۱۰ عدد) رو بنویس.
فقط JSON آرایه برگردان: ["سرفصل۱","سرفصل۲"]`;

    const result = await tryGeminiAPI(config, prompt);
    
    if (result.success && result.data) {
      try {
        const jsonMatch = result.data.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const chapters = JSON.parse(jsonMatch[0]);
          if (Array.isArray(chapters) && chapters.length > 0) {
            return { chapters, usedFallback: false, message: '✅ سرفصل‌ها با Gemini AI تولید شدند' };
          }
        }
      } catch {
        // Fall through
      }
    }
  }

  // Smart generation
  const chapters = smartGenerateChapters(courseName);
  return { chapters, usedFallback: true, message: '🧠 سرفصل‌ها از دیتابیس هوشمند تولید شدند' };
}

export async function analyzeNotes(
  config: AIConfig,
  courseName: string,
  content: string
): Promise<{ summary: string; topics: string[]; usedFallback: boolean; message: string }> {
  
  // Try Gemini API if configured
  if (config.provider === 'gemini' && config.apiKey && content.length > 100) {
    const truncated = content.slice(0, 2000);
    const prompt = `این متن جزوه درس "${courseName}" است:
${truncated}

خلاصه کوتاه و موضوعات اصلی رو استخراج کن.
JSON برگردان: {"summary":"خلاصه","topics":["موضوع۱","موضوع۲"]}`;

    const result = await tryGeminiAPI(config, prompt);
    
    if (result.success && result.data) {
      try {
        const jsonMatch = result.data.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.summary && parsed.topics) {
            return { ...parsed, usedFallback: false, message: '✅ جزوه با Gemini AI تحلیل شد' };
          }
        }
      } catch {
        // Fall through
      }
    }
  }

  // Smart analysis
  const { summary, topics } = smartAnalyzeNotes(courseName, content);
  
  const message = config.apiKey && config.provider !== 'none'
    ? '⚠️ API در دسترس نبود - تحلیل هوشمند انجام شد'
    : '🧠 تحلیل هوشمند جزوه انجام شد';

  return { summary, topics, usedFallback: true, message };
}

// ============ COMPREHENSIVE DATABASE ============

const flashcardDatabase: Record<string, { front: string; back: string }[]> = {
  'زمین‌شناسی': [
    { front: 'سه نوع اصلی سنگ کدامند؟', back: 'آذرین (Igneous)، رسوبی (Sedimentary)، دگرگونی (Metamorphic)' },
    { front: 'کانی چیست؟', back: 'ماده جامد طبیعی غیرآلی با ترکیب شیمیایی معین و ساختار بلوری منظم' },
    { front: 'گسل چیست؟', back: 'شکستگی در پوسته زمین که بلوک‌های دو طرف نسبت به هم جابجا شده‌اند' },
    { front: 'چرخه سنگ چیست؟', back: 'فرآیند پیوسته تبدیل سنگ‌ها از یک نوع به نوع دیگر در طول زمان زمین‌شناسی' },
    { front: 'تفاوت ماگما و لاوا چیست؟', back: 'ماگما: سنگ مذاب زیر سطح | لاوا: ماگمایی که به سطح رسیده' },
    { front: 'هوازدگی چیست؟', back: 'تخریب فیزیکی و شیمیایی سنگ‌ها در اثر عوامل جوی' },
    { front: 'انواع گسل کدامند؟', back: 'نرمال (کششی)، معکوس (فشارشی)، امتدادلغز' },
    { front: 'چین‌خوردگی چیست؟', back: 'خمیدگی لایه‌های سنگی بر اثر نیروهای تکتونیکی' },
    { front: 'تفاوت سنگ آذرین درونی و بیرونی؟', back: 'درونی: سرد شدن آهسته، بلورهای درشت | بیرونی: سریع، بلورهای ریز' },
    { front: 'کانسار چیست؟', back: 'تمرکز اقتصادی یک یا چند ماده معدنی' },
  ],
  
  'مکانیک سنگ': [
    { front: 'UCS چیست؟', back: 'Uniaxial Compressive Strength - مقاومت فشاری تک‌محوری' },
    { front: 'فرمول معیار موهر-کولمب؟', back: 'τ = c + σn·tan(φ) که c چسبندگی و φ زاویه اصطکاک است' },
    { front: 'RQD چیست و فرمولش؟', back: 'Rock Quality Designation = (Σ قطعات>10cm / طول کل) × 100%' },
    { front: 'طبقه‌بندی RMR شامل چه پارامترهایی است؟', back: 'UCS، RQD، فاصله‌داری درزه، وضعیت درزه، آب زیرزمینی' },
    { front: 'تنش برجا چیست؟', back: 'تنش طبیعی در توده سنگ قبل از حفاری' },
    { front: 'مدول یانگ چیست؟', back: 'E = σ/ε - نسبت تنش به کرنش در ناحیه الاستیک' },
    { front: 'نسبت پواسون چیست؟', back: 'ν = -ε_lateral/ε_axial - نسبت کرنش عرضی به طولی' },
    { front: 'آزمایش برزیلی چیست؟', back: 'تعیین مقاومت کششی غیرمستقیم با فشردن دیسک سنگی' },
    { front: 'GSI چیست؟', back: 'Geological Strength Index - شاخص مقاومت زمین‌شناسی' },
    { front: 'معیار هوک-براون چیست؟', back: 'σ1 = σ3 + σci(mb·σ3/σci + s)^a - معیار شکست تجربی' },
  ],
  
  'انفجار': [
    { front: 'VOD چیست؟', back: 'Velocity of Detonation - سرعت پیشروی موج انفجار' },
    { front: 'بردن (Burden) چیست؟', back: 'فاصله عمود از چال تا نزدیک‌ترین سطح آزاد' },
    { front: 'فاصله‌داری (Spacing) چیست؟', back: 'فاصله بین چال‌های یک ردیف' },
    { front: 'خرج ویژه (Powder Factor) چیست؟', back: 'kg ماده منفجره / تن یا m³ سنگ' },
    { front: 'ANFO چیست؟', back: 'نیترات آمونیوم + سوخت دیزل (94% + 6%)' },
    { front: 'گل‌گذاری (Stemming) چیست؟', back: 'پر کردن بالای چال با مواد خنثی' },
    { front: 'پیش‌شکافی (Pre-splitting) چیست؟', back: 'ایجاد شکاف قبل از انفجار اصلی' },
    { front: 'نسبت بردن به فاصله‌داری معمولاً چقدر است؟', back: 'B/S = 1 تا 1.3' },
    { front: 'تأخیر بین چال‌ها چرا مهم است؟', back: 'بهبود خردایش و کاهش لرزش زمین' },
    { front: 'زاویه چال معمولاً چقدر است؟', back: '10-15 درجه از قائم' },
  ],
  
  'ریاضی': [
    { front: 'قضیه مقدار میانگین؟', back: 'f\'(c) = (f(b)-f(a))/(b-a) برای c∈(a,b)' },
    { front: '∫xⁿ dx = ?', back: 'xⁿ⁺¹/(n+1) + C (n≠-1)' },
    { front: 'd/dx[sin(x)] = ?', back: 'cos(x)' },
    { front: 'd/dx[eˣ] = ?', back: 'eˣ' },
    { front: 'd/dx[ln(x)] = ?', back: '1/x' },
    { front: 'سری تیلور f در نقطه a؟', back: 'Σ f⁽ⁿ⁾(a)/n! · (x-a)ⁿ' },
    { front: 'قانون لوپیتال کی کاربرد دارد؟', back: 'حدهای 0/0 یا ∞/∞' },
    { front: 'آزمون نسبت برای سری‌ها؟', back: 'lim|aₙ₊₁/aₙ| < 1 همگرا، > 1 واگرا' },
    { front: 'گرادیان ∇f(x,y) = ?', back: '(∂f/∂x, ∂f/∂y)' },
    { front: '∫∫ روی ناحیه D چیست؟', back: 'انتگرال دوگانه - حجم یا جرم' },
  ],
  
  'فیزیک': [
    { front: 'قانون دوم نیوتن؟', back: 'F = ma' },
    { front: 'انرژی جنبشی؟', back: 'Eₖ = ½mv²' },
    { front: 'انرژی پتانسیل گرانشی؟', back: 'Eₚ = mgh' },
    { front: 'قانون اهم؟', back: 'V = IR' },
    { front: 'قانون کولن؟', back: 'F = kq₁q₂/r²' },
    { front: 'قانون گرانش نیوتن؟', back: 'F = Gm₁m₂/r²' },
    { front: 'معادلات حرکت یکنواخت؟', back: 'v=v₀+at, x=x₀+v₀t+½at²' },
    { front: 'قانون فارادی؟', back: 'emf = -dΦ/dt' },
    { front: 'توان؟', back: 'P = W/t = Fv' },
    { front: 'تکانه؟', back: 'p = mv' },
  ],
  
  'مقاومت مصالح': [
    { front: 'تنش (Stress)؟', back: 'σ = F/A [Pa یا MPa]' },
    { front: 'کرنش (Strain)؟', back: 'ε = ΔL/L [بدون بعد]' },
    { front: 'قانون هوک؟', back: 'σ = Eε' },
    { front: 'نسبت پواسون؟', back: 'ν = -ε_lat/ε_long' },
    { front: 'تنش برشی در پیچش؟', back: 'τ = Tr/J' },
    { front: 'تنش خمشی؟', back: 'σ = My/I' },
    { front: 'ممان اینرسی مستطیل؟', back: 'I = bh³/12' },
    { front: 'بار بحرانی کمانش اویلر؟', back: 'Pcr = π²EI/(KL)²' },
    { front: 'تنش فون‌میزس؟', back: '√[(σ₁-σ₂)²+(σ₂-σ₃)²+(σ₃-σ₁)²]/√2' },
    { front: 'مدول برشی G؟', back: 'G = E/2(1+ν)' },
  ],
  
  'مدار': [
    { front: 'قانون کیرشهف جریان (KCL)؟', back: 'Σiورودی = Σiخروجی' },
    { front: 'قانون کیرشهف ولتاژ (KVL)؟', back: 'ΣV = 0 در مسیر بسته' },
    { front: 'مقاومت سری؟', back: 'Req = R₁ + R₂ + ...' },
    { front: 'مقاومت موازی؟', back: '1/Req = 1/R₁ + 1/R₂ + ...' },
    { front: 'توان در مقاومت؟', back: 'P = VI = I²R = V²/R' },
    { front: 'امپدانس خازن؟', back: 'Zc = 1/(jωC)' },
    { front: 'امپدانس سلف؟', back: 'ZL = jωL' },
    { front: 'فرکانس تشدید LC؟', back: 'f₀ = 1/(2π√LC)' },
    { front: 'تقسیم ولتاژ؟', back: 'Vn = Vtot × (Rn/Rtot)' },
    { front: 'ثابت زمانی RC؟', back: 'τ = RC' },
  ],
  
  'ترمودینامیک': [
    { front: 'قانون اول؟', back: 'ΔU = Q - W' },
    { front: 'قانون دوم؟', back: 'ΔS ≥ 0 برای سیستم ایزوله' },
    { front: 'بازده کارنو؟', back: 'η = 1 - Tc/Th' },
    { front: 'آنتالپی؟', back: 'H = U + PV' },
    { front: 'گاز ایده‌آل؟', back: 'PV = nRT' },
    { front: 'فرآیند ایزوترمال؟', back: 'T=const, PV=const' },
    { front: 'فرآیند آدیاباتیک؟', back: 'Q=0, PVᵞ=const' },
    { front: 'COP یخچال؟', back: 'COP = Qc/W' },
    { front: 'آنتروپی؟', back: 'dS = δQ/T' },
    { front: 'کار در فرآیند ایزوبار؟', back: 'W = PΔV' },
  ],
  
  'کانه‌آرایی': [
    { front: 'نسبت خردایش؟', back: 'RR = D80_feed / d80_product' },
    { front: 'فلوتاسیون بر چه اساسی است؟', back: 'تفاوت خاصیت سطحی (آب‌گریزی)' },
    { front: 'کلکتور چیست؟', back: 'ماده‌ای که کانی را آب‌گریز می‌کند' },
    { front: 'عیار (Grade)؟', back: 'درصد فلز در محصول' },
    { front: 'بازیابی (Recovery)؟', back: 'R = (C×c)/(F×f) × 100%' },
    { front: 'جدایش ثقلی بر چه اساسی است؟', back: 'اختلاف چگالی' },
    { front: 'ماشین‌های جدایش ثقلی؟', back: 'جیگ، میز لرزان، اسپیرال' },
    { front: 'پرعیارسازی چیست؟', back: 'افزایش غلظت کانی با ارزش' },
    { front: 'باطله چیست؟', back: 'مواد بدون ارزش اقتصادی' },
    { front: 'کف‌ساز چیست؟', back: 'ایجاد حباب‌های پایدار در فلوتاسیون' },
  ],
  
  'معدنکاری': [
    { front: 'نسبت باطله‌برداری؟', back: 'SR = حجم باطله / حجم ماده معدنی' },
    { front: 'روش اتاق و پایه؟', back: 'باقی گذاشتن پایه‌های سنگی برای نگهداری' },
    { front: 'روش تخریب بلوکی؟', back: 'تخریب از پایین و ریزش ثقلی' },
    { front: 'زاویه شیب نهایی پیت؟', back: 'زاویه دیواره نهایی با افق' },
    { front: 'تهویه طبیعی؟', back: 'جریان هوا به دلیل اختلاف دما و ارتفاع' },
    { front: 'ضریب استخراج؟', back: 'نسبت ماده استخراجی به کل ذخیره' },
    { front: 'پله در معدن سطحی؟', back: 'واحد استخراج با ارتفاع مشخص' },
    { front: 'رمپ چیست؟', back: 'راه شیب‌دار دسترسی در معدن' },
    { front: 'شفت چیست؟', back: 'چاه قائم دسترسی در معدن زیرزمینی' },
    { front: 'Cut-off grade؟', back: 'حداقل عیار اقتصادی استخراج' },
  ],
  
  'سیستم‌عامل': [
    { front: 'فرآیند (Process)؟', back: 'برنامه در حال اجرا + منابع' },
    { front: 'ریسه (Thread)؟', back: 'واحد اجرای سبک درون فرآیند' },
    { front: 'بن‌بست (Deadlock)؟', back: 'انتظار دایره‌ای برای منابع' },
    { front: 'شرایط بن‌بست؟', back: 'انحصار، نگهداشت، عدم پیش‌گیری، انتظار دایره‌ای' },
    { front: 'حافظه مجازی؟', back: 'استفاده از دیسک به عنوان RAM' },
    { front: 'Page Fault؟', back: 'صفحه در RAM نیست' },
    { front: 'الگوریتم LRU؟', back: 'جایگزینی کم‌استفاده‌ترین صفحه' },
    { front: 'سمافور؟', back: 'متغیر همگام‌سازی با wait و signal' },
    { front: 'Context Switch؟', back: 'تعویض CPU بین فرآیندها' },
    { front: 'Thrashing؟', back: 'افت شدید عملکرد به دلیل Page Fault زیاد' },
  ],
  
  'پایگاه داده': [
    { front: 'کلید اصلی؟', back: 'شناسه یکتای هر ردیف' },
    { front: 'کلید خارجی؟', back: 'ارجاع به کلید اصلی جدول دیگر' },
    { front: 'ACID؟', back: 'Atomicity, Consistency, Isolation, Durability' },
    { front: '1NF؟', back: 'فقط مقادیر اتمیک' },
    { front: '2NF؟', back: '1NF + وابستگی کامل به کلید' },
    { front: '3NF؟', back: '2NF + بدون وابستگی تعدی' },
    { front: 'JOIN چیست؟', back: 'ترکیب جداول بر اساس شرط' },
    { front: 'INDEX چیست؟', back: 'ساختار برای جستجوی سریع' },
    { front: 'VIEW چیست؟', back: 'جدول مجازی از کوئری' },
    { front: 'Transaction؟', back: 'واحد کار که کامل یا اصلاً اجرا می‌شود' },
  ],

  'سازه': [
    { front: 'روش‌های تحلیل سازه نامعین؟', back: 'نیرو، تغییر شکل، المان محدود' },
    { front: 'ماتریس سختی چیست؟', back: 'رابطه نیرو و تغییر شکل گره‌ها' },
    { front: 'درجه نامعینی استاتیکی؟', back: 'تعداد مجهولات - تعداد معادلات' },
    { front: 'لنگر خمشی؟', back: 'گشتاور داخلی در مقطع تیر' },
    { front: 'نیروی برشی؟', back: 'نیروی عمود بر محور در مقطع' },
    { front: 'تیر کنسولی؟', back: 'تیر با یک تکیه‌گاه گیردار' },
    { front: 'خرپا چیست؟', back: 'سازه مثلثی با اتصالات مفصلی' },
    { front: 'قاب خمشی؟', back: 'سازه با اتصالات صلب' },
  ],

  'مکانیک خاک': [
    { front: 'تراکم نسبی؟', back: 'Dr = (emax-e)/(emax-emin)' },
    { front: 'ضریب نفوذپذیری k؟', back: 'سرعت جریان آب در خاک' },
    { front: 'تنش مؤثر؟', back: 'σ\' = σ - u' },
    { front: 'تحکیم؟', back: 'خروج آب و کاهش حجم در طول زمان' },
    { front: 'زاویه اصطکاک داخلی؟', back: 'مقاومت برشی خاک دانه‌ای' },
    { front: 'چسبندگی؟', back: 'مقاومت برشی خاک چسبنده' },
    { front: 'حد روانی (LL)؟', back: 'رطوبت مرز خمیری و روان' },
    { front: 'شاخص خمیری (PI)؟', back: 'PI = LL - PL' },
  ],

  'مواد': [
    { front: 'ساختار BCC؟', back: 'Body Centered Cubic - مکعب مرکز پر' },
    { front: 'ساختار FCC؟', back: 'Face Centered Cubic - مکعب وجوه پر' },
    { front: 'عملیات حرارتی آنیل؟', back: 'گرم کردن و سرد کردن آهسته' },
    { front: 'سختی‌پذیری؟', back: 'توانایی سخت شدن در عمق' },
    { front: 'دیاگرام فاز آهن-کربن؟', back: 'نمودار تعادلی فازهای فولاد' },
    { front: 'مارتنزیت چیست؟', back: 'فاز سخت از سرد کردن سریع' },
    { front: 'خوردگی چیست؟', back: 'تخریب شیمیایی فلز' },
    { front: 'آزمون کشش چه می‌دهد؟', back: 'تنش تسلیم، استحکام، ازدیاد طول' },
  ],

  'شیمی': [
    { front: 'pH چیست؟', back: 'pH = -log[H⁺]' },
    { front: 'مول چیست؟', back: '6.02×10²³ ذره (عدد آووگادرو)' },
    { front: 'غلظت مولار؟', back: 'M = mol/L' },
    { front: 'قانون گاز ایده‌آل؟', back: 'PV = nRT' },
    { front: 'واکنش اکسیداسیون؟', back: 'از دست دادن الکترون' },
    { front: 'واکنش احیا؟', back: 'گرفتن الکترون' },
    { front: 'آنتالپی چیست؟', back: 'گرمای واکنش در فشار ثابت' },
    { front: 'ثابت تعادل K؟', back: 'نسبت غلظت محصولات به واکنش‌دهنده‌ها' },
  ],

  'کامپیوتر': [
    { front: 'پیچیدگی O(n)؟', back: 'زمان خطی با اندازه ورودی' },
    { front: 'پیچیدگی O(log n)؟', back: 'زمان لگاریتمی (مثل جستجوی دودویی)' },
    { front: 'پشته (Stack)؟', back: 'LIFO - آخرین ورودی، اولین خروجی' },
    { front: 'صف (Queue)؟', back: 'FIFO - اولین ورودی، اولین خروجی' },
    { front: 'درخت دودویی جستجو؟', back: 'چپ < ریشه < راست' },
    { front: 'هش چیست؟', back: 'تبدیل کلید به اندیس آرایه' },
    { front: 'مرتب‌سازی سریع (Quick Sort)؟', back: 'O(n log n) میانگین، تقسیم و حل' },
    { front: 'گراف همبند؟', back: 'مسیر بین هر دو رأس وجود دارد' },
  ],

  'default': [
    { front: 'مفهوم اصلی این مبحث چیست؟', back: 'تعریف و اهمیت موضوع در رشته' },
    { front: 'فرمول‌های کلیدی کدامند؟', back: 'روابط ریاضی اصلی' },
    { front: 'کاربرد عملی چیست؟', back: 'استفاده در صنعت و پروژه‌ها' },
    { front: 'نکات امتحانی مهم؟', back: 'موارد پرسش‌شونده در آزمون' },
    { front: 'ارتباط با سایر مباحث؟', back: 'پیش‌نیازها و وابستگی‌ها' },
  ],
};

const chapterDatabase: Record<string, string[]> = {
  'زمین‌شناسی عمومی': ['ساختار زمین', 'کانی‌شناسی', 'سنگ‌های آذرین', 'سنگ‌های رسوبی', 'سنگ‌های دگرگونی', 'تکتونیک صفحه‌ای', 'زلزله', 'آتشفشان', 'هوازدگی', 'آب زیرزمینی'],
  'زمین‌شناسی ساختاری': ['تنش و کرنش', 'رفتار سنگ', 'چین‌ها', 'گسل‌های نرمال', 'گسل‌های معکوس', 'گسل‌های امتدادلغز', 'درزه‌ها', 'استریونت', 'نقشه ساختاری'],
  'زمین‌شناسی اقتصادی': ['کانسارشناسی', 'کانسارهای ماگمایی', 'کانسارهای هیدروترمال', 'کانسارهای رسوبی', 'کانسارهای پلاسری', 'اکتشاف', 'ارزیابی ذخیره'],
  'مکانیک سنگ': ['خواص فیزیکی', 'مقاومت فشاری', 'مقاومت کششی', 'مقاومت برشی', 'معیارهای شکست', 'طبقه‌بندی RMR', 'طبقه‌بندی Q', 'تحلیل پایداری', 'مدل‌سازی عددی'],
  'مهندسی انفجار': ['مبانی انفجار', 'مواد منفجره', 'چاشنی‌ها', 'طراحی الگو', 'محاسبه بردن', 'خردایش', 'لرزش زمین', 'انفجار کنترل‌شده', 'ایمنی'],
  'معدنکاری سطحی': ['طراحی پیت', 'زاویه شیب', 'باطله‌برداری', 'حفاری', 'بارگیری', 'حمل', 'پایداری شیب', 'آبکشی', 'بازسازی'],
  'معدنکاری زیرزمینی': ['روش‌های استخراج', 'اتاق و پایه', 'تخریب بلوکی', 'جبهه‌کار بلند', 'نگهداری', 'تهویه', 'ایمنی'],
  'کانه‌آرایی ۱': ['خردایش', 'سنگ‌شکن‌ها', 'آسیاها', 'دانه‌بندی', 'طبقه‌بندی', 'جدایش ثقلی'],
  'کانه‌آرایی ۲': ['فلوتاسیون', 'جدایش مغناطیسی', 'جدایش الکتریکی', 'لیچینگ', 'آبگیری'],
  'ریاضی عمومی ۱': ['تابع', 'حد', 'پیوستگی', 'مشتق', 'کاربرد مشتق', 'انتگرال نامعین', 'انتگرال معین', 'کاربرد انتگرال'],
  'ریاضی عمومی ۲': ['دنباله', 'سری', 'سری توانی', 'بردار', 'توابع چندمتغیره', 'مشتقات جزئی', 'انتگرال دوگانه'],
  'فیزیک عمومی ۱': ['کینماتیک', 'دینامیک', 'کار و انرژی', 'تکانه', 'دوران', 'گرانش', 'نوسان', 'موج'],
  'فیزیک عمومی ۲': ['الکتروستاتیک', 'میدان الکتریکی', 'پتانسیل', 'خازن', 'جریان', 'مغناطیس', 'القا'],
  'مقاومت مصالح': ['تنش و کرنش', 'محوری', 'پیچش', 'خمش', 'برش', 'ترکیبی', 'کمانش'],
  'ساختمان داده‌ها': ['آرایه', 'لیست پیوندی', 'پشته', 'صف', 'درخت', 'گراف', 'مرتب‌سازی', 'جستجو'],
  'سیستم‌عامل': ['فرآیند', 'ریسه', 'زمان‌بندی', 'همگام‌سازی', 'بن‌بست', 'حافظه', 'فایل'],
  'پایگاه داده‌ها': ['مدل رابطه‌ای', 'SQL', 'نرمال‌سازی', 'تراکنش', 'همروندی', 'فهرست'],
};
