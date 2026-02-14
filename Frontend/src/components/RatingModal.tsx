import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ratingsAPI } from '@/services/api';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string;
    skillName: string;
    onSuccess?: () => void;
}

const RatingModal = ({ isOpen, onClose, requestId, skillName, onSuccess }: RatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setIsSubmitting(true);
        try {
            await ratingsAPI.create({
                requestId,
                score: rating,
                comment
            });
            toast.success('Thank you for your feedback!');
            onSuccess?.();
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to submit rating');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 border border-border"
                    >
                        <div className="bg-primary p-6 text-white text-center relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 text-white hover:bg-white/20"
                                onClick={onClose}
                                title="Close"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </Button>
                            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-md">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-bold">Rate Your Experience</h2>
                            <p className="text-primary-foreground/80 mt-1">Collaboration on <b>{skillName}</b></p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">How was the collaboration?</p>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="transition-all hover:scale-110 active:scale-95 outline-none"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHover(star)}
                                            onMouseLeave={() => setHover(0)}
                                            title={`${star} Star${star > 1 ? 's' : ''}`}
                                            aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                                        >
                                            <Star
                                                size={40}
                                                className={`transition-colors ${(hover || rating) >= star
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-muted-foreground/30'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <p className="mt-4 text-sm font-semibold h-5">
                                    {rating === 1 && "Poor"}
                                    {rating === 2 && "Fair"}
                                    {rating === 3 && "Good"}
                                    {rating === 4 && "Great"}
                                    {rating === 5 && "Amazing!"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <MessageSquare size={16} />
                                    <span>Feedback (Optional)</span>
                                </div>
                                <Textarea
                                    placeholder="Leave a short comment about what you learned or how it went..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="min-h-[100px] resize-none border-muted focus:border-primary transition-all rounded-xl"
                                    maxLength={200}
                                />
                                <div className="text-[10px] text-right text-muted-foreground">
                                    {comment.length}/200 characters
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Later
                                </Button>
                                <Button
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || rating === 0}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Rating'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RatingModal;
