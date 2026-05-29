import React from 'react';

interface RenderCommentProps {
  text: string;
}

export default function RenderComment({ text }: RenderCommentProps) {
  // Regex to match @[Name](userId)
  const mentionRegex = /@\[([^\]]+)\]\(([a-zA-Z0-9_-]+)\)/g;
  
  const parseMentions = (inputText: string) => {
    if (!inputText) return null;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    
    const matches = [...inputText.matchAll(mentionRegex)];
    
    matches.forEach((match, index) => {
      // Add text before the match
      if (match.index !== undefined && match.index > lastIndex) {
        parts.push(inputText.substring(lastIndex, match.index));
      }
      
      const name = match[1];
      const userId = match[2];
      
      // Add the mention component
      parts.push(
        <span 
          key={`${userId}-${index}`}
          className="inline-flex items-center text-indigo-600 bg-indigo-50 px-1.5 rounded text-[14px] font-bold cursor-pointer hover:bg-indigo-100 transition-colors mx-0.5 group relative"
          onClick={(e) => {
            e.stopPropagation();
            // Could add navigation or profile modal trigger here
            console.log(`Clicked user profile for ${userId}`);
          }}
        >
          @{name}
          {/* Simple CSS Tooltip */}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block w-max px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-xl pointer-events-none z-10 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-900">
            View Profile ({userId.substring(0, 8)}...)
          </span>
        </span>
      );
      
      lastIndex = (match.index || 0) + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    
    return parts;
  };

  return (
    <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap">
      {parseMentions(text)}
    </p>
  );
}
