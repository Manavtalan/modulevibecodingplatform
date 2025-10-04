import { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Sidebar from '@/components/Sidebar/Sidebar';
import { supabase } from '@/integrations/supabase/client';

const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Mock current user subscription data - replace with actual data later
  const currentPlan = {
    name: 'Free',
    description: 'Your project will be Public by default and data may be used to improve our model.',
    credits: 3,
    maxCredits: 10,
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 499,
      yearlyPrice: 399,
      features: [
        '50 Credits/month',
        'Private projects',
        'Integrations',
        'Debugging Support',
      ],
      cta: 'Upgrade',
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 999,
      yearlyPrice: 799,
      features: [
        'Everything in Starter',
        '100 Credits/month',
        'Unlimited Projects',
        'Advanced Code Explanations',
        'Priority Support',
      ],
      cta: 'Upgrade',
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: null,
      yearlyPrice: null,
      features: [
        'Unlimited Projects',
        'Dedicated AI Assistant',
        'Team Collaboration',
        '24/7 Support',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (plan.id === 'enterprise') {
      // For enterprise, redirect to contact sales
      window.location.href = 'mailto:sales@module.com?subject=Enterprise Plan Inquiry';
      return;
    }

    try {
      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
      
      if (!price) {
        alert('Invalid plan selected');
        return;
      }

      // Call the edge function to create Cashfree order
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please login to continue');
        window.location.href = '/auth';
        return;
      }

      const response = await fetch(
        `https://ryhhskssaplqakovldlp.supabase.co/functions/v1/create-cashfree-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            planId: plan.id,
            planName: plan.name,
            amount: price,
            billingCycle: billingCycle,
          }),
        }
      );

      const result = await response.json();

      if (result.success && result.payment_url) {
        // Redirect to Cashfree payment page
        window.location.href = result.payment_url;
      } else {
        alert(`Error: ${result.error || 'Failed to initiate payment'}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return 'Custom';
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    return `₹${price}`;
  };

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      
      <main className="flex-1 ml-[72px] p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Subscription & Payment
            </h1>
            <p className="text-muted-foreground">
              Choose the perfect plan for your coding needs
            </p>
          </div>

          {/* Current Plan Card */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentPlan.description}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {currentPlan.credits} / {currentPlan.maxCredits} credits
                  </Badge>
                </div>
              </div>

              {/* Monthly/Yearly Toggle */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-primary text-primary-foreground'
                      : 'glass hover:bg-muted'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-primary text-primary-foreground'
                      : 'glass hover:bg-muted'
                  }`}
                >
                  Yearly
                  <Badge variant="outline" className="bg-primary/20 border-primary text-primary text-xs">
                    Save 20%
                  </Badge>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`glass-card border-border relative transition-all hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-primary glow-primary' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-4xl font-bold text-foreground">
                      {getPrice(plan)}
                    </span>
                    {plan.monthlyPrice && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/20 p-1 mt-0.5">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className="w-full"
                    size="lg"
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center pt-8 pb-4">
            <p className="text-sm text-muted-foreground">
              Payments are 100% secure. Powered by <span className="font-semibold text-foreground">Cashfree</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Subscription;
