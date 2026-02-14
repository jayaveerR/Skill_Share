import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SkillSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: {
        name: string;
        skills: Array<{ _id: string; name: string; category: string }>;
    } | null;
    onSelectSkill: (skill: { _id: string; name: string; category: string }) => void;
}

const SkillSelectionModal = ({ isOpen, onClose, member, onSelectSkill }: SkillSelectionModalProps) => {
    if (!member) return null;

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
                        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight">
                                    Select a <span className="text-orange-500">Skill</span>
                                </h2>
                                <p className="text-sm text-gray-400 font-medium mt-1">
                                    Which skill would you like to request from {member.name}?
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

                        <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
                            {member.skills.map((skill) => (
                                <motion.button
                                    key={skill._id}
                                    whileHover={{ x: 4 }}
                                    onClick={() => onSelectSkill(skill)}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-orange-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-orange-500 shadow-sm">
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">{skill.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{skill.category}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:text-orange-500 shadow-sm transition-colors">
                                        <ChevronRight size={16} />
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <div className="p-6 bg-gray-50/50">
                            <p className="text-xs text-center text-gray-400 font-medium">
                                Choosing a specific skill helps starting a focused collaboration.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SkillSelectionModal;
