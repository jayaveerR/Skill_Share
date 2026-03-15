import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ShieldCheck, ShieldAlert, Sparkles, Loader2, Star, UserCheck } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authAPI, type ExploreUser } from '@/services/api';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UserCardProps {
    user: ExploreUser;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
    const queryClient = useQueryClient();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeMutation = useMutation({
        mutationFn: () => authAPI.refreshAIAnalysis(user._id),
        onSuccess: (response) => {
            if (response.success) {
                toast.success('AI Analysis Completed');
                queryClient.invalidateQueries({ queryKey: ['users'] });
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
        setIsAnalyzing(true);
        analyzeMutation.mutate();
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

    const authenticityScore = user.aiAnalysis?.confidenceScore || 0;
    const isFake = user.aiAnalysis?.isFake || false;
    const hasBeenAnalyzed = !!user.aiAnalysis;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className="group bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
            {/* Premium Gradient Background Blur */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex items-start gap-4">
                <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground truncate">{user.name}</h3>
                        {authenticityScore > 85 && !isFake && (
                            <UserCheck className="text-blue-500" size={16} />
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        {user.bio || 'Sharing knowledge and growing together.'}
                    </p>
                </div>

                {/* AI Detection Symbol */}
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`p-2.5 rounded-xl border-2 transition-all shadow-sm ${
                        isAnalyzing 
                        ? 'bg-primary/10 border-primary/20 animate-pulse' 
                        : hasBeenAnalyzed 
                            ? isFake 
                                ? 'bg-red-50 border-red-200 text-red-600' 
                                : 'bg-green-50 border-green-200 text-green-600'
                            : 'bg-primary/5 border-primary/20 text-primary animate-pulse shadow-primary/10'
                    }`}
                    title="AI Deep Fake & Authenticity Analysis"
                >
                    {isAnalyzing ? (
                        <Loader2 size={20} className="animate-spin" />
                    ) : (
                        <Brain size={20} className={!hasBeenAnalyzed ? "animate-pulse" : ""} />
                    )}
                </motion.button>
            </div>

            {/* AI Result Section */}
            <AnimatePresence>
                {hasBeenAnalyzed && !isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                            isFake ? 'bg-red-50/50 border-red-100' : 'bg-primary/5 border-primary/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Deep Fake Verdict</span>
                            <div className="flex items-center gap-1">
                                {isFake ? <ShieldAlert size={12} className="text-red-500" /> : <ShieldCheck size={12} className="text-green-500" />}
                                <span className={`text-[10px] font-bold ${isFake ? 'text-red-600' : 'text-green-600'}`}>
                                    {isFake ? 'Potential Fake' : 'Real Profile'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${authenticityScore}%` }}
                                    className={`h-full rounded-full ${isFake ? 'bg-red-500' : 'bg-primary'}`}
                                />
                            </div>
                            <span className="text-xs font-black">{Math.round(authenticityScore)}%</span>
                        </div>
                        
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {user.aiAnalysis?.reasoning}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Details */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 p-2 rounded-xl border border-border/50 text-center">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Skills</p>
                    <p className="text-sm font-black">{user.skills?.length || 0}</p>
                </div>
                <div className="bg-muted/30 p-2 rounded-xl border border-border/50 text-center">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Rating</p>
                    <div className="flex items-center justify-center gap-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black">{user.averageRating?.toFixed(1) || '0.0'}</span>
                    </div>
                </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full rounded-xl border-primary/20 hover:bg-primary/5 text-primary text-xs font-bold gap-2"
                onClick={() => user._id && window.open(`/profile/${user._id}`)}
            >
                View Full Profile
                <Sparkles size={14} />
            </Button>
        </motion.div>
    );
};

export default UserCard;
