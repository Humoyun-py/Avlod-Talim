import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-100">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 bg-slate-700/60 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
            HTTP 404 Not Found
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Resource Not Found</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The requested application URL does not exist or has been relocated within the Avlod Ta'lim system.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" />
            <span>Return to Admin Console</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
