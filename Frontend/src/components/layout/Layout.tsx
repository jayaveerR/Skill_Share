import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PageTransition } from './PageTransition';
import { ReactNode, useState, useEffect } from 'react';
import { getSocket } from '@/services/socket';
import { useAuth } from '@/hooks/useAuth';
import RatingModal from '@/components/RatingModal';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const socket = getSocket();
  const queryClient = useQueryClient();
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean; requestId: string; skillName: string } | null>(null);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.on('request-completed', (data: { requestId: string; skillName: string }) => {
      setRatingModal({
        isOpen: true,
        requestId: data.requestId,
        skillName: data.skillName
      });
      // Invalidate queries to reflect completed status
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    });

    return () => {
      socket.off('request-completed');
    };
  }, [socket, isAuthenticated, queryClient]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16">
        <PageTransition>
          {children || <Outlet />}
        </PageTransition>
      </main>
      <Footer />
      {ratingModal && (
        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal(null)}
          requestId={ratingModal.requestId}
          skillName={ratingModal.skillName}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
            queryClient.invalidateQueries({ queryKey: ['me'] });
          }}
        />
      )}
    </div>
  );
}
