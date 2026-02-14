import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Users, ArrowLeftRight, Star, Clock, CheckCircle,
  AlertCircle, Zap, MessageSquare, Check, X as CloseIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsAPI, PopulatedSkillRequest, ExploreUser } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import RequestSkillModal from '@/components/RequestSkillModal';
import ChatPanel from '@/components/ChatPanel';
import { useChat } from '@/services/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { staggerContainer, fadeInUp, slideInLeft, slideInRight } from '@/components/layout/PageTransition';

interface PeerDetails {
  peerId: string;
  peerName: string;
  skillName: string;
}

interface RequestItem {
  _id: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
  message?: string;
  createdAt: string;
  requestedBy: {
    _id: string;
    name: string;
  };
  requestedTo: {
    _id: string;
    name: string;
  };
  skillId?: {
    name: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [activeChat, setActiveChat] = useState<{ requestId: string; peerId: string; peerName: string; skillName: string; status: string } | null>(null);
  const { endSession, unreadChats } = useChat();

  useEffect(() => {
    if (location.state?.activeChat) {
      setActiveChat(location.state.activeChat);
      // Optional: Clean up state to prevent reopening on simple refresh? 
      // Keeping it simple for now.
    }
  }, [location.state]);

  // ... (rest of the component)

  const closeChat = () => {
    if (activeChat) {
      endSession(activeChat.requestId);
      setActiveChat(null);
    }
  };

  // ...


  const { data: requestsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestsAPI.getAll(),
  });

  const incoming = requestsResponse?.data?.incoming || [];
  const outgoing = requestsResponse?.data?.outgoing || [];

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Accepted' | 'Rejected' | 'Completed' }) =>
      requestsAPI.updateStatus(id, status),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Action failed');
    }
  });

  const handleStatusUpdate = (id: string, status: 'Accepted' | 'Rejected' | 'Completed', peerDetails?: PeerDetails) => {
    updateStatusMutation.mutate({ id, status }, {
      onSuccess: () => {
        if (status === 'Accepted' && peerDetails) {
          setActiveChat({
            requestId: id,
            peerId: peerDetails.peerId,
            peerName: peerDetails.peerName,
            skillName: peerDetails.skillName,
            status: 'Accepted'
          });
        }
      }
    });
  };

  const statsCards = [
    {
      label: 'Incoming Requests',
      value: incoming.filter((r: PopulatedSkillRequest) => r.status === 'Pending').length,
      icon: ArrowLeftRight,
      change: 'Needs your attention',
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      label: 'Active Exchanges',
      value: [...incoming, ...outgoing].filter((r: PopulatedSkillRequest) => r.status === 'Accepted').length,
      icon: Zap,
      change: 'In progress',
      color: 'bg-orange-500/10 text-orange-500'
    },
    {
      label: 'Completed',
      value: [...incoming, ...outgoing].filter((r: PopulatedSkillRequest) => r.status === 'Completed').length,
      icon: CheckCircle,
      change: 'Successfully done',
      color: 'bg-green-500/10 text-green-500'
    },
    {
      label: 'Outgoing',
      value: outgoing.length,
      icon: Users,
      change: 'Requests sent',
      color: 'bg-primary/10 text-primary'
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="text-green-500" size={16} />;
      case 'accepted': return <Clock className="text-orange-500" size={16} />;
      case 'pending': return <AlertCircle className="text-yellow-500" size={16} />;
      case 'rejected': return <CloseIcon className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50/50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30';
      case 'accepted': return 'bg-orange-50/50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
      case 'pending': return 'bg-yellow-50/50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30';
      case 'rejected': return 'bg-red-50/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex gap-3 items-center border border-red-100 dark:border-red-900/30">
          <AlertCircle />
          <div>
            <p className="font-medium">Failed to load dashboard data</p>
            <p className="text-sm">{(error as ApiError)?.response?.data?.message || (error instanceof Error ? error.message : 'Check your connection and try again.')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Zap size={16} />
              Dashboard
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || 'Member'}</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your skill requests and track active exchanges
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
          >
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-card border border-border rounded-2xl p-6 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}
                  >
                    <stat.icon size={22} />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="w-2 h-4 rounded-full"
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                  className="text-3xl font-bold text-foreground"
                >
                  {stat.value}
                </motion.p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                {stat.change && (
                  <p className="text-xs text-primary mt-2 font-medium">{stat.change}</p>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Incoming Requests */}
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate="visible"
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowLeftRight size={20} className="text-orange-500" />
                  Incoming Requests
                </span>
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-500 border-orange-100 dark:border-orange-900/30">
                  {incoming.length}
                </Badge>
              </h2>
              <div className="space-y-4">
                {incoming.map((request: PopulatedSkillRequest) => {
                  const requester = request.requestedBy;
                  const skill = request.skillId;
                  if (!requester) return null;

                  return (
                    <motion.div
                      key={request._id}
                      layout
                      className="p-4 bg-muted/30 rounded-2xl border border-border/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center font-bold text-orange-500">
                            {requester.name ? requester.name[0] : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none">{requester.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground mt-1">wants to learn {skill?.name || 'a skill'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`capitalize ${getStatusColor(request.status)}`}>
                          {request.status}
                        </Badge>
                      </div>

                      {request.message && (
                        <p className="text-sm text-muted-foreground italic bg-card p-3 rounded-xl mb-4 border border-border">
                          "{request.message}"
                        </p>
                      )}

                      <div className="flex gap-2">
                        {request.status === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex-1 h-9 gap-1"
                              onClick={() => handleStatusUpdate(request._id, 'Accepted', {
                                peerId: requester._id,
                                peerName: requester.name,
                                skillName: skill?.name || 'Skill'
                              })}
                            >
                              <Check size={16} /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex-1 h-9 gap-1"
                              onClick={() => handleStatusUpdate(request._id, 'Rejected')}
                            >
                              <CloseIcon size={16} /> Reject
                            </Button>
                          </>
                        )}
                        {request.status === 'Accepted' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white rounded-xl flex-1 h-9 gap-1"
                              onClick={() => handleStatusUpdate(request._id, 'Completed')}
                            >
                              <CheckCircle size={16} /> Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-foreground hover:bg-muted rounded-xl flex-1 h-9 gap-1"
                              onClick={() => setActiveChat({
                                requestId: request._id,
                                peerId: requester._id,
                                peerName: requester.name,
                                skillName: skill?.name || 'Skill',
                                status: request.status
                              })}
                            >
                              <MessageSquare size={16} /> Chat
                              {unreadChats.has(request._id) && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                {incoming.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                    <p className="text-muted-foreground text-sm">No incoming requests yet</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Outgoing Requests */}
            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Sent Requests
                </span>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                  {outgoing.length}
                </Badge>
              </h2>
              <div className="space-y-4">
                {outgoing.map((request: PopulatedSkillRequest) => {
                  const targetUser = request.requestedTo;
                  const skill = request.skillId;
                  if (!targetUser) return null;

                  return (
                    <motion.div
                      key={request._id}
                      layout
                      className="p-4 bg-muted/30 rounded-2xl border border-border/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center font-bold text-primary">
                            {targetUser.name ? targetUser.name[0] : '?'}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none">{targetUser.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Requested: {skill?.name || 'Skill'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={`capitalize ${getStatusColor(request.status)}`}>
                            {request.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      {request.status === 'Accepted' && (
                        <Button
                          size="sm"
                          className="w-full mt-4 bg-primary hover:bg-primary/90 text-white rounded-xl h-9 gap-2"
                          onClick={() => setActiveChat({
                            requestId: request._id,
                            peerId: targetUser._id,
                            peerName: targetUser.name,
                            skillName: skill?.name || 'Skill',
                            status: request.status
                          })}
                        >
                          <MessageSquare size={16} /> Start Chat
                          {unreadChats.has(request._id) && (
                            <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
                {outgoing.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                    <p className="text-muted-foreground text-sm">You haven't sent any requests yet</p>
                    <Button
                      variant="link"
                      className="text-primary mt-2"
                      onClick={() => window.location.href = '/explore'}
                    >
                      Explore Skills
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat Overlay */}
          <AnimatePresence>
            {activeChat && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                  onClick={closeChat}
                />

                {/* Drawer */}
                <motion.div
                  initial={{ x: "100%", opacity: 0.5 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-card shadow-2xl z-50 flex flex-col border-l border-border"
                >
                  <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                    <ChatPanel
                      requestId={activeChat.requestId}
                      peerId={activeChat.peerId}
                      skillName={activeChat.skillName}
                      status={activeChat.status}
                      onClose={() => setActiveChat(null)}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
