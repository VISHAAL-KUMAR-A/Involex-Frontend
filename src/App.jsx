import { motion } from 'framer-motion';
import { 
  Scale, 
  Clock, 
  Zap, 
  CheckCircle, 
  Mail, 
  DollarSign, 
  Users, 
  Star,
  Download,
  ArrowRight,
  Chrome,
  BarChart3,
  Shield,
  Sparkles
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Scale className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">Involex</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center space-x-8"
            >
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                             <button className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/25 border border-white/20">
                 <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="relative flex items-center justify-center space-x-3">
                   <div className="p-2 bg-white/20 rounded-full">
                     <Chrome className="w-5 h-5" />
                   </div>
                   <div className="flex flex-col items-start">
                     <span className="text-lg leading-none">Add to Chrome</span>
                     <span className="text-xs text-emerald-100 font-normal">Free Extension</span>
                   </div>
                   <div className="ml-2">
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                   </div>
                 </div>
               </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              rotate: -360,
              scale: [1.1, 1, 1.1]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30"
                >
                  <Sparkles className="w-4 h-4 text-blue-400 mr-2" />
                  <span className="text-blue-300 text-sm font-medium">AI-Powered Legal Assistant</span>
                </motion.div>
                
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Automate Your
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Legal Billing</span>
                </h1>
                
                <p className="text-xl text-gray-300 leading-relaxed">
                  Transform every email into billable entries automatically. Involex summarizes your client communications and syncs with PracticePanther, Clio, MyCase, and more.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 text-white font-bold py-5 px-10 rounded-2xl shadow-2xl transform transition-all duration-300 hover:shadow-emerald-500/30 border border-white/20"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <div className="relative flex items-center justify-center space-x-4">
                     <div className="p-3 bg-white/20 rounded-full">
                       <Chrome className="w-6 h-6" />
                     </div>
                     <div className="flex flex-col items-start">
                       <span className="text-xl leading-none">Install Extension</span>
                       <span className="text-sm text-emerald-100 font-normal">Start Free Today</span>
                     </div>
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                   </div>
                 </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary flex items-center justify-center"
                >
                  Watch Demo
                </motion.button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white/20" />
                    ))}
                  </div>
                  <span className="text-gray-300">500+ Happy Lawyers</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-300 ml-2">4.9/5</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative z-10">
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-6 h-6 text-blue-400" />
                        <span className="text-white font-semibold">Email Summary</span>
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 rounded-full">
                        <span className="text-green-300 text-sm">Processed</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-300 text-sm">
                          "Discussed contract terms for the Smith acquisition. Reviewed liability clauses and warranty provisions..."
                        </p>
                      </div>
                      
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 1, duration: 2 }}
                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Time: 0.5 hours</span>
                        <span className="text-green-400">$225.00</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"
              />
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-20 blur-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Modern Law Firms
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to streamline your billing process and never miss a billable moment
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Summarization",
                description: "Advanced AI automatically summarizes your emails, extracting key legal points and time spent.",
                color: "from-yellow-400 to-orange-500"
              },
              {
                icon: Clock,
                title: "Smart Time Tracking",
                description: "Automatically detects and calculates time spent on client communications.",
                color: "from-blue-400 to-cyan-500"
              },
              {
                icon: DollarSign,
                title: "Instant Billing Entries",
                description: "Creates billable entries in your practice management software with one click.",
                color: "from-green-400 to-emerald-500"
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "Enterprise-grade encryption ensures your client data stays protected.",
                color: "from-purple-400 to-pink-500"
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Track your billing efficiency and identify revenue opportunities.",
                color: "from-indigo-400 to-purple-500"
              },
              {
                icon: Users,
                title: "Multi-Platform Integration",
                description: "Works seamlessly with PracticePanther, Clio, MyCase, and 20+ other platforms.",
                color: "from-red-400 to-pink-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-hover bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              How Involex Works
            </h2>
            <p className="text-xl text-gray-300">
              Three simple steps to transform your billing process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Install & Connect",
                description: "Install the Chrome extension and connect your practice management software",
                icon: Download
              },
              {
                step: "02", 
                title: "Email & Summarize",
                description: "Send emails to clients as usual. Involex automatically detects and summarizes them",
                icon: Mail
              },
              {
                step: "03",
                title: "Auto-Bill Creation",
                description: "Review summaries and create billable entries with one click",
                icon: CheckCircle
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="relative z-10 bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 card-hover">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-blue-400 mb-4">{step.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-4">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
                
                {index < 2 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.8 }}
                    className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform -translate-y-1/2 origin-left"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Transform Your Billing?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join hundreds of law firms already saving time and increasing revenue with Involex
            </p>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2">$29<span className="text-lg text-gray-300">/month</span></div>
                <p className="text-gray-300">Per user, unlimited emails</p>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited email summarization",
                  "All platform integrations",
                  "Advanced analytics",
                  "Priority support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
              
                             <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="group relative w-full overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/30 border border-white/20"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="relative flex items-center justify-center space-x-3">
                   <span className="text-lg">Start Free Trial</span>
                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                 </div>
               </motion.button>
              
              <p className="text-sm text-gray-400 mt-4">14-day free trial • No credit card required</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Scale className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold text-white">Involex</span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2024 Involex. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
