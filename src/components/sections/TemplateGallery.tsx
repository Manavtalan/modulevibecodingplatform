import { TemplateCard } from './TemplateCard';
import { 
  Globe, 
  User, 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Rocket,
  Briefcase,
  Camera
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  features: string[];
  icon: React.ReactNode;
  prompt: string;
  isPopular?: boolean;
}

interface TemplateGalleryProps {
  onSelectTemplate: (prompt: string) => void;
}

const templates: Template[] = [
  {
    id: 'landing',
    title: 'Landing Page',
    description: 'Perfect for product launches and marketing campaigns',
    category: 'Marketing',
    features: [
      'Hero section with CTA',
      'Features showcase grid',
      'Testimonials slider',
      'Contact form integration'
    ],
    icon: <Globe className="w-6 h-6" />,
    prompt: 'Create a modern landing page with a hero section featuring a bold headline and CTA button, a features grid with icons, customer testimonials, and a contact form. Use gradients and glassmorphism design.',
    isPopular: true,
  },
  {
    id: 'portfolio',
    title: 'Portfolio Site',
    description: 'Showcase your work and skills professionally',
    category: 'Personal',
    features: [
      'Project gallery with filters',
      'About me section',
      'Skills & expertise',
      'Contact information'
    ],
    icon: <User className="w-6 h-6" />,
    prompt: 'Build a creative portfolio website with a projects gallery featuring filter options, an about section with photo, skills display with progress bars, and social media links. Modern and minimal design.',
    isPopular: true,
  },
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    description: 'Data visualization and management interface',
    category: 'Business',
    features: [
      'Analytics cards with stats',
      'Interactive charts',
      'Data tables with search',
      'Sidebar navigation'
    ],
    icon: <LayoutDashboard className="w-6 h-6" />,
    prompt: 'Design an admin dashboard with KPI cards showing key metrics, interactive charts for data visualization, a data table with search and filters, and a collapsible sidebar for navigation. Use cards and charts.',
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Store',
    description: 'Complete online shopping experience',
    category: 'Commerce',
    features: [
      'Product grid with images',
      'Shopping cart preview',
      'Product filters',
      'Checkout flow'
    ],
    icon: <ShoppingCart className="w-6 h-6" />,
    prompt: 'Create an e-commerce product page with product grid display, image galleries, add to cart functionality, filters by category/price, and a shopping cart preview. Clean and conversion-focused design.',
    isPopular: true,
  },
  {
    id: 'blog',
    title: 'Blog Platform',
    description: 'Share your stories and insights',
    category: 'Content',
    features: [
      'Article grid layout',
      'Category tags',
      'Search functionality',
      'Author profiles'
    ],
    icon: <FileText className="w-6 h-6" />,
    prompt: 'Build a blog website with article cards in a grid layout, category filters, search bar, featured posts section, and author bio cards. Typography-focused with good readability.',
  },
  {
    id: 'saas',
    title: 'SaaS Platform',
    description: 'Software as a Service landing and app',
    category: 'Business',
    features: [
      'Pricing tables',
      'Feature comparison',
      'User authentication UI',
      'Dashboard preview'
    ],
    icon: <Rocket className="w-6 h-6" />,
    prompt: 'Design a SaaS landing page with pricing tiers in cards, feature comparison table, benefits section with icons, user testimonials, and CTAs. Professional and trustworthy appearance.',
  },
  {
    id: 'agency',
    title: 'Agency Website',
    description: 'Promote your services and team',
    category: 'Business',
    features: [
      'Services showcase',
      'Team member cards',
      'Case studies',
      'Contact form'
    ],
    icon: <Briefcase className="w-6 h-6" />,
    prompt: 'Create an agency website showcasing services with icon cards, team members with photos and roles, case study highlights, and a multi-step contact form. Bold and professional design.',
  },
  {
    id: 'photography',
    title: 'Photography Portfolio',
    description: 'Stunning image galleries for photographers',
    category: 'Creative',
    features: [
      'Masonry gallery layout',
      'Lightbox image viewer',
      'Service packages',
      'Booking form'
    ],
    icon: <Camera className="w-6 h-6" />,
    prompt: 'Build a photography portfolio with a masonry-style gallery, lightbox for full-size images, service packages display, client testimonials, and booking contact form. Image-first design with elegant typography.',
  },
];

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  return (
    <section className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Choose a Template
        </h2>
        <p className="text-muted-foreground text-base md:text-lg">
          Start with a professionally designed template and customize it to your needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            title={template.title}
            description={template.description}
            category={template.category}
            features={template.features}
            icon={template.icon}
            onSelect={() => onSelectTemplate(template.prompt)}
            isPopular={template.isPopular}
          />
        ))}
      </div>
    </section>
  );
}
