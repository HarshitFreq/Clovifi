import React from "react";
import {
  Tag,
  Utensils,
  Coffee,
  Car,
  Fuel,
  Home,
  Wrench,
  ShoppingCart,
  ShoppingBag,
  Zap,
  Film,
  Gamepad2,
  Activity,
  GraduationCap,
  Plane,
  Shirt,
  Smartphone,
  Wallet,
  Briefcase,
  TrendingUp,
  Gift,
  Building2,
  PiggyBank,
  CreditCard,
  Banknote,
  Landmark,
  Tv,
  HelpCircle,
  LucideIcon,
} from "lucide-react";

export interface CategoryGlyphOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_GLYPH_OPTIONS: CategoryGlyphOption[] = [
  { id: "tag", label: "General Tag", icon: Tag },
  { id: "utensils", label: "Dining & Food", icon: Utensils },
  { id: "coffee", label: "Coffee & Drinks", icon: Coffee },
  { id: "car", label: "Transport & Auto", icon: Car },
  { id: "fuel", label: "Fuel & Gas", icon: Fuel },
  { id: "home", label: "Housing & Rent", icon: Home },
  { id: "wrench", label: "Maintenance", icon: Wrench },
  { id: "shopping-bag", label: "Shopping", icon: ShoppingBag },
  { id: "cart", label: "Groceries", icon: ShoppingCart },
  { id: "zap", label: "Utilities", icon: Zap },
  { id: "film", label: "Movies & Cinema", icon: Film },
  { id: "tv", label: "Streaming", icon: Tv },
  { id: "gamepad", label: "Gaming", icon: Gamepad2 },
  { id: "activity", label: "Health & Fitness", icon: Activity },
  { id: "graduation-cap", label: "Education", icon: GraduationCap },
  { id: "plane", label: "Travel & Flights", icon: Plane },
  { id: "shirt", label: "Clothing", icon: Shirt },
  { id: "smartphone", label: "Tech & Devices", icon: Smartphone },
  { id: "wallet", label: "Salary & Cash", icon: Wallet },
  { id: "briefcase", label: "Work & Freelance", icon: Briefcase },
  { id: "trending-up", label: "Investments", icon: TrendingUp },
  { id: "gift", label: "Gifts & Charity", icon: Gift },
];

// Map legacy emoji or string identifiers to appropriate Lucide vector icons
const ICON_LOOKUP: Record<string, LucideIcon> = {
  // Named keys
  tag: Tag,
  utensils: Utensils,
  food: Utensils,
  dining: Utensils,
  restaurants: Utensils,
  coffee: Coffee,
  car: Car,
  transport: Car,
  fuel: Fuel,
  home: Home,
  housing: Home,
  rent: Home,
  wrench: Wrench,
  maintenance: Wrench,
  "shopping-bag": ShoppingBag,
  shopping: ShoppingBag,
  cart: ShoppingCart,
  groceries: ShoppingCart,
  zap: Zap,
  utilities: Zap,
  film: Film,
  movies: Film,
  streaming: Tv,
  tv: Tv,
  gamepad: Gamepad2,
  gaming: Gamepad2,
  activity: Activity,
  health: Activity,
  fitness: Activity,
  gym: Activity,
  "graduation-cap": GraduationCap,
  education: GraduationCap,
  plane: Plane,
  travel: Plane,
  flights: Plane,
  shirt: Shirt,
  clothes: Shirt,
  clothing: Shirt,
  smartphone: Smartphone,
  electronics: Smartphone,
  wallet: Wallet,
  salary: Wallet,
  cash: Banknote,
  briefcase: Briefcase,
  freelance: Briefcase,
  "trending-up": TrendingUp,
  investments: TrendingUp,
  gift: Gift,
  gifts: Gift,
  landmark: Landmark,
  checking: Landmark,
  "piggy-bank": PiggyBank,
  savings: PiggyBank,
  "credit-card": CreditCard,
  credit: CreditCard,
  banknote: Banknote,

  // Legacy emoji mappings (so older database rows or seeded data automatically render as 2010 vector glyphs)
  "🍔": Utensils,
  "🍕": Utensils,
  "🍎": ShoppingCart,
  "☕": Coffee,
  "🍺": Coffee,
  "🚗": Car,
  "🚕": Car,
  "🚲": Car,
  "🚇": Car,
  "⛽": Fuel,
  "🏠": Home,
  "🏡": Home,
  "🔧": Wrench,
  "🛠️": Wrench,
  "🛠": Wrench,
  "🛒": ShoppingCart,
  "🛍️": ShoppingBag,
  "🛍": ShoppingBag,
  "🔌": Zap,
  "⚡": Zap,
  "🍿": Tv,
  "🎬": Film,
  "🎭": Film,
  "🎮": Gamepad2,
  "🕹️": Gamepad2,
  "🕹": Gamepad2,
  "🩺": Activity,
  "💪": Activity,
  "💊": Activity,
  "🏋️": Activity,
  "🏋": Activity,
  "🧴": Activity,
  "🎓": GraduationCap,
  "📚": GraduationCap,
  "✈️": Plane,
  "✈": Plane,
  "🛫": Plane,
  "🏨": Home,
  "👔": Shirt,
  "📱": Smartphone,
  "💻": Smartphone,
  "📞": Smartphone,
  "💰": Wallet,
  "💵": Banknote,
  "💸": Wallet,
  "📈": TrendingUp,
  "🎁": Gift,
  "🏷️": Tag,
  "🏷": Tag,
  "🧹": Wrench,
  "🐾": Activity,
  "🪴": Home,
  "🏦": Landmark,
  "🐖": PiggyBank,
  "💳": CreditCard,
  "👛": Banknote,
};

// Fallback resolver by category name keywords
function resolveByName(name?: string): LucideIcon {
  if (!name) return Tag;
  const n = name.toLowerCase();
  if (n.includes("food") || n.includes("dine") || n.includes("restaurant") || n.includes("eat")) return Utensils;
  if (n.includes("coffee") || n.includes("cafe")) return Coffee;
  if (n.includes("fuel") || n.includes("gas") || n.includes("petrol")) return Fuel;
  if (n.includes("transport") || n.includes("car") || n.includes("cab") || n.includes("ride") || n.includes("auto")) return Car;
  if (n.includes("rent") || n.includes("hous") || n.includes("home") || n.includes("flat") || n.includes("apartment")) return Home;
  if (n.includes("maint") || n.includes("repair") || n.includes("plumb")) return Wrench;
  if (n.includes("grocer") || n.includes("supermarket")) return ShoppingCart;
  if (n.includes("shop") || n.includes("cloth") || n.includes("wear")) return ShoppingBag;
  if (n.includes("util") || n.includes("electr") || n.includes("power") || n.includes("bill")) return Zap;
  if (n.includes("stream") || n.includes("netflix") || n.includes("prime") || n.includes("youtube") || n.includes("movie")) return Tv;
  if (n.includes("game") || n.includes("gaming")) return Gamepad2;
  if (n.includes("health") || n.includes("gym") || n.includes("medic") || n.includes("fitness") || n.includes("doctor")) return Activity;
  if (n.includes("educat") || n.includes("school") || n.includes("college") || n.includes("course") || n.includes("study")) return GraduationCap;
  if (n.includes("travel") || n.includes("flight") || n.includes("trip") || n.includes("hotel")) return Plane;
  if (n.includes("salar") || n.includes("pay") || n.includes("income") || n.includes("wage")) return Wallet;
  if (n.includes("freelance") || n.includes("consult") || n.includes("work")) return Briefcase;
  if (n.includes("invest") || n.includes("stock") || n.includes("mutual") || n.includes("share")) return TrendingUp;
  if (n.includes("gift") || n.includes("charity") || n.includes("donat")) return Gift;
  return Tag;
}

interface CategoryGlyphProps {
  icon?: string | null;
  name?: string;
  color?: string;
  size?: number;
  className?: string;
  badge?: boolean;
}

export default function CategoryGlyph({
  icon,
  name,
  color = "#66c028",
  size = 14,
  className = "",
  badge = false,
}: CategoryGlyphProps) {
  let ResolvedIcon: LucideIcon = Tag;

  if (icon && ICON_LOOKUP[icon]) {
    ResolvedIcon = ICON_LOOKUP[icon];
  } else if (icon && ICON_LOOKUP[icon.trim().toLowerCase()]) {
    ResolvedIcon = ICON_LOOKUP[icon.trim().toLowerCase()];
  } else {
    ResolvedIcon = resolveByName(name);
  }

  if (badge) {
    return (
      <span
        className={`inline-flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          width: `${size + 8}px`,
          height: `${size + 8}px`,
          borderRadius: "4px",
          background: `linear-gradient(135deg, ${color}35 0%, ${color}15 100%)`,
          border: `1px solid ${color}55`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.3)",
          color: color,
        }}
      >
        <ResolvedIcon size={size} strokeWidth={2} />
      </span>
    );
  }

  return (
    <ResolvedIcon
      size={size}
      strokeWidth={2}
      className={className}
      style={{ color: color, flexShrink: 0 }}
    />
  );
}

// Account Type Vector Icons
export function AccountTypeGlyph({
  type,
  size = 15,
  color,
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  let IconComponent = Landmark;
  switch (type) {
    case "checking":
      IconComponent = Landmark;
      break;
    case "savings":
      IconComponent = PiggyBank;
      break;
    case "credit_card":
      IconComponent = CreditCard;
      break;
    case "cash":
      IconComponent = Banknote;
      break;
    case "investment":
      IconComponent = TrendingUp;
      break;
    default:
      IconComponent = Landmark;
  }

  return <IconComponent size={size} strokeWidth={2} style={{ color: color || "currentColor", flexShrink: 0 }} />;
}
