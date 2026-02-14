import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Sparkles, Info, Zap, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { skillsAPI } from '@/services/api';
import { toast } from 'sonner';

const skillSchema = z.object({
    name: z.string().min(2, 'Skill name must be at least 2 characters'),
    category: z.string().min(1, 'Please select a category'),
    level: z.string().min(1, 'Please select a level'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
});

type SkillFormValues = z.infer<typeof skillSchema>;

const categories = [
    'Development',
    'Design',
    'Marketing',
    'Business',
    'Music',
    'Language',
    'Photography',
    'Other',
];

interface AddSkillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddSkillModal = ({ isOpen, onClose, onSuccess }: AddSkillModalProps) => {
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SkillFormValues>({
        resolver: zodResolver(skillSchema),
        defaultValues: {
            name: '',
            category: '',
            level: '',
            description: ''
        }
    });

    const description = watch('description') || '';
    const category = watch('category');
    const level = watch('level');

    const getQualityFeedback = () => {
        if (!description.trim()) return null;
        const msg = description.toLowerCase();

        const feedback = [];
        if (description.length < 30) feedback.push({ text: "Tell us more! Detailed descriptions get 3x more requests.", icon: <Info size={14} /> });

        const keywords = ['learn', 'teach', 'experience', 'projects', 'tools', 'basics', 'advanced'];
        const hasKeywords = keywords.some(word => msg.includes(word));
        if (!hasKeywords) feedback.push({ text: "Tip: Mention tools or project types you've worked with.", icon: <Zap size={14} /> });

        return feedback;
    };

    const feedbacks = getQualityFeedback();

    const onSubmit = async (data: SkillFormValues) => {
        try {
            setLoading(true);
            await skillsAPI.create(data);
            toast.success('Skill added successfully!');
            reset();
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error.response?.data?.message || 'Failed to add skill');
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
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-background rounded-2xl shadow-xl overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-semibold">Add New Skill</h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Skill Name</label>
                                <Input
                                    {...register('name')}
                                    placeholder="e.g. React Development"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Category</label>
                                    <Select value={category} onValueChange={(val) => setValue('category', val, { shouldValidate: true })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c} value={c}>
                                                    {c}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-red-500">
                                            {errors.category.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Level</label>
                                    <Select value={level} onValueChange={(val) => setValue('level', val, { shouldValidate: true })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Advanced">Advanced</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.level && (
                                        <p className="text-sm text-red-500">
                                            {errors.level.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    {...register('description')}
                                    placeholder="Describe what you can teach..."
                                    className="min-h-[100px] rounded-xl"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-500">
                                        {errors.description.message}
                                    </p>
                                )}
                                <AnimatePresence>
                                    {feedbacks && feedbacks.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-2 mt-3"
                                        >
                                            {feedbacks.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                                    <span className="text-primary">{f.icon}</span>
                                                    <span className="text-[10px] font-bold text-primary/80 uppercase tracking-tight">{f.text}</span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Add Skill
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AddSkillModal;
