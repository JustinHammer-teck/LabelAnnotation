import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const selectStyle = {
    backgroundColor: '#ffffff',
    color: '#333333',
    border: '1px solid #cccccc',
    colorScheme: 'light',
  };

  return (
    <select
      className="language-switcher"
      onChange={handleLanguageChange}
      defaultValue={i18n.language}
      style={selectStyle}
    >
      <option value="en">English</option>
      <option value="cn">Chinese</option>
    </select>
  );
};
