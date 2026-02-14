import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockSkills } from '@/data/mockData';

export function FeaturedSkills() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section ref={containerRef} className="py-24 bg-secondary/50 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
        >
          <div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-medium mb-2 block"
            >
              Discover
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">Featured Skills</h2>
            <p className="text-muted-foreground mt-3 max-w-md">
              Explore what talented people in our community are sharing
            </p>
          </div>
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => scroll('left')}
                className="rounded-full w-12 h-12"
              >
                <ChevronLeft size={24} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => scroll('right')}
                className="rounded-full w-12 h-12"
              >
                <ChevronRight size={24} />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {mockSkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -12, transition: { duration: 0.3 } }}
              className="group flex-shrink-0 w-80 bg-card border border-border rounded-2xl p-6 snap-start cursor-pointer relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
              />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center"
                    >
                      <span className="text-primary font-bold text-xl">
                        {skill.userName[0]}
                      </span>
                    </motion.div>
                    <div>
                      <p className="font-semibold text-foreground">{skill.userName}</p>
                      <p className="text-sm text-muted-foreground">{skill.category}</p>
                    </div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="w-10 h-10 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowUpRight className="text-primary-foreground" size={18} />
                  </motion.div>
                </div>
                
                <h3 className="font-bold text-xl text-foreground mb-2">{skill.name}</h3>
                <p className="text-muted-foreground mb-6">{skill.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">
                    Available for exchange
                  </span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    Request
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
