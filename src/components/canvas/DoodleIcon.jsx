import { ArrowRight, AtSign, Check, Circle, Cloud, Heart, Sparkles, Star, Sun, Undo2, Waves, Zap } from 'lucide-react';

const ICONS = {
  curve: Undo2,
  arrow: ArrowRight,
  star: Star,
  sparkle: Sparkles,
  swirl: AtSign,
  heart: Heart,
  burst: Zap,
  underline: Waves,
  circle: Circle,
  check: Check,
  sun: Sun,
  cloud: Cloud,
};

export const DOODLES = [
  ['curve', 'Curve'], ['arrow', 'Arrow'], ['star', 'Star'], ['sparkle', 'Sparkle'],
  ['swirl', 'Swirl'], ['heart', 'Heart'], ['burst', 'Burst'], ['underline', 'Underline'],
  ['circle', 'Circle'], ['check', 'Check'], ['sun', 'Sun'], ['cloud', 'Cloud'],
];

export default function DoodleIcon({ name, size = 48, strokeWidth = 1.8, className = '' }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
}
