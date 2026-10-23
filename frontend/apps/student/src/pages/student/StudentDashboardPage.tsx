import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Coins,
  CalendarCheck,
  CalendarDays,
  ShoppingBag,
  Award,
  ArrowRight,
  Clock,
  BookOpenCheck,
  Megaphone,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  GraduationCap,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StudentUser, AttendanceRecord, LessonSchedule, CoinTransaction, Announcement, Product } from '../../types';
import { StudentApiService } from '../../services/studentApi';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = user && user.role === 'STUDENT' ? (user as StudentUser) : null;

  const [loading, setLoading] = useState(true);
  const [coinData, setCoinData] = useState<{ balance: number; totalEarned: number; totalSpent: number }>({
    balance: 0,
    totalEarned: 0,
    totalSpent: 0
  });
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    attended: 0,
    missed: 0,
    late: 0,
    excused: 0,
    percentage: 100
  });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [upcomingLessons, setUpcomingLessons] = useState<LessonSchedule[]>([]);
  const [recentRewards, setRecentRewards] = useState<CoinTransaction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const loadDashboardData = async () => {
    if (!student) return;
    try {
      setLoading(true);
      const [coinsRes, attRes, schRes, txsRes, annRes, prodsRes] = await Promise.all([
        StudentApiService.getCoinBalance(student.id),
        StudentApiService.getAttendance(student.id),
        StudentApiService.getSchedule(student.groupId),
        StudentApiService.getCoinTransactions(student.id),
        StudentApiService.getAnnouncements(),
        StudentApiService.getShopProducts()
      ]);

      setCoinData(coinsRes);
      setAttendanceStats(attRes.stats);
      setRecentAttendance(attRes.records.slice(0, 4));
      setUpcomingLessons(schRes.slice(0, 3));
      // Only rewards (adds)
      setRecentRewards(txsRes.filter(t => t.operation === 'add').slice(0, 4));
      setAnnouncements(annRes.slice(0, 2));
      setFeaturedProducts(prodsRes.slice(0, 3));
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [student?.id, student?.groupId]);

  // Reactive listeners for live updates
  useEffect(() => {
    window.addEventListener('coin-transactions-updated', loadDashboardData);
    window.addEventListener('students-updated', loadDashboardData);
    return () => {
      window.removeEventListener('coin-transactions-updated', loadDashboardData);
      window.removeEventListener('students-updated', loadDashboardData);
    };
  }, [student?.id]);

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden border border-slate-800 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>Talaba ID:</span>
              <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-cyan-300">
                {student.studentId}
              </span>
              <span>·</span>
              <span className="text-slate-300">{student.groupName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Assalomu alaykum, {student.fullName}
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Kurs: <strong className="text-white">{student.courseName}</strong>. Ustoz:{' '}
              <strong className="text-cyan-300">{student.teacherName}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/student/coins"
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition-all font-semibold text-xs flex items-center gap-2"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Coinlar: {coinData.balance}</span>
            </Link>
            <Link
              to="/student/shop"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Do‘kon</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Coin Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Mavjud Coinlar</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {coinData.balance}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span>+{coinData.totalEarned} to‘plangan</span>
            <span>·</span>
            <Link to="/student/coins" className="text-cyan-700 hover:underline font-medium">
              Tarix &rarr;
            </Link>
          </div>
        </div>

        {/* Attendance Percentage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Davomat Ko‘rsatkichi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {attendanceStats.percentage}%
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span>{attendanceStats.attended} qatnashgan</span>
            <span>·</span>
            <span>{attendanceStats.missed} qoldirgan</span>
          </div>
        </div>

        {/* Lessons Attended */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">O‘tilgan Darslar</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {attendanceStats.attended} / {attendanceStats.total}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {attendanceStats.late > 0 ? `${attendanceStats.late} kechikish qayd etilgan` : 'Kechikishlar mavjud emas'}
          </div>
        </div>

        {/* Next Lesson */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Navbatdagi Dars</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {upcomingLessons[0]?.dayOfWeek || 'Dushanba'} {upcomingLessons[0]?.startTime || '14:00'}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {upcomingLessons[0]?.room || 'Lab-A xonasi'}
          </div>
        </div>
      </div>

      {/* Main Grid: Schedule & Attendance vs Rewards & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Schedule & Attendance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming Lessons Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Yaqinlashayotgan Darslar</h3>
                <p className="text-xs text-slate-500">Sizning guruh jadvali bo‘yicha</p>
              </div>
              <Link
                to="/student/schedule"
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
              >
                <span>To‘liq jadval</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingLessons.map(lesson => (
                <div
                  key={lesson.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900">{lesson.dayOfWeek}</span>
                      <span className="text-slate-400 font-mono">· {lesson.startTime} - {lesson.endTime}</span>
                      <span className="text-slate-400">· {lesson.room}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium truncate">
                      {lesson.topic}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded shrink-0">
                    Rejalashtirilgan
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">So‘nggi Davomat Yozuvlari</h3>
                <p className="text-xs text-slate-500">Darslarda qatnashish holati</p>
              </div>
              <Link
                to="/student/attendance"
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
              >
                <span>Barchasi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAttendance.map(att => (
                <div key={att.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{att.topic}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{att.date}</span>
                      <span>·</span>
                      <span>{att.dayOfWeek}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {att.status === 'Present' && (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        Qatnashdi
                      </span>
                    )}
                    {att.status === 'Late' && (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        Kechikdi
                      </span>
                    )}
                    {att.status === 'Excused' && (
                      <span className="text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded text-[11px]">
                        Sababli
                      </span>
                    )}
                    {att.status === 'Absent' && (
                      <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                        Qatnashmadi
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Coin Rewards & Announcements & Shop Shortcut (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Coin Rewards from Teachers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ustoz Bergan Coinlar</h3>
                  <p className="text-[11px] text-slate-500">Rag‘batlantirish tarixi</p>
                </div>
              </div>
              <Link
                to="/student/coins"
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
              >
                Barchasi &rarr;
              </Link>
            </div>

            <div className="space-y-2.5">
              {recentRewards.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">Hali coin mukofotlari yo‘q</p>
              ) : (
                recentRewards.map(tx => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/50 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {tx.reason}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {tx.teacherName ? `Ustoz: ${tx.teacherName}` : 'Akademiya ma’muriyati'} · {tx.date}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-700 shrink-0">
                      +{tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">Rasmiy E’lonlar</h3>
              </div>
              <Link
                to="/student/announcements"
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-900"
              >
                Ko‘rish &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.map(ann => (
                <div key={ann.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{ann.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{ann.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Coin Shop Shortcut */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Avlod Coin Do‘koni</h3>
              </div>
              <Link
                to="/student/shop"
                className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Do‘konga o‘tish &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              O‘z coinlaringizga markaziy hoodie, ryukzak yoki mexanik klaviatura sotib oling!
            </p>
            <div className="grid grid-cols-3 gap-2">
              {featuredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate('/student/shop')}
                  className="bg-slate-800/80 rounded-xl p-2 border border-slate-700 text-center cursor-pointer hover:bg-slate-700/80 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[10px] font-mono text-cyan-300 mt-1 font-bold">{p.coinPrice} coin</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
