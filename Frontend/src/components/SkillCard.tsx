import React, { useState, useEffect, forwardRef, Ref } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2, Star, TrendingUp, MessageSquare, Brain, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { skillsAPI, requestsAPI, authAPI, ExploreSkill } from '@/services/api';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SkillProps {
    skill: ExploreSkill;
    onRequest?: (skill: ExploreSkill) => void;
    onChat?: () => void;
    onRemove?: () => void;
    status?: string;
    rejectedAt?: string;
    isOwnSkill?: boolean;
}

const SkillCard = forwardRef(({ skill, onRequest, onChat, onRemove, status, rejectedAt, isOwnSkill }: SkillProps, ref: Ref<HTMLDivElement>) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // AI Analysis Logic
    const analyzeMutation = useMutation({
        mutationFn: () => authAPI.refreshAIAnalysis(skill.createdBy?._id || ''),
        onSuccess: (response) => {
            if (response.success) {
                toast.success('AI Analysis Completed');
                queryClient.invalidateQueries({ queryKey: ['skills'] });
            }
            setIsAnalyzing(false);
        },
        onError: () => {
            toast.error('AI Analysis failed');
            setIsAnalyzing(false);
        }
    });

    const handleAnalyze = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!skill.createdBy?._id) return;
        setIsAnalyzing(true);
        analyzeMutation.mutate();
    };

    // Fetch requests to check for active collaborations (for the remove button state)
    const { data: requestsResponse } = useQuery({
        queryKey: ['my-requests'],
        queryFn: requestsAPI.getAll,
        enabled: isOwnSkill
    });

    const hasActiveCollabs = isOwnSkill && requestsResponse?.data?.incoming?.some((r: { skillId: string | { _id: string } | null, status: string }) => {
        if (!r.skillId) return false;
        const id = typeof r.skillId === 'object' ? r.skillId._id : r.skillId;
        return id === skill._id && ['Pending', 'Accepted', 'InProgress'].includes(r.status);
    });

    const deleteMutation = useMutation({
        mutationFn: () => skillsAPI.delete(skill._id),
        onSuccess: () => {
            toast.success('Skill removed permanently');
            queryClient.invalidateQueries({ queryKey: ['skills'] });
            setShowDeleteAlert(false);
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            const message = error.response?.data?.message || 'Failed to remove skill';
            toast.error(message);
        }
    });

    useEffect(() => {
        if (status === 'Rejected' && rejectedAt) {
            const calculateTimeLeft = () => {
                const rejectionTime = new Date(rejectedAt).getTime();
                const now = new Date().getTime();
                const diff = rejectionTime + 3600000 - now; // 1 hour = 3600000 ms

                if (diff <= 0) {
                    setTimeLeft(null);
                    return;
                }
                setTimeLeft(diff);
            };

            calculateTimeLeft();
            const timer = setInterval(calculateTimeLeft, 1000);
            return () => clearInterval(timer);
        } else {
            setTimeLeft(null);
        }
    }, [status, rejectedAt]);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarUrl = (name: string) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    };

    const isPending = status === 'Pending';
    const isAccepted = status === 'Accepted';
    const isRejectedLocked = status === 'Rejected' && timeLeft !== null;

    const renderBadges = () => {
        const badges = [];
        if (!skill.createdBy) return null;
        const { completedCollaborations, averageRating } = skill.createdBy;

        if (completedCollaborations && completedCollaborations >= 10) {
            badges.push({ text: 'Top Contributor', color: 'bg-blue-100 text-blue-700' });
        }
        if (averageRating && averageRating >= 4.5) {
            badges.push({ text: 'Trusted Mentor', color: 'bg-amber-100 text-amber-700' });
        }
        if (!averageRating || averageRating === 0) {
            badges.push({ text: 'New Member', color: 'bg-green-100 text-green-700' });
        }

        return badges.map((badge, idx) => (
            <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.color}`}>
                {badge.text}
            </span>
        ));
    };

    const userAnalysis = skill.createdBy?.aiAnalysis;
    const hasBeenAnalyzed = !!userAnalysis;
    const isFake = userAnalysis?.isFake;

    return (
        <motion.div
            layout
            ref={ref}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
            {skill.isTrending && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-xl flex items-center gap-1.5 z-10 shadow-lg">
                    <span className="text-[10px] font-black uppercase tracking-widest">Trending</span>
                    <TrendingUp size={12} className="animate-bounce" />
                </div>
            )}
            <div>
                <div className="flex items-start gap-4 mb-4">
                    <div
                        className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300 cursor-pointer relative"
                        onClick={() => skill.createdBy?._id && navigate(`/profile/${skill.createdBy._id}`)}
                    >
                        <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-background">
                            <AvatarImage
                                src={skill.createdBy?.avatar || (skill.createdBy?.name ? getAvatarUrl(skill.createdBy.name) : undefined)}
                                alt={skill.createdBy?.name || 'User'}
                            />
                            <AvatarFallback>{skill.createdBy?.name ? getInitials(skill.createdBy.name) : '??'}</AvatarFallback>
                        </Avatar>
                        {skill.createdBy?.isOnline && (
                             <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full shadow-sm" />
                        )}
                    </div>
                    <div
                        className="flex-1 flex flex-col overflow-hidden cursor-pointer"
                        onClick={() => skill.createdBy?._id && navigate(`/profile/${skill.createdBy._id}`)}
                    >
                        <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {skill.createdBy?.name || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{skill.category}</p>
                    </div>

                    {/* AI Analysis Button */}
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className={`p-1.5 rounded-lg border transition-all ${
                            isAnalyzing 
                            ? 'bg-primary/10 border-primary/20 animate-pulse' 
                            : hasBeenAnalyzed 
                                ? isFake 
                                    ? 'bg-red-50 border-red-200 text-red-600' 
                                    : 'bg-green-50 border-green-200 text-green-600'
                                : 'bg-primary/5 border-primary/20 text-primary animate-pulse'
                        }`}
                        title="AI Deep Fake & Authenticity Analysis"
                    >
                        {isAnalyzing ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Brain size={16} className={!hasBeenAnalyzed ? "animate-pulse" : ""} />
                        )}
                    </motion.button>
                </div>

                {/* AI Analysis Result Section (Collapsible) */}
                <AnimatePresence>
                    {hasBeenAnalyzed && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={`p-2 rounded-xl border flex flex-col gap-1 overflow-hidden ${
                                isFake ? 'bg-red-50/50 border-red-100' : 'bg-green-50/30 border-green-100/50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    {isFake ? <ShieldAlert size={12} className="text-red-500" /> : <ShieldCheck size={12} className="text-green-500" />}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isFake ? 'text-red-600' : 'text-green-600'}`}>
                                        {isFake ? 'Potential Fake Detection' : 'Real Profile Verified'}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold opacity-70">{Math.round(userAnalysis.confidenceScore)}%</span>
                            </div>
                            <p className="text-[9px] text-muted-foreground line-clamp-1 italic">
                                {userAnalysis.reasoning}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {renderBadges()}
                </div>

                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {skill.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {skill.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-6 bg-muted/30 border border-border/50 p-2 rounded-lg">
                    <span>Member Rating:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        {skill.createdBy?.averageRating?.toFixed(1) || '0.0'}
                    </span>
                </div>
            </div>

            {isAccepted ? (
                <Button
                    className="w-full bg-[#008069] hover:bg-[#008069]/90 text-white rounded-xl"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onChat) onChat();
                    }}
                >
                    <MessageSquare size={16} className="mr-2" />
                    Chat
                </Button>
            ) : isOwnSkill ? (
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className={`w-full font-bold rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2 ${hasActiveCollabs ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !hasActiveCollabs && setShowDeleteAlert(true)}
                        disabled={hasActiveCollabs}
                    >
                        <Trash2 size={16} />
                        Remove Permanently
                    </Button>
                    {hasActiveCollabs && (
                        <p className="text-[10px] text-red-500 text-center font-medium">
                            Active collaborations prevent removal
                        </p>
                    )}
                </div>
            ) : (
                <Button
                    className={`w-full font-bold rounded-xl transition-all ${isPending
                        ? 'bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed'
                        : isOwnSkill
                            ? 'bg-secondary text-muted-foreground cursor-default'
                            : 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                        } ${isRejectedLocked ? 'bg-red-100 text-red-500 hover:bg-red-100 cursor-not-allowed' : ''}`}
                    onClick={() => !isPending && !isOwnSkill && !isRejectedLocked && onRequest && onRequest(skill)}
                    disabled={isPending || isOwnSkill || isRejectedLocked}
                >
                    {isPending ? 'Request Pending' : isRejectedLocked ? `Try again in ${formatTime(timeLeft!)}` : 'Request Skill'}
                </Button>
            )}

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            <span className="font-bold text-foreground mx-1">"{skill.name}"</span>
                            skill from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                deleteMutation.mutate();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2 font-bold"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
});

SkillCard.displayName = "SkillCard";

export default SkillCard;
