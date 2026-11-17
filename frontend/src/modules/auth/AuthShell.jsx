import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <MenuBookOutlined color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Acervo Digital</Typography>
          </Stack>
          <Typography variant="h5" component="h1">{title}</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
          {children}
        </CardContent>
      </Card>
    </Box>
  );
}
