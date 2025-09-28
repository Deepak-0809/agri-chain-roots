import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Store, ShoppingCart, Leaf, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

const RoleSelect = () => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  // Check for existing session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Redirect authenticated users
          setTimeout(() => {
            getUserRole(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        getUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserRole = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      const role = profile?.role || 'farmer';
      switch (role) {
        case 'farmer':
          navigate('/farmer-dashboard');
          break;
        case 'distributor':
          navigate('/distributor-dashboard');
          break;
        case 'consumer':
          navigate('/consumer-dashboard');
          break;
        default:
          navigate('/farmer-dashboard');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      navigate('/farmer-dashboard');
    }
  };

  const roles = [
    {
      id: "farmer",
      title: "Farmer",
      description: "Grow and sell your agricultural products directly to vendors and retailers.",
      icon: Users,
      features: ["Product Management", "Inventory Tracking", "Direct Sales", "Supply Chain Visibility"],
      color: "bg-green-50 border-green-200 text-green-800"
    },
    {
      id: "distributor",
      title: "Distributor", 
      description: "Source products from farmers and distribute to consumers in bulk.",
      icon: Store,
      features: ["Supplier Network", "Bulk Purchasing", "Logistics Management", "Quality Control"],
      color: "bg-blue-50 border-blue-200 text-blue-800"
    },
    {
      id: "consumer",
      title: "Consumer",
      description: "Purchase fresh products from distributors with full supply chain transparency.",
      icon: ShoppingCart,
      features: ["Product Sourcing", "Supply Chain Tracking", "QR Code Scanning", "Transparency"],
      color: "bg-purple-50 border-purple-200 text-purple-800"
    }
  ];

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
  };

  const handleGoogleSignup = async () => {
    if (!selectedRole) {
      toast.error("Please select your role first");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast.error(`Google signup failed: ${error.message}`);
        setIsLoading(false);
      }
      // The auth state change will handle the role assignment and redirect
    } catch (error: any) {
      toast.error(`Google signup failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast.error("Please select your role first");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: selectedRole
          }
        }
      });

      if (error) {
        toast.error(`Signup failed: ${error.message}`);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Update the profile with the selected role
        await supabase
          .from('profiles')
          .update({ role: selectedRole })
          .eq('user_id', data.user.id);
        
        toast.success("Account created successfully! Please check your email to verify your account.");
        
        // If user is immediately confirmed (for development), redirect
        if (data.session) {
          setTimeout(() => {
            switch (selectedRole) {
              case 'farmer':
                navigate('/farmer-dashboard');
                break;
              case 'distributor':
                navigate('/distributor-dashboard');
                break;
              case 'consumer':
                navigate('/consumer-dashboard');
                break;
              default:
                navigate('/farmer-dashboard');
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      toast.error(`Signup failed: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  // If user is already logged in, redirect them
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-secondary/20 p-4">
        <Card className="bg-gradient-card border-border shadow-strong">
          <CardContent className="p-6 text-center">
            <p className="text-foreground">You are already logged in. Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10 p-4 flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 group mb-6">
            <div className="p-3 rounded-xl bg-gradient-primary text-primary-foreground group-hover:scale-105 transition-transform duration-300">
              <Leaf className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold text-foreground">AgriChain</span>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">Join AgriChain</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your role in our agricultural ecosystem and start building connections 
            between farmers, vendors, and retailers.
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-strong ${
                  selectedRole === role.id 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-medium' 
                    : 'hover:shadow-medium hover:scale-105'
                }`}
                onClick={() => handleRoleSelection(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <IconComponent className="h-8 w-8 text-primary" />
                    {selectedRole === role.id && (
                      <CheckCircle className="h-6 w-6 text-primary fill-primary/20" />
                    )}
                  </div>
                  <CardTitle className="text-xl text-foreground">{role.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedRole && (
          <div className="mt-8 max-w-md mx-auto">
            <Card className="bg-gradient-card border-border shadow-strong">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-foreground">
                  Sign up as {roles.find(r => r.id === selectedRole)?.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Create your AgriChain account
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Google Sign Up Button */}
                <Button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="w-full mb-4"
                  variant="outline"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? "Creating Account..." : "Continue with Google"}
                </Button>

                {/* Divider */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or sign up with email</span>
                  </div>
                </div>

                {/* Email Sign Up Form */}
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-background border-border"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="hero"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <span className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                  </span>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelect;