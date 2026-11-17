import { useAuth } from '../../auth/AuthContext';
import LibrarianDashboard from './LibrarianDashboard';
import ReaderDashboard from './ReaderDashboard';

export default function DashboardPage() {
  return useAuth().isLibrarian ? <LibrarianDashboard /> : <ReaderDashboard />;
}
