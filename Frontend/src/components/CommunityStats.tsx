import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { Users, BookOpen, SwatchBook, Star, Sparkles, TrendingUp } from 'lucide-react';

import { LucideIcon } from 'lucide-react';

interface StatProps {
    value: number;
    label: string;
    icon: LucideIcon;
    delay: number;
}

const StatItem = ({ value, label, icon: Icon, delay }: StatProps) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => {
        const val = Math.round(latest);
        if (val >= 1000) {
            return (val / 1000).toFixed(1) + 'k';
        }
        return val.toLocaleString();
    });

    useEffect(() => {
        const controls = animate(count, value, { duration: 2, ease: 'easeOut', delay });
        return controls.stop;
    }, [value, delay, count]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="flex-1 bg-white dark:bg-black p-8 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center gap-6 shadow-xl hover:shadow-2xl transition-all duration-300 group"
        >
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center text-orange-500 group-hover:rotate-12 transition-transform duration-500 shadow-sm border border-orange-100/50 dark:border-orange-500/10">
                <Icon size={32} />
            </div>
            <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                    <motion.span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                        {rounded}
                    </motion.span>
                    <span className="text-orange-500 font-black text-3xl">+</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
        </motion.div>
    );
};

interface CommunityStatsProps {
    stats: {
        totalMembers: number;
        activeProviders: number;
        totalSkills: number;
        successfulExchanges: number;
    };
}

const CommunityStats = ({ stats }: CommunityStatsProps) => {
    // Calculate total users for the header countdown
    const totalUsers = useMotionValue(0);
    const roundedTotal = useTransform(totalUsers, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(totalUsers, stats.totalMembers, { duration: 2.5, ease: 'circOut' });
        return controls.stop;
    }, [stats.totalMembers, totalUsers]);

    return (
        <section className="py-12 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(249,115,22,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.1)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16 relative z-10"
            >
                <span className="text-orange-500 font-bold mb-4 block text-sm uppercase tracking-widest">Our Impact</span>
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-foreground">
                    Trusted by <span className="text-orange-500"><motion.span className="inline-block min-w-[60px]">{roundedTotal}</motion.span>+</span> Members
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    Join a growing community of learners and mentors sharing knowledge daily.
                </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center max-w-6xl mx-auto relative z-10">
                <StatItem value={stats.totalMembers} label="Active Users" icon={Users} delay={0.1} />
                <StatItem value={stats.totalSkills} label="Skills Shared" icon={BookOpen} delay={0.2} />
                <StatItem value={stats.successfulExchanges} label="Exchanges Completed" icon={Sparkles} delay={0.3} />
            </div>
        </section>
    );
};

export default CommunityStats;
