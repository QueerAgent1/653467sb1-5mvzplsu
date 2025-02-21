import React from 'react';
import { Crown, Star, AlertCircle } from 'lucide-react';
import type { Sass } from '../services/memory';

interface ElektraResponseProps {
  sass: Sass;
  className?: string;
}

export function ElektraResponse({ sass, className = '' }: ElektraResponseProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {sass.read && (
        <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium italic">{sass.read}</p>
        </div>
      )}
      
      {sass.praise && (
        <div className="flex items-start gap-3 text-yellow-600 bg-yellow-50 p-4 rounded-lg">
          <Crown className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium italic">{sass.praise}</p>
        </div>
      )}
      
      {sass.advice && (
        <div className="flex items-start gap-3 text-purple-600 bg-purple-50 p-4 rounded-lg">
          <Star className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <p className="font-medium italic">{sass.advice}</p>
        </div>
      )}
    </div>
  );
}