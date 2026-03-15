import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Plus, X as CloseIcon, Star, BarChart, ArrowUpDown, Filter, TrendingUp, Zap, Lightbulb, Brain } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SkillCard from '@/components/SkillCard';
import AddSkillModal from '@/components/AddSkillModal';
import RequestSkillModal from '@/components/RequestSkillModal';
import ChatPanel from '@/components/ChatPanel';
import { skillsAPI, requestsAPI, authAPI, type ExploreSkill, type SkillRequest, type ExploreUser } from '@/services/api';
import UserCard from '@/components/UserCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useChat } from '@/services/ChatContext';
import { getSocket } from '@/services/socket';


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

const Explore = () => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [isOnlineOnly, setIsOnlineOnly] = useState(false);
  const [showMySkills, setShowMySkills] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'collaborations'>('newest');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [viewType, setViewType] = useState<'skills' | 'users'>('skills');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedSkillForRequest, setSelectedSkillForRequest] = useState<ExploreSkill | null>(null);
  const [activeChat, setActiveChat] = useState<{
    requestId: string;
    peerId: string;
    peerName: string;
    skillName: string;
    status: string
  } | null>(null);

  const { endSession } = useChat();
  const socket = getSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleRequestUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    };

    socket.on('request-accepted', handleRequestUpdate);
    socket.on('request-rejected', handleRequestUpdate);
    socket.on('new-request', handleRequestUpdate);
    socket.on('profile-rating-updated', handleRequestUpdate);
    socket.on('user-online', handleRequestUpdate);
    socket.on('user-offline', handleRequestUpdate);
    socket.on('skill-removed', handleRequestUpdate);

    const handleScroll = () => {
      const position = window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((position / maxScroll) * 100);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      socket.off('request-accepted', handleRequestUpdate);
      socket.off('request-rejected', handleRequestUpdate);
      socket.off('new-request', handleRequestUpdate);
      socket.off('profile-rating-updated', handleRequestUpdate);
      socket.off('user-online', handleRequestUpdate);
      socket.off('user-offline', handleRequestUpdate);
      socket.off('skill-removed', handleRequestUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [socket, queryClient]);

  const closeChat = () => {
    if (activeChat) {
      endSession(activeChat.requestId);
      setActiveChat(null);
    }
  };

  const {
    data: skillsResponse,
    isLoading: isSkillsLoading,
    refetch: refetchSkills,
  } = useQuery({
    queryKey: ['skills', selectedCategory, searchQuery],
    queryFn: () => skillsAPI.getAll(selectedCategory || undefined, searchQuery),
  });

  const {
    data: requestsResponse,
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestsAPI.getAll(),
    enabled: isAuthenticated,
  });

  const {
    data: usersResponse,
    isLoading: isUsersLoading,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => authAPI.getUsers(),
    enabled: viewType === 'users',
  });

  const skills: (ExploreSkill & { relevanceScore?: number, isTrending?: boolean, insights?: string[] })[] = skillsResponse?.data || [];
  const usersList: ExploreUser[] = usersResponse?.data || [];
  const myRequests: SkillRequest[] = requestsResponse?.data?.outgoing || [];

  const trackViewMutation = useMutation({
    mutationFn: (id: string) => skillsAPI.trackView(id),
  });

  const handleSkillView = (skillId: string) => {
    trackViewMutation.mutate(skillId);
  };

  const filteredSkills = skills.filter((skill) => {
    if (!skill || !skill.createdBy) return false;
    if (minRating > 0 && (skill.createdBy.averageRating || 0) < minRating) return false;
    if (selectedLevel && skill.level !== selectedLevel) return false;
    if (isOnlineOnly && !skill.createdBy.isOnline) return false;
    if (showMySkills && skill.createdBy._id !== user?._id) return false;
    return true;
  });

  const recommendedSkills = isAuthenticated
    ? [...filteredSkills].filter(s => (s.relevanceScore || 0) > 40).slice(0, 4)
    : [];

  const trendingSkills = [...filteredSkills].filter(s => s.isTrending).slice(0, 4);

  const displaySkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === 'rating') {
      return ((b.createdBy?.averageRating || 0) - (a.createdBy?.averageRating || 0));
    }
    if (sortBy === 'collaborations') {
      return ((b.createdBy?.completedCollaborations || 0) - (a.createdBy?.completedCollaborations || 0));
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddSkillClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add a skill');
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleRequestSkill = (skill: ExploreSkill) => {
    if (!isAuthenticated) {
      toast.error('Please log in to request a skill');
      return;
    }
    handleSkillView(skill._id);
    setSelectedSkillForRequest(skill);
    setIsRequestModalOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Accepted' | 'Rejected' | 'Completed' }) =>
      requestsAPI.updateStatus(id, status),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  });

  const handleStatusUpdate = (id: string, status: 'Accepted' | 'Rejected' | 'Completed') => {
    updateStatusMutation.mutate({ id, status });
  };

  // Logic: Heuristic Suggestions
  const getSuggestions = () => {
    const suggestions = [];
    if (scrollProgress > 40 && !dismissedSuggestions.includes('online')) {
      suggestions.push({ id: 'online', text: 'Looking for fast replies? Try "Online Now"', icon: <Zap size={14} />, action: () => setIsOnlineOnly(true) });
    }
    if (filteredSkills.length > 10 && !dismissedSuggestions.includes('rating')) {
      suggestions.push({ id: 'rating', text: 'Overwhelmed? Sort by "Top Rated"', icon: <Star size={14} />, action: () => setSortBy('rating') });
    }
    if (isAuthenticated && (user?.completedCollaborations || 0) < 2 && !dismissedSuggestions.includes('beginner')) {
      suggestions.push({ id: 'beginner', text: 'New here? Explore "Beginner Friendly" skills', icon: <Lightbulb size={14} />, action: () => setSelectedLevel('Beginner') });
    }
    return suggestions;
  };

  const activeSuggestions = getSuggestions();

  return (
    <section className="py-12 md:py-20 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12 gap-6 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-foreground text-sm font-medium mb-4">
              <Sparkles size={16} />
              Discover Community
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {viewType === 'skills' ? 'Explore ' : 'Discover '}
              <span className="text-primary">{viewType === 'skills' ? 'Skills' : 'Members'}</span>
            </h1>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-muted p-1 rounded-2xl flex gap-1 shadow-inner border border-border">
            <Button
              variant={viewType === 'skills' ? 'default' : 'ghost'}
              onClick={() => setViewType('skills')}
              className={`rounded-xl px-8 transition-all duration-300 ${viewType === 'skills' ? 'shadow-lg font-black' : 'text-muted-foreground'}`}
            >
              Explore Skills
            </Button>
            <Button
              variant={viewType === 'users' ? 'default' : 'ghost'}
              onClick={() => setViewType('users')}
              className={`rounded-xl px-8 transition-all duration-300 ${viewType === 'users' ? 'shadow-lg font-black' : 'text-muted-foreground'}`}
            >
              Discover Users
            </Button>
          </div>
        </div>

        {viewType === 'skills' ? (
          <>
            <div className="mb-10 space-y-6 flex flex-col items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full max-w-4xl mx-auto items-center">
                    <div className="relative flex-1">
                        <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={22}
                        />
                        <Input
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-12 rounded-xl border-input focus:border-primary transition-colors bg-card shadow-sm text-foreground w-full"
                        />
                    </div>
                    <Button
                        onClick={handleAddSkillClick}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-lg h-12 px-6 rounded-xl"
                    >
                        <Plus size={20} />
                        Add Skill
                    </Button>
                </div>

              <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-2 justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className="rounded-full px-6"
                    >
                      All Categories
                    </Button>
                  </motion.div>
                  {categories.map((category) => (
                    <motion.div
                      key={category}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="rounded-full px-6"
                      >
                        {category}
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap gap-4 justify-center items-center bg-card shadow-sm p-5 rounded-2xl border border-border w-full"
                >
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors group">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:scale-110 transition-transform">
                      <Star size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rating</span>
                      <Select
                        value={minRating.toString()}
                        onValueChange={(value) => setMinRating(Number(value))}
                      >
                        <SelectTrigger className="h-7 p-0 border-none bg-transparent shadow-none focus:ring-0 text-sm font-semibold min-w-[110px] hover:text-foreground transition-colors">
                          <SelectValue placeholder="Any Rating" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl bg-card z-[100]">
                          <SelectItem value="0" className="rounded-lg">Any Rating</SelectItem>
                          <SelectItem value="4" className="rounded-lg">4.0+ Stars</SelectItem>
                          <SelectItem value="4.5" className="rounded-lg">4.5+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-primary/10 hidden md:block" />

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors group">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
                      <BarChart size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Level</span>
                      <Select
                        value={selectedLevel || "all"}
                        onValueChange={(value) => setSelectedLevel(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="h-7 p-0 border-none bg-transparent shadow-none focus:ring-0 text-sm font-semibold min-w-[110px] hover:text-foreground transition-colors">
                          <SelectValue placeholder="Any Level" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl bg-card z-[100]">
                          <SelectItem value="all" className="rounded-lg">Any Level</SelectItem>
                          <SelectItem value="Beginner" className="rounded-lg">Beginner</SelectItem>
                          <SelectItem value="Intermediate" className="rounded-lg">Intermediate</SelectItem>
                          <SelectItem value="Advanced" className="rounded-lg">Advanced</SelectItem>
                          <SelectItem value="Expert" className="rounded-lg">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-primary/10 hidden md:block" />

                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors group">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                      <ArrowUpDown size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sort By</span>
                      <Select
                        value={sortBy}
                        onValueChange={(value) => setSortBy(value as 'newest' | 'rating' | 'collaborations')}
                      >
                        <SelectTrigger className="h-7 p-0 border-none bg-transparent shadow-none focus:ring-0 text-sm font-semibold min-w-[130px] hover:text-foreground transition-colors">
                          <SelectValue placeholder="Newest First" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border shadow-2xl bg-card z-[100]">
                          <SelectItem value="newest" className="rounded-lg">Newest First</SelectItem>
                          <SelectItem value="rating" className="rounded-lg">Top Rated</SelectItem>
                          <SelectItem value="collaborations" className="rounded-lg">Most Experienced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-primary/10 hidden md:block" />

                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer select-none hover:bg-primary/5 transition-colors"
                  >
                    <button
                      onClick={() => setIsOnlineOnly(!isOnlineOnly)}
                      title={isOnlineOnly ? "Show all skills" : "Show online users only"}
                      className={`p-2 rounded-xl border transition-all ${isOnlineOnly ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-card border-border text-muted-foreground hover:border-orange-500/30 hover:text-orange-500 shadow-sm'}`}
                    >
                      {isOnlineOnly && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                      <span className="text-sm font-semibold">Online Now</span>
                    </div>
                  </motion.div>

                  <div className="h-8 w-px bg-primary/10 hidden md:block" />

                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer select-none hover:bg-primary/5 transition-colors"
                    onClick={() => setShowMySkills(!showMySkills)}
                  >
                    <button
                      title={showMySkills ? "Show all skills" : "Show my skills only"}
                      className={`p-2 rounded-xl border transition-all ${showMySkills ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-primary shadow-sm'}`}
                    >
                      {showMySkills && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-white" />}
                      {!showMySkills && <Sparkles size={14} />}
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ownership</span>
                      <span className="text-sm font-semibold">My Skills</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {/* AI Suggestions Bar */}
            <AnimatePresence>
              {activeSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-3 justify-center mb-8 overflow-hidden"
                >
                  {activeSuggestions.map(suggestion => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl shadow-lg border border-white/10 group cursor-pointer hover:bg-gray-900 transition-all"
                      onClick={() => {
                        suggestion.action();
                        setDismissedSuggestions([...dismissedSuggestions, suggestion.id]);
                      }}
                    >
                      <span className="text-orange-400">{suggestion.icon}</span>
                      <span className="text-xs font-black uppercase tracking-widest">{suggestion.text}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedSuggestions([...dismissedSuggestions, suggestion.id]);
                        }}
                        className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                        title="Dismiss suggestion"
                      >
                        <CloseIcon size={12} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recommended Section */}
            {isAuthenticated && recommendedSkills.length > 0 && !searchQuery && !selectedCategory && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 text-orange-500 rounded-lg">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Recommended <span className="text-orange-500">for You</span></h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Based on your interests and activity</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendedSkills.map(skill => (
                    <SkillCard
                      key={`rec-${skill._id}`}
                      skill={skill}
                      onRequest={handleRequestSkill}
                      status={myRequests.find(r => r.skillId && (typeof r.skillId === 'object' ? r.skillId._id : r.skillId) === skill._id)?.status}
                      isOwnSkill={skill.createdBy?._id === user?._id}
                      onChat={() => navigate('/dashboard')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            {!searchQuery && !selectedCategory && trendingSkills.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-100 text-red-500 rounded-lg">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">Trending <span className="text-red-500">Skills</span></h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Most popular in the community right now</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trendingSkills.map(skill => (
                    <SkillCard
                      key={`trend-${skill._id}`}
                      skill={skill}
                      onRequest={handleRequestSkill}
                      status={myRequests.find(r => r.skillId && (typeof r.skillId === 'object' ? r.skillId._id : r.skillId) === skill._id)?.status}
                      isOwnSkill={skill.createdBy?._id === user?._id}
                      onChat={() => navigate('/dashboard')}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-lg">
                <Filter size={20} />
              </div>
              <h2 className="text-2xl font-black text-foreground">All <span className="text-slate-500">Skills</span></h2>
            </div>

            {isSkillsLoading || (isAuthenticated && isRequestsLoading) ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-muted/50 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <motion.div
                layout
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {displaySkills.map((skill) => {
                    const existingRequest = myRequests.find(
                      (r: SkillRequest) => {
                        if (!r.skillId) return false;
                        const id = typeof r.skillId === 'object' ? r.skillId._id : r.skillId;
                        return id === skill._id;
                      }
                    );
                    return (
                      <SkillCard
                        key={skill._id}
                        skill={skill}
                        onRequest={handleRequestSkill}
                        status={existingRequest?.status}
                        rejectedAt={existingRequest?.rejectedAt || existingRequest?.updatedAt}
                        isOwnSkill={skill.createdBy?._id === user?._id}
                        onChat={() => {
                          if (!existingRequest || !skill.createdBy) return;
                          navigate('/dashboard', {
                            state: {
                              activeChat: {
                                requestId: existingRequest._id,
                                peerId: skill.createdBy?._id || '',
                                peerName: skill.createdBy?.name || 'Unknown',
                                skillName: skill.name,
                                status: existingRequest.status
                              }
                            }
                          });
                        }}
                        onRemove={() => existingRequest && handleStatusUpdate(existingRequest._id, 'Rejected')}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {!isSkillsLoading && filteredSkills.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  No skills found. Try adjusting your search or filters!
                </p>
              </div>
            )}
          </>
        ) : (
          /* USERS VIEW */
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Brain size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground">Community <span className="text-primary">Shield</span></h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">AI-Powered Authenticity Detection Enabled</p>
                </div>
              </div>
              
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search members by name or bio..." 
                  className="pl-10 rounded-xl bg-card"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isUsersLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              <motion.div 
                layout
                className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {usersList
                    .filter(u => 
                      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(u => (
                      <UserCard key={u._id} user={u} />
                    ))
                  }
                </AnimatePresence>
              </motion.div>
            )}

            {usersList.length === 0 && !isUsersLoading && (
              <div className="text-center py-20 bg-card rounded-3xl border border-dashed">
                <p className="text-muted-foreground">No other users found in the community yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeChat && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
              onClick={closeChat}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-card shadow-2xl z-50 flex flex-col border-l border-border"
            >
              <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-4 top-3 z-20 hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={closeChat}
                  title="Close Chat"
                >
                  <CloseIcon size={20} />
                </Button>
                <ChatPanel
                  requestId={activeChat.requestId}
                  peerId={activeChat.peerId}
                  skillName={activeChat.skillName}
                  status={activeChat.status}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetchSkills}
      />

      <RequestSkillModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        skill={selectedSkillForRequest}
        onSuccess={refetchRequests}
      />
    </section>
  );
};

export default Explore;
