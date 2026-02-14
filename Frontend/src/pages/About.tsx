import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Users, Heart, Sparkles, Star, Shield, Lightbulb } from 'lucide-react';
import { staggerContainer, fadeInUp, scaleIn } from '@/components/layout/PageTransition';

const About = () => {
  const sections = [
    {
      icon: Target,
      title: 'What is this platform?',
      content: 'SkillShare is a community-driven platform where people exchange skills without any monetary transactions. Whether you want to learn guitar, coding, a new language, or pottery—you can find someone willing to teach you in exchange for something you know.',
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: Heart,
      title: 'Why community skills?',
      content: 'We believe knowledge should be accessible to everyone. By enabling skill exchanges, we create a more connected, resourceful community where learning is collaborative and mutual. No paywalls, no barriers—just people helping each other grow.',
      color: 'bg-pink-500/10 text-pink-500',
    },
    {
      icon: Users,
      title: 'Who is it for?',
      content: 'Anyone with a skill to share and a desire to learn. Students, professionals, hobbyists, retirees—our community is diverse and welcoming. If you have knowledge others might find valuable and want to acquire new abilities, this platform is for you.',
      color: 'bg-green-500/10 text-green-500',
    },
  ];

  const values = [
    { icon: Star, title: 'Openness', desc: 'Everyone is welcome regardless of background' },
    { icon: Heart, title: 'Generosity', desc: 'Share freely and receive gratefully' },
    { icon: Lightbulb, title: 'Growth', desc: 'Continuous learning is at our core' },
    { icon: Shield, title: 'Trust', desc: 'Build lasting connections through reliability' },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-8"
          >
            <Sparkles className="text-primary" size={40} />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            About <span className="text-primary">SkillShare</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Building a world where everyone can learn anything, from anyone, for free.
          </p>
        </motion.div>

        {/* Main Sections */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto space-y-12 mb-24"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              variants={fadeInUp}
              whileHover={{ x: 8 }}
              className="flex flex-col md:flex-row items-start gap-6 p-8 bg-card border border-border rounded-3xl group cursor-pointer"
            >
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`w-16 h-16 ${section.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
              >
                <section.icon size={30} />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4 relative inline-block">
                  {section.title}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-primary/30 origin-left rounded-full"
                  />
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-secondary to-secondary/50 rounded-3xl p-12 mb-24"
        >
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Our <span className="text-primary">Values</span>
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                variants={scaleIn}
                whileHover={{ y: -8, scale: 1.05 }}
                className="text-center group cursor-pointer"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors"
                >
                  <value.icon className="text-primary" size={26} />
                </motion.div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to <span className="text-primary">join</span>?
            </h2>
          </motion.div>
          <p className="text-muted-foreground mb-8 text-lg">
            Start sharing and learning today.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/signup">
                Get Started
                <ArrowRight className="ml-2" size={18} />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
