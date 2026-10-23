import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  History,
  Copy,
  Check,
  User,
  Plus,
  Minus,
  Equal,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { DirectorService } from '../services/mockService';
import { Student, CoinTransaction } from '../types';
import { useToast } from '../context/ToastContext';

export const CoinsPage: React.FC = () => {
  const { success, error, info } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Target Student
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State
  const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState<number | string>(50);
  const [reason, setReason] = useState<string>('Darsdagi faollik uchun');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Copied studentId state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active tab: 'award' or 'history' or 'leaderboard'
  const [activeTab, setActiveTab] = useState<'award' | 'history' | 'leaderboard'>('award');

  const loadData = async () => {
    try {
      setLoading(true);
      const [stuData, txData] = await Promise.all([
        DirectorService.getStudents(),
        DirectorService.getCoinTransactions()
      ]);
      setStudents(stuData);
      setTransactions(txData);

      // If a student was previously selected, update reference
      if (selectedStudent) {
        const found = stuData.find(s => s.id === selectedStudent.id);
        if (found) setSelectedStudent(found);
      }
    } catch {
      error('Xatolik', 'Maʼlumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('students-updated', handleUpdate);
    window.addEventListener('coin-transactions-updated', handleUpdate);
    return () => {
      window.removeEventListener('students-updated', handleUpdate);
      window.removeEventListener('coin-transactions-updated', handleUpdate);
    };
  }, []);

  // Filter students based on ID or Name
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return students.filter(s =>
      s.studentId.toLowerCase().includes(q) ||
      s.fullName.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.groupName.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Leaderboard (Top 10 coin holders)
  const leaderboard = useMemo(() => {
    return [...students].sort((a, b) => (b.coins || 0) - (a.coins || 0)).slice(0, 10);
  }, [students]);

  // Aggregate stats
  const totalCoinsInCirculation = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.coins || 0), 0);
  }, [students]);

  const avgCoinsPerStudent = useMemo(() => {
    if (students.length === 0) return 0;
    return Math.round(totalCoinsInCirculation / students.length);
  }, [students, totalCoinsInCirculation]);

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    info('Nusxa olindi', `Talaba ID: ${id} buferga nusxalandi`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      error('O‘quvchi tanlanmagan', 'Iltimos, avval o‘quvchi ID raqamini qidirib tanlang');
      return;
    }

    const numAmt = Number(amount);
    if (isNaN(numAmt) || (numAmt <= 0 && operation !== 'set')) {
      error('Xatolik', 'Iltimos, to‘g‘ri va musbat coin miqdorini kiriting');
      return;
    }

    try {
      setSubmitting(true);
      const finalReason = reason === 'Boshqa' ? (customReason.trim() || 'Direktor qarori') : reason;
      const res = await DirectorService.awardStudentCoins(
        selectedStudent.id,
        numAmt,
        operation,
        finalReason
      );

      success(
        'Muvaffaqiyatli saqlandi',
        `${res.student.fullName} (ID: ${res.student.studentId}) ning yangi balansi: ${res.newTotal} coin`
      );

      // Refresh data
      await loadData();
      setSelectedStudent(res.student);
      setAmount(50);
      setCustomReason('');
    } catch (err: any) {
      error('Xatolik', err.message || 'Coin berishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations
  const currentCoins = selectedStudent ? (selectedStudent.coins || 0) : 0;
  const numAmt = Number(amount) || 0;
  const newProjectedTotal = useMemo(() => {
    if (!selectedStudent) return 0;
    if (operation === 'add') return currentCoins + numAmt;
    if (operation === 'subtract') return Math.max(0, currentCoins - numAmt);
    if (operation === 'set') return Math.max(0, numAmt);
    return currentCoins;
  }, [selectedStudent, operation, currentCoins, numAmt]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Coins className="w-5 h-5 text-amber-500" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              O‘quvchilarga Coin Berish & Balans Boshqaruvi
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
            Direktor talabaning <strong>ID raqami</strong> orqali qidirib, uning hisobiga rag‘batlantiruvchi Avlod coinlarini o‘tkazishi, ko‘paytirishi yoki tahrirlashi mumkin.
          </p>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Muomaladagi Coinlar</p>
              <p className="text-sm font-black text-amber-950">{totalCoinsInCirculation.toLocaleString()} coin</p>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2.5 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-[#5C42FD] text-white flex items-center justify-center font-black text-xs shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-purple-800 uppercase tracking-wider">O‘rtacha Balans</p>
              <p className="text-sm font-black text-purple-950">{avgCoinsPerStudent} coin / talaba</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('award')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'award'
              ? 'bg-[#5C42FD] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Coin Berish (ID bo‘yicha)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-[#5C42FD] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Top Talabalar Reytingi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-[#5C42FD] text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Berilgan Coinlar Tarixi ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: AWARD COINS (MAIN WORKFLOW) */}
      {activeTab === 'award' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: ID Search & Student Selection (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E9EAF3] shadow-xs">
              <label className="block text-xs font-bold text-gray-900 mb-2">
                1. Talabani ID raqami bo‘yicha qidirish
              </label>

              {/* Main Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ID raqam (masalan: 82940173 yoki 829)..."
                  className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-amber-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-medium placeholder-gray-400 focus:outline-hidden transition-all shadow-2xs"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Demo ID chips */}
              <div className="mt-3">
                <p className="text-[11px] font-semibold text-gray-400 mb-1.5">
                  Tezkor namuna ID lar (bosib tekshiring):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {students.slice(0, 4).map(stu => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleSelectStudent(stu)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        selectedStudent?.id === stu.id
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{stu.firstName}</span>
                      <span className="font-mono text-[10px] text-amber-700 bg-white px-1.5 py-0.2 rounded border border-amber-200">
                        {stu.studentId}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Search Results Dropdown / List */}
              {searchQuery.trim() !== '' && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-500 mb-2">
                    Qidiruv natijalari ({searchResults.length} ta):
                  </p>
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                      «{searchQuery}» ID yoki ism bo‘yicha talaba topilmadi
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                      {searchResults.map(stu => (
                        <div
                          key={stu.id}
                          onClick={() => handleSelectStudent(stu)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                            selectedStudent?.id === stu.id
                              ? 'border-amber-400 bg-amber-50/70 shadow-2xs'
                              : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {stu.firstName[0]}{stu.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">{stu.fullName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-[#5C42FD] bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 shrink-0">
                                  ID: {stu.studentId}
                                </span>
                                <span className="text-[10px] text-gray-500 truncate">{stu.groupName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-600" />
                              {stu.coins}
                            </span>
                            <span className="text-amber-600 font-bold text-[11px] flex items-center">
                              Tanlash <ArrowRight className="w-3 h-3 ml-0.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Student Card */}
            {selectedStudent ? (
              <div className="bg-gradient-to-br from-amber-50/60 to-purple-50/40 rounded-2xl p-5 border border-amber-200/80 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                      {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                        {selectedStudent.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-[#5C42FD] bg-white px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                          ID: {selectedStudent.studentId}
                          <button
                            type="button"
                            onClick={e => handleCopyId(selectedStudent.studentId, e)}
                            className="text-gray-400 hover:text-gray-600 cursor-pointer ml-1"
                            title="ID nusxalash"
                          >
                            {copiedId === selectedStudent.studentId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {selectedStudent.groupName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-lg shrink-0">
                    Faol Talaba
                  </span>
                </div>

                {/* Big Golden Balance Display */}
                <div className="p-3.5 bg-white/90 backdrop-blur-xs rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                      <Coins className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Joriy Balans
                      </p>
                      <p className="text-xl font-black text-amber-600">
                        {selectedStudent.coins || 0} <span className="text-xs font-bold text-amber-800">coin</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-gray-500">
                    <p>Kurs: <strong className="text-gray-800">{selectedStudent.courseName}</strong></p>
                    <p>Tel: <strong className="text-gray-800">{selectedStudent.phone}</strong></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/50 rounded-2xl p-6 border border-dashed border-amber-200 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 mb-1">O‘quvchi hali tanlanmadi</h4>
                <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  Coin berish uchun yuqoridagi maydonga talabaning 8 xonali ID raqamini kiriting yoki namunaviy tugmalardan birini bosing.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Coin Action & Reason Form (7 cols) */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 border border-[#E9EAF3] shadow-xs space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  2. Coin Operatsiyasi & O‘tkazish
                </h3>
                {selectedStudent && (
                  <span className="text-xs font-bold text-gray-600">
                    Tanlangan: <strong className="text-[#5C42FD]">{selectedStudent.fullName}</strong>
                  </span>
                )}
              </div>

              {/* Operation type toggle */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Operatsiya turini tanlang:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOperation('add')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      operation === 'add'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${operation === 'add' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Qo‘shish (+)</span>
                      <span className="text-[10px] text-gray-500 block">Rag‘batlantirish</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperation('subtract')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      operation === 'subtract'
                        ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${operation === 'subtract' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Minus className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Ayirish (-)</span>
                      <span className="text-[10px] text-gray-500 block">Jarima / Bekor</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperation('set')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      operation === 'set'
                        ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-bold shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${operation === 'set' ? 'bg-[#5C42FD] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      <Equal className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">Belgilash (=)</span>
                      <span className="text-[10px] text-gray-500 block">Aniq miqdor</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Coin Amount Input & Quick Chips */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Coin miqdori
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={amount === '' || amount === 0 ? '' : String(amount)}
                    onChange={e => {
                      const clean = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
                      setAmount(clean === '' ? '' : Number(clean));
                    }}
                    placeholder="Masalan: 50"
                    className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-amber-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 font-bold focus:outline-hidden transition-all shadow-2xs"
                  />
                </div>

                {/* Fast presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-gray-400 font-semibold mr-1">Tezkor tanlov:</span>
                  {[10, 25, 50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        Number(amount) === val
                          ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Coin berish sababi (Mukofot asosi)
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-[#F8F8FC] border border-[#E9EAF3] focus:border-amber-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-hidden transition-all shadow-2xs"
                >
                  <option value="Darsdagi faollik uchun">Darsdagi faollik va savol-javob uchun</option>
                  <option value="Uy vazifasini a'lo bahoga bajargani uchun">Uy vazifasini a'lo bahoga bajargani uchun</option>
                  <option value="Oylik imtihon / testda yuqori ball olgani uchun">Oylik imtihon / testda yuqori ball olgani uchun</option>
                  <option value="Musobaqa / Hakaton g'olibi">Akademiya musobaqasi yoki hakaton g‘olibi</option>
                  <option value="Namuna ko‘rsatgan xulq-atvor uchun">Namuna ko‘rsatgan xulq-atvor va odob uchun</option>
                  <option value="Qo‘shimcha amaliy loyiha topshirgani uchun">Qo‘shimcha amaliy loyiha topshirgani uchun</option>
                  <option value="Direktor maxsus mukofoti">Direktor maxsus mukofoti</option>
                  <option value="Boshqa">Boshqa sabab (izoh kiritish)...</option>
                </select>

                {reason === 'Boshqa' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Sabab yoki izohni yozing..."
                    className="w-full mt-2 bg-white border border-gray-200 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-hidden shadow-2xs"
                    required
                  />
                )}
              </div>

              {/* Live Preview Calculation */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs flex items-center justify-between">
                <div className="text-gray-600">
                  <span>Hozir: <strong className="text-gray-900">{currentCoins} coin</strong></span>
                  <span className="mx-2">➔</span>
                  <span>
                    Yangi balans:{' '}
                    <strong className="text-amber-800 text-sm">
                      {newProjectedTotal} coin
                    </strong>
                  </span>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  operation === 'add'
                    ? 'bg-emerald-100 text-emerald-800'
                    : operation === 'subtract'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {operation === 'add'
                    ? `+${numAmt}`
                    : operation === 'subtract'
                    ? `-${numAmt}`
                    : `=${numAmt}`} coin
                </span>
              </div>

              {/* Action Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedStudent || !amount}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'O‘tkazilmoqda...'
                      : selectedStudent
                      ? `${selectedStudent.fullName} uchun coinni hisobga o‘tkazish`
                      : 'Avval o‘quvchini tanlang'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-2xl border border-[#E9EAF3] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Eng Ko‘p Coin To‘plagan Talabalar (Top 10)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Faol va eng yuqori natijalarga erishayotgan o‘quvchilar reytingi
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FC] border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">O‘rin</th>
                  <th className="py-3 px-4">Talaba F.I.SH</th>
                  <th className="py-3 px-4">Talaba ID</th>
                  <th className="py-3 px-4">Guruh & Kurs</th>
                  <th className="py-3 px-4 text-right">Coin Balansi</th>
                  <th className="py-3 px-4 text-center">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((stu, idx) => (
                  <tr key={stu.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      {idx === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs shadow-2xs">
                          🥇 1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black flex items-center justify-center text-xs">
                          🥈 2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-black flex items-center justify-center text-xs">
                          🥉 3
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold ml-2">#{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {stu.firstName[0]}{stu.lastName[0]}
                        </div>
                        <span className="font-bold text-gray-900">{stu.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {stu.studentId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">
                      <p className="font-semibold text-gray-800">{stu.groupName}</p>
                      <p className="text-[10px] text-gray-400">{stu.courseName}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs">
                        <Coins className="w-3.5 h-3.5" />
                        {stu.coins} coin
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(stu);
                          setActiveTab('award');
                        }}
                        className="px-3 py-1.5 bg-[#5C42FD] hover:bg-[#4d33eb] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Coins className="w-3 h-3" />
                        Coin berish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#E9EAF3] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                So‘nggi Berilgan Coinlar Tarixi
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Direktor tomonidan o‘tkazilgan barcha operatsiyalar va izohlar
              </p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Hali hech qanday coin operatsiyasi amalga oshirilmagan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FC] border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Sana va Vaqt</th>
                    <th className="py-3 px-4">Talaba F.I.SH</th>
                    <th className="py-3 px-4">Talaba ID</th>
                    <th className="py-3 px-4">Guruh</th>
                    <th className="py-3 px-4">Miqdor</th>
                    <th className="py-3 px-4">Yangi Balans</th>
                    <th className="py-3 px-4">Sabab / Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {tx.date}
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-900">
                        {tx.studentName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-[#5C42FD] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {tx.studentPublicId}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-gray-600">
                        {tx.groupName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                          tx.operation === 'add'
                            ? 'bg-emerald-50 text-emerald-700'
                            : tx.operation === 'subtract'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-purple-50 text-[#5C42FD]'
                        }`}>
                          {tx.operation === 'add' ? `+${tx.amount}` : tx.operation === 'subtract' ? `-${tx.amount}` : `=${tx.amount}`} coin
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-amber-700">
                        {tx.newBalance} coin
                      </td>

                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {tx.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
