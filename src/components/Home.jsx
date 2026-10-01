import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { loginTrainer, signUpTrainer, resetTrainerPassword } from "../services/firebase";
import daLogo from "../assets/DALogo.png";

export default function Home() {
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        await loginTrainer(email, password);
        setEmail("");
        setPassword("");
      } else if (authMode === "signup") {
        await signUpTrainer(email, password);
        setEmail("");
        setPassword("");
      } else if (authMode === "forgot") {
        await resetTrainerPassword(email);
        setAuthSuccess("Password reset link sent! Please check your email inbox.");
      }
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    } finally {
      setAuthLoading(false);
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setAuthError("");
    setAuthSuccess("");
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden bg-cover bg-center bg-fixed relative flex items-center justify-center p-4 font-sans text-slate-800"
      style={{ backgroundImage: `url('https://academy.dswd.gov.ph/wp-content/uploads/2025/03/A1-1024x538.jpg')` }}
    >
      {/* Modern Gradient Backdrop Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-slate-900/80 backdrop-blur-md pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="relative z-10 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-slate-950/30 overflow-hidden"
      >
        {/* Decorative Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

        {/* Logo and Header */}
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 p-1">
            <img 
              src={daLogo} 
              alt="DA Logo" 
              className="w-full h-full object-contain scale-200"
            />
          </div>
          <h2 className="font-extrabold text-xl text-slate-800 tracking-wide">
            Thought Hub
          </h2>

          <div className="h-6 overflow-hidden relative mt-1">
            <AnimatePresence mode="wait">
              <motion.p
                key={authMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-slate-500 font-medium"
              >
                {authMode === "login" && "Sign in to access the Trainer Control Panel"}
                {authMode === "signup" && "Create an account to start managing training"}
                {authMode === "forgot" && "Enter your email to receive a password reset link"}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Animated Switcher Tabs (Hidden during Forgot Password mode) */}
        {authMode !== "forgot" ? (
          <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-2xl mb-6 border border-slate-200/50 relative">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative py-2.5 font-bold text-xs rounded-xl transition-colors cursor-pointer z-10 ${
                authMode === "login" ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {authMode === "login" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Log In
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative py-2.5 font-bold text-xs rounded-xl transition-colors cursor-pointer z-10 ${
                authMode === "signup" ? "text-blue-700" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {authMode === "signup" && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/60 -z-10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              Sign Up
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
          </button>
        )}

        {/* Form Controls */}
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

          {authMode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase text-slate-600 tracking-wide">
                  Password
                </label>
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50 transition-all text-slate-800"
              />
            </div>
          )}

          {/* Animated Messages */}
          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs font-semibold text-rose-600">
                  {authError}
                </div>
              </motion.div>
            )}

            {authSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button 
            type="submit" 
            disabled={authLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <AnimatePresence mode="wait">
              {authMode === "login" && (
                <motion.span 
                  key="login-btn"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {authLoading ? "Logging in..." : "Log In"}
                </motion.span>
              )}

              {authMode === "signup" && (
                <motion.span 
                  key="signup-btn"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {authLoading ? "Registering..." : "Create Account"}
                </motion.span>
              )}

              {authMode === "forgot" && (
                <motion.span 
                  key="forgot-btn"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {authLoading ? "Sending Reset Email..." : "Reset Password"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}