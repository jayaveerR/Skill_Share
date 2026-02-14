import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sparkles, Users, Filter, LayoutGrid, ShieldCheck, MessageCircle, Heart, Star, TrendingUp, Info, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CommunityStats from '@/components/CommunityStats';
import MemberCard from '@/components/MemberCard';
import ActivityFeed from '@/components/ActivityFeed';
import { communityAPI, CommunityMember } from '@/services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import SkillSelectionModal from '@/components/SkillSelectionModal';
import RequestSkillModal from '@/components/RequestSkillModal';
import { requestsAPI, type ExploreSkill, type SkillRequest } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { getSocket } from '@/services/socket';
import { useQueryClient } from '@tanstack/react-query';

const filters = [
  { id: 'All', label: 'All Members' },
  { id: 'Online', label: 'Online Now' },
  { id: 'TopRated', label: 'Top Rated' },
  { id: 'RecentlyActive', label: 'Recently Active' },
  { id: 'New', label: 'New Members' }
];

const Community = () => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedMemberForSelection, setSelectedMemberForSelection] = useState<CommunityMember | null>(null);
  const [selectedSkillForRequest, setSelectedSkillForRequest] = useState<ExploreSkill | null>(null);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = getSocket();

  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, 5000, { duration: 2.5, ease: "circOut" });
    return animation.stop;
  }, [count]);

  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
    };

    socket.on('user-online', handlePresenceUpdate);
    socket.on('user-offline', handlePresenceUpdate);

    return () => {
      socket.off('user-online', handlePresenceUpdate);
      socket.off('user-offline', handlePresenceUpdate);
    };
  }, [socket, queryClient]);

  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['community-members'],
    queryFn: () => communityAPI.getMembers(),
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['community-stats'],
    queryFn: () => communityAPI.getStats(),
  });

  const { data: activitiesResponse } = useQuery({
    queryKey: ['community-activities'],
    queryFn: () => communityAPI.getActivities(),
  });

  const { data: requestsResponse, refetch: refetchRequests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestsAPI.getAll(),
    enabled: isAuthenticated,
  });

  const myRequests: SkillRequest[] = requestsResponse?.data?.outgoing || [];

  const filteredMembers = useMemo(() => {
    if (!membersResponse?.data) return [];
    let members = [...membersResponse.data];

    // Hide logged-in user's profile
    if (currentUser) {
      members = members.filter(m => m._id !== currentUser._id);
    }

    switch (activeFilter) {
      case 'Online':
        return members.filter(m => m.isOnline);
      case 'TopRated':
        return members.sort((a, b) => b.rating - a.rating);
      case 'RecentlyActive':
        return members.sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime());
      case 'New':
        return members.filter(m => m.ratingCount === 0);
      default:
        return members;
    }
  }, [membersResponse, activeFilter, currentUser]);

  const topContributors = useMemo(() => {
    if (!membersResponse?.data) return [];
    return membersResponse.data
      .filter(m => m.rating >= 4.5 && m.ratingCount > 5)
      .slice(0, 6);
  }, [membersResponse]);

  const handleRequestSkill = (member: CommunityMember) => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a skill');
      return;
    }

    if (member.skills.length === 0) {
      toast.error('This member has no skills listed yet');
      return;
    }

    if (member.skills.length === 1) {
      const skill = member.skills[0];
      setSelectedSkillForRequest({
        _id: skill._id,
        name: skill.name,
        category: skill.category,
        createdBy: {
          _id: member._id,
          name: member.name,
          email: member.email,
        }
      } as ExploreSkill);
      setIsRequestModalOpen(true);
    } else {
      setSelectedMemberForSelection(member);
      setIsSelectionModalOpen(true);
    }
  };

  const handleSkillSelected = (skill: { _id: string; name: string; category: string }) => {
    if (!selectedMemberForSelection) return;

    setSelectedSkillForRequest({
      _id: skill._id,
      name: skill.name,
      category: skill.category,
      createdBy: {
        _id: selectedMemberForSelection._id,
        name: selectedMemberForSelection.name,
        email: selectedMemberForSelection.email,
      }
    } as ExploreSkill);
    setIsSelectionModalOpen(false);
    setIsRequestModalOpen(true);
  };

  const handleViewProfile = (id: string) => {
    navigate(`/profile/${id}`);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-black selection:bg-orange-100 dark:selection:bg-orange-900/30">
      {/* 1️⃣ COMMUNITY HERO */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-orange-50/30 to-background dark:from-black dark:to-black overflow-hidden relative">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-widest mb-6"
            >
              <Users size={14} />
              Global Community
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-[1.1] tracking-tight">
              Meet the <span className="text-orange-500">Community</span>
            </h1>
            <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Connect with skilled people, collaborate on projects, and grow your expertise in our trusted ecosystem.
            </p>

            <div className="flex justify-center mt-8">
              <Button
                onClick={() => navigate('/community-chat')}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-6 font-bold text-lg transition-all shadow-xl hover:shadow-orange-500/20 hover:-translate-y-1"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Join Group Discussions
              </Button>
            </div>
          </motion.div>

          {/* Stats Row */}
          {statsResponse && (
            <div className="max-w-5xl mx-auto">
              <CommunityStats stats={statsResponse.data} />
            </div>
          )}

          {/* Trusted by Thousands Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col items-center justify-center mt-12 space-y-4"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + (i * 0.1) }}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
                >
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="Community member"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                +2k
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-orange-500 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm font-bold text-foreground">
                Our Impact: <span className="text-orange-600 font-black"><motion.span>{rounded}</motion.span>+</span> skilled members
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-50/20 rounded-full blur-3xl -ml-48 -mb-48" />
      </section>

      {/* 2️⃣ QUICK FILTER BAR (STICKY) */}
      <div className="sticky top-16 z-40 bg-background/95 dark:bg-black/95 backdrop-blur-sm border-b border-border py-4 supports-[backdrop-filter]:bg-background/60 dark:supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 relative",
                  activeFilter === filter.id
                    ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {filter.label}
                {activeFilter === filter.id && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute -bottom-4 left-0 right-0 h-0.5 bg-orange-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div >

      <section className="py-16 bg-muted/30 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* 3️⃣ ACTIVE MEMBERS GRID */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  <TrendingUp className="text-orange-500" />
                  Active Members
                </h2>
                <span className="text-sm font-bold text-gray-400">
                  {filteredMembers.length} PERSONS FOUND
                </span>
              </div>

              {membersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 4, 6].map((n) => (
                    <div key={n} className="h-80 bg-muted rounded-[32px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredMembers.map((member: CommunityMember) => {
                      const acceptedRequest = myRequests.find(r =>
                        r.requestedTo && (typeof r.requestedTo === 'string' ? r.requestedTo === member._id : r.requestedTo._id === member._id) &&
                        r.status === 'Accepted'
                      );

                      const pendingRequest = myRequests.find(r =>
                        r.requestedTo && (typeof r.requestedTo === 'string' ? r.requestedTo === member._id : r.requestedTo._id === member._id) &&
                        r.status === 'Pending'
                      );

                      return (
                        <MemberCard
                          key={member._id}
                          member={{
                            ...member,
                            isTopContributor: member.rating >= 4.5 && member.ratingCount > 5
                          }}
                          onRequestSkill={() => handleRequestSkill(member)}
                          onViewProfile={() => handleViewProfile(member._id)}
                          onChat={() => navigate('/dashboard', {
                            state: {
                              activeChat: {
                                requestId: acceptedRequest?._id,
                                peerId: member._id,
                                peerName: member.name,
                                skillName: typeof acceptedRequest?.skillId === 'object' ? acceptedRequest.skillId.name : 'Skill',
                                status: 'Accepted'
                              }
                            }
                          })}
                          isRequestAccepted={!!acceptedRequest}
                          isPending={!!pendingRequest}
                        />
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 8️⃣ EMPTY STATE */}
              {filteredMembers.length === 0 && !membersLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24 bg-white dark:bg-black rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800"
                >
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <LayoutGrid size={32} className="text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 shadow-sm">No members found</h3>
                  <p className="text-gray-400 mb-8 max-w-xs mx-auto">Try adjusting your filters or search for something else.</p>
                  <Button
                    onClick={() => setActiveFilter('All')}
                    variant="outline"
                    className="rounded-full px-8 font-bold"
                  >
                    Clear All Filters
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:w-[360px] space-y-6">
              <div className="sticky top-32 space-y-6">
                {/* 5️⃣ RECENT ACTIVITY */}
                {activitiesResponse && (
                  <ActivityFeed activities={activitiesResponse.data} />
                )}

                {/* 7️⃣ SAFETY & GUIDELINES */}
                <div className="bg-card dark:bg-black rounded-[24px] p-6 text-card-foreground border border-border shadow-sm overflow-hidden relative group">
                  <div className="relative z-10">
                    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                      <ShieldCheck className="text-orange-500" />
                      Safety First
                    </h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={12} className="text-orange-500" />
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium">Respectful communication is mandatory.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={12} className="text-orange-500" />
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium">No monetary transactions allowed on platform.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-5 h-5 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 size={12} className="text-orange-500" />
                        </div>
                        <p className="text-[13px] text-gray-600 font-medium">Report any misuse to the moderators.</p>
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-black text-white hover:bg-gray-800 transition-all rounded-xl font-black text-xs tracking-widest h-11 uppercase">
                      READ FULL GUIDELINES
                    </Button>
                  </div>
                  {/* Decorative icon */}
                  <ShieldCheck size={120} className="absolute -right-8 -bottom-8 text-gray-100 group-hover:rotate-12 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4️⃣ TOP CONTRIBUTORS SECTION */}
      <section className="py-24 bg-card dark:bg-black border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 text-[10px] font-black uppercase tracking-wider mb-4">
                <Sparkles size={12} />
                Recognition
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
                Top <span className="text-orange-500">Contributors</span>
              </h2>
            </div>
            <p className="text-gray-500 font-medium max-w-sm">
              Recognizing members who consistently share knowledge and build trust.
            </p>
          </div>

          <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar -mx-4 px-4 snap-x">
            {topContributors.map((member, idx) => (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="min-w-[280px] md:min-w-[320px] bg-card dark:bg-black border border-border rounded-[32px] p-6 hover:shadow-xl transition-all duration-500 snap-center group"
              >
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-14 h-14 border-2 border-orange-100 dark:border-orange-900/30 p-0.5">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=fdf2f0&color=f97316&bold=true`} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-foreground transition-colors">{member.name}</h4>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <span className="text-[12px] font-black text-gray-400 uppercase tracking-tight">{member.ratingCount} COLLABORATIONS</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl transition-colors duration-500">
                  <span className="text-[11px] font-black text-orange-600 uppercase tracking-widest">TOP CONTRIBUTOR</span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-500">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6️⃣ SKILL GROUPS (CTA to Explore) */}
      <section className="py-24 bg-muted/30 dark:bg-black">
        <div className="container mx-auto px-4">
          <div className="bg-card dark:bg-black border border-border shadow-xl rounded-[40px] p-8 md:p-16 text-card-foreground flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                Want to learn or share a <br /> specific skill?
              </h2>
              <p className="text-gray-500 text-lg md:text-xl font-medium mb-12">
                Explore thousands of skills shared by community members across hundreds of categories.
              </p>
              <Button
                onClick={() => navigate('/explore')}
                className="bg-black text-white hover:bg-orange-500 transition-all rounded-full px-12 py-7 font-black text-sm tracking-widest h-14 uppercase shadow-xl"
              >
                EXPLORE ALL SKILLS
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 dark:bg-orange-900/20 rounded-full -mr-32 -mt-32 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-muted rounded-full -ml-32 -mb-32 blur-2xl" />
            <Sparkles size={200} className="absolute left-12 top-12 text-orange-500/5 -rotate-12" />
          </div>
        </div>
      </section>

      <SkillSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        member={selectedMemberForSelection}
        onSelectSkill={handleSkillSelected}
      />

      <RequestSkillModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        skill={selectedSkillForRequest}
        onSuccess={refetchRequests}
      />
    </div >
  );
};

export default Community;
