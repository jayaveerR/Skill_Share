import { forwardRef, Ref } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Star, MessageSquare, UserPlus, ShieldCheck, ExternalLink, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MemberProps {
    member: {
        _id: string;
        name: string;
        role?: string;
        avatar?: string;
        skills: Array<{ name: string; category: string }>;
        rating: number;
        ratingCount: number;
        isOnline: boolean;
        lastSeen?: string;
        isTopContributor?: boolean;
    };
    onViewProfile?: (id: string) => void;
    onRequestSkill?: (id: string) => void;
    onChat?: (id: string) => void;
    isRequestAccepted?: boolean;
    isPending?: boolean;
}

const MemberCard = forwardRef(({ member, onViewProfile, onRequestSkill, onChat, isRequestAccepted, isPending }: MemberProps, ref: Ref<HTMLDivElement>) => {
    const navigate = useNavigate();
    const getAvatarUrl = (name: string) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fdf2f0&color=f97316&bold=true`;
    };

    return (
        <motion.div
            layout
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            viewport={{ once: true }}
            className="group relative bg-card dark:bg-black rounded-[24px] p-6 border border-border shadow-sm hover:shadow-xl transition-all duration-300"
        >
            {/* Top Indicator */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
                {member.isTopContributor && (
                    <Badge className="bg-orange-500 text-white border-none text-[10px] font-bold px-2 py-0.5">
                        TOP CONTRIBUTOR
                    </Badge>
                )}
                {!member.isTopContributor && (
                    <Badge variant="outline" className="text-muted-foreground text-[10px] uppercase font-bold px-2 py-0.5 border-border">
                        NEW MEMBER
                    </Badge>
                )}
            </div>

            <div className="flex flex-col items-center text-center">
                {/* Avatar with Status */}
                <div
                    className="relative mb-4 cursor-pointer"
                    onClick={() => navigate(`/profile/${member._id}`)}
                >
                    <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-orange-500 to-orange-200 overflow-hidden">
                        <Avatar className="h-full w-full border-4 border-white">
                            <AvatarImage src={member.avatar || getAvatarUrl(member.name)} alt={member.name} className="object-cover" />
                            <AvatarFallback className="bg-orange-50 text-orange-500 font-bold text-xl">
                                {member.name ? member.name[0] : '?'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className={cn(
                        "absolute bottom-1 right-1 w-4 h-4 border-2 border-white rounded-full",
                        member.isOnline ? "bg-green-500" : "bg-gray-300"
                    )} />
                </div>

                {/* Name & Role */}
                <h3
                    className="text-lg font-bold text-foreground mb-1 transition-colors cursor-pointer"
                    onClick={() => navigate(`/profile/${member._id}`)}
                >
                    {member.name}
                </h3>
                <div className="flex flex-col items-center mb-4">
                    {!member.isOnline && member.lastSeen && !isNaN(new Date(member.lastSeen).getTime()) && (
                        <p className="text-[10px] text-muted-foreground mb-1">
                            Last seen {format(new Date(member.lastSeen), 'HH:mm')}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                        <span className="text-foreground">{member.rating > 0 ? member.rating.toFixed(1) : 'New'}</span>
                        <span className="text-muted-foreground font-normal">({member.ratingCount || 0} reviews)</span>
                    </div>
                </div>

                {/* Skills Tags */}
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                    {member.skills.slice(0, 2).map((skill, idx) => (
                        <span
                            key={idx}
                            className="bg-muted text-muted-foreground text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-tight"
                        >
                            {skill.name}
                        </span>
                    ))}
                    {member.skills.length > 2 && (
                        <span className="text-muted-foreground text-[11px] font-bold py-1">
                            +{member.skills.length - 2} MORE
                        </span>
                    )}
                </div>
                {/* Action Buttons */}
                <div className="w-full mt-6 flex flex-col gap-2">
                    <Button
                        onClick={() => !isPending && onRequestSkill?.(member._id)}
                        disabled={isPending}
                        className={cn(
                            "w-full font-bold rounded-xl h-11 transition-all",
                            isPending
                                ? "bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed"
                                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                        )}
                    >
                        {isPending ? 'Request Pending' : 'Request Skill'}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onViewProfile?.(member._id)}
                            className="flex-1 rounded-xl h-11 font-bold border-border hover:bg-muted flex items-center justify-center gap-2"
                        >
                            Profile
                            <ExternalLink size={14} />
                        </Button>
                        {isRequestAccepted && (
                            <Button
                                onClick={() => onChat?.(member._id)}
                                className="flex-1 bg-black hover:bg-gray-900 text-white rounded-xl h-11 font-bold flex items-center justify-center gap-2"
                            >
                                Chat
                                <MessageCircle size={14} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

MemberCard.displayName = "MemberCard";

export default MemberCard;
