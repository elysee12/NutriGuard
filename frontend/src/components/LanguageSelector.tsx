import { useTranslation } from 'react-i18next';
import rwandaFlag from '@/assets/rwanda.png';
import englandFlag from '@/assets/england.jpg';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => changeLanguage('en')}
        className={`p-1 rounded-md transition-all ${
          i18n.language === 'en' ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
        }`}
        title="English"
      >
        <img src={englandFlag} alt="English" className="h-6 w-9 object-cover rounded shadow-sm" />
      </button>
      <button
        onClick={() => changeLanguage('rw')}
        className={`p-1 rounded-md transition-all ${
          i18n.language === 'rw' ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
        }`}
        title="Kinyarwanda"
      >
        <img src={rwandaFlag} alt="Kinyarwanda" className="h-6 w-9 object-cover rounded shadow-sm" />
      </button>
    </div>
  );
}
