import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedSkills } from '@/components/home/FeaturedSkills';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CommunityStats } from '@/components/home/CommunityStats';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <>
      <HeroSection />
      <FeaturedSkills />
      <HowItWorks />
      <CommunityStats />

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
