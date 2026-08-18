// NEXUS Onboarding Wizard
// Multi-step interactive onboarding flow for new users
// Personalizes the platform experience based on user's needs

'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  Target, 
  Users, 
  Zap,
  Globe,
  Building2,
  Rocket
} from 'lucide-react';

// ==================== TYPES ====================

export interface OnboardingData {
  // Step 1: Profile
  name: string;
  organization: string;
  role: 'founder' | 'investor' | 'researcher' | 'consultant' | 'other';
  
  // Step 2: Interests
  sectors: string[];
  technologies: string[];
  interests: string[];
  
  // Step 3: Goals
  primaryGoal: 'find-funding' | 'monitor-market' | 'write-grants' | 'network' | 'learn';
  fundingAmount?: number;
  timeline: string;
  
  // Step 4: Location & Scope
  location: string;
  regions: string[];
  companyStage: 'idea' | 'pre-seed' | 'seed' | 'series-a' | 'growth' | 'established';
  
  // Step 5: Preferences
  notificationPreference: 'realtime' | 'daily' | 'weekly';
  collaborationInterest: boolean;
  teamSize: 'solo' | 'small' | 'medium' | 'large';
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  initialData?: Partial<OnboardingData>;
}

// ==================== SECTOR OPTIONS ====================

const SECTOR_OPTIONS = [
  { id: 'ai', label: 'AI & Machine Learning', icon: '🤖', color: 'bg-purple-100 text-purple-800' },
  { id: 'quantum', label: 'Quantum Computing', icon: '⚛️', color: 'bg-blue-100 text-blue-800' },
  { id: 'biotech', label: 'Biotechnology', icon: '🧬', color: 'bg-green-100 text-green-800' },
  { id: 'cleantech', label: 'Clean Technology', icon: '🌱', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'materials', label: 'Advanced Materials', icon: '🔬', color: 'bg-orange-100 text-orange-800' },
  { id: 'semiconductor', label: 'Semiconductors', icon: '💾', color: 'bg-red-100 text-red-800' },
  { id: 'space', label: 'Space Technology', icon: '🚀', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'robotics', label: 'Robotics', icon: '🦾', color: 'bg-gray-100 text-gray-800' },
  { id: 'healthtech', label: 'Health Tech', icon: '❤️', color: 'bg-pink-100 text-pink-800' },
  { id: 'fintech', label: 'FinTech', icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
];

const TECHNOLOGY_OPTIONS = [
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Quantum Computing',
  'Blockchain',
  'IoT (Internet of Things)',
  'AR/VR/XR',
  'Robotics',
  'Biotech/Genomics',
  'Energy Storage',
  'Semiconductors',
  'Advanced Materials',
];

const GOAL_OPTIONS = [
  { 
    id: 'find-funding', 
    label: 'Find Funding Opportunities', 
    description: 'Discover grants, investors, and funding programs that match my project',
    icon: Target,
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  { 
    id: 'monitor-market', 
    label: 'Monitor Market Intelligence', 
    description: 'Track competitors, regulations, and industry trends automatically',
    icon: Globe,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  { 
    id: 'write-grants', 
    label: 'Write Winning Grant Applications', 
    description: 'Use AI assistance to create compelling grant proposals',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  { 
    id: 'network', 
    label: 'Connect with Partners', 
    description: 'Find collaborators, consortium partners, and advisors',
    icon: Users,
    color: 'text-orange-600 bg-orange-50 border-orange-200'
  },
  { 
    id: 'learn', 
    label: 'Learn About Funding Landscape', 
    description: 'Understand available options and how to navigate them',
    icon: Zap,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
];

const REGION_OPTIONS = [
  'United Kingdom',
  'European Union',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'Switzerland',
  'Singapore',
  'Global/Multiple',
];

const STAGE_OPTIONS = [
  { id: 'idea', label: 'Idea Stage', description: 'Concept or early research phase' },
  { id: 'pre-seed', label: 'Pre-Seed', description: 'Initial validation, prototype development' },
  { id: 'seed', label: 'Seed Stage', description: 'Product development, first customers' },
  { id: 'series-a', label: 'Series A', description: 'Scaling operations, market expansion' },
  { id: 'growth', label: 'Growth Stage', description: 'Established product, rapid growth' },
  { id: 'established', label: 'Established', description: 'Mature company, diversification' },
];

// ==================== WIZARD COMPONENT ====================

export function OnboardingWizard({ onComplete, initialData }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    organization: '',
    role: 'founder',
    sectors: [],
    technologies: [],
    interests: [],
    primaryGoal: 'find-funding',
    timeline: '',
    location: '',
    regions: ['United Kingdom'],
    companyStage: 'seed',
    notificationPreference: 'daily',
    collaborationInterest: false,
    teamSize: 'small',
    ...initialData,
  });

  const steps = [
    { title: 'Welcome', icon: Rocket, description: 'Let\'s get to know you' },
    { title: 'Interests', icon: Target, description: 'What excites you?' },
    { title: 'Goals', icon: Zap, description: 'What do you want to achieve?' },
    { title: 'Location', icon: Globe, description: 'Where are you based?' },
    { title: 'Preferences', icon: Sparkles, description: 'Customize your experience' },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayItem = useCallback((field: keyof OnboardingData, item: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...arr, item] };
    });
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return data.name.trim().length > 0 && data.organization.trim().length > 0;
      case 1:
        return data.sectors.length > 0;
      case 2:
        return data.primaryGoal.length > 0;
      case 3:
        return data.location.trim().length > 0 && data.regions.length > 0;
      case 4:
        return true; // All optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ==================== STEP RENDERERS ====================

  const renderStep0 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Welcome to NEXUS! 🚀</h3>
        <p className="text-muted-foreground">
          Let's personalize your experience. This takes about 2 minutes.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            placeholder="Dr. Sarah Chen"
            value={data.name}
            onChange={e => updateData({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organization">Organization</Label>
          <Input
            id="organization"
            placeholder="Quantum Materials Ltd"
            value={data.organization}
            onChange={e => updateData({ organization: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>I am a...</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'founder', label: 'Founder/CEO', emoji: '👩‍💼' },
              { value: 'investor', label: 'Investor', emoji: '💼' },
              { value: 'researcher', label: 'Researcher', emoji: '🔬' },
              { value: 'consultant', label: 'Consultant', emoji: '🎯' },
              { value: 'other', label: 'Other', emoji: '✨' },
            ].map(option => (
              <Button
                key={option.value}
                variant={data.role === option.value ? 'default' : 'outline'}
                className="justify-start h-auto py-3"
                onClick={() => updateData({ role: option.value as OnboardingData['role'] })}
              >
                <span className="mr-2">{option.emoji}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Your Sectors of Interest</h3>
        <p className="text-sm text-muted-foreground">
          Choose all that apply - this helps us find relevant opportunities
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SECTOR_OPTIONS.map(sector => (
          <button
            key={sector.id}
            onClick={() => toggleArrayItem('sectors', sector.id)}
            className={`relative p-4 rounded-lg border-2 transition-all text-left ${
              data.sectors.includes(sector.id)
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/30'
            }`}
          >
            <span className="text-2xl mb-2 block">{sector.icon}</span>
            <span className={`font-medium text-sm ${sector.color.split(' ')[1]}`}>
              {sector.label}
            </span>
            {data.sectors.includes(sector.id) && (
              <Check className="w-5 h-5 text-primary absolute top-2 right-2" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Specific Technologies (optional)</Label>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGY_OPTIONS.slice(0, 8).map(tech => (
            <Badge
              key={tech}
              variant={data.technologies.includes(tech) ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => toggleArrayItem('technologies', tech)}
            >
              {tech}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">What's Your Primary Goal?</h3>
        <p className="text-sm text-muted-foreground">
          We'll tailor your dashboard and recommendations accordingly
        </p>
      </div>

      <div className="space-y-3">
        {GOAL_OPTIONS.map(goal => (
          <button
            key={goal.id}
            onClick={() => updateData({ primaryGoal: goal.id as OnboardingData['primaryGoal'] })}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-start gap-4 ${
              data.primaryGoal === goal.id
                ? `${goal.color} border-current`
                : 'border-border hover:border-gray-300'
            }`}
          >
            <goal.icon className={`w-6 h-6 mt-0.5 ${data.primaryGoal === goal.id ? '' : 'text-muted-foreground'}`} />
            <div>
              <div className="font-semibold">{goal.label}</div>
              <div className="text-sm opacity-80 mt-1">{goal.description}</div>
            </div>
          </button>
        ))}
      </div>

      {(data.primaryGoal === 'find-funding') && (
        <div className="space-y-2 p-4 bg-muted rounded-lg animate-in fade-in duration-300">
          <Label>Target Funding Amount (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {['<£100K', '£100K-500K', '£500K-2M', '>£2M'].map(amount => (
              <Button
                key={amount}
                size="sm"
                variant={data.fundingAmount?.toString() === amount ? 'default' : 'outline'}
                onClick={() => updateData({ fundingAmount: parseInt(amount.replace(/[^\d]/g, '')) * 1000 })}
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="timeline">Timeline for achieving your goal?</Label>
        <Input
          id="timeline"
          placeholder="e.g., Within 3 months, This year, No rush"
          value={data.timeline}
          onChange={e => updateData({ timeline: e.target.value })}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Where Are You Based?</h3>
        <p className="text-sm text-muted-foreground">
          We'll show opportunities relevant to your region
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">City/Region</Label>
          <Input
            id="location"
            placeholder="Cambridge, UK"
            value={data.location}
            onChange={e => updateData({ location: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Target Regions for Opportunities</Label>
          <div className="grid grid-cols-2 gap-2">
            {REGION_OPTIONS.slice(0, 6).map(region => (
              <button
                key={region}
                onClick={() => toggleArrayItem('regions', region)}
                className={`px-3 py-2 rounded-md border text-sm transition-all ${
                  data.regions.includes(region)
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Company/Project Stage</Label>
          <div className="grid grid-cols-3 gap-2">
            {STAGE_OPTIONS.map(stage => (
              <button
                key={stage.id}
                onClick={() => updateData({ companyStage: stage.id as OnboardingData['companyStage'] })}
                className={`px-3 py-2 rounded-md border text-sm transition-all ${
                  data.companyStage === stage.id
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Almost Done! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          A few preferences to customize your experience
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>How often do you want updates?</Label>
          <div className="flex gap-2">
            {[
              { value: 'realtime', label: 'Real-time ⚡', desc: 'As they happen' },
              { value: 'daily', label: 'Daily 📧', desc: 'Once per day' },
              { value: 'weekly', label: 'Weekly 📊', desc: 'Digest format' },
            ].map(option => (
              <Button
                key={option.value}
                variant={data.notificationPreference === option.value ? 'default' : 'outline'}
                className="flex-1 flex-col h-auto py-3"
                onClick={() => updateData({ notificationPreference: option.value as OnboardingData['notificationPreference'] })}
              >
                <span>{option.label}</span>
                <span className="text-xs opacity-70 mt-1">{option.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Team Size</Label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'solo', label: 'Solo 👤' },
              { value: 'small', label: 'Small 👥' },
              { value: 'medium', label: 'Medium 🏢' },
              { value: 'large', label: 'Large 🏛️' },
            ].map(option => (
              <Button
                key={option.value}
                variant={data.teamSize === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateData({ teamSize: option.value as OnboardingData['teamSize'] })}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <div className="font-medium">Enable Collaboration Features</div>
            <div className="text-sm text-muted-foreground">
              Invite team members, share workspaces, real-time editing
            </div>
          </div>
          <button
            onClick={() => updateData({ collaborationInterest: !data.collaborationInterest })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              data.collaborationInterest ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                data.collaborationInterest ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Your NEXUS Profile Summary
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Name:</span> {data.name || 'Not set'}</div>
            <div><span className="text-muted-foreground">Role:</span> {data.role}</div>
            <div><span className="text-muted-foreground">Sectors:</span> {data.sectors.join(', ') || 'None selected'}</div>
            <div><span className="text-muted-foreground">Goal:</span> {data.primaryGoal}</div>
            <div><span className="text-muted-foreground">Location:</span> {data.location || 'Not set'}</div>
            <div><span className="text-muted-foreground">Stage:</span> {data.companyStage}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ==================== MAIN RENDER ====================

  const stepRenderers = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              {React.createElement(steps[currentStep].icon, { className: "w-6 h-6" })}
              Step {currentStep + 1}: {steps[currentStep].title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {steps[currentStep].description}
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {stepRenderers[currentStep]()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="min-w-[120px]"
        >
          {currentStep === steps.length - 1 ? (
            <>
              Complete Setup
              <Rocket className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ==================== EXPORTS ====================

export default OnboardingWizard;

// Hook for using onboarding state
export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(false);
  const [data, setData] = useState<OnboardingData | null>(null);

  const completeOnboarding = (onboardingData: OnboardingData) => {
    setData(onboardingData);
    setIsComplete(true);
    
    // Save to localStorage (in production, save to backend)
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus-onboarding-complete', 'true');
      localStorage.setItem('nexus-onboarding-data', JSON.stringify(onboardingData));
    }
  };

  const checkOnboardingStatus = () => {
    if (typeof window === 'undefined') return false;
    
    const complete = localStorage.getItem('nexus-onboarding-complete') === 'true';
    const savedData = localStorage.getItem('nexus-onboarding-data');
    
    setIsComplete(complete);
    if (savedData) {
      setData(JSON.parse(savedData));
    }
    
    return complete;
  };

  return {
    isComplete,
    data,
    completeOnboarding,
    checkOnboardingStatus,
  };
}
