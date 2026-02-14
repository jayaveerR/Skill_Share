export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export interface User {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  exchanges: number;
  badges: string[];
}

export interface Exchange {
  id: string;
  skillOffered: string;
  skillRequested: string;
  status: 'pending' | 'accepted' | 'completed';
  date: string;
  partnerId: string;
  partnerName: string;
}

export const categories = [
  'Technology',
  'Design',
  'Languages',
  'Music',
  'Business',
  'Health',
  'Crafts',
  'Education',
];

export const mockSkills: Skill[] = [
  { id: '1', name: 'JavaScript', category: 'Technology', description: 'Modern JS development', userId: '1', userName: 'Alex Chen' },
  { id: '2', name: 'UI/UX Design', category: 'Design', description: 'User interface design', userId: '2', userName: 'Sarah Kim' },
  { id: '3', name: 'Spanish', category: 'Languages', description: 'Native speaker', userId: '3', userName: 'Maria Lopez' },
  { id: '4', name: 'Guitar', category: 'Music', description: 'Acoustic & electric', userId: '4', userName: 'James Wilson' },
  { id: '5', name: 'Marketing', category: 'Business', description: 'Digital marketing', userId: '5', userName: 'Emma Davis' },
  { id: '6', name: 'Yoga', category: 'Health', description: 'Hatha yoga instructor', userId: '6', userName: 'Priya Sharma' },
  { id: '7', name: 'Pottery', category: 'Crafts', description: 'Wheel throwing', userId: '7', userName: 'Tom Baker' },
  { id: '8', name: 'Python', category: 'Technology', description: 'Data science focus', userId: '8', userName: 'Lisa Park' },
  { id: '9', name: 'Photography', category: 'Design', description: 'Portrait & landscape', userId: '9', userName: 'Mike Brown' },
  { id: '10', name: 'French', category: 'Languages', description: 'Conversational French', userId: '10', userName: 'Claire Martin' },
  { id: '11', name: 'Piano', category: 'Music', description: 'Classical piano', userId: '11', userName: 'David Lee' },
  { id: '12', name: 'Public Speaking', category: 'Education', description: 'Presentation skills', userId: '12', userName: 'Rachel Green' },
];

export const mockUser: User = {
  id: 'current',
  name: 'Jordan Taylor',
  bio: 'Passionate learner and teacher. Love exchanging knowledge with the community.',
  skillsOffered: ['React', 'TypeScript', 'Node.js'],
  skillsWanted: ['Spanish', 'Photography', 'Piano'],
  rating: 4.8,
  exchanges: 23,
  badges: ['Top Mentor', 'Active Learner'],
};

export const mockExchanges: Exchange[] = [
  { id: '1', skillOffered: 'React', skillRequested: 'Spanish', status: 'completed', date: '2024-01-15', partnerId: '3', partnerName: 'Maria Lopez' },
  { id: '2', skillOffered: 'TypeScript', skillRequested: 'Photography', status: 'accepted', date: '2024-01-18', partnerId: '9', partnerName: 'Mike Brown' },
  { id: '3', skillOffered: 'Node.js', skillRequested: 'Piano', status: 'pending', date: '2024-01-20', partnerId: '11', partnerName: 'David Lee' },
];

export const stats = {
  activeUsers: 12500,
  skillsShared: 45000,
  exchangesCompleted: 89000,
};

export const testimonials = [
  { id: '1', name: 'Alex Chen', text: 'Learned guitar in exchange for coding lessons. Amazing community!', role: 'Software Engineer' },
  { id: '2', name: 'Sarah Kim', text: 'The best way to learn new skills while sharing what you know.', role: 'Designer' },
  { id: '3', name: 'James Wilson', text: 'Met incredible people and learned photography. Highly recommend!', role: 'Musician' },
];
