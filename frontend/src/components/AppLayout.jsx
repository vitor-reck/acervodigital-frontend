import { Suspense, useState } from 'react';
import { NavLink, Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  LinearProgress,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../auth/AuthContext';
import { NAVIGATION } from '../routes';
import { initials } from '../utils/format';

const DRAWER_WIDTH = 248;

function isActive(pathname, to) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
}

function Navigation({ onNavigate }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const groups = NAVIGATION[user.role];
  const activeTo = groups
    .flatMap((group) => group.items)
    .filter((item) => isActive(pathname, item.to))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;

  return (
    <Box component="nav" aria-label="Navegação principal">
      <Toolbar component={RouterLink} to="/" sx={{ gap: 1, color: 'text.primary', textDecoration: 'none' }}>
        <MenuBookOutlined color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Acervo Digital</Typography>
      </Toolbar>
      {groups.map((group) => (
        <List key={group.section} dense subheader={<ListSubheader sx={{ bgcolor: 'transparent' }}>{group.section}</ListSubheader>}>
          {group.items.map(({ to, label, icon: Icon }) => (
            <ListItemButton key={to} component={NavLink} to={to} end selected={to === activeTo} onClick={onNavigate} sx={{ mx: 1, borderRadius: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}><Icon fontSize="small" /></ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      ))}
    </Box>
  );
}

export default function AppLayout() {
  const { user, isLibrarian, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton aria-label="Abrir menu" onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Box sx={{ flexGrow: 1 }} />
          {!isLibrarian && (
            <IconButton component={RouterLink} to="/notificacoes" aria-label="Notificações"><NotificationsNone /></IconButton>
          )}
          <IconButton aria-label="Menu do usuário" onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>{initials(user.name)}</Avatar>
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', opacity: '1 !important' }}>
              <Typography variant="subtitle2">{user.name}</Typography>
              <Typography variant="caption" color="text.secondary">{isLibrarian ? 'Bibliotecário' : 'Leitor'} · {user.email}</Typography>
            </MenuItem>
            <MenuItem onClick={logout}>Sair</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box sx={{ width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          <Navigation onNavigate={() => setMobileOpen(false)} />
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#F4F4F5' } }}>
          <Navigation />
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 3 }, mt: 8 }}>
        <Suspense fallback={<LinearProgress />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
