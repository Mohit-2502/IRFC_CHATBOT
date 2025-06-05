import React from 'react';
import { User, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntryPageProps {
  pageTransition: boolean;
  onSelectHR: () => void;
  onSelectFinancials: () => void;
}

const EntryPage: React.FC<EntryPageProps> = ({ 
  pageTransition,
  onSelectHR,
  onSelectFinancials
}) => {
  return (
    <div className={cn(
      "h-full flex flex-col p-4",
      pageTransition ? "opacity-0" : "opacity-100",
      "transition-all duration-300"
    )}>
      <div className="flex flex-col gap-4 h-full">
        <button 
          onClick={onSelectHR}
          className="flex-1 bg-gradient-to-r from-[#2a427a] to-[#1a2e5b] text-white rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:from-[#1a2e5b] hover:to-[#2a427a] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
          <User size={48} />
          <span className="text-xl font-semibold">Human Resources</span>
        </button>
        <button 
          onClick={onSelectFinancials}
          className="flex-1 bg-gradient-to-r from-[#2a427a] to-[#1a2e5b] text-white rounded-lg p-6 flex flex-col items-center justify-center gap-3 hover:from-[#1a2e5b] hover:to-[#2a427a] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
          <DollarSign size={48} />
          <span className="text-xl font-semibold">Financials</span>
        </button>
      </div>
    </div>
  );
};

export default EntryPage;
