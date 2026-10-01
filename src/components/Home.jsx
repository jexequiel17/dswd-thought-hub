import { useState } from "react";
import { motion } from "motion/react";
import { Shield, LogIn, UserPlus } from "lucide-react";
import { loginTrainer, signUpTrainer } from "../services/firebase";

export default function Home() {
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await loginTrainer(email, password);
      } else {
        await signUpTrainer(email, password);
      }
      setEmail("");
      setPassword("");
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-cover bg-center bg-fixed relative flex items-center justify-center p-4 font-sans text-slate-800"
      style={{ backgroundImage: `url('https://academy.dswd.gov.ph/wp-content/uploads/2025/03/A1-1024x538.jpg')` }}
    >
      {/* Modern Gradient Backdrop Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-slate-900/80 backdrop-blur-md pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        className="relative z-10 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-slate-950/30 overflow-hidden"
      >
        {/* Decorative Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

        <div className="text-center mb-6 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="font-extrabold text-xl text-slate-800 tracking-wide">
            DSWD Thought Hub
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sign in to access the Trainer Control Panel
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-2xl mb-6 border border-slate-200/50">
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setAuthError(""); }}
            className={`py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              authMode === "login"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            className={`py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
              authMode === "signup"
                ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1.5 text-slate-600 tracking-wide">
              Trainer Email
            </label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@dswd.gov.ph"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1.5 text-slate-600 tracking-wide">
              Password
            </label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 transition-all text-slate-800"
            />
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs font-semibold text-rose-600">
              {authError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {authMode === "login" ? (
              <>
                <LogIn className="w-4 h-4" />
                {authLoading ? "Logging in..." : "Log In"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {authLoading ? "Registering..." : "Create Account"}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}