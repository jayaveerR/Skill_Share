import { motion } from 'framer-motion';
import { UserPlus, ListPlus, ArrowLeftRight, GraduationCap } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Profile',
    description: 'Sign up and tell us about yourself and your learning goals.',
    color: 'bg-orange-50',
  },
  {
    icon: ListPlus,
    title: 'Add Skills',
    description: 'List skills you can teach and what you want to learn.',
    color: 'bg-orange-100/50',
  },
  {
    icon: ArrowLeftRight,
    title: 'Request Exchange',
    description: 'Find matches and propose skill exchanges with others.',
    color: 'bg-orange-50',
  },
  {
    icon: GraduationCap,
    title: 'Learn & Share',
    description: 'Connect and start your knowledge exchange journey.',
    color: 'bg-orange-100/50',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.1)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-medium mb-3 block"
          >
            Simple Process
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            Start exchanging skills in four simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative"
            >
              {/* Connector line for desktop */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.15, duration: 0.4 }}
                  className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10 origin-left"
                />
              )}

              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="bg-card border border-border rounded-2xl p-8 h-full relative overflow-hidden group"
              >
                {/* Hover effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                />

                <div className="relative">
                  {/* Step number */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.15, type: "spring" }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                  >
                    {index + 1}
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6`}
                  >
                    <step.icon size={28} className="text-primary" />
                  </motion.div>

                  <h3 className="font-bold text-xl text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
