import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users, Calendar, Clock, BookOpen, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Group } from '../../types';
import { LoadingState } from '../../components/common/States';

export const TeacherDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const res = await api.getGroups();
        setGroups(res.results || []);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/avlod_brand_mark_1792586439669.jpg"
              alt="Avlod Ta'lim"
              className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-300"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Instructor Portal</h1>
              <p className="text-xs text-slate-500">Avlod Ta'lim Academic Faculty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Welcome Box */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">Welcome, Instructor {user?.full_name}</h2>
          <p className="text-xs text-slate-500 mt-1">
            View your active student cohorts, timetables, and academic attendance logs.
          </p>
        </div>

        {/* Assigned Classes */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Your Academic Groups</h3>
          {loading ? (
            <LoadingState message="Loading teaching assignments..." />
          ) : groups.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 bg-white rounded-lg text-center">No assigned groups.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <div key={g.id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {g.name}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{g.course_name}</h4>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 uppercase">{g.status}</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{g.schedule}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">Start Date: {g.start_date}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{g.students_count || g.student_ids.length} Students Enrolled</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
