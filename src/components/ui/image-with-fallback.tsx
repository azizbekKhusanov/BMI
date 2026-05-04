import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff } from "lucide-react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export const ImageWithFallback = ({ 
  src, 
  alt, 
  fallback, 
  className, 
  containerClassName,
  ...props 
}: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className} ${containerClassName}`}>
        {fallback || <ImageOff size={24} />}
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {loading && (
        <Skeleton className={`absolute inset-0 z-10 ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
    </div>
  );
};
