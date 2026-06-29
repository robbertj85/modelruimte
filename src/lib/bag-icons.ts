import {
  House,
  ShoppingBag,
  Briefcase,
  Hotel,
  Users,
  Factory,
  HeartPulse,
  GraduationCap,
  Dumbbell,
  Lock,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import type { BagGebruiksdoel } from './bag-types';

export interface BagIconConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const BAG_ICONS: Record<BagGebruiksdoel, BagIconConfig> = {
  woonfunctie: { icon: House, color: '#0a3660', label: 'Wonen' },
  winkelfunctie: { icon: ShoppingBag, color: '#ff6b35', label: 'Winkel' },
  kantoorfunctie: { icon: Briefcase, color: '#115491', label: 'Kantoor' },
  logiesfunctie: { icon: Hotel, color: '#9b4f96', label: 'Logies' },
  bijeenkomstfunctie: { icon: Users, color: '#e1306c', label: 'Bijeenkomst' },
  industriefunctie: { icon: Factory, color: '#6c6c6c', label: 'Industrie' },
  gezondheidszorgfunctie: { icon: HeartPulse, color: '#d62828', label: 'Zorg' },
  onderwijsfunctie: { icon: GraduationCap, color: '#5a8f29', label: 'Onderwijs' },
  sportfunctie: { icon: Dumbbell, color: '#14a38b', label: 'Sport' },
  celfunctie: { icon: Lock, color: '#1a1a1a', label: 'Cel' },
  'overige gebruiksfunctie': { icon: Circle, color: '#999999', label: 'Overig' },
};
