import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, User, LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { requestsAPI, PopulatedSkillRequest } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/services/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Explore', path: '/explore' },
  { name: 'Community', path: '/community' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'About', path: '/about' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadChats } = useChat();

  // Fetch requests for notification badge
  const { data: requestsResponse } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => requestsAPI.getAll(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const pendingIncomingCount = requestsResponse?.data?.incoming?.filter(
    (r: PopulatedSkillRequest) => r.status === 'Pending'
  ).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = (user?.name && user.name.trim())
    || (user?.email ? user.email.split('@')[0] : '')
    || 'Account';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
            >
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </motion.div>
            <span className="font-bold text-xl text-foreground">SkillShare</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="relative group">
                <span
                  className={`text-sm font-medium transition-colors ${location.pathname === link.path
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {link.name}
                  {link.name === 'Dashboard' && unreadChats.size > 0 && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </span>
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary origin-left"
                  initial={{ scaleX: location.pathname === link.path ? 1 : 0 }}
                  animate={{ scaleX: location.pathname === link.path ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </Link>
            ))}
          </div>

          {/* Auth Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notifications Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors relative outline-none"
                    aria-label="Notifications"
                  >
                    <Bell size={18} className="text-foreground" />
                    {pendingIncomingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-lg">
                        {pendingIncomingCount > 9 ? '9+' : pendingIncomingCount}
                      </span>
                    )}
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl overflow-hidden shadow-xl border-border bg-card">
                  <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-background rounded-full border border-border">
                      {pendingIncomingCount} Pending
                    </span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    {requestsResponse?.data?.incoming?.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="mx-auto mb-2 opacity-50" size={24} />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      requestsResponse?.data?.incoming?.map((req: PopulatedSkillRequest) => (
                        <DropdownMenuItem
                          key={req._id}
                          className="p-4 cursor-pointer focus:bg-muted/50 border-b border-border/50 last:border-0"
                          onClick={() => navigate('/dashboard')}
                        >
                          <div className="flex gap-3 items-start w-full">
                            <Avatar className="h-9 w-9 border border-border mt-0.5">
                              <AvatarImage
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(req.requestedBy?.name || 'Unknown User')}&background=random&color=fff`}
                              />
                              <AvatarFallback>{(req.requestedBy?.name || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">
                                <span className="font-bold">{req.requestedBy?.name || 'Unknown User'}</span> requested{' '}
                                <span className="text-primary">{req.skillId?.name || 'Deleted Skill'}</span>
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                "{req.message}"
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {req.status === 'Pending' && (
                              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-border bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={() => navigate('/dashboard')}
                    >
                      View All Requests
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {theme === 'light' ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon size={18} className="text-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun size={18} className="text-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 p-1 pr-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '')}&background=random&color=fff`}
                        alt={user.name || user.email}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{displayName}</span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-semibold">{displayName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {/* Notifications (Mobile) */}
            {isAuthenticated && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  navigate('/dashboard');
                  setIsOpen(false);
                }}
                className="p-2 rounded-lg bg-secondary relative"
              >
                <Bell size={20} />
                {pendingIncomingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {pendingIncomingCount}
                  </span>
                )}
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </motion.button>
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-background border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block py-2 font-medium ${location.pathname === link.path
                      ? 'text-primary'
                      : 'text-muted-foreground'
                      }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-3 pt-4">
                {isAuthenticated && user ? (
                  <>
                    <div className="flex items-center gap-2 mb-3 p-3 bg-secondary rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '')}&background=random&color=fff`}
                          alt={user.name || user.email}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigate('/profile');
                        setIsOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setIsOpen(false)}>Login</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
