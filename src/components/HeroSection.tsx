import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Users } from "lucide-react";
import heroImage from "@/assets/hero-agriculture.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Modern agricultural field with supply chain elements"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-75"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transparent
            <span className="block text-accent-foreground">Agricultural Supply Chain</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Track your produce from farm to table with blockchain technology. 
            Ensure quality, verify origin, and eliminate exploitation in the supply chain.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/register">
              <Button size="lg" variant="hero" className="px-8 py-4 text-lg">
                Start Tracking <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 text-lg bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-medium hover:bg-card/20 transition-all duration-300">
              <div className="bg-primary rounded-xl p-3 w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Blockchain Security</h3>
              <p className="text-white/80">
                Immutable records ensure data integrity and prevent tampering throughout the supply chain.
              </p>
            </div>

            <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-medium hover:bg-card/20 transition-all duration-300">
              <div className="bg-primary rounded-xl p-3 w-fit mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Tracking</h3>
              <p className="text-white/80">
                Monitor your products at every stage from harvest to consumer purchase.
              </p>
            </div>

            <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-medium hover:bg-card/20 transition-all duration-300">
              <div className="bg-primary rounded-xl p-3 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Fair Trading</h3>
              <p className="text-white/80">
                Transparent pricing and direct connections between farmers and buyers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;