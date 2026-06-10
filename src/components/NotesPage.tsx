import { useState, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { courseColors } from '../data/courses';
import { toPersianNum } from '../utils/jalali';
import { generateChapters, analyzeNotes } from '../services/aiService';
import type { Chapter } from '../types';

interface StoredNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export default function NotesPage() {
  const { state, dispatch } = useApp();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const course = state.courses.find(c => c.id === selectedCourse);
  
  // Store notes in course.notes as JSON
  const getStoredNotes = (): StoredNote[] => {
    if (!course?.pdfContent) return [];
    try {
      const parsed = JSON.parse(course.pdfContent);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // Legacy: if it's plain text, convert to single note
      if (course.pdfContent.trim()) {
        return [{
          id: 'legacy',
          title: 'جزوه قدیمی',
          content: course.pdfContent,
          createdAt: Date.now()
        }];
      }
      return [];
    }
  };

  const saveStoredNotes = (notes: StoredNote[]) => {
    if (!course) return;
    dispatch({
      type: 'UPDATE_COURSE',
      course: { ...course, pdfContent: JSON.stringify(notes) }
    });
  };

  const storedNotes = getStoredNotes();
  const selectedNote = storedNotes.find(n => n.id === selectedNoteId);

  const addNote = () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !course) return;
    
    const newNote: StoredNote = {
      id: crypto.randomUUID(),
      title: newNoteTitle,
      content: newNoteContent,
      createdAt: Date.now()
    };
    
    saveStoredNotes([...storedNotes, newNote]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
    setStatusMessage('✅ جزوه ذخیره شد');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const deleteNote = (noteId: string) => {
    if (!confirm('حذف این جزوه؟')) return;
    saveStoredNotes(storedNotes.filter(n => n.id !== noteId));
    if (selectedNoteId === noteId) setSelectedNoteId(null);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!course) return;
    setAnalyzing(true);
    setStatusMessage('در حال خواندن فایل...');

    try {
      let content = '';
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        content = await file.text();
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Try to extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(bytes);
        
        // Extract readable text
        const textMatches = rawText.match(/\(([^)]+)\)\s*Tj/g);
        if (textMatches) {
          content = textMatches.map(m => {
            const match = m.match(/\(([^)]+)\)/);
            return match ? match[1] : '';
          }).join(' ');
        }
        
        // Also try stream content
        const streamMatches = rawText.match(/stream[\s\S]*?endstream/g);
        if (streamMatches && !content) {
          for (const stream of streamMatches) {
            const readable = stream.replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s.,;:!?()\-]/g, ' ');
            if (readable.trim().length > 50) {
              content += readable + '\n';
            }
          }
        }
        
        if (!content.trim()) {
          content = `فایل PDF "${file.name}" آپلود شد. متن قابل استخراج نبود. لطفاً محتوا را به صورت دستی وارد کنید.`;
        }
      } else {
        content = `فایل "${file.name}" آپلود شد. فرمت پشتیبانی نشده.`;
      }

      // Save as note
      const newNote: StoredNote = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.(pdf|txt)$/i, ''),
        content: content.slice(0, 50000), // Limit size
        createdAt: Date.now()
      };
      
      saveStoredNotes([...storedNotes, newNote]);
      setSelectedNoteId(newNote.id);
      setStatusMessage(`✅ فایل "${file.name}" ذخیره شد`);
    } catch (err) {
      console.error('File read error:', err);
      setStatusMessage('❌ خطا در خواندن فایل');
    }
    
    setAnalyzing(false);
    setTimeout(() => setStatusMessage(''), 5000);
  }, [course, storedNotes, saveStoredNotes]);

  const analyzeNoteContent = useCallback(async (noteId: string) => {
    const note = storedNotes.find(n => n.id === noteId);
    if (!note || !course) return;
    
    setAnalyzing(true);
    setStatusMessage('در حال تحلیل جزوه با هوش مصنوعی...');
    
    const result = await analyzeNotes(
      {
        provider: state.settings.apiProvider,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint,
        customModel: state.settings.customModel,
      },
      course.name,
      note.content
    );
    
    setStatusMessage(result.message);
    dispatch({
      type: 'SET_AI_STATUS',
      status: result.usedFallback ? 'disconnected' : 'connected',
      message: result.message,
    });
    
    // Add extracted topics as chapters
    if (result.topics.length > 0) {
      const newChapters: Chapter[] = result.topics.map(title => ({
        id: crypto.randomUUID(),
        title,
        studied: false,
        flashcards: [],
      }));
      
      const mergedChapters = [...course.chapters];
      for (const nc of newChapters) {
        if (!mergedChapters.find(c => c.title === nc.title)) {
          mergedChapters.push(nc);
        }
      }
      
      dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: mergedChapters } });
      setStatusMessage(`${result.message} - ${result.topics.length} سرفصل استخراج شد`);
    }
    
    setAnalyzing(false);
    setTimeout(() => setStatusMessage(''), 5000);
  }, [storedNotes, course, state.settings, dispatch]);

  const autoGenerateChapters = useCallback(async () => {
    if (!course) return;
    
    setGeneratingChapters(true);
    setStatusMessage('در حال تولید سرفصل‌ها...');
    
    const result = await generateChapters(
      {
        provider: state.settings.apiProvider,
        apiKey: state.settings.apiKey,
        customEndpoint: state.settings.customEndpoint,
        customModel: state.settings.customModel,
      },
      course.name
    );
    
    setStatusMessage(result.message);
    dispatch({
      type: 'SET_AI_STATUS',
      status: result.usedFallback ? 'disconnected' : 'connected',
      message: result.message,
    });
    
    const newChapters: Chapter[] = result.chapters.map(title => ({
      id: crypto.randomUUID(),
      title,
      studied: false,
      flashcards: [],
    }));
    
    const mergedChapters = [...course.chapters];
    for (const nc of newChapters) {
      if (!mergedChapters.find(c => c.title === nc.title)) {
        mergedChapters.push(nc);
      }
    }
    
    dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: mergedChapters } });
    setGeneratingChapters(false);
    setTimeout(() => setStatusMessage(''), 5000);
  }, [course, state.settings, dispatch]);

  const handlePersonalNotesChange = (notes: string) => {
    if (!course) return;
    dispatch({ type: 'UPDATE_COURSE', course: { ...course, notes } });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black dark:text-white">📝 جزوه‌ها و یادداشت‌ها</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">آپلود، ذخیره و تحلیل جزوات درسی</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
          state.aiStatus === 'connected'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${state.aiStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
          {state.aiStatus === 'connected' ? '🤖 AI' : '📚 آفلاین'}
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-3 rounded-xl text-sm font-medium animate-fadeIn ${
          statusMessage.includes('✅') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          statusMessage.includes('❌') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          statusMessage.includes('⚠️') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Course Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {state.courses.map(c => {
          const color = courseColors[c.colorIndex % courseColors.length];
          const notesCount = (() => {
            try {
              const parsed = JSON.parse(c.pdfContent || '[]');
              return Array.isArray(parsed) ? parsed.length : (c.pdfContent ? 1 : 0);
            } catch {
              return c.pdfContent ? 1 : 0;
            }
          })();
          
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCourse(c.id); setSelectedNoteId(null); }}
              className={`card-hover p-4 rounded-2xl text-right transition-all border-2 ${
                selectedCourse === c.id
                  ? `${color.border} shadow-lg`
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800`}
            >
              <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center text-white text-lg mb-2`}>📖</div>
              <p className="font-bold dark:text-white text-sm">{c.name}</p>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{toPersianNum(c.chapters.length)} فصل</span>
                <span>{toPersianNum(notesCount)} جزوه</span>
              </div>
            </button>
          );
        })}
      </div>

      {course && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideIn">
          {/* Left Column: Notes List & Upload */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold dark:text-white mb-3">📤 افزودن جزوه</h3>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-indigo-400 transition-all mb-3">
                <label className="cursor-pointer">
                  <div className="text-3xl mb-2">📎</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">آپلود فایل PDF یا TXT</p>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                </label>
                {analyzing && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm">
                    <span className="animate-spin">⚙️</span>
                    <span>در حال پردازش...</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="w-full p-2 rounded-xl border border-indigo-500 text-indigo-500 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                ✍️ نوشتن جزوه جدید
              </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 animate-fadeIn">
                <h4 className="font-bold dark:text-white text-sm mb-3">جزوه جدید</h4>
                <input
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                  placeholder="عنوان جزوه..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm mb-2 focus:border-indigo-500 focus:outline-none"
                />
                <textarea
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder="محتوای جزوه را وارد کنید..."
                  className="w-full h-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-sm resize-none mb-2 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={addNote} className="flex-1 btn-gradient text-white py-2 rounded-xl text-sm font-bold">ذخیره</button>
                  <button onClick={() => setShowAddNote(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm">انصراف</button>
                </div>
              </div>
            )}

            {/* Notes List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold dark:text-white mb-3">📚 جزوه‌های ذخیره شده</h3>
              {storedNotes.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                  هنوز جزوه‌ای ذخیره نشده
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {storedNotes.map(note => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        selectedNoteId === note.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-400'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                      }`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium dark:text-white text-sm">{note.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {toPersianNum(note.content.length)} کاراکتر
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Note Content & Chapters */}
          <div className="lg:col-span-2 space-y-4">
            {/* Selected Note Content */}
            {selectedNote ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold dark:text-white text-lg">{selectedNote.title}</h3>
                  <button
                    onClick={() => analyzeNoteContent(selectedNote.id)}
                    disabled={analyzing}
                    className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-600 disabled:opacity-50"
                  >
                    {analyzing ? '⏳ در حال تحلیل...' : '🧠 تحلیل با AI'}
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {selectedNote.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-10 text-center">
                <div className="text-4xl mb-2">👈</div>
                <p className="text-gray-500 dark:text-gray-400">یک جزوه از لیست انتخاب کنید</p>
              </div>
            )}

            {/* Chapters Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold dark:text-white text-lg">📑 سرفصل‌های {course.name}</h3>
                <button
                  onClick={autoGenerateChapters}
                  disabled={generatingChapters}
                  className="px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 disabled:opacity-50"
                >
                  {generatingChapters ? '⏳' : '🧠'} تولید خودکار
                </button>
              </div>

              {course.chapters.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  با تحلیل جزوه یا تولید خودکار، سرفصل‌ها ایجاد می‌شوند
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {course.chapters.map((ch, i) => (
                    <div
                      key={ch.id}
                      className={`flex items-center gap-2 p-3 rounded-xl transition-all ${
                        ch.studied
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={ch.studied}
                        onChange={() => {
                          const updatedChapters = course.chapters.map(c =>
                            c.id === ch.id ? { ...c, studied: !c.studied } : c
                          );
                          dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: updatedChapters } });
                        }}
                        className="w-4 h-4 accent-indigo-500"
                      />
                      <span className={`flex-1 text-sm ${ch.studied ? 'line-through opacity-70' : ''}`}>
                        {i + 1}. {ch.title}
                      </span>
                      <button
                        onClick={() => {
                          const updatedChapters = course.chapters.filter(c => c.id !== ch.id);
                          dispatch({ type: 'UPDATE_COURSE', course: { ...course, chapters: updatedChapters } });
                        }}
                        className="text-xs text-red-400 hover:text-red-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {course.chapters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">پیشرفت مطالعه:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {toPersianNum(Math.round((course.chapters.filter(c => c.studied).length / course.chapters.length) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${(course.chapters.filter(c => c.studied).length / course.chapters.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Personal Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold dark:text-white text-lg mb-3">✍️ یادداشت‌های شخصی</h3>
              <textarea
                value={course.notes}
                onChange={e => handlePersonalNotesChange(e.target.value)}
                placeholder="نکات مهم، فرمول‌ها، سوالات احتمالی و هر چیز دیگری..."
                className="w-full h-40 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white resize-y focus:border-indigo-500 focus:outline-none text-sm leading-relaxed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-left">
                {toPersianNum(course.notes.length)} کاراکتر | ذخیره خودکار ✓
              </p>
            </div>
          </div>
        </div>
      )}

      {state.courses.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-xl text-gray-500 dark:text-gray-400">ابتدا درس‌ها رو اضافه کنید</p>
          <button
            onClick={() => dispatch({ type: 'SET_PAGE', page: 'courses' })}
            className="mt-4 btn-gradient text-white px-6 py-3 rounded-xl font-bold"
          >
            رفتن به مدیریت درس‌ها
          </button>
        </div>
      )}

      {state.courses.length > 0 && !selectedCourse && (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
          <div className="text-4xl mb-2">👆</div>
          <p className="text-gray-500 dark:text-gray-400">یک درس را انتخاب کنید</p>
        </div>
      )}
    </div>
  );
}
