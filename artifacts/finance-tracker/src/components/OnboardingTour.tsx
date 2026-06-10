import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Sparkles, LayoutDashboard, PlusCircle, Wallet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "clovifi-onboarding-done";

const STEPS = [
  {
    icon: <LayoutDashboard size={40} className="text-[#7DDA2A]" />,
    title: "Welcome to Clovifi 🍀",
    description:
      "Your personal finance tracker. Get a bird's-eye view of your spending, income, and savings — all in one place.",
  },
  {
    icon: <Wallet size={40} className="text-[#7DDA2A]" />,
    title: "Your Cash Wallet is Ready",
    description:
      'We\'ve created a "Cash Wallet" account for you. Go to the Accounts page to add more accounts like bank, credit card, or savings.',
  },
  {
    icon: <PlusCircle size={40} className="text-[#7DDA2A]" />,
    title: "Add Your First Transaction",
    description:
      'Click the "+ New Transaction" button on any page to log your expenses or income. We\'ve set up 12 categories to get you started.',
  },
  {
    icon: <Sparkles size={40} className="text-[#7DDA2A]" />,
    title: "Load Demo Data",
    description:
      "Your dashboard looks empty right now. Load some sample transactions to see charts and insights in action!",
    isDemo: true,
  },
];

interface OnboardingTourProps {
  onDemoLoad: () => void;
  demoLoading: boolean;
}

export default function OnboardingTour({ onDemoLoad, demoLoading }: OnboardingTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else close();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div
              className="relative w-full max-w-md rounded-2xl border border-white/10 p-8 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(2,10,4,0.98) 0%, rgba(10,30,15,0.98) 100%)",
                boxShadow: "0 0 60px rgba(125,218,42,0.15), 0 0 120px rgba(125,218,42,0.05)",
              }}
            >
              {/* Close */}
              <button
                onClick={close}
                className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Step dots */}
              <div className="flex justify-center gap-2 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? "24px" : "6px",
                      background: i === step ? "#7DDA2A" : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>

              {/* Icon */}
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mb-5"
              >
                <div
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(125,218,42,0.1)", border: "1px solid rgba(125,218,42,0.2)" }}
                >
                  {current.icon}
                </div>
              </motion.div>

              {/* Text */}
              <motion.div key={`text-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl font-bold text-white mb-3">{current.title}</h2>
                <p className="text-white/60 text-sm leading-relaxed">{current.description}</p>
              </motion.div>

              {/* Demo Load Button */}
              {current.isDemo && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={async () => {
                    await onDemoLoad();
                    close();
                  }}
                  disabled={demoLoading}
                  className="mt-5 w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: "linear-gradient(135deg, #7DDA2A, #4CAF50)",
                    color: "#020A04",
                    boxShadow: "0 0 20px rgba(125,218,42,0.3)",
                    opacity: demoLoading ? 0.7 : 1,
                  }}
                >
                  {demoLoading ? "Loading Demo Data…" : "✨ Load Demo Data"}
                </motion.button>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="flex items-center gap-1 text-sm text-white/40 hover:text-white/80 transition-colors disabled:opacity-0"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: step === STEPS.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(125,218,42,0.15)",
                    color: step === STEPS.length - 1 ? "rgba(255,255,255,0.6)" : "#7DDA2A",
                    border: "1px solid",
                    borderColor: step === STEPS.length - 1 ? "rgba(255,255,255,0.1)" : "rgba(125,218,42,0.3)",
                  }}
                >
                  {step === STEPS.length - 1 ? "Skip" : "Next"}
                  {step < STEPS.length - 1 && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
