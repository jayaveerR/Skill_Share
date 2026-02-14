import React, { useState, useEffect, forwardRef, Ref } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trash2, Loader2, Star, TrendingUp, MessageSquare } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { skillsAPI, requestsAPI, ExploreSkill } from '@/services/api';
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
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
                        className="flex-shrink-0 group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => skill.createdBy?._id && navigate(`/profile/${skill.createdBy._id}`)}
                    >
                        <Avatar className="h-12 w-12 border-2 border-primary/20 ring-2 ring-background">
                            <AvatarImage
                                src={skill.createdBy?.avatar || (skill.createdBy?.name ? getAvatarUrl(skill.createdBy.name) : undefined)}
                                alt={skill.createdBy?.name || 'User'}
                            />
                            <AvatarFallback>{skill.createdBy?.name ? getInitials(skill.createdBy.name) : '??'}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div
                        className="flex-1 flex flex-col overflow-hidden cursor-pointer"
                        onClick={() => skill.createdBy?._id && navigate(`/profile/${skill.createdBy._id}`)}
                    >
                        <h4 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {skill.createdBy?.name || 'Unknown User'}
                            {skill.createdBy?.isOnline && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="ml-1.5 inline-block w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background animate-pulse shadow-sm"
                                    title="Online"
                                />
                            )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{skill.category}</p>
                        {skill.insights && skill.insights.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {skill.insights.map((insight, idx) => (
                                    <span key={idx} className="text-[8px] font-black uppercase tracking-tighter text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-1 py-0.5 rounded border border-orange-100/50 dark:border-orange-900/30">
                                        {insight}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-auto flex-shrink-0">
                        <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {skill.level}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs">
                            {skill.createdBy?.averageRating ? (
                                <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-bold">
                                    <Star size={10} className="fill-current mr-0.5" />
                                    <span>{skill.createdBy.averageRating.toFixed(1)}</span>
                                    {skill.createdBy.totalRatings !== undefined && (
                                        <span className="text-muted-foreground font-normal ml-0.5">({skill.createdBy.totalRatings})</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted-foreground font-normal italic">New</span>
                            )}
                        </div>
                    </div>
                </div>

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
                    <span>Collaborations:</span>
                    <span className="font-semibold text-foreground">{skill.createdBy?.completedCollaborations || 0} ✅</span>
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
                            : 'bg-primary/5 hover:bg-primary/10 text-foreground dark:text-foreground border border-border'
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

SkillCard.displayName = "SkillCard"; // Add display name for debugging

export default SkillCard;
