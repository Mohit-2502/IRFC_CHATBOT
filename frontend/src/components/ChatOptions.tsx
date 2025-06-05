import React from 'react';
import { 
  FileText, Briefcase, Users, DollarSign, TrendingUp, 
  ArrowsUpFromLine, Leaf, Heart, Gift, Shield, 
  Gavel, ArrowUpRight, House
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatOptionsProps {
  onOptionClick: (text: string) => void;
}

const options = [
  { icon: <FileText className="h-5 w-5 text-[#1a2e5b]" />, text: 'IRFC Overview' },
  { icon: <Briefcase className="h-5 w-5 text-[#1a2e5b]" />, text: 'Employment Conditions' },
  { icon: <Users className="h-5 w-5 text-[#1a2e5b]" />, text: 'Recruitment Rules' },
  { icon: <DollarSign className="h-5 w-5 text-[#1a2e5b]" />, text: 'Salary Structure' },
  { icon: <TrendingUp className="h-5 w-5 text-[#1a2e5b]" />, text: 'Promotion Policy' },
  { icon: <ArrowsUpFromLine className="h-5 w-5 text-[#1a2e5b]" />, text: 'Travel and Daily Allowance' },
  { icon: <Leaf className="h-5 w-5 text-[#1a2e5b]" />, text: 'Leave Rules' },
  { icon: <Heart className="h-5 w-5 text-[#1a2e5b]" />, text: 'Medical Benefits' },
  { icon: <Gift className="h-5 w-5 text-[#1a2e5b]" />, text: 'Gratuity Rules' },
  { icon: <Shield className="h-5 w-5 text-[#1a2e5b]" />, text: 'Superannuation Scheme' },
  { icon: <Gavel className="h-5 w-5 text-[#1a2e5b]" />, text: 'Conduct & Discipline' },
  { icon: <ArrowUpRight className="h-5 w-5 text-[#1a2e5b]" />, text: 'Advance Rules' },
  { icon: <House className="h-5 w-5 text-[#1a2e5b]" />, text: 'House Lease Rules' },
  { icon: <Users className="h-5 w-5 text-[#1a2e5b]" />, text: 'Employee Welfare' },
];

const ChatOptions = ({ onOptionClick }: ChatOptionsProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`p-3 md:p-4 grid grid-cols-2 gap-2 md:gap-3 ${isMobile ? "pb-5" : ""}`}>
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => onOptionClick(option.text)}
          className="option-button flex items-center justify-start px-2.5 py-2 md:px-3 md:py-2.5 rounded-full border border-gray-200 hover:bg-gradient-to-r hover:from-[#f0f4ff] hover:to-[#d9e2ff] hover:border-[#a3b8ff] text-xs md:text-sm transition-all duration-300 w-full group overflow-hidden"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className="mr-1.5 md:mr-2 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">{option.icon}</span>
          <span className="text-gray-700 truncate group-hover:overflow-visible group-hover:whitespace-normal transition-all duration-300 group-hover:scale-100">{option.text}</span>
        </button>
      ))}
    </div>
  );
};

export default ChatOptions;
