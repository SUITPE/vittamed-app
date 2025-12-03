import {
  Calendar,
  Clock,
  Users,
  CreditCard,
  Activity,
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  UserPlus,
  Settings,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Stethoscope,
  Pill,
  HeartHandshake,
  Zap,
  TrendingUp,
  DollarSign,
  CalendarDays,
  UserCheck,
  Clock3,
  BellRing,
  Bell,
  MessageSquare,
  Shield,
  Lock,
  List,
  Loader2,
  Info,
  Utensils,
  Package,
  Circle,
  FileText,
  ClipboardList,
  Quote,
  Lightbulb,
  Globe,
  Award,
  Target,
  Linkedin,
  PieChart,
  Inbox,
  RefreshCw,
} from "lucide-react"

export const Icons = {
  // Navigation
  calendar: Calendar,
  clock: Clock,
  users: Users,
  home: Home,
  building: Building,

  // Medical
  stethoscope: Stethoscope,
  pill: Pill,
  heartHandshake: HeartHandshake,

  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash2,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  list: List,

  // Status
  check: Check,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  alertCircle: AlertCircle,
  eye: Eye,
  eyeOff: EyeOff,

  // User
  user: User,
  userPlus: UserPlus,
  userCheck: UserCheck,

  // System
  settings: Settings,
  logOut: LogOut,
  moon: Moon,
  sun: Sun,
  menu: Menu,
  x: X,

  // Navigation
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,

  // Contact
  phone: Phone,
  mail: Mail,
  mapPin: MapPin,

  // Social
  star: Star,
  heart: Heart,

  // Business
  creditCard: CreditCard,
  activity: Activity,
  zap: Zap,
  trendingUp: TrendingUp,
  dollarSign: DollarSign,
  calendarDays: CalendarDays,
  clock3: Clock3,

  // Communication
  bellRing: BellRing,
  bell: Bell,
  messageSquare: MessageSquare,
  shield: Shield,

  // Security
  lock: Lock,

  // Loading
  loader: Loader2,

  // Additional
  info: Info,
  utensils: Utensils,
  package: Package,
  circle: Circle,
  fileText: FileText,
  clipboardList: ClipboardList,

  // Investor page
  quote: Quote,
  lightbulb: Lightbulb,
  globe: Globe,
  award: Award,
  target: Target,
  linkedin: Linkedin,
  pieChart: PieChart,

  // Empty states
  inbox: Inbox,
  refreshCw: RefreshCw,
}

export type IconName = keyof typeof Icons