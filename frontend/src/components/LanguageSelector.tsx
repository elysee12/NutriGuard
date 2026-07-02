import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSelectorProps {
  className?: string;
}

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
];

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`h-10 px-3 rounded-xl border-2 bg-white/95 backdrop-blur-sm hover:bg-white hover:border-primary/50 hover:shadow-md shadow-sm transition-all duration-200 ${className}`}
        >
          <Languages className="h-4 w-4 mr-2 text-primary" />
          <span className="font-bold text-sm">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white/98 backdrop-blur-xl border-2 border-slate-200 rounded-xl shadow-2xl p-2">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`cursor-pointer px-4 py-3 rounded-lg transition-all duration-200 ${
              i18n.language === lang.code 
                ? 'bg-gradient-to-r from-primary/10 to-teal-500/10 border border-primary/20' 
                : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="font-bold text-sm text-slate-900">{lang.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{lang.nativeName}</p>
              </div>
              {i18n.language === lang.code && (
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
