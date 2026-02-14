import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const footerLinks = {
  about: [
    { name: 'Our Story', path: '/about' },
    { name: 'Team', path: '/about' },
    { name: 'Careers', path: '/about' },
  ],
  quickLinks: [
    { name: 'Explore Skills', path: '/explore' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Community', path: '/community' },
  ],
  guidelines: [
    { name: 'Code of Conduct', path: '/about' },
    { name: 'Privacy Policy', path: '/about' },
    { name: 'Terms of Service', path: '/about' },
  ],
  contact: [
    { name: 'Support', path: '/about' },
    { name: 'Feedback', path: '/about' },
    { name: 'FAQ', path: '/about' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h4 className="font-semibold text-foreground mb-4 capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">S</span>
            </div>
            <span className="font-semibold text-foreground">SkillShare</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} SkillShare. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
