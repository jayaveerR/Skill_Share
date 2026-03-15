import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedSkills } from '@/components/home/FeaturedSkills';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CommunityStats } from '@/components/home/CommunityStats';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Brain } from 'lucide-react';

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturedSkills />
      <HowItWorks />
      <CommunityStats />

      {/* AI Verification Highlight */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                <Brain size={14} className="animate-pulse" />
                OpenRouter AI Enabled
              </div>
              <h2 className="text-4xl font-black text-foreground">
                Trust but <span className="text-primary">Verify</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Our advanced AI models analyze community profiles in real-time. 
                Get a deep understanding of who you're collaborating with, 
                with transparency at the core of SkillSwap.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="rounded-xl font-bold gap-2" asChild>
                  <Link to="/explore">
                    Explore Verified Members
                    <ArrowRight size={18} />
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 relative"
            >
              <div className="relative z-10 bg-card border border-border rounded-3xl p-8 shadow-2xl overflow-hidden group">
                {/* Mock UI for AI Analysis */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted/60 rounded animate-pulse" />
                  </div>
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Brain size={24} />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Authenticity Score</span>
                    <span className="text-2xl font-black text-primary">98%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '98%' }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-xs italic text-muted-foreground">
                      "Profile shows consistent skill history and professional engagement patterns across the network."
                    </p>
                  </div>
                </div>

                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Brain size={120} />
                </div>
              </div>
              
              {/* Decorative Blur */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-primary" size={28} />
              </motion.div>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Start Your
              <br />
              <span className="text-primary">Learning Journey?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join thousands of learners exchanging skills every day.
              No fees, no barriers—just pure knowledge sharing.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="text-base px-8 h-14 rounded-xl shadow-lg shadow-primary/25"
                  asChild
                >
                  <Link to="/signup">
                    Get Started Free
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-2" size={20} />
                    </motion.span>
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-14 rounded-xl"
                  asChild
                >
                  <Link to="/about">Learn More</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Index;
