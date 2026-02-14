import { useEffect, useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { stats, testimonials } from '@/data/mockData';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k';
    }
    return num.toString();
  };

  return (
    <span ref={ref}>{formatNumber(count)}{suffix}</span>
  );
}

export function CommunityStats() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-32 bg-gradient-to-br from-white via-blue-50 to-white dark:from-background dark:via-blue-950/10 dark:to-background text-foreground relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,150,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,150,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(100,150,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(100,150,255,0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Gradient orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 12, repeat: Infinity, delay: 1 }}
        className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <span className="text-primary font-medium mb-4 block text-sm uppercase tracking-widest">Our Impact</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-20 text-foreground">Trusted by Thousands</h2>

          <div className="grid md:grid-cols-3 gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08, y: -10 }}
              className="relative bg-card rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100/50 dark:border-blue-900/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-6xl md:text-7xl font-bold text-primary mb-4"
              >
                <AnimatedCounter target={stats.activeUsers} suffix="+" />
              </motion.div>
              <p className="text-foreground text-lg font-semibold">Active Users</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.08, y: -10 }}
              className="relative bg-card rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100/50 dark:border-blue-900/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.3 }}
                className="text-6xl md:text-7xl font-bold text-primary mb-4"
              >
                <AnimatedCounter target={stats.skillsShared} suffix="+" />
              </motion.div>
              <p className="text-foreground text-lg font-semibold">Skills Shared</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.08, y: -10 }}
              className="relative bg-card rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100/50 dark:border-blue-900/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.4 }}
                className="text-6xl md:text-7xl font-bold text-primary mb-4"
              >
                <AnimatedCounter target={stats.exchangesCompleted} suffix="+" />
              </motion.div>
              <p className="text-foreground text-lg font-semibold">Exchanges Completed</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-24"
        >
          <div className="bg-card backdrop-blur-sm rounded-3xl p-8 md:p-16 border border-blue-200/60 dark:border-blue-900/30 shadow-2xl">
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 mx-auto"
            >
              <Quote className="text-primary" size={24} />
            </motion.div>

            <div className="relative h-40 md:h-32">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 text-center"
                >
                  <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed font-medium">
                    "{testimonials[activeTestimonial].text}"
                  </p>
                  <p className="font-bold text-foreground text-base">{testimonials[activeTestimonial].name}</p>
                  <p className="text-muted-foreground/80 text-sm">{testimonials[activeTestimonial].role}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-blue-100/50 dark:border-blue-900/20">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full border-2 border-primary/40 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <ChevronLeft size={20} />
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${activeTestimonial === index ? 'bg-primary' : 'bg-gray-300'
                      }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full border-2 border-primary/40 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
