import { motion } from 'framer-motion';
import { User, ShieldCheck, Sparkles, Star, MessageSquare, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    _id: string;
    user: { name: string };
    type: string;
    details: string;
    createdAt: string;
}

const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'SKILL_ADDED':
            return <div className="p-1.5 bg-blue-50 rounded-lg text-blue-500"><PlusCircle size={14} /></div>;
        case 'EXCHANGE_COMPLETED':
            return <div className="p-1.5 bg-green-50 rounded-lg text-green-500"><ShieldCheck size={14} /></div>;
        case 'RATING_RECEIVED':
            return <div className="p-1.5 bg-orange-50 rounded-lg text-orange-500"><Star size={14} /></div>;
        case 'MESSAGE_SENT':
            return <div className="p-1.5 bg-purple-50 rounded-lg text-purple-50"><MessageSquare size={14} /></div>;
        default:
            return <div className="p-1.5 bg-gray-50 rounded-lg text-gray-400"><User size={14} /></div>;
    }
};

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => {
    return (
        <div className="bg-white dark:bg-black rounded-[24px] border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Recent Activity
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">LIVE</span>
                </div>
            </div>

            <div className="max-h-[240px] overflow-y-auto pr-2 custom-scrollbar space-y-4 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100 dark:before:bg-gray-800">
                {activities.slice(0, 10).map((activity, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05 }}
                        key={activity._id || idx}
                        className="flex gap-3 relative z-10"
                    >
                        <div className="bg-white dark:bg-black ring-4 ring-white dark:ring-black">
                            <ActivityIcon type={activity.type} />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <p className="text-[13px] text-muted-foreground leading-snug">
                                <span className="font-bold text-foreground">{activity.user?.name || 'Unknown User'}</span>
                                <span className="mx-1 text-muted-foreground/70">{activity.details}</span>
                            </p>
                            <span className="text-[10px] text-muted-foreground/50 font-bold uppercase mt-1 block tracking-wider">
                                {activity.createdAt && !isNaN(new Date(activity.createdAt).getTime())
                                    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                                    : 'Recently'}
                            </span>
                        </div>
                    </motion.div>
                ))}
                {activities.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-sm text-gray-400 italic">No recent updates</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityFeed;
