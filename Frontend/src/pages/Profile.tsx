import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Star, Award, X, CheckCircle2, History, BookOpen, GraduationCap, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsAPI, ratingsAPI, authAPI, skillsAPI } from '@/services/api';
import { getSocket } from '@/services/socket';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import AddSkillModal from '@/components/AddSkillModal';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, updateProfile } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editName, setEditName] = useState(authUser?.name || '');
  const [editBio, setEditBio] = useState(authUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(authUser?.avatar || '');
  const [isOnline, setIsOnline] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<{ id: string, name: string } | null>(null);
  const queryClient = useQueryClient();

  const isOwnProfile = !id || id === authUser?._id;

  // Fetch full user data
  const { data: userData, refetch: refetchUser, isLoading: isUserLoading } = useQuery({
    queryKey: isOwnProfile ? ['me'] : ['user-profile', id],
    queryFn: () => isOwnProfile ? authAPI.getMe() : authAPI.getUserProfile(id!),
    enabled: !!authUser || !!id
  });

  const user = userData?.data || (isOwnProfile ? authUser : null);

  useEffect(() => {
    if (isEditModalOpen && user) {
      setEditName(user.name || '');
      setEditBio(user.bio || '');
      setEditAvatar(user.avatar || '');
    }
  }, [isEditModalOpen, user]);

  useEffect(() => {
    if (user) {
      setIsOnline(user.isOnline);
    }
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleOnline = (data: { userId: string }) => {
      if (data.userId === user._id) setIsOnline(true);
    };
    const handleOffline = (data: { userId: string }) => {
      if (data.userId === user._id) {
        setIsOnline(false);
        refetchUser(); // Refresh to get latest lastSeen from DB
      }
    };

    socket.on('user-online', handleOnline);
    socket.on('user-offline', handleOffline);

    return () => {
      socket.off('user-online', handleOnline);
      socket.off('user-offline', handleOffline);
    };
  }, [user, refetchUser]);

  // Fetch actual skills created by this user
  const { data: skillsResponse, refetch: refetchSkills } = useQuery({
    queryKey: ['my-skills', user?._id],
    queryFn: () => skillsAPI.getAll(undefined, undefined, user?._id),
    enabled: !!user?._id
  });

  const skills = skillsResponse?.data || [];

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: (skillId: string) => skillsAPI.delete(skillId),
    onSuccess: (data) => {
      toast.success(data.message || 'Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['my-skills', user?._id] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSkillToDelete(null);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to delete skill');
    }
  });

  const handleDeleteConfirm = () => {
    if (skillToDelete) {
      deleteMutation.mutate(skillToDelete.id);
    }
  };

  // Fetch requests (collaborations)
  const { data: requestsResponse } = useQuery({
    queryKey: ['my-requests'],
    queryFn: requestsAPI.getAll,
    enabled: !!authUser
  });

  const completedRequests = [
    ...(requestsResponse?.data?.incoming || []),
    ...(requestsResponse?.data?.outgoing || [])
  ].filter(r => r.status === 'Completed' && r.requestedBy && r.requestedTo)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Fetch ratings received
  const { data: ratingsResponse } = useQuery({
    queryKey: ['my-ratings', user?._id],
    queryFn: () => ratingsAPI.getForUser(user?._id),
    enabled: !!user?._id
  });

  const ratings = ratingsResponse?.data || [];

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateProfile({ name: editName, bio: editBio, avatar: editAvatar });
      setIsEditModalOpen(false);
      refetchUser();
      toast.success('Profile updated successfully');
    } catch (err: unknown) {
      console.error('Failed to update profile', err);
      const error = err as { response?: { data?: { message?: string, suggestion?: string } } };
      const serverMessage = error.response?.data?.message;
      const suggestion = error.response?.data?.suggestion;

      if (suggestion) {
        toast.error(`${serverMessage} Tip: ${suggestion}`, { duration: 5000 });
      } else {
        toast.error(serverMessage || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground font-medium">Finding profile...</p>
      </div>
    );
  }

  const getTrustBadge = () => {
    if (user.completedCollaborations >= 10) return { text: 'Top Contributor', icon: <Award className="w-4 h-4 text-blue-500" /> };
    if (user.averageRating >= 4.5) return { text: 'Trusted Mentor', icon: <CheckCircle2 className="w-4 h-4 text-amber-500" /> };
    if (!user.totalRatings) return { text: 'New Member', icon: <Star className="w-4 h-4 text-green-500" /> };
    return null;
  };

  const trustBadge = getTrustBadge();

  return (
    <>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-8 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary font-bold text-3xl">
                    {user.name ? user.name[0] : '?'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] py-0 h-5">Online</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {user.lastSeen ? `Last seen ${format(new Date(user.lastSeen), 'MMM dd, HH:mm')}` : 'Offline'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Edit size={16} />
                      </Button>
                    ) : (
                      <div className="flex gap-2 ml-2">
                        <Button
                          className="bg-black text-white hover:bg-gray-800 rounded-xl px-4 py-0 h-9 font-bold text-xs uppercase tracking-wider"
                          onClick={() => navigate('/dashboard', {
                            state: {
                              activeChat: {
                                peerId: user._id,
                                peerName: user.name,
                                skillName: "Collaboration"
                              }
                            }
                          })}
                        >
                          Message
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{user.bio}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="text-primary" size={18} />
                    <span className="font-medium">{user.averageRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-muted-foreground text-sm">Rating ({user.totalRatings || 0})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-primary" size={18} />
                    <span className="font-medium">{user.completedCollaborations || 0}</span>
                    <span className="text-muted-foreground text-sm">Collaborations</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            {trustBadge && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium text-foreground mb-3 uppercase text-xs tracking-wider opacity-60">Trust Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-full text-sm font-medium">
                    {trustBadge.icon}
                    {trustBadge.text}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tabs for Skills & History */}
          <Tabs defaultValue="offered" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/20 p-1">
              <TabsTrigger value="offered" className="gap-2"><BookOpen size={16} /> Skills Offered</TabsTrigger>
              <TabsTrigger value="learned" className="gap-2"><GraduationCap size={16} /> Skills Learned</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History size={16} /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="offered">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Skills I Can Teach</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {skills.map((skill, index) => (
                      <motion.div
                        key={skill._id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5, x: -20 }}
                        className="p-4 bg-secondary/50 border border-border/50 rounded-xl flex justify-between items-center group hover:bg-secondary transition-all"
                      >
                        <div>
                          <p className="font-medium text-foreground">{skill.name}</p>
                          <p className="text-xs text-muted-foreground">{skill.level}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                            Offered
                          </Badge>
                          {isOwnProfile && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => setSkillToDelete({ id: skill._id, name: skill.name })}
                              title="Delete skill"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {skills.length === 0 && (
                    <p className="text-muted-foreground italic col-span-2 text-center py-8">No skills added yet.</p>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 w-full py-6 border-dashed border-2 hover:border-primary hover:text-primary transition-all"
                    onClick={() => setIsAddSkillModalOpen(true)}
                  >
                    <Edit size={16} className="mr-2" /> Add New Skill
                  </Button>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="learned">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="text-lg font-semibold text-foreground mb-4">Skills I've Learned</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completedRequests
                    .filter(r => r.requestedBy?._id === user._id)
                    .map((request, index) => (
                      <div key={index} className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                        <p className="font-medium">{request.skillId?.name || 'Unknown Skill'}</p>
                        <p className="text-xs text-muted-foreground">From {request.requestedTo?.name || 'Unknown User'}</p>
                      </div>
                    ))}
                  {completedRequests.filter(r => r.requestedBy?._id === user._id).length === 0 && (
                    <p className="text-muted-foreground italic col-span-2 text-center py-8">Start a collaboration to learn new skills!</p>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="history">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {completedRequests.map((request, index) => {
                  const partner = request.requestedBy?._id === user._id ? request.requestedTo : request.requestedBy;
                  if (!partner) return null;
                  const rating = ratings.find(r => r.requestId === request._id);

                  return (
                    <div key={index} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/30 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] uppercase font-bold">Completed</Badge>
                          <span className="text-xs text-muted-foreground">{format(new Date(request.updatedAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <h4 className="font-bold text-lg">{request.skillId && request.skillId.name ? request.skillId.name : 'Deleted Skill'}</h4>
                        <p className="text-sm text-muted-foreground">with {partner.name}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {rating ? (
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            {rating.score} ⭐
                            <span className="text-[10px] text-muted-foreground font-normal">(Rating Received)</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No rating yet</span>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-8">View Details</Button>
                      </div>
                    </div>
                  );
                })}
                {completedRequests.length === 0 && (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-border border-dashed">
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground">No completed collaborations yet.</p>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Edit Profile</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name
                  </label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Avatar URL
                  </label>
                  <Input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    title="Bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-input rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {skillToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-[100] p-4"
            onClick={() => !deleteMutation.isPending && setSkillToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-card rounded-[24px] p-8 w-full max-w-sm border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>

                <h3 className="text-xl font-black text-black mb-3">Are you absolutely sure?</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
                  This action cannot be undone. This will permanently delete your <span className="text-black font-bold">"{skillToDelete.name}"</span> skill from the system.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <Button
                    variant="destructive"
                    className="w-full h-12 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-red-500/20"
                    onClick={handleDeleteConfirm}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-12 rounded-xl font-bold text-gray-400 hover:text-black hover:bg-gray-50"
                    onClick={() => setSkillToDelete(null)}
                    disabled={deleteMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AddSkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        onSuccess={() => refetchSkills()}
      />
    </>
  );
};

export default Profile;
