import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Zap, Info, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { requestsAPI } from '@/services/api';
import { toast } from 'sonner';

interface RequestSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    skill: {
        _id: string;
        name: string;
        createdBy: {
            name: string;
        };
    } | null;
    onSuccess?: () => void;
}

const RequestSkillModal = ({ isOpen, onClose, skill, onSuccess }: RequestSkillModalProps) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const getQualityFeedback = () => {
        if (!message.trim()) return null;
        const msg = message.toLowerCase();

        const feedback = [];
        if (message.length < 20) feedback.push({ text: "Message is short. Add more context to improve acceptance rate!", icon: <Info size={14} /> });

        const goalKeywords = ['build', 'learn', 'help', 'guide', 'review', 'project', 'start'];
        const hasGoal = goalKeywords.some(word => msg.includes(word));
        if (!hasGoal) feedback.push({ text: "Tip: Mention a specific goal (e.g., 'build a project')", icon: <Zap size={14} /> });

        const timeKeywords = ['days', 'week', 'hours', 'weekend', 'month', 'time', 'availability'];
        const hasTime = timeKeywords.some(word => msg.includes(word));
        if (!hasTime) feedback.push({ text: "Add your availability or a rough timeline", icon: <Clock size={14} /> });

        return feedback;
    };

    const feedbacks = getQualityFeedback();

    if (!skill) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            toast.error('Please add a message to your request');
            return;
        }

        // Check for duplicate request client-side to prevent 409
        try {
            const { data: requests } = await requestsAPI.getAll();
            const existing = requests.outgoing.find((r: { skillId: string | { _id: string } | null, status: string }) => {
                if (!r.skillId) return false;
                const rSkillId = typeof r.skillId === 'object' ? r.skillId._id : r.skillId;
                return rSkillId === skill._id && ['Pending', 'Accepted', 'InProgress'].includes(r.status);
            });

            if (existing) {
                toast.error('You have already requested this skill');
                onClose();
                return;
            }

            setLoading(true);
            await requestsAPI.create({
                skillId: skill._id,
                message,
            });
            toast.success('Skill request sent successfully!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string, suggestion?: string } } };
            const serverMessage = error.response?.data?.message;
            const suggestion = error.response?.data?.suggestion;

            if (suggestion) {
                toast.error(`${serverMessage} Tip: ${suggestion}`, { duration: 5000 });
            } else {
                toast.error(serverMessage || 'Failed to send request');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white pt-8">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight">
                                    Request <span className="text-orange-500">Skill</span>
                                </h2>
                                <p className="text-sm text-gray-400 font-medium mt-1">
                                    Connect with {skill.createdBy.name}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="rounded-full hover:bg-gray-50"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="bg-orange-50/50 p-4 rounded-2xl">
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
                                    Requested Skill
                                </p>
                                <p className="text-lg font-bold text-gray-900">{skill.name}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">
                                    Collaboration Message
                                </label>
                                <Textarea
                                    placeholder="Tell them why you want to learn this skill and what you can offer in return..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="min-h-[140px] rounded-2xl border-gray-100 bg-gray-50/50 focus:border-orange-500/30 transition-all resize-none p-4 text-sm"
                                />

                                <AnimatePresence>
                                    {feedbacks && feedbacks.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-2 mt-4"
                                        >
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Smart Feedback</p>
                                            {feedbacks.map((f, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ x: -10 }}
                                                    animate={{ x: 0 }}
                                                    className="flex items-start gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50"
                                                >
                                                    <span className="text-blue-500 mt-0.5">{f.icon}</span>
                                                    <span className="text-[11px] font-semibold text-blue-700 leading-normal">{f.text}</span>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                    className="flex-1 rounded-2xl h-12 font-bold text-gray-400 hover:text-gray-900"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-12 shadow-lg shadow-orange-500/20 px-8 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Send Request
                                            <Send size={18} />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RequestSkillModal;
